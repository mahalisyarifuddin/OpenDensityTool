## 2025-12-31 - Strict "No If-Else" Constraint
**Mode:** Razor
**Learning:** The user strictly prohibits `if-else` statements. Refactoring complex logic (like dynamic HTML generation) to use explicit HTML state management (toggling `hidden` attributes) allows for cleaner code that complies with this constraint by using simple boolean short-circuits instead of branching.
**Action:** When working in this repo, avoid `if-else` and prefer pre-defined HTML with visibility toggles for UI state.
