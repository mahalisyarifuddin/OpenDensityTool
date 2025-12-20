## 2024-10-24 - Accessible Color Headers
**Learning:** This app uses `input[type="color"]` as a visual header bullet point for font sections. While visually clever, it leaves screen reader users with unlabeled inputs.
**Action:** When using form inputs as design elements, always ensure they have explicit `aria-label` or `label` associations, even if the "visual label" (sibling text) seems obvious to sighted users.

## 2024-10-24 - Inline Errors vs Alerts
**Learning:** The app was using `alert()` for file validation errors, which is disruptive and poor UX.
**Action:** Replace native alerts with inline error messages in the UI context (e.g., in the results panel) to maintain user flow and provide a less intrusive experience.

## 2024-05-22 - Missing ARIA labels
**Learning:** Icon-only buttons or color inputs often miss accessible labels, making them invisible to screen readers.
**Action:** Always verify `aria-label` or `title` attributes on inputs that lack visible text labels.
