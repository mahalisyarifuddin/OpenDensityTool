const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const opentype = require('opentype.js');

// This test verifies that the OpenDensityTool correctly handles input that produces no ink (like a space),
// instead of returning null or crashing.

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
    // virtualConsole.on("error", () => {});

    const dom = new JSDOM(modifiedHtml, {
        runScripts: "dangerously",
        resources: "usable",
        virtualConsole
    });

    const window = dom.window;
    window.opentype = opentype;

    // Mock Canvas
    window.HTMLCanvasElement.prototype.getContext = function() {
        return {
            clearRect: () => {},
            fillRect: () => {},
            drawImage: () => {},
            getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), // All transparent
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
            globalCompositeOperation: 'source-over'
        };
    };

    const tool = new window.DensityToolHook();
    const font = await opentype.load('roboto-regular-webfont.woff');

    // Analyze space
    console.log("Analyzing space character...");
    const result = tool.analyze(font, " ", 100, 0, 0);

    if (result === null) {
        console.error("FAIL: Analyze returned null for space character.");
        process.exit(1);
    }

    console.log("Analyze returned a result object.");

    if (result.density !== "0.0") {
        console.error(`FAIL: Expected density 0.0, got ${result.density}`);
        process.exit(1);
    }

    if (result.yMin !== 0 || result.yMax !== 0) {
         console.warn(`WARNING: yMin/yMax are ${result.yMin}/${result.yMax}. Expected 0/0 for no ink.`);
         // Not failing, but noting it.
    }

    console.log("PASS: Space character analyzed successfully.");
}

test();
