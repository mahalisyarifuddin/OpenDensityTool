const fontkit = require('fontkit');
const fs = require('fs');

const buffer = fs.readFileSync('roboto-regular-webfont.woff');
const font = fontkit.create(buffer);
const run = font.layout('Hello World');

console.log('Run keys:', Object.keys(run));
if (run.bbox) {
    console.log('Run has bbox:', run.bbox);
} else {
    console.log('Run does NOT have bbox');
}

console.log('Advance Width:', run.advanceWidth);
