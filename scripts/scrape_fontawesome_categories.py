#!/usr/bin/env python3
"""
FontAwesome Category Scraper

Scrapes FontAwesome's free classic icon collection to extract icon names
grouped by category tags. Uses browser automation to click through categories
and scrape icons from filtered grids.
"""

import asyncio
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set
from playwright.async_api import async_playwright, Page, TimeoutError as PlaywrightTimeoutError


# Configuration
BASE_URL = "https://fontawesome.com/search?ip=classic&ic=free-collection"
OUTPUT_FILE = Path(__file__).parent / "fontawesome_icon_categories.json"
CATEGORIES_METADATA_FILE = Path(__file__).parent / "fontawesome_categories_metadata.json"
DELAY_BETWEEN_CATEGORIES = 1.0  # seconds
DELAY_BETWEEN_PAGES = 0.5  # seconds
PAGE_LOAD_TIMEOUT = 30000  # milliseconds
ELEMENT_WAIT_TIMEOUT = 10000  # milliseconds


async def wait_for_grid_update(page: Page, timeout: int = ELEMENT_WAIT_TIMEOUT) -> None:
    """Wait for the icon grid to update after a category filter is applied."""
    try:
        # Wait for the icon grid container to be visible and stable
        await page.wait_for_selector(
            "article.wrap-icon",
            timeout=timeout,
            state="visible"
        )
        # Additional small delay to ensure all icons are loaded
        await asyncio.sleep(0.5)
    except PlaywrightTimeoutError:
        print("  Warning: Timeout waiting for grid to update")


async def extract_icon_names(page: Page) -> List[str]:
    """
    Extract icon names from the current page.
    Returns a list of full class strings from <i> elements.
    """
    icon_names: List[str] = []
    
    try:
        # Find all article elements (icons)
        articles = await page.query_selector_all("article.wrap-icon")
        
        for article in articles:
            try:
                # Find the <i> element inside the button
                i_element = await article.query_selector("button.icon.flat i")
                if i_element:
                    class_attr = await i_element.get_attribute("class")
                    if class_attr:
                        icon_names.append(class_attr.strip())
            except Exception as e:
                print(f"    Warning: Failed to extract icon from article: {e}")
                continue
                
    except Exception as e:
        print(f"  Error extracting icons: {e}")
    
    return icon_names


async def scrape_category_pages(page: Page, category_name: str) -> List[str]:
    """
    Scrape all icons from all pages for a given category.
    Returns a list of icon names (full class strings).
    """
    all_icons: List[str] = []
    page_num = 1
    
    print(f"  Scraping category: {category_name}")
    
    while True:
        print(f"    Page {page_num}...", end=" ", flush=True)
        
        # Wait for grid to be ready
        await wait_for_grid_update(page)
        
        # Extract icons from current page
        icons = await extract_icon_names(page)
        all_icons.extend(icons)
        print(f"Found {len(icons)} icons")
        
        # Check for next page button
        try:
            # Look for pagination controls
            # The pagination class is: display-none tablet:display-flex flex-content-center flex-wrap flex-items-center pagination-large-screen
            # Try to find a "next" button or link
            next_button = await page.query_selector(
                ".pagination-large-screen a[aria-label*='next'], "
                ".pagination-large-screen a[aria-label*='Next'], "
                ".pagination-large-screen button[aria-label*='next'], "
                ".pagination-large-screen button[aria-label*='Next'], "
                ".pagination-large-screen a:has-text('Next'), "
                ".pagination-large-screen button:has-text('Next')"
            )
            
            # Alternative: look for pagination links with page numbers
            if not next_button:
                # Try finding the current page number and look for next
                pagination_links = await page.query_selector_all(".pagination-large-screen a, .pagination-large-screen button")
                current_page_found = False
                for link in pagination_links:
                    text = (await link.inner_text()).strip().lower()
                    if text == str(page_num + 1) or "next" in text:
                        next_button = link
                        current_page_found = True
                        break
            
            if next_button:
                # Check if button is disabled or not clickable
                disabled_attr = await next_button.get_attribute("disabled")
                aria_disabled = await next_button.get_attribute("aria-disabled")
                class_attr = await next_button.get_attribute("class") or ""
                is_disabled = (
                    disabled_attr is not None or
                    aria_disabled == "true" or
                    "disabled" in class_attr
                )
                
                if not is_disabled:
                    try:
                        await next_button.click()
                        await asyncio.sleep(DELAY_BETWEEN_PAGES)
                        page_num += 1
                        continue
                    except Exception as e:
                        print(f"\n    Warning: Could not click next button: {e}")
                        break
                else:
                    # Next button exists but is disabled - we're on the last page
                    break
            else:
                # No next button found - assume we're on the last page
                break
                
        except Exception as e:
            print(f"\n    Warning: Error checking for next page: {e}")
            break
    
    # Remove duplicates while preserving order
    seen: Set[str] = set()
    unique_icons: List[str] = []
    for icon in all_icons:
        if icon not in seen:
            seen.add(icon)
            unique_icons.append(icon)
    
    print(f"  Total unique icons for '{category_name}': {len(unique_icons)}")
    return unique_icons


def clean_category_name(category_name: str) -> str:
    """
    Clean and normalize category name.
    Ensures lowercase, replaces spaces/+ with hyphens, removes special chars.
    """
    # Convert to lowercase
    cleaned = category_name.lower()
    # Replace spaces and + with hyphens
    cleaned = re.sub(r'\s+', '-', cleaned)  # Replace spaces with hyphens
    cleaned = re.sub(r'\+', '-', cleaned)    # Replace + with hyphens
    # Remove any other non-alphanumeric characters except hyphens
    cleaned = re.sub(r'[^a-z0-9-]+', '', cleaned)
    # Remove multiple consecutive hyphens
    cleaned = re.sub(r'-+', '-', cleaned)
    # Remove leading/trailing hyphens
    cleaned = cleaned.strip('-')
    return cleaned


async def find_category_buttons(page: Page) -> List[tuple]:
    """
    Find all category buttons/links in the sidebar.
    Returns a list of tuples: (input_id, category_name)
    We store input_id instead of element references to avoid stale element issues.
    """
    categories: List[tuple] = []
    
    try:
        # Find the category sidebar
        category_container = await page.query_selector(".icons-facets-group-categories")
        if not category_container:
            print("Error: Could not find category container (.icons-facets-group-categories)")
            return categories
        
        # Scroll through the category container to ensure all categories are loaded
        # Some categories might be lazy-loaded or hidden until scrolled into view
        print("  Scrolling through category list to load all categories...")
        try:
            # First, try scrolling the container itself to the bottom
            await category_container.scroll_into_view_if_needed()
            await asyncio.sleep(0.3)
            
            # Scroll through all list items to ensure they're loaded
            # Get all list items (li elements) in the category container
            list_items = await category_container.query_selector_all("li")
            
            if list_items:
                # Scroll each item into view to trigger lazy loading
                for i, li_item in enumerate(list_items):
                    try:
                        await li_item.scroll_into_view_if_needed()
                        # Every 5 items, check if we've found more inputs
                        if i % 5 == 0:
                            await asyncio.sleep(0.1)
                    except Exception:
                        continue
                
                # Final scroll to bottom
                await list_items[-1].scroll_into_view_if_needed()
                await asyncio.sleep(0.5)  # Wait for any lazy-loaded content
            
        except Exception as e:
            print(f"  Warning: Error scrolling category list: {e}")
            # Continue anyway - might still find categories
        
        # Find all input elements with id starting with "icons-category-"
        # The id format is: "icons-category-{category-name}"
        input_elements = await category_container.query_selector_all("input[id^='icons-category-']")
        print(f"  Total input elements found: {len(input_elements)}")
        
        for input_element in input_elements:
            try:
                # Get the id attribute
                input_id = await input_element.get_attribute("id")
                if not input_id or not input_id.startswith("icons-category-"):
                    continue
                
                # Extract category name from id (remove "icons-category-" prefix)
                category_name = input_id.replace("icons-category-", "", 1)
                
                # Clean the category name to ensure consistent format
                category_name = clean_category_name(category_name)
                
                # Store the input_id instead of element reference
                # We'll re-find the element each time we need to click it
                categories.append((input_id, category_name))
                    
            except Exception as e:
                print(f"  Warning: Error processing category input: {e}")
                continue
        
    except Exception as e:
        print(f"Error finding categories: {e}")
        import traceback
        traceback.print_exc()
    
    return categories


async def click_category(page: Page, input_id: str, category_name: str) -> bool:
    """Click a category button to filter the icon grid."""
    try:
        # Re-find the category container and element each time (avoids stale element issues)
        category_container = await page.query_selector(".icons-facets-group-categories")
        if not category_container:
            print(f"  Error: Category container not found for '{category_name}'")
            return False
        
        # Find the label element by input_id (re-find it each time)
        label_element = await category_container.query_selector(f"label[for='{input_id}']")
        if not label_element:
            # Fallback: try the input element itself
            label_element = await category_container.query_selector(f"input[id='{input_id}']")
            if not label_element:
                print(f"  Error: Could not find element for category '{category_name}' (id: {input_id})")
                return False
        
        # Scroll element into view
        await label_element.scroll_into_view_if_needed()
        await asyncio.sleep(0.2)
        
        # Click the element
        await label_element.click()
        await asyncio.sleep(0.3)
        
        print(f"  Clicked category: {category_name}")
        return True
    except Exception as e:
        print(f"  Error clicking category '{category_name}': {e}")
        return False


async def unclick_category(page: Page, input_id: str, category_name: str) -> bool:
    """Unclick/deselect a category to reset the filter."""
    try:
        # Re-find the category container and element each time (avoids stale element issues)
        category_container = await page.query_selector(".icons-facets-group-categories")
        if not category_container:
            # Try alternative: look for a clear/reset button
            return await try_clear_filters(page)
        
        # Find the label element by input_id (re-find it each time)
        label_element = await category_container.query_selector(f"label[for='{input_id}']")
        if not label_element:
            # Fallback: try the input element itself
            label_element = await category_container.query_selector(f"input[id='{input_id}']")
            if not label_element:
                # Try clear button as fallback
                return await try_clear_filters(page)
        
        # Try clicking again to toggle off
        await label_element.scroll_into_view_if_needed()
        await asyncio.sleep(0.2)
        await label_element.click()
        await asyncio.sleep(0.3)
        
        # Wait for grid to reset
        await wait_for_grid_update(page)
        return True
    except Exception as e:
        print(f"  Warning: Error unclicking category '{category_name}': {e}")
        # Try alternative: look for a clear/reset button
        return await try_clear_filters(page)


async def try_clear_filters(page: Page) -> bool:
    """Try to find and click a clear/reset filters button."""
    try:
        clear_button = await page.query_selector(
            "button[aria-label*='clear'], "
            "button[aria-label*='Clear'], "
            "button:has-text('Clear'), "
            ".filter-reset, "
            "[data-clear-filters]"
        )
        if clear_button:
            await clear_button.click()
            await wait_for_grid_update(page)
            return True
    except Exception:
        pass
    return False


async def scrape_all_categories() -> Dict[str, List[str]]:
    """
    Main scraping function.
    Returns a dictionary with category names as keys and lists of icon names as values.
    """
    result: Dict[str, List[str]] = {}
    
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()
        
        try:
            print(f"Navigating to {BASE_URL}...")
            await page.goto(BASE_URL, wait_until="networkidle", timeout=PAGE_LOAD_TIMEOUT)
            print("Page loaded, waiting for content...")
            await asyncio.sleep(2)  # Additional wait for dynamic content
            
            # Find all category buttons
            print("\nFinding categories...")
            categories = await find_category_buttons(page)
            print(f"Found {len(categories)} categories")
            
            if not categories:
                print("ERROR: No categories found! Check the selector.")
                return result
            
            # Process each category
            for idx, (input_id, category_name) in enumerate(categories, 1):
                print(f"\n[{idx}/{len(categories)}] Processing category: {category_name}")
                
                # Click the category (re-finds element each time to avoid stale references)
                if not await click_category(page, input_id, category_name):
                    print(f"  Skipping category '{category_name}' due to click failure")
                    continue
                
                # Wait for grid to update
                await wait_for_grid_update(page)
                
                # Scrape all icons from all pages for this category
                icons = await scrape_category_pages(page, category_name)
                
                if icons:
                    result[category_name] = icons
                else:
                    print(f"  Warning: No icons found for category '{category_name}'")
                
                # Unclick the category to reset (re-finds element each time)
                await unclick_category(page, input_id, category_name)
                
                # Delay before next category
                if idx < len(categories):
                    await asyncio.sleep(DELAY_BETWEEN_CATEGORIES)
            
        except Exception as e:
            print(f"\nFatal error during scraping: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()
    
    return result


def save_results(data: Dict[str, List[str]]) -> None:
    """Save the scraped data to a JSON file."""
    metadata = {
        "scrape_date": datetime.now().isoformat(),
        "total_categories": len(data),
        "total_icons": sum(len(icons) for icons in data.values()),
    }
    
    # Save full data with icons
    output = {
        "metadata": metadata,
        "categories": data
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Results saved to {OUTPUT_FILE}")
    print(f"   Categories: {metadata['total_categories']}")
    print(f"   Total icons: {metadata['total_icons']}")
    
    # Save category names and metadata separately
    save_categories_metadata(data, metadata)


def save_categories_metadata(data: Dict[str, List[str]], metadata: Dict) -> None:
    """Save category names and metadata to a separate JSON file."""
    # Extract just the category names (sorted)
    category_names = sorted(data.keys())
    
    # Create output with metadata and category list
    output = {
        "metadata": metadata,
        "category_names": category_names,
        "category_counts": {
            category: len(icons) for category, icons in sorted(data.items())
        }
    }
    
    with open(CATEGORIES_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Categories metadata saved to {CATEGORIES_METADATA_FILE}")
    print(f"   Category names: {len(category_names)}")


async def main():
    """Main entry point."""
    print("=" * 60)
    print("FontAwesome Category Scraper")
    print("=" * 60)
    print()
    
    try:
        # Scrape all categories
        data = await scrape_all_categories()
        
        if data:
            # Save results
            save_results(data)
            print("\n✅ Scraping completed successfully!")
        else:
            print("\n❌ No data collected. Check the selectors and page structure.")
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Scraping interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
