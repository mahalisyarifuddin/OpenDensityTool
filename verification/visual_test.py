import sys
from playwright.sync_api import sync_playwright, expect
import os

def run(playwright, output_path):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8081/OpenDensityTool.html")

    # Wait for page load
    expect(page.get_by_role("heading", name="Typographic Density Tool")).to_be_visible()

    # Upload fonts
    # We use the roboto font file present in the repo
    font_path = os.path.abspath("roboto-regular-webfont.woff")
    page.set_input_files("#file1", font_path)
    page.set_input_files("#file2", font_path)

    # Set text
    page.fill("#text1", "Test")
    page.fill("#text2", "Test")

    # Set colors to test blending
    page.fill("#color1", "#ff0000")
    page.fill("#color2", "#0000ff")

    # Wait for processing to complete.
    # The spinner appears in #result1/2 when loading.
    # When done, .statisticRow appears.
    expect(page.locator("#result1 .statisticRow").first).to_be_visible(timeout=10000)
    expect(page.locator("#result2 .statisticRow").first).to_be_visible(timeout=10000)

    # Also toggle dark mode to test that logic (since we are refactoring it)
    # We need to test both light and dark modes?
    # The refactor affects both but heavily affects dark mode.
    # Let's switch to dark mode.
    page.click("#openSettings")
    expect(page.locator("#preferencesDialog")).to_be_visible()
    page.select_option("#theme", "dark")
    page.click("#closeSettings")

    # Wait a bit for render
    page.wait_for_timeout(500)

    # Take screenshot
    page.screenshot(path=output_path)

    browser.close()

if __name__ == "__main__":
    output = sys.argv[1] if len(sys.argv) > 1 else "verification/baseline.png"
    with sync_playwright() as playwright:
        run(playwright, output)
