
from playwright.sync_api import sync_playwright

def verify_visuals_full():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8000/OpenDensityTool.html")

        # Take a screenshot of the main area
        page.locator("main").screenshot(path="verification/full_visual.png")

        browser.close()

if __name__ == "__main__":
    verify_visuals_full()
