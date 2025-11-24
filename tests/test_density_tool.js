
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

// Helper to load the tool
function loadTool() {
    const htmlPath = path.resolve(__dirname, '../OpenDensityTool.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Inject window.densityTool export
    const modifiedHtml = htmlContent.replace('new DensityTool();', 'window.densityTool = new DensityTool();');

    const dom = new JSDOM(modifiedHtml, {
        runScripts: "dangerously",
        resources: "usable",
        beforeParse(window) {
            window.opentype = opentype;
            window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
            window.cancelAnimationFrame = (id) => clearTimeout(id);
            window.alert = (msg) => {}; // Silence alerts
        }
    });

    return new Promise((resolve, reject) => {
        // Wait for script to execute
        setTimeout(() => {
            const tool = dom.window.densityTool;
            if (tool) resolve(tool);
            else reject(new Error("DensityTool not initialized"));
        }, 100);
    });
}

async function testWhitespacePreservation() {
    console.log("Running test: Whitespace Preservation");
    const tool = await loadTool();

    // Mock a font
    const mockFont = {
        unitsPerEm: 1000,
        ascender: 800,
        descender: -200,
        tables: { os2: { usWinAscent: 800, usWinDescent: 200 }, hhea: { ascender: 800, descender: -200 } },
        stringToGlyphs: (text) => text.split('').map(char => ({ path: { getBoundingBox: () => ({x1:0,y1:-200,x2:500,y2:800}) } })),
        getPath: () => ({ getBoundingBox: () => ({x1:0,y1:0,x2:500,y2:100}) }),
        getAdvanceWidth: () => 500,
        draw: (ctx) => { ctx.fillRect(0,0,10,10); }
    };

    tool.state.fonts[0] = mockFont;

    // Test input with spaces
    const testString = " a ";
    tool.elements.font1Text.value = testString;

    // Spy on analyze
    const originalAnalyze = tool.analyze.bind(tool);
    let capturedText = null;
    tool.analyze = (font, text, ...args) => {
        // Only capture if it matches our test string or trimmed version (to detect failure)
        if (text === testString || text === testString.trim()) {
            capturedText = text;
        }
        return originalAnalyze(font, text, ...args);
    };

    tool.update();

    if (capturedText === testString) {
        console.log("PASS: Text was preserved exactly ('" + capturedText + "').");
    } else if (capturedText === testString.trim()) {
        console.error("FAIL: Text was trimmed ('" + capturedText + "').");
        process.exit(1);
    } else {
        console.error("FAIL: Unexpected text passed to analyze: '" + capturedText + "'");
        process.exit(1);
    }
}

testWhitespacePreservation().catch(err => {
    console.error(err);
    process.exit(1);
});
