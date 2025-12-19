## 2024-05-22 - [Loop Splitting for Pixel Analysis]
**Learning:** Splitting pixel iteration loops into "find first match" and "process remainder" sections significantly improves performance (nearly 2x in this case) by removing conditional checks from the hot path.
**Action:** Apply this pattern to other pixel manipulation loops where a state change (like finding minX) happens only once per row/iteration.
