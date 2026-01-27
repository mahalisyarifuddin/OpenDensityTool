import sys
from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8081/OpenDensityTool.html")

    # Wait for page load
    expect(page.get_by_role("heading", name="Typographic Density Tool")).to_be_visible()

    # Upload fonts to ensure canvas is active and sized
    font_path = os.path.abspath("roboto-regular-webfont.woff")
    page.set_input_files("#file1", font_path)
    page.set_input_files("#file2", font_path)

    # Wait for processing
    expect(page.locator("#result1 .statisticRow").first).to_be_visible(timeout=10000)

    # Get canvas element
    canvas = page.locator("#canvas")
    box = canvas.bounding_box()

    # Move mouse to the middle of the canvas
    center_x = box["x"] + box["width"] / 2
    center_y = box["y"] + box["height"] / 2
    page.mouse.move(center_x, center_y)

    # Check if cursor guide is visible
    guide = page.locator("#cursorGuide")
    expect(guide).to_be_visible()

    # Check that style 'top' is set
    style = guide.get_attribute("style")
    assert "top:" in style
    assert "left:" in style
    assert "width:" in style

    # Take screenshot for visual verification
    page.screenshot(path="verification/cursor_guide_visible.png")

    # Move mouse out
    page.mouse.move(0, 0)

    # Wait a bit for raf?
    page.wait_for_timeout(100)

    # Verify hidden.
    expect(guide).to_be_hidden()

    print("Cursor guide verification passed!")
    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
