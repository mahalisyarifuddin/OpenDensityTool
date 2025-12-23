
from playwright.sync_api import sync_playwright

def verify_visuals():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8000/OpenDensityTool.html")

        # Take a screenshot of the controls area where the buttons are
        # We target 'main' or specifically the 'section' with configuration
        page.locator("main > section").first.screenshot(path="verification/buttons_visual.png")

        browser.close()

if __name__ == "__main__":
    verify_visuals()
