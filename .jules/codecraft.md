## 2024-02-14 - Canvas Loop Optimization
**Mode:** Bolt
**Learning:** V8 JIT optimizes typed array loops very effectively. Manual loop optimization using `Uint32Array` view to process pixels or unrolling mathematical operations (`Math.min/max`) in JS resulted in slower or equal performance compared to the original code structure in microbenchmarks. The overhead of creating new TypedArray views and bitwise arithmetic in JS can outweigh the benefits of reduced iterations or branches for simple pixel manipulation tasks.
**Action:** Trust V8's optimizer for tight loops unless profiling shows a specific bottleneck. Focus on algorithmic changes (like reducing allocations) rather than micro-optimizing arithmetic.

## 2026-01-13 - Single File HTML Verification
**Mode:** Palette
**Learning:** When working with single-file HTML applications without a build step or `package.json`, standard verification commands (`npm test`) are unavailable. Verification must be performed by loading the file directly (e.g., `file://...`) in a browser automation script.
**Action:** Always check for `package.json` before assuming standard scripts exist. If missing, plan for manual or ad-hoc verification scripts immediately.
