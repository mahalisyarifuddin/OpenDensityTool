import os
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Load local file
        filepath = os.path.abspath("OpenDensityTool.html")
        page.goto(f"file://{filepath}")

        # Take a screenshot
        page.screenshot(path="verification/screenshot.png")

        # Check title
        assert page.title() == "Typographic Density Tool"

        # Check main sections
        assert page.locator("h2:has-text('Configuration')").is_visible()

        # Verify inputs and default values
        assert page.locator("#text1").input_value() == "Idealogy"
        assert page.locator("#text2").input_value() == "Идеология"

        print("Verification passed and screenshot taken.")
        browser.close()

if __name__ == "__main__":
    verify()
