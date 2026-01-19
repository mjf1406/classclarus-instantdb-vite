# FontAwesome Category Scraper

This script scrapes FontAwesome's free classic icon collection to extract icon names grouped by category.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements-scraper.txt
```

2. Install Playwright browsers:
```bash
playwright install chromium
```

## Usage

Run the scraper:
```bash
python scripts/scrape_fontawesome_categories.py
```

The script will:
- Launch a headless browser
- Navigate to FontAwesome's search page
- Click through each category in the sidebar
- Scrape all icons from all pages for each category
- Save results to `scripts/fontawesome_icon_categories.json`

## Output Format

The JSON output will have the following structure:
```json
{
  "metadata": {
    "scrape_date": "2024-01-01T12:00:00",
    "total_categories": 50,
    "total_icons": 2000
  },
  "categories": {
    "communication": ["fa-classic fa-solid fa-address-book", ...],
    "business": ["fa-classic fa-solid fa-briefcase", ...],
    ...
  }
}
```

## Notes

- The scraper includes delays between actions to avoid being rate-limited
- If the script fails, check the console output for specific errors
- You may need to adjust selectors if FontAwesome updates their HTML structure
