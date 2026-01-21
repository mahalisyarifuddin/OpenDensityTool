
from playwright.sync_api import sync_playwright
import time
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console logs
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PageError: {err}"))

    page.goto("http://localhost:8001/OpenDensityTool.html")

    # Check if page loaded
    print(page.title())

    # Upload font
    cwd = os.getcwd()
    font_path = os.path.join(cwd, "roboto-regular-webfont.woff")

    if not os.path.exists(font_path):
        print(f"Font file not found at {font_path}")
        return

    page.set_input_files("#file1", font_path)

    # Wait for processing.
    try:
        page.wait_for_selector("#result1 .statisticGrid", timeout=5000)
    except Exception as e:
        print(f"Error waiting for selector: {e}")
        # Take a screenshot to see what's happening
        page.screenshot(path="verification/error_screenshot.png")

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
