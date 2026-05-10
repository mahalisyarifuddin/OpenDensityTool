const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`file://${path.resolve(__dirname, 'OpenDensityTool.html')}`);
  await page.waitForSelector('.group', { state: 'attached' });

  await page.evaluate(async () => {
    window.workerCalls = 0;
    const origRunWorker = window.app.runWorker;
    window.app.runWorker = function(...args) {
      window.workerCalls++;
      return origRunWorker.apply(this, args);
    };

    const resp = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2');
    const blob = await resp.blob();
    const file = new File([blob], "roboto.woff2", { type: 'font/woff2' });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    document.getElementById('file1').files = dataTransfer.files;
    document.getElementById('file1').dispatchEvent(new Event('change', { bubbles: true }));
  });

  await page.waitForTimeout(1000);

  // Type a string with many duplicate characters
  await page.evaluate(() => {
    document.getElementById('text1').value = "aaaaaaaaaaaaaaaaaaaa"; // 20 'a's
    document.getElementById('text1').dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.workerCalls = 0; });

  // Enable autospacing to trigger getGlyphProfile for all 20 characters
  await page.evaluate(() => {
    document.getElementById('autospacing1').checked = true;
    document.getElementById('autospacing1').dispatchEvent(new Event('change'));
  });

  await page.waitForTimeout(1000);
  let calls = await page.evaluate(() => window.workerCalls);
  console.log('Worker calls for 20 "a"s:', calls);

  await browser.close();
})();
