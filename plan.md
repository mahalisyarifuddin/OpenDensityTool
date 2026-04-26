We will use **Bolt Mode (Performance)** to address the canvas creation overhead in `getGlyphProfile`.

1. **Diagnosis**:
   When calculating density or applying autospacing, `getGlyphProfile` is called for each unique glyph. Currently, `getGlyphProfile` allocates a new `<canvas>` element for every glyph using `document.createElement('canvas')`. This causes excessive DOM allocation and garbage collection when analyzing long text strings or fonts with many unique glyphs.

2. **Treatment**:
   - Add a shared `glyphCanvas` to the class instance properties in the constructor.
   - Modify `getGlyphProfile` to reuse this `glyphCanvas` by passing it to the existing `prepareCanvas(canvas, width, height)` utility function. `prepareCanvas` handles both resizing and explicitly clearing the context (as required by the system memory).

### Pre-commit steps:
1. Ensure the Playwright script continues to pass and does not break due to canvas reuse.
2. Verify visual output isn't compromised (no artifacts left over in glyph profiling).

3. **Metrics/Impact**:
   Expected to prevent tens to hundreds of canvas instantiations and context allocations per layout pass, noticeably reducing memory pressure and execution time for the `applyAutospacing` logic, especially during initial renders or when typing new characters.
