from playwright.sync_api import sync_playwright, expect
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:8080/OpenDensityTool.html")

            # Verify title
            expect(page).to_have_title("Typographic Density Tool")
            print("Title verified")

            # Upload font file
            font_path = os.path.abspath("roboto-regular-webfont.woff")
            file_input = page.locator("#file1")
            file_input.set_input_files(font_path)
            print("Font uploaded")

            # Wait for analysis to appear
            result_div = page.locator("#result1")
            expect(result_div).to_contain_text("Density", timeout=10000)
            print("Analysis loaded")

            # Get text content of result
            text = result_div.text_content()
            print(f"Result text: {text}")

            # Take screenshot
            page.screenshot(path="verification/after_refactor.png")
            print("Screenshot saved")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
