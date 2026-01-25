from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8081/OpenDensityTool.html")

    # Wait for page load
    expect(page.get_by_role("heading", name="Typographic Density Tool")).to_be_visible()

    # Locate inputs
    text1 = page.locator("#text1")
    text2 = page.locator("#text2")

    # Set initial values
    text1.fill("AAA")
    text2.fill("BBB")

    # Verify initial state
    expect(text1).to_have_value("AAA")
    expect(text2).to_have_value("BBB")

    # Click Swap
    page.click("#swapFonts")

    # Verify swapped state
    expect(text1).to_have_value("BBB")
    expect(text2).to_have_value("AAA")

    # Verify button visibility and style
    swap_btn = page.locator("#swapFonts")
    expect(swap_btn).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
