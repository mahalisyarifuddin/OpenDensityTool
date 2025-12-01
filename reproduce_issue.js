const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration
const PORT = 8081; // Make sure the server is running on this port
const URL = `http://localhost:${PORT}/OpenDensityTool.html`;

(async () => {
    console.log('Starting reproduction test...');
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    try {
        await page.goto(URL);

        // Upload file (assumes roboto-regular-webfont.woff exists in root)
        const fileInput = await page.$('#file1');
        if (!fileInput) throw new Error('File input not found');
        await fileInput.uploadFile('roboto-regular-webfont.woff');

        // Wait for analysis
        await new Promise(r => setTimeout(r, 1000));

        console.log('Setting huge text to trigger OOM...');

        // Set huge text and size
        await page.evaluate(() => {
            const textInput = document.getElementById('text1');
            const sizeInput = document.getElementById('size1');

            // 1000 "M"s at size 2000 causes approx 2,000,000 px width canvas
            textInput.value = 'M'.repeat(1000);
            sizeInput.value = 2000;

            // Trigger input event
            textInput.dispatchEvent(new Event('input'));
            sizeInput.dispatchEvent(new Event('input'));
        });

        // Wait for processing
        await new Promise(r => setTimeout(r, 2000));

        // Check result
        const result = await page.evaluate(() => {
            const result1 = document.getElementById('result1');
            return result1.textContent;
        });
        console.log('Result text found:', result);

        if (result.includes('Error:') || result.includes('File too large') || result.includes('Canvas') || result.includes('Out of memory')) {
            console.log('TEST PASS: Error was caught and reported in UI.');
        } else if (result.includes('Density:')) {
            console.log('TEST FAIL: UI shows density (stale data) or failed to catch error.');
            process.exit(1);
        } else {
            console.log('TEST FAIL: UI shows unexpected state.');
            process.exit(1);
        }

    } catch (e) {
        console.error('TEST ERROR:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
