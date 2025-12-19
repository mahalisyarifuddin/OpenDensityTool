
import os
from playwright.sync_api import sync_playwright

def verify_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        file_path = os.path.abspath("OpenDensityTool.html")
        page.goto(f"file://{file_path}")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/final.png")
        browser.close()

if __name__ == "__main__":
    verify_load()
