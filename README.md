# OpenDensityTool
Typography, quantified.

## Introduction
OpenDensityTool is a single‑file, browser‑based utility for visualizing and comparing how letterforms occupy space. It overlays two fonts (cyan and magenta), plots a per‑scanline "ink" density graph, and reports useful vertical metrics so you can judge alignment and texture across scripts.

This project is inspired by:
- "Typeface design beyond a single script" by Typotheque: https://www.typotheque.com/articles/typeface-design-beyond-a-single-script
- FitFont by TypeProject: http://typeproject.com/en/service/fitfont

I also use this tool personally to pair Latin with East Asian fonts (e.g., choosing weights, sizes, and baseline shifts that harmonize Latin with CJK).

All processing happens locally in your browser using opentype.js; fonts are not uploaded.

## How It Works
- Renders your text to an off‑screen canvas for each font.
- Reads vertical metrics from the font (OS/2 and hhea tables) and estimates "actual" ascent/descent from glyph outlines.
- Computes a per‑row coverage ("ink") density from alpha pixels to form the left‑side density graph.
- Tints each font (cyan/magenta) and overlays them using multiply blending to reveal differences in texture, weight, and alignment.
- Reports yMin/yMax (relative to baseline), density %, actual vs. font ascent/descent, and your inputs (size and baseline shift).

## Quick Start
1. Download OpenDensityTool.html.
2. Open it in any modern browser (Chrome, Edge, Firefox, Safari).
3. Load two font files (OTF/TTF/WOFF).
4. Enter text, set sizes, and adjust baseline shift to align optical baselines.
5. Choose "Fit to View" or "100% Scale."
6. Click "Export PNG" to save the visualization.

Note: The page loads opentype.js from a CDN. To use fully offline, replace the script tag with a local copy of opentype.js.

## Key Features
- Dual‑font comparison (overlay or side-by-side) with multiply blending
- Per‑scanline ink density graph to the left of the text
- Baseline‑aware alignment with per‑font baseline shift
- Actual vs. nominal (OS/2/hhea) ascent/descent reporting
- Fit‑to‑view or 100% zoom; PNG export
- Single HTML file, no build step or external assets beyond opentype.js

## Controls
- Font File: Load OTF/TTF/WOFF.
- Text: Enter the string to analyze (per font).
- Size (px): Render size per font.
- Baseline Shift: Nudge a font up/down to align optical baselines.
- Display: Fit to View or 100% Scale.
- Mode: Overlay or Side-by-side comparison.
- Normalize by: Choose the normalization method for the density calculation.
- Export PNG: Download the current canvas.

## Interpreting the Analysis
- Density (%): Share of the glyph area covered by "ink," where any pixel with an alpha value of 0.5 or greater is counted as ink. This provides a balance between ignoring faint anti-aliasing and capturing the true area of the letterform. This can be calculated in two ways:
  - **Ink Box**: Normalizes by the tightest possible box around the visible ink. This is useful for measuring the "blackness" of the glyphs themselves.
  - **Em box**: Normalizes by the full horizontal space the character occupies (advance width) and the font's em size. This is useful for judging the overall texture and color of a block of text.
- yMin / yMax (px): Extents above/below the baseline measured from detected pixels.
- Actual Ascent/Descent: Measured from glyph outlines at the chosen size.
- Font Ascent/Descent: Max of OS/2/hhea/win metrics (when available).
- Overlay: Cyan vs. magenta differences quickly show mismatched vertical alignment, weight, or texture.

## Use Cases
- Pairing Latin with CJK, Cyrillic, or Greek
- Checking vertical alignment across scripts (cap height/x‑height vs. kana/han/others)
- Evaluating apparent weight and texture
- Comparing foundry metrics to actual rendered extents
- Making before/after visuals when tuning sizes or baselines

## Known Limitations
- OpenType feature coverage: opentype.js now supports shaping for Arabic and Thai. For other scripts, it primarily supports GPOS "kern" and GSUB "liga." Complex shaping and features beyond these are limited.
- Complex scripts: While Arabic and Thai are now supported, other shaping-intensive scripts (e.g., Indic, other Southeast Asian languages) may not render ideally. Consider the results approximate.
- No vertical writing / ideographic baseline: The tool measures in horizontal layout only.
- Rendering variability: Density depends on the browser’s canvas rasterization and anti‑aliasing; results can differ by OS/zoom/GPU.
- Performance: Very long strings, huge font sizes, or fonts with a large number of glyphs and complex OpenType features can be slow to process.

## Privacy & Data
All processing is local. Fonts and text never leave your machine. The app fetches opentype.js from a CDN; replace with a local copy if you need completely offline use.

## License
MIT License. See LICENSE for details.

## Acknowledgments
- opentype.js (https://github.com/opentypejs/opentype.js)
- Typotheque article on multi‑script typeface design
- TypeProject FitFont

## Contributions
Contributions, issues, and suggestions are welcome. Please open an issue to discuss ideas or submit a PR.

## Changelog
- **v1.1 (2025-11-02):**
  - Refactored the JavaScript codebase for improved conciseness and readability using modern syntax.
  - Implemented robust error handling for font loading and parsing, displaying errors in the analysis panel instead of using alerts.
  - Added safeguards for oversized font files and other invalid user inputs.
