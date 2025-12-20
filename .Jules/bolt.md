## 2024-05-22 - [Loop Splitting for Pixel Analysis]
**Learning:** Splitting pixel iteration loops into "find first match" and "process remainder" sections significantly improves performance (nearly 2x in this case) by removing conditional checks from the hot path.
**Action:** Apply this pattern to other pixel manipulation loops where a state change (like finding minX) happens only once per row/iteration.

## 2024-05-23 - [Canvas Optimization]
**Learning:** Batching geometry operations (e.g., using `rect()` in a loop and a single `fill()` call) is significantly faster than repeated `fillRect()` calls for simple shapes. Also, reusing offscreen canvases without resizing (when the new size fits) avoids expensive buffer reallocations.
**Action:** Always batch canvas drawing calls where possible and use object pooling for temporary canvases.
