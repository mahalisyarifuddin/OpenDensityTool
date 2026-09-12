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
// NEW TEST: Empty String Crash (Medic Mode)
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve(__dirname, 'OpenDensityTool.html')}`;
  await page.goto(filePath);

  await page.waitForSelector('.group', { state: 'attached' });

  // upload font first
  const fileInput = await page.$('#file1');
  await fileInput.setInputFiles('roboto-regular-webfont.woff');
  await page.waitForTimeout(500);

  // Clear the text area 1
  await page.fill('#text1', '');

  // Wait a bit for debounced update
  await page.waitForTimeout(500);

  // See what is the result
  const textContent = await page.textContent('#result1');
  if (textContent.includes('Error')) {
    console.error('Empty string test failed! Crash observed:', textContent);
    process.exit(1);
  }

  console.log('Test passed: empty string does not cause a crash.');

  await browser.close();
})();

// NEW TEST: AdvanceScale scaling percentage tracking with optical autospacing Crash (Medic Mode)
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve(__dirname, 'OpenDensityTool.html')}`;
  await page.goto(filePath);

  await page.waitForSelector('.group', { state: 'attached' });

  // upload font first
  const fileInput = await page.$('#file1');
  await fileInput.setInputFiles('roboto-regular-webfont.woff');
  await page.waitForTimeout(500);

  // Switch to percent
  await page.click('#openSettings');
  await page.selectOption('#spacingUnit', 'percent');
  await page.click('#closeSettings');
  await page.waitForTimeout(100);

  // Set tracking to 0%
  await page.fill('#spacing1', '0');

  // Enable autospacing
  await page.check('#autospacing1');

  await page.waitForTimeout(500);

  const textContent = await page.textContent('#result1');
  if (textContent.includes('Error')) {
    console.error('AdvanceScale test failed! Crash observed:', textContent);
    process.exit(1);
  }

  console.log('Test passed: AdvanceScale does not cause a crash.');

  await browser.close();
})();

// NEW TEST: Canvas Box Density Mode (Bolt Mode)
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve(__dirname, 'OpenDensityTool.html')}`;
  await page.goto(filePath);

  await page.waitForSelector('.group', { state: 'attached' });

  // upload font first
  const fileInput = await page.$('#file1');
  await fileInput.setInputFiles('roboto-regular-webfont.woff');
  await page.waitForTimeout(500);

  // Change density mode to Canvas Box
  await page.selectOption('#density', 'canvas');
  await page.waitForTimeout(500);

  const textContent = await page.textContent('#result1');
  if (textContent.includes('Error') || !textContent.includes('Density')) {
    console.error('Canvas Box test failed! Text content:', textContent);
    process.exit(1);
  }

  console.log('Test passed: Canvas Box mode works correctly.');

  await browser.close();
})();

// NEW TEST: Canvas Box Height Reference (Font 1 / Font 2 / Tallest)
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve(__dirname, 'OpenDensityTool.html')}`;
  await page.goto(filePath);

  await page.waitForSelector('.group', { state: 'attached' });

  // Same font in both slots at different sizes -> different canvas heights
  await page.setInputFiles('#file1', 'roboto-regular-webfont.woff');
  await page.setInputFiles('#file2', 'roboto-regular-webfont.woff');
  await page.waitForFunction(() => app.fonts[0] && app.fonts[1] && !app.loading[0] && !app.loading[1]);
  await page.fill('#size2', '50');
  await page.waitForTimeout(500);

  const readDensity = async n => parseFloat((await page.textContent(`#result${n}`)).match(/Density([\d.]+)%/)[1]);
  const expected = (index, height) => page.evaluate(([i, h]) => {
    const a = app.analyses[i];
    return +((a.inkPixels / (Math.max(1, a.advanceWidth) * h)) * 100).toFixed(1);
  }, [index, height]);

  // The picker is only relevant in Canvas Box mode
  let hidden = await page.evaluate(() => document.getElementById('canvasRef').hidden);
  if (!hidden) {
    console.error('Canvas Ref test failed! #canvasRef should be hidden outside Canvas Box mode');
    process.exit(1);
  }
  await page.selectOption('#density', 'canvas');
  await page.waitForTimeout(500);
  hidden = await page.evaluate(() => document.getElementById('canvasRef').hidden);
  if (hidden) {
    console.error('Canvas Ref test failed! #canvasRef should be visible in Canvas Box mode');
    process.exit(1);
  }

  const heights = await page.evaluate(() => app.analyses.map(a => a.height));
  if (!(heights[0] > heights[1])) {
    console.error('Canvas Ref test failed! Expected font 1 to be taller than font 2, got', heights);
    process.exit(1);
  }

  for (const [ref, height] of [['1', heights[0]], ['2', heights[1]], ['auto', heights[0]]]) {
    await page.selectOption('#canvasRef', ref);
    await page.waitForTimeout(500);
    for (const index of [0, 1]) {
      const actual = await readDensity(index + 1);
      const want = await expected(index, height);
      if (actual !== want) {
        console.error(`Canvas Ref test failed! ref=${ref} font ${index + 1}: expected ${want}%, got ${actual}%`);
        process.exit(1);
      }
    }
  }

  // Swapping fonts keeps the reference pinned to the same font
  await page.selectOption('#canvasRef', '2');
  await page.waitForTimeout(500);
  const before = [await readDensity(1), await readDensity(2)];
  await page.click('#swapFonts');
  await page.waitForTimeout(500);
  const after = [await readDensity(1), await readDensity(2)];
  const refAfter = await page.evaluate(() => document.getElementById('canvasRef').value);
  if (refAfter !== '1' || after[0] !== before[1] || after[1] !== before[0]) {
    console.error(`Canvas Ref test failed! After swap expected ref=1 and densities ${JSON.stringify([before[1], before[0]])}, got ref=${refAfter} ${JSON.stringify(after)}`);
    process.exit(1);
  }

  // A pinned font that is cleared falls back to the tallest visible font (no crash).
  // After the swap, slot 2 holds the larger font, so its own height is the fallback.
  await page.click('#clear1');
  await page.click('#clear1');
  await page.waitForTimeout(500);
  const fallback = await readDensity(2);
  const fallbackWant = await expected(1, heights[0]);
  if (fallback !== fallbackWant || (await page.textContent('#result2')).includes('Error')) {
    console.error(`Canvas Ref test failed! Fallback expected ${fallbackWant}%, got ${fallback}%`);
    process.exit(1);
  }

  console.log('Test passed: Canvas Box height reference normalises against the selected font.');

  await browser.close();
})();

// NEW TEST: Async Swap Race Condition during File Load (Medic Mode)
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve(__dirname, 'OpenDensityTool.html')}`;
  await page.goto(filePath);

  await page.waitForSelector('.group', { state: 'attached' });

  // Expose a function to trigger file input without awaiting
  await page.evaluate(() => {
    window.triggerUploadAndSwap = async () => {
      // Mock file
      const blob = new Blob(["dummy"], { type: 'font/woff' });
      const file = new File([blob], "dummy.woff");

      // Delay arrayBuffer to simulate slow network/large file
      const origArrayBuffer = file.arrayBuffer.bind(file);
      file.arrayBuffer = async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve(origArrayBuffer()), 500);
        });
      };

      app.loadFont(file, 0);
      app.swap();
    };
  });

  await page.evaluate(() => window.triggerUploadAndSwap());

  await page.waitForTimeout(1000);

  const loading = await page.evaluate(() => app.loading);
  const loadErrors = await page.evaluate(() => app.loadErrors.map(e => !!e));

  if (loading[0] || loading[1] || loadErrors[0] || !loadErrors[1]) {
    console.error('Async Swap Race Condition test failed! Expected loading: [false, false] and loadErrors: [false, true]', loading, loadErrors);
    process.exit(1);
  }

  console.log('Test passed: async swap race condition is handled correctly.');

  await browser.close();
})();
