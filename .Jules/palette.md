## 2024-10-24 - Accessible Color Headers
**Learning:** This app uses `input[type="color"]` as a visual header bullet point for font sections. While visually clever, it leaves screen reader users with unlabeled inputs.
**Action:** When using form inputs as design elements, always ensure they have explicit `aria-label` or `label` associations, even if the "visual label" (sibling text) seems obvious to sighted users.
