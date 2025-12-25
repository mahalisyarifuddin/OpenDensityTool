from playwright.sync_api import sync_playwright

def verify_canvas(page):
    page.goto("http://localhost:8080/OpenDensityTool.html")
    # Wait for canvas to be present
    page.wait_for_selector("#canvas")
    # Wait a bit for font loading and rendering (mocked or real)
    page.wait_for_timeout(2000)

    # Check if drag-active class logic works (via script injection since we can't easily drag-drop in headless easily)
    page.evaluate("document.querySelector('.group').classList.add('drag-active')")
    page.wait_for_timeout(500)
    page.screenshot(path="verification/drag_active.png")

    # Check canvas rendering (should not be empty)
    page.screenshot(path="verification/canvas_initial.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_canvas(page)
        finally:
            browser.close()
