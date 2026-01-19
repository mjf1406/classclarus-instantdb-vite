#!/usr/bin/env python3
"""
Generate categories metadata file from existing fontawesome_icon_categories.json
"""

import json
from pathlib import Path

INPUT_FILE = Path(__file__).parent / "fontawesome_icon_categories.json"
OUTPUT_FILE = Path(__file__).parent / "fontawesome_categories_metadata.json"

def main():
    # Load the existing JSON file
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Extract metadata and categories
    metadata = data.get("metadata", {})
    categories = data.get("categories", {})
    
    # Extract just the category names (sorted)
    category_names = sorted(categories.keys())
    
    # Create output with metadata and category list
    output = {
        "metadata": metadata,
        "category_names": category_names,
        "category_counts": {
            category: len(icons) for category, icons in sorted(categories.items())
        }
    }
    
    # Save to file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Categories metadata saved to {OUTPUT_FILE}")
    print(f"   Total categories: {len(category_names)}")
    print(f"   Total icons: {metadata.get('total_icons', 'N/A')}")

if __name__ == "__main__":
    main()
