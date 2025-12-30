# CodeCraft Journal

## 2024-05-22 - Initial Setup
**Mode:** Setup
**Learning:** The environment has a `.jules` directory but no `codecraft.md` yet.
**Action:** Created the journal.

## 2024-05-22 - High DPI Support
**Mode:** Palette
**Learning:** `window.devicePixelRatio` is essential for crisp canvas rendering on modern displays. Without scaling the backing store (canvas width/height) by DPR while keeping the CSS size constant, text and graphics appear blurry. However, when doing so, logical calculations (like "1 pixel high graph bar") need to be adjusted to physical pixels to maintain visual correctness.
**Action:** Always check for `devicePixelRatio` when working with Canvas 2D API for text or fine graphics.
