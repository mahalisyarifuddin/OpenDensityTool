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

  // Test swap functionality for mute and solo states
  const mute1Btn = await page.$('#mute1');
  const mute2Btn = await page.$('#mute2');
  const solo1Btn = await page.$('#solo1');
  const solo2Btn = await page.$('#solo2');
  const swapBtn = await page.$('#swapFonts');

  // Mute font 1 and solo font 2 to set up different states
  await mute1Btn.click();
  await solo2Btn.click();

  let state = await page.evaluate(() => {
    return {
      m1: document.getElementById('mute1').getAttribute('aria-pressed'),
      m2: document.getElementById('mute2').getAttribute('aria-pressed'),
      s1: document.getElementById('solo1').getAttribute('aria-pressed'),
      s2: document.getElementById('solo2').getAttribute('aria-pressed')
    };
  });

  if (state.m1 !== 'true' || state.m2 !== 'false' || state.s1 !== 'false' || state.s2 !== 'true') {
    console.error(`Expected pre-swap state to be m1=true, m2=false, s1=false, s2=true, got ${JSON.stringify(state)}`);
    process.exit(1);
  }

  // Swap
  await swapBtn.click();

  state = await page.evaluate(() => {
    return {
      m1: document.getElementById('mute1').getAttribute('aria-pressed'),
      m2: document.getElementById('mute2').getAttribute('aria-pressed'),
      s1: document.getElementById('solo1').getAttribute('aria-pressed'),
      s2: document.getElementById('solo2').getAttribute('aria-pressed')
    };
  });

  if (state.m1 !== 'false' || state.m2 !== 'true' || state.s1 !== 'true' || state.s2 !== 'false') {
    console.error(`Expected post-swap state to be m1=false, m2=true, s1=true, s2=false, got ${JSON.stringify(state)}`);
    process.exit(1);
  }

  console.log('Test passed: swap correctly swaps mute and solo aria-pressed states.');

  await browser.close();
})();