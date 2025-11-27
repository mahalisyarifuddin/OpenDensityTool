const opentype = require('opentype.js');
const { createCanvas } = require('canvas');
const fs = require('fs');

async function run() {
    const fontBuffer = fs.readFileSync('roboto-regular-webfont.woff');
    const font = opentype.parse(fontBuffer.buffer);

    const text = "Testing";
    const fontSize = 100;
    const letterSpacing = 50; // Large spacing

    const opts = {
        tracking: letterSpacing ? (letterSpacing / fontSize) * 1000 : 0
    };

    const advanceWidthWithOpts = font.getAdvanceWidth(text, fontSize, opts);
    const advanceWidthWithoutOpts = font.getAdvanceWidth(text, fontSize);

    console.log(`Advance Width with opts: ${advanceWidthWithOpts}`);
    console.log(`Advance Width without opts: ${advanceWidthWithoutOpts}`);

    if (advanceWidthWithOpts === advanceWidthWithoutOpts) {
        console.log("BUG CONFIRMED: getAdvanceWidth ignores options/tracking");
    } else {
        console.log("getAdvanceWidth respects options");
    }

    // Also check getPath
    const path = font.getPath(text, 0, 0, fontSize, opts);
    const box = path.getBoundingBox();
    console.log(`Bounding Box Width: ${box.x2 - box.x1}`);
}

run();
