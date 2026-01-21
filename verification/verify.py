
from playwright.sync_api import sync_playwright
import time
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8001/OpenDensityTool.html")

    # Check if page loaded
    print(page.title())

    # Upload font
    # input[type=file] id="file1"
    # We need to make sure the file path is absolute
    cwd = os.getcwd()
    font_path = os.path.join(cwd, "roboto-regular-webfont.woff")

    page.set_input_files("#file1", font_path)

    # Wait for processing. The UI shows a spinner or updates result1.
    # When loaded, #result1 contains "Density" text.
    page.wait_for_selector("#result1 .statisticGrid", timeout=5000)

    # Take screenshot of light mode
    page.screenshot(path="verification/screenshot_light.png")

    # Switch to dark mode
    page.click("#openSettings")
    page.select_option("#theme", "dark")
    page.click("#closeSettings")

    # Wait for transition/redraw (raf)
    time.sleep(1)

    # Take screenshot of dark mode
    page.screenshot(path="verification/screenshot_dark.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
