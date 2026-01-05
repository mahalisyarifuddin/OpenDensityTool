# OpenDensityTool
Typography, quantified.

## Introduction
OpenDensityTool is a single‑file, browser‑based utility for visualizing and comparing how letterforms occupy space. It overlays two fonts, plots a per‑scanline "ink" density graph, and reports useful vertical metrics so you can judge alignment and texture across scripts.

This project is inspired by:
- "Typeface design beyond a single script" by Typotheque: https://www.typotheque.com/articles/typeface-design-beyond-a-single-script
- FitFont by TypeProject: http://typeproject.com/en/service/fitfont

I also use this tool personally to pair Latin with East Asian fonts (e.g., choosing weights, sizes, and baseline shifts that harmonize Latin with CJK).

All processing happens locally in your browser using **fontkit** (which supports advanced shaping and WOFF2); fonts are not uploaded.

## How It Works
- Renders text to an off-screen canvas for each font using **fontkit**'s advanced layout engine.
- Reads vertical metrics from the font's OS/2, hhea, or other tables.
- Computes per-row "ink" density from pixel data to generate the density graph on the left.
- Tints each font and overlays them using multiply blending to highlight differences in texture, weight, and alignment.
- Reports density percentage, ink bounds (relative to the baseline), and nominal font metrics.

## Quick Start
1. Download OpenDensityTool.html.
2. Open it in any modern browser (Chrome, Edge, Firefox, Safari).
3. Load two font files (OTF/TTF/WOFF/WOFF2).
4. Enter text, set sizes, and adjust baseline shift to align optical baselines.
5. Customize the overlay colors as needed.
6. Choose "Fit to View" or "100% Scale."
7. Click "Export PNG" to save the visualization.

Note: The page loads fontkit and buffer from CDNs (esm.sh). To use fully offline, you must host these files locally and update the script references.

## Key Features
- Dual‑font comparison (overlay or side-by-side) with multiply blending
- Customizable overlay colors and Dark mode support
- Drag and drop font loading
- Per‑scanline ink density graph to the left of the text
- Baseline‑aware alignment with per‑font baseline shift and letter spacing
- Mute/Solo buttons for individual font visibility control
- Reporting of measured ink bounds vs. nominal font metrics
- Copy analysis results to clipboard
- Fit‑to‑view or 100% zoom; PNG export
- Single HTML file using ES modules for dependency loading
- **Advanced Shaping Support**: Powered by fontkit, supporting complex scripts (e.g., Arabic, Indic scripts including Tamil, Thai) and advanced OpenType features (ligatures, kerning, contextual alternates).
- **Native WOFF2 Support**: Handles compressed web fonts seamlessly.

## Controls
- Theme: Auto, Light, or Dark mode.
- Font File: Load OTF/TTF/WOFF/WOFF2 (supports drag and drop).
- Color: Choose a custom color for each font overlay.
- Mute (M) / Solo (S): Toggle visibility of individual fonts.
- Text: Enter the string to analyze (per font).
- Size (px): Render size per font.
- Letter Spacing: Adjust tracking (spacing between characters).
- Baseline Shift: Nudge a font up/down to align optical baselines.
- Display: Fit to View or 100% Scale.
- Mode: Overlay or Side-by-side comparison.
- Normalize by: Choose the normalization method for the density calculation.
- Guides: Toggle baseline and metrics visualization.
- Export PNG: Download the current canvas.

## Interpreting the Analysis
- **Density**: Share of the glyph area covered by "ink," where any pixel with an alpha value of 0.5 or greater is counted as ink. This provides a balance between ignoring faint anti-aliasing and capturing the true area of the letterform. This can be calculated in two ways:
  - **Ink Box**: Normalizes by the tightest possible box around the visible ink. This is useful for measuring the "blackness" of the glyphs themselves.
  - **Em box**: Normalizes by the full horizontal space the character occupies (advance width, including letter spacing) and the effective vertical extent. This is useful for judging the overall texture and color of a block of text.
- **Ink Bounds**:
  - **Max Y**: The highest point of the ink relative to the baseline (positive is up).
  - **Min Y**: The lowest point of the ink relative to the baseline (negative is down).
- **Metrics**:
  - **Ascent**: The font's nominal ascent.
  - **Descent**: The font's nominal descent.
- **Overlay**: Color differences in the visualization quickly show mismatched vertical alignment, weight, or texture.

## Use Cases
- Pairing Latin with CJK, Cyrillic, or Greek
- Checking vertical alignment across scripts (cap height/x‑height vs. kana/han/others)
- Evaluating apparent weight and texture
- Comparing foundry metrics to actual rendered extents
- Making before/after visuals when tuning sizes or baselines

## Known Limitations
- No vertical writing / ideographic baseline: The tool measures in horizontal layout only.
- Variable fonts: Only static fonts are supported; variable font axes (e.g., weight, width) are not adjustable.
- Rendering variability: Density depends on the browser’s canvas rasterization and anti‑aliasing; results can differ by OS/zoom/GPU.
- Performance: Very long strings, huge font sizes, or fonts with a large number of glyphs can be slow to process.

## Privacy & Data
All processing is local. Fonts and text never leave your machine. The app fetches fontkit and buffer from CDNs; replace with local copies if you need completely offline use.

## License
MIT License. See LICENSE for details.

## Acknowledgments
- fontkit (https://github.com/foliojs/fontkit)
- Typotheque article on multi‑script typeface design
- TypeProject FitFont

## Contributions
Contributions, issues, and suggestions are welcome. Please open an issue to discuss ideas or submit a PR.
