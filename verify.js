const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, 'OpenDensityTool.html'));
const fixture = path.join(__dirname, 'roboto-regular-webfont.woff');
const bundle = process.env.FONTKIT_BUNDLE_PATH;

async function main() {
  const server = http.createServer((req, res) => {
    if (req.url === '/fontkit.mjs' && bundle) {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      return fs.createReadStream(bundle).pipe(res);
    }
    res.writeHead(req.url === '/' ? 200 : 404, { 'Content-Type': 'text/html' });
    res.end(req.url === '/' ? html : 'Not found');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    if (bundle) await page.addInitScript(() => { window.FONTKIT_URL = '/fontkit.mjs'; });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => !!window.app);
    const ready = async index => page.waitForFunction(i => window.app.analyses[i] && !window.app.loading[i] && !window.app.analyses[i].error, index);
    await page.locator('#file1').setInputFiles(fixture);
    await ready(0);
    assert.match(await page.locator('#result1').innerText(), /Density/);
    const bounds = await page.evaluate(() => { const a = app.analyses[0]; return [a.yMax, a.yMin, a.inkHeight]; });
    assert.equal(bounds[0] - bounds[1], bounds[2]);
    await page.locator('#file2').setInputFiles(fixture);
    await ready(1);
    await page.evaluate(() => { const select = document.querySelector('#spacingUnit'); select.value = 'percent'; select.dispatchEvent(new Event('change')); });
    assert.equal(await page.locator('#spacingRange1').inputValue(), '100');
    assert.equal(await page.locator('#spacingRange1').getAttribute('min'), '0');
    await page.locator('#mute1').click();
    await page.locator('#resetConfig').click();
    await page.locator('#resetConfig').click();
    assert.equal(await page.locator('#spacing1').inputValue(), '100');
    assert.equal(await page.locator('#mute1').getAttribute('aria-pressed'), 'false');
    await page.evaluate(async () => {
      document.querySelector('#text1').value = '\nA\nB\tC\n';
      await app.update();
    });
    assert.equal(await page.evaluate(() => app.layoutCache[0].content), 'A B C');
    await page.evaluate(() => { app.loadErrors[0] = '<img src=x onerror="window.xss=1">'; app.updateResult(1, 0); });
    assert.equal(await page.locator('#result1 img').count(), 0);
    assert.match(await page.locator('#result1').innerText(), /<img/);
    await page.evaluate(() => { app.loadErrors[0] = null; });
    await page.evaluate(async () => {
      document.querySelector('#spacing1').value = '0';
      document.querySelector('#autospacing1').checked = true;
      document.querySelector('#text1').value = 'AV';
      await app.update();
      if (!app.analyses[0] || app.analyses[0].error) throw new Error('Zero tracking with optical spacing failed');
      document.querySelector('#text1').value = '';
      await app.update();
      if (app.analyses[0].inkHeight !== 0) throw new Error('Empty text has nonzero ink bounds');
      document.querySelector('#autospacing1').checked = false;
    });
    await page.evaluate(async () => {
      const old = app.generateRenderData.bind(app);
      app.generateRenderData = async (sequence, inputs) => {
        if (inputs.content === 'old') await new Promise(resolve => setTimeout(resolve, 150));
        return old(sequence, inputs);
      };
      document.querySelector('#text1').value = 'old';
      const first = app.update();
      document.querySelector('#text1').value = 'new';
      const second = app.update();
      await Promise.all([first, second]);
      app.generateRenderData = old;
    });
    assert.equal(await page.evaluate(() => app.layoutCache[0].content), 'new');
    await page.evaluate(() => {
      app.collections[0] = [app.fonts[0], app.fonts[1]];
      app.updateFaceSelector(0);
    });
    assert.equal(await page.locator('#face1 option').count(), 2);
    await page.locator('#swapFonts').click();
    assert.equal(await page.locator('#face2 option').count(), 2);
    await page.locator('#clear2').click();
    await page.locator('#clear2').click();
    assert.equal(await page.evaluate(() => app.fonts[1]), null);
    assert.equal(await page.locator('#faceField2').isHidden(), true);
    await page.evaluate(async () => {
      const sequence = app.loadSequence[0];
      const file = { size: 1, arrayBuffer: () => new Promise(resolve => setTimeout(() => resolve(new ArrayBuffer(1)), 100)) };
      const loading = app.loadFont(file, 0);
      app.clearFont(0);
      await loading;
      if (app.loading[0] || app.fonts[0] || app.loadSequence[0] === sequence) throw new Error('Clear did not cancel load');
      await app.update();
    });
    await page.locator('#file1').setInputFiles(fixture);
    await ready(0);
    const visibility = await page.evaluate(() => app.visibility[0]);
    await page.keyboard.press('Control+Digit1');
    assert.equal(await page.evaluate(() => app.visibility[0]), visibility);
    await page.evaluate(() => {
      const group = document.querySelector('#file1').closest('.group');
      group.dispatchEvent(new Event('dragover', { cancelable: true }));
      if (!group.classList.contains('dragActive')) throw new Error('Drag state missing');
      group.dispatchEvent(new Event('dragleave'));
      if (group.classList.contains('dragActive')) throw new Error('Drag state stuck');
    });
    assert.deepEqual(errors, []);
    console.log('Verification passed: loading, analysis, spacing, reset, safety, races, collections, clear, shortcuts and drag/drop.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
