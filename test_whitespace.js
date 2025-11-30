const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const opentype = require('opentype.js');

// This test verifies that the OpenDensityTool correctly preserves leading/trailing whitespace
// during analysis, which is crucial for manual alignment and accurate density calculation.
//
// To run this test:
// 1. npm install jsdom opentype.js
// 2. node test_whitespace.js

async function test() {
    console.log("Loading OpenDensityTool.html...");
    const html = fs.readFileSync('OpenDensityTool.html', 'utf8');

    // Inject hook to access DensityTool class
    let modifiedHtml = html.replace(
        'class DensityTool {',
        'window.DensityToolHook = class DensityTool {'
    );
    // Disable auto-init
    modifiedHtml = modifiedHtml.replace('new DensityTool();', '// new DensityTool();');

    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.on("error", () => {}); // Suppress canvas errors

    const dom = new JSDOM(modifiedHtml, {
        runScripts: "dangerously",
        resources: "usable",
        virtualConsole
    });

    const window = dom.window;
    window.opentype = opentype;

    // Mock Canvas getContext because JSDOM canvas support might be limited
    window.HTMLCanvasElement.prototype.getContext = function() {
        return {
            clearRect: () => {},
            fillRect: () => {},
            drawImage: () => {},
            getImageData: () => ({ data: new Uint8ClampedArray(4) }),
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            quadraticCurveTo: () => {},
            bezierCurveTo: () => {},
            closePath: () => {},
            fill: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {},
        };
    };

    // Create tool instance
    const tool = new window.DensityToolHook();

    // Mock font loading
    const font = await opentype.load('roboto-regular-webfont.woff');
    tool.fonts[0] = font;

    // Setup inputs
    const textArea = window.document.getElementById('text1');
    const inputString = " A ";
    textArea.value = inputString;

    // Spy on analyze method to check what content receives
    let receivedContent = null;
    const originalAnalyze = tool.analyze.bind(tool);
    tool.analyze = (font, content, ...args) => {
        // We only care about the first call corresponding to text1
        if (receivedContent === null) {
            receivedContent = content;
        }
        return originalAnalyze(font, content, ...args);
    };

    // Trigger update (which reads inputs and calls analyze)
    tool.update();

    console.log(`Input: '${inputString}'`);
    console.log(`Analyzed: '${receivedContent}'`);

    if (receivedContent === inputString) {
        console.log("PASS: Whitespace was preserved.");
    } else if (receivedContent === inputString.trim()) {
        console.log("FAIL: Whitespace was trimmed.");
        process.exit(1);
    } else {
        console.log("UNKNOWN: " + receivedContent);
        process.exit(1);
    }
}

test();
