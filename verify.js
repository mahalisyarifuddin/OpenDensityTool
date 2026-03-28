const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load the HTML file
  const filePath = `file://${path.resolve(__dirname, 'OpenDensityTool.html')}`;
  await page.goto(filePath);

  // Wait for the UI to render. Using #container makes sure we get a specific element that is loaded
  await page.waitForSelector('.group', { state: 'attached' });

  // Find the file drop group (id="file1").closest('.group')
  const groupHandle = await page.$('#file1');
  const parentGroup = await page.evaluateHandle(el => el.closest('.group'), groupHandle);

  // Trigger dragover to add 'dragActive'
  await page.evaluate(el => {
    const event = new Event('dragover');
    el.dispatchEvent(event);
  }, parentGroup);

  // Verify class is added
  let hasClass = await page.evaluate(el => el.classList.contains('dragActive'), parentGroup);
  if (!hasClass) {
    console.error('dragActive class was not added on dragover');
    process.exit(1);
  }

  // Trigger dragleave with an element outside the group as relatedTarget
  await page.evaluate(el => {
    const event = new Event('dragleave');
    // Mock relatedTarget to be document.body (outside the group)
    Object.defineProperty(event, 'relatedTarget', { value: document.body });
    el.dispatchEvent(event);
  }, parentGroup);

  // Verify class is removed
  hasClass = await page.evaluate(el => el.classList.contains('dragActive'), parentGroup);
  if (hasClass) {
    console.error('dragActive class was not removed on dragleave');
    process.exit(1);
  }

  console.log('Test passed: dragleave correctly removes dragActive class without ReferenceError.');

  // Test confirmAction aria-label restoration
  const clearBtn = await page.$('#clear1');
  const initialAria = await page.evaluate(el => el.getAttribute('aria-label'), clearBtn);
  if (initialAria !== 'Clear Font 1') {
    console.error(`Expected initial aria-label to be 'Clear Font 1', got '${initialAria}'`);
    process.exit(1);
  }

  // Click to trigger confirm state
  await clearBtn.click();
  let currentAria = await page.evaluate(el => el.getAttribute('aria-label'), clearBtn);
  if (currentAria !== 'Confirm Clear') {
    console.error(`Expected confirm aria-label to be 'Confirm Clear', got '${currentAria}'`);
    process.exit(1);
  }

  // Click again to confirm
  await clearBtn.click();
  currentAria = await page.evaluate(el => el.getAttribute('aria-label'), clearBtn);
  if (currentAria !== 'Clear Font 1') {
    console.error(`Expected restored aria-label to be 'Clear Font 1', got '${currentAria}'`);
    process.exit(1);
  }

  console.log('Test passed: confirmAction correctly restores aria-label.');

  await browser.close();
})();