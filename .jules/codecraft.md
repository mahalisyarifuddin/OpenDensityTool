## 2025-02-17 - [confirmAction Accessibility Loss]
**Mode:** 🩺 Medic
**Learning:** The application's `confirmAction` toggling pattern for destructive UI components correctly appended a `confirm-danger` state, but blindly executed `btn.removeAttribute('aria-label')` when reverting or confirming actions, which permanently erased any initially set `aria-label` attributes on those elements (such as `aria-label="Clear Font 1"`), silently crippling accessibility over time.
**Action:** When working with UI state toggles that momentarily replace `aria-label` text with instructional prompts (e.g., "Confirm?"), always retrieve and stash the initial attribute in a dataset property like `dataset.originalAria` before modifying it. Restore the attribute explicitly (or properly clear it if falsy) when resolving the temporary state.

## 2025-05-18 - [Canvas Overhead in Glyph Profiling]
**Mode:** ⚡ Bolt
**Learning:** During parallel execution with `Promise.all`, reusing a single shared `canvas` for operations like `glyph.render` and `getImageData` is safe because these DOM interactions are entirely synchronous. Therefore, creating a new `canvas` instance per glyph inside `getGlyphProfile` was an unnecessary source of DOM allocation and garbage collection overhead.
**Action:** Share a single offscreen canvas (e.g., `glyphCanvas`) and reuse it across multiple synchronous render-to-buffer calls, using `ctx.save()` and `ctx.restore()` to reset any translations before the next use.
