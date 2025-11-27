const opentype = require('opentype.js');
const fs = require('fs');
const { createCanvas } = require('canvas');

async function run() {
    const fontBuffer = fs.readFileSync('roboto-regular-webfont.woff');
    const font = opentype.parse(fontBuffer.buffer);
    const text = "gypq"; // Descenders

    // Use the fontSize that caused clipping before
    const fontSize = 10.499999999999998;

    const scale = fontSize / font.unitsPerEm;
    const os2 = font.tables.os2;
    const hhea = font.tables.hhea;

    const metric = keys=>Math.max(0, ...keys.map(k=>Math.abs(font[k] ?? os2?.[k] ?? hhea?.[k] ?? 0)).filter(v=>!isNaN(v))) * scale;

    const fontAscent = metric(['ascender', 'sTypoAscender', 'usWinAscent']);
    const fontDescent = metric(['descender', 'sTypoDescender', 'usWinDescent']);

    const glyphs = font.stringToGlyphs(text);
    const extents = glyphs.reduce((r,g)=>{
        const b = g.path.getBoundingBox();
        if (b && isFinite(b.y1) && isFinite(b.y2)) {
            r.actualAscent = Math.max(r.actualAscent, b.y2);
            r.actualDescent = Math.max(r.actualDescent, -b.y1);
        }
        return r;
    }, { actualAscent: 0, actualDescent: 0 });

    const ascent = Math.max(extents.actualAscent * scale, fontAscent);
    const descent = Math.max(extents.actualDescent * scale, fontDescent);

    // Proposed FIX:
    const baseline = Math.ceil(ascent);
    const currentHeight = Math.ceil(baseline + descent);

    console.log(`FontSize: ${fontSize}`);
    console.log(`Ascent: ${ascent}, Descent: ${descent}`);
    console.log(`Baseline (ceil(Ascent)): ${baseline}`);
    console.log(`New Height (ceil(Baseline+Descent)): ${currentHeight}`);
    console.log(`Required Y (Baseline + Descent): ${baseline + descent}`);

    if (baseline + descent > currentHeight) {
        console.error("FAIL: Still clipping!");
    } else {
        console.log("SUCCESS: No clipping calculation error.");
    }

    // Verify with Canvas
    const width = 100;

    // Use a safe canvas to detect if anything goes beyond currentHeight
    const canvasSafe = createCanvas(width, currentHeight + 10);
    const ctxSafe = canvasSafe.getContext('2d');
    ctxSafe.fillStyle = 'white';
    ctxSafe.fillRect(0, 0, width, currentHeight + 10);
    ctxSafe.fillStyle = 'black';
    font.draw(ctxSafe, text, 0, baseline, fontSize);

    // Check if there are pixels in the "safe" zone (row >= currentHeight)
    const imgData = ctxSafe.getImageData(0, 0, width, currentHeight + 10);
    let clippedPixels = 0;
    for (let y = currentHeight; y < currentHeight + 10; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (imgData.data[idx] < 255) { // Not white
                clippedPixels++;
            }
        }
    }

    if (clippedPixels > 0) {
        console.error(`FAIL: ${clippedPixels} pixels still clipped (this shouldn't happen if math is right).`);
    } else {
        console.log("SUCCESS: Visual verification passed (0 pixels clipped).");
    }
}

run();
