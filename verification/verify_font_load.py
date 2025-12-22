from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:8000/OpenDensityTool.html')

        # Wait for the font to load and analysis to appear.
        # Initially it says "Load a font." in #result1.
        # After loading, it should show "Density: ..."

        # We can wait for the text "Density:" to appear in #result1
        try:
            expect(page.locator('#result1')).to_contain_text("Density:", timeout=10000)
            print("Font loaded successfully!")
        except Exception as e:
            print("Font failed to load or timed out.")
            print(page.locator('#result1').text_content())

        page.screenshot(path='verification/font_loaded.png')
        browser.close()

if __name__ == '__main__':
    run()
