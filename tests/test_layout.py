import pytest
from playwright.sync_api import sync_playwright, expect
import os

def test_fit_to_view_scaling(page):
    # Get the absolute path to the HTML file
    file_path = os.path.abspath("OpenDensityTool.html")

    page.goto(f"file://{file_path}")

    # Set a small viewport to ensure scaling is triggered
    page.set_viewport_size({"width": 800, "height": 600})

    # Load a font and set a large font size to generate a wide canvas
    page.locator("#font1-file").set_input_files("tests/fixtures/NotoSans-Regular.ttf")
    page.locator("#font1-size").fill("200")

    # Wait for the canvas to be rendered with the font
    page.wait_for_function("document.getElementById('canvas').width > 800", timeout=15000)

    # Switch to "Fit to View"
    page.locator("#zoom-mode").select_option("fit")

    # Give the browser a moment to apply the scaling
    page.wait_for_timeout(500)

    # And the wrapper should not be overflowing its container
    wrapper = page.locator(".canvas-wrapper")
    wrapper_width_after = wrapper.bounding_box()["width"]
    container_width = page.locator(".preview-container").bounding_box()["width"]
    assert wrapper_width_after <= container_width, "The wrapper is overflowing its container"

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_fit_to_view_scaling(page)
            print("Test passed!")
        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()
