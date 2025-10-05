from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the HTML file
        file_path = os.path.abspath("OpenDensityTool.html")

        # Open the local HTML file
        page.goto(f"file://{file_path}")

        # Wait for the page to be ready
        page.wait_for_selector("h1")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run()