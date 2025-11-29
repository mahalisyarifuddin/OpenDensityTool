const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.join(__dirname, '../OpenDensityTool.html'), 'utf8');

// Extract computeMetrics method body
const startMarker = 'computeMetrics(font, content, fontSize, letterSpacing) {';
const endMarker = 'analyze(font, content, fontSize, baselineShift, letterSpacing) {';

const startIndex = htmlContent.indexOf(startMarker);
const endIndex = htmlContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find computeMetrics in HTML file');
    process.exit(1);
}

const methodBody = htmlContent.substring(startIndex + startMarker.length, endIndex);
// Remove the last closing brace which belongs to computeMetrics
const lastBraceIndex = methodBody.lastIndexOf('}');
const cleanBody = methodBody.substring(0, lastBraceIndex);

// Create a function from the extracted body
const computeMetrics = new Function('font', 'content', 'fontSize', 'letterSpacing', cleanBody);

// Mock Font object
const mockFont = {
    unitsPerEm: 1000,
    tables: { os2: { usWinAscent: 800, usWinDescent: 200 }, hhea: { ascender: 800, descender: -200 } },
    // Mock stringToGlyphs: Returns a glyph that sits on baseline (small box)
    stringToGlyphs: () => [{
        path: {
            getBoundingBox: () => ({ y1: 0, y2: 500, x1: 0, x2: 500 }) // y1=0 (bottom), y2=500 (top). Height 500.
        }
    }],
    // Mock getPath: Returns a bounding box that is shifted UP (simulating GPOS)
    // Canvas coords: Y down.
    // If shifted up by 1000 units (relative to font), it should be way above baseline.
    // FontSize = 100. Scale = 0.1.
    // Glyph 500 units high.
    // Normal: Top at -50 px. Bottom at 0 px.
    // Shifted UP by 500 units (extra). Top at -100 px. Bottom at -50 px.
    // bounds.y1 should be -100.
    getPath: () => ({
        getBoundingBox: () => ({ x1: 0, y1: -100, x2: 50, y2: -50 }) // Top at -100px, Bottom at -50px.
    }),
    getAdvanceWidth: () => 500
};

const fontSize = 100;
const letterSpacing = 0;

// Expected behavior:
// Font Ascent (scaled) = 800 * 0.1 = 80.
// Extents Ascent (scaled) = 500 * 0.1 = 50.
// Path Top (pixels) = 100.
// The computed 'ascent' should be at least 100 to cover the Path Top.
// If it uses only font/extents, it will be max(80, 50) = 80.
// 80 < 100 -> CLIPPING!

const metrics = computeMetrics(mockFont, "test", fontSize, letterSpacing);

console.log('Metrics:', metrics);
console.log('Calculated Ascent:', metrics.ascent);
console.log('Required Ascent (from Path):', 100);

if (metrics.ascent < 100) {
    console.log('FAIL: Ascent is too small! Text will be clipped.');
    process.exit(1);
} else {
    console.log('PASS: Ascent covers the path.');
}
