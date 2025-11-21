from playwright.sync_api import sync_playwright, expect
import os

def verify_density_tool():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the tool
        page.goto("http://localhost:8000/OpenDensityTool.html")

        # Verify page loaded
        expect(page.locator("h1")).to_have_text("Typographic Density Tool")

        # Since we can't easily upload a font file programmatically without having one,
        # we can only verify the initial state and that the canvas exists.
        # However, the fix handles logic when a font IS loaded.
        # We can check if the application crashes or if the canvas is present.

        canvas = page.locator("#mainCanvas")
        expect(canvas).to_be_visible()

        # Take a screenshot of the initial state
        screenshot_path = "/home/jules/verification/density_tool_initial.png"
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path=screenshot_path)

        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_density_tool()
