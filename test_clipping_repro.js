const opentype = require('opentype.js');
const fs = require('fs');
const { createCanvas } = require('canvas');

async function run() {
    const fontBuffer = fs.readFileSync('roboto-regular-webfont.woff');
    const font = opentype.parse(fontBuffer.buffer);
    const text = "gypq"; // Descenders

    // Find a fontSize that causes clipping
    for (let fontSize = 10; fontSize < 200; fontSize += 0.1) {
        const scale = fontSize / font.unitsPerEm;
        const os2 = font.tables.os2;
        const hhea = font.tables.hhea;

        // Logic from computeMetrics
        const metric = keys=>Math.max(0, ...keys.map(k=>Math.abs(font[k] ?? os2?.[k] ?? hhea?.[k] ?? 0)).filter(v=>!isNaN(v))) * scale;

        const fontAscent = metric(['ascender', 'sTypoAscender', 'usWinAscent']);
        const fontDescent = metric(['descender', 'sTypoDescender', 'usWinDescent']);

        // Logic from analyze
        // We assume actualAscent/Descent are <= fontAscent/Descent for simplicty/worst-case
        // In reality, computeMetrics takes Max.

        // To reproduce clipping, we need a case where we use fontAscent/fontDescent
        // (or actual ones if they are large enough) and the math fails.

        // Let's assume actual extents match font metrics for this test to isolate the math error.
        // Or we can compute actual metrics.

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

        const currentHeight = Math.ceil(ascent + descent);
        const baseline = Math.ceil(ascent);

        // If we draw at baseline, the bottommost pixel will be at baseline + descent.
        // If baseline + descent > currentHeight, we have clipping.

        if (baseline + descent > currentHeight) {
            console.log(`Found failing fontSize: ${fontSize}`);
            console.log(`Ascent: ${ascent}, Descent: ${descent}`);
            console.log(`Baseline (ceil(Ascent)): ${baseline}`);
            console.log(`Current Height (ceil(Ascent+Descent)): ${currentHeight}`);
            console.log(`Required Y (Baseline + Descent): ${baseline + descent}`);
            console.log(`Clipping amount: ${baseline + descent - currentHeight}`);

            // Verify with Canvas
            const width = 100; // Arbitrary
            const canvas = createCanvas(width, currentHeight);
            const ctx = canvas.getContext('2d');

            // Fill with white
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, currentHeight);

            // Draw text in black
            ctx.fillStyle = 'black';
            font.draw(ctx, text, 0, baseline, fontSize);

            // Check last row pixels
            // If clipping occurred, we might see ink at the very bottom edge,
            // but theoretically we lost what was below.
            // To prove it, we can try to draw with a larger canvas and see if pixels exist below currentHeight.

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
                console.log(`VERIFIED: ${clippedPixels} pixels would be clipped.`);
                return;
            }
        }
    }
    console.log("No clipping found (unexpected)");
}

run();
