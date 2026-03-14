## 2024-02-14 - Canvas Loop Optimization
**Mode:** Bolt
**Learning:** V8 JIT optimizes typed array loops very effectively. Manual loop optimization using `Uint32Array` view to process pixels or unrolling mathematical operations (`Math.min/max`) in JS resulted in slower or equal performance compared to the original code structure in microbenchmarks. The overhead of creating new TypedArray views and bitwise arithmetic in JS can outweigh the benefits of reduced iterations or branches for simple pixel manipulation tasks.
**Action:** Trust V8's optimizer for tight loops unless profiling shows a specific bottleneck. Focus on algorithmic changes (like reducing allocations) rather than micro-optimizing arithmetic.

## 2026-01-13 - Single File HTML Verification
**Mode:** Palette
**Learning:** When working with single-file HTML applications without a build step or `package.json`, standard verification commands (`npm test`) are unavailable. Verification must be performed by loading the file directly (e.g., `file://...`) in a browser automation script.
**Action:** Always check for `package.json` before assuming standard scripts exist. If missing, plan for manual or ad-hoc verification scripts immediately.

## 2023-10-27 - Infinite Loop on Empty Glyphs
**Mode:** Medic
**Learning:** `fontkit` sets empty bounding boxes (e.g., for space characters) to `{ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }`. This causes `yStart = Infinity` and `yEnd = -Infinity`. If these are used to calculate a loop step, `(yEnd - yStart) / steps` evaluates to `-Infinity` and causes an infinite loop when stepping if the loop condition incorrectly allows it, or if it evaluates to exactly 0 for zero-height glyphs.
**Action:** Always clamp mathematical step calculations derived from bounding boxes (especially `yEnd - yStart`) using `Math.max(1, ...)` to ensure a minimum step size and prevent infinite `while` or `for` loops on empty or zero-height elements.
