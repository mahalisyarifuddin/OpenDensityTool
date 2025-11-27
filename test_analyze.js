
function analyzePixels(width, height, data) {
    const densityByRow = new Float32Array(height);
    let inkPixels = 0
      , minX = width
      , maxX = -1
      , minY = height
      , maxY = -1;

    for (let y = 0; y < height; y++) {
        for (let x = 0, idx = y * width * 4 + 3; x < width; x++,
        idx += 4) {
            if (data[idx] >= 128) {
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                inkPixels++;
                densityByRow[y]++;
            }
        }
    }
    return {
        densityByRow,
        inkPixels,
        minX,
        maxX,
        minY,
        maxY
    };
}

function testAnalyzePixels() {
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);

    // Set a single pixel at (5, 5)
    const x = 5;
    const y = 5;
    const idx = (y * width + x) * 4 + 3;
    data[idx] = 255;

    const result = analyzePixels(width, height, data);

    console.log(`Ink Pixels: ${result.inkPixels}`);
    console.log(`Min X: ${result.minX}, Max X: ${result.maxX}`);
    console.log(`Min Y: ${result.minY}, Max Y: ${result.maxY}`);

    if (result.inkPixels !== 1) console.error("FAIL: Ink Pixels should be 1");
    if (result.minX !== 5) console.error("FAIL: Min X should be 5");
    if (result.maxX !== 5) console.error("FAIL: Max X should be 5");
    if (result.minY !== 5) console.error("FAIL: Min Y should be 5");
    if (result.maxY !== 5) console.error("FAIL: Max Y should be 5");

    // Test Empty
    const resultEmpty = analyzePixels(width, height, new Uint8ClampedArray(width * height * 4));
    console.log(`Empty Ink Pixels: ${resultEmpty.inkPixels}`);
    console.log(`Empty Min Y: ${resultEmpty.minY}, Max Y: ${resultEmpty.maxY}`);

    if (resultEmpty.minY > resultEmpty.maxY) {
        console.log("Empty result detected correctly (minY > maxY)");
    } else {
        console.error("FAIL: Empty result not detected");
    }
}

testAnalyzePixels();
