const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => {
      console.log('BROWSER ERROR:', error.message);
      process.exit(1);
  });

  const filePath = `file://${path.resolve(__dirname, 'OpenDensityTool.html')}`;
  await page.goto(filePath);

  await page.waitForSelector('.group', { state: 'attached' });

  // wait a bit
  await page.waitForTimeout(1000);

  await browser.close();
})();
