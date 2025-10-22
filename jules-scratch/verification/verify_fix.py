from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Get the absolute path to the HTML file
        html_file_path = os.path.abspath('OpenDensityTool.html')

        # Go to the local HTML file
        page.goto(f'file://{html_file_path}')

        # Input a pangram into the text area
        page.fill('#font1-text', 'The quick brown fox jumps over the lazy dog')

        # Take a screenshot of the main container
        page.locator('.container').screenshot(path='jules-scratch/verification/verification.png')

        browser.close()

if __name__ == "__main__":
    run()
