from playwright.sync_api import sync_playwright

def verify_editor():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the editor
        page.goto("http://localhost:3000")

        # Wait for Reveal to load
        page.wait_for_selector(".reveal")

        # Check for toolbar elements
        page.wait_for_selector("#editor-toolbar")

        # Take a screenshot
        page.screenshot(path="verification/editor.png")

        browser.close()

if __name__ == "__main__":
    verify_editor()
