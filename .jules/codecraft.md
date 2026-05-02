## 2025-02-17 - [confirmAction Accessibility Loss]
**Mode:** 🩺 Medic
**Learning:** The application's `confirmAction` toggling pattern for destructive UI components correctly appended a `confirm-danger` state, but blindly executed `btn.removeAttribute('aria-label')` when reverting or confirming actions, which permanently erased any initially set `aria-label` attributes on those elements (such as `aria-label="Clear Font 1"`), silently crippling accessibility over time.
**Action:** When working with UI state toggles that momentarily replace `aria-label` text with instructional prompts (e.g., "Confirm?"), always retrieve and stash the initial attribute in a dataset property like `dataset.originalAria` before modifying it. Restore the attribute explicitly (or properly clear it if falsy) when resolving the temporary state.

## 2025-05-18 - [Canvas Overhead in Glyph Profiling]
**Mode:** ⚡ Bolt
**Learning:** During parallel execution with `Promise.all`, reusing a single shared `canvas` for operations like `glyph.render` and `getImageData` is safe because these DOM interactions are entirely synchronous. Therefore, creating a new `canvas` instance per glyph inside `getGlyphProfile` was an unnecessary source of DOM allocation and garbage collection overhead.
**Action:** Share a single offscreen canvas (e.g., `glyphCanvas`) and reuse it across multiple synchronous render-to-buffer calls, using `ctx.save()` and `ctx.restore()` to reset any translations before the next use.

## 2025-05-18 - [Mute/Solo Array Desync during Swap]
**Mode:** 🩺 Medic
**Learning:** During the swapping of font 1 and font 2 slots, multiple distinct application states must be synchronized. The `swap()` function was swapping primary inputs but overlooked swapping the `visibility` and `solo` internal state arrays, as well as the corresponding DOM `aria-pressed` states on the mute and solo UI buttons. This resulted in the application holding incorrect state regarding which font was muted or soloed.
**Action:** When creating composite operations like swapping states between parallel sets of inputs/components, always meticulously cross-reference all mutable internal arrays and all corresponding DOM attributes to guarantee comprehensive state exchange. Ensure tests validate both the logical arrays and DOM outputs for such actions.
