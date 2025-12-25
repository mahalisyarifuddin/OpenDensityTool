            const dom = new Proxy({}, { get: (t, id) => document.getElementById(id) });

            class DensityTool {
                constructor() {
                    this.fonts = [null, null];
                    this.loadErrors = [null, null];
                    this.analyses = [null, null];
                    this.analysisCanvases = [document.createElement('canvas'), document.createElement('canvas')];
                    this.graphWidth = 150;
                    this.graphPadding = 20;
                    this.context = dom.canvas.getContext('2d');
                    this.bind();
                    this.setTheme('auto');
                    this.update();
                }

                bind() {
                    const schedule = fn=>{
                        let f;
                        return ()=>{
                            f && cancelAnimationFrame(f);
                            f = requestAnimationFrame(fn);
                        };
                    };
                    const refresh = schedule(()=>this.update());
                    const resize = schedule(()=>this.updateScale());

                    dom.zoom.onchange = resize;
                    dom.render.onchange = dom.density.onchange = refresh;
                    dom.export.onclick = ()=>this.exportImage();
                    dom.theme.onchange = e=>this.setTheme(e.target.value);
                    window.onresize = resize;

                    document.querySelectorAll('.copy-btn').forEach(btn => {
                        const original = btn.textContent;
                        btn.onclick = async () => {
                            try {
                                await navigator.clipboard.writeText(document.getElementById(btn.dataset.target).innerText);
                                btn.textContent = 'Copied!';
                            } catch {
                                btn.textContent = 'Error';
                            }
                            setTimeout(() => btn.textContent = original, 2000);
                        };
                    });

                    [1, 2].forEach((n,i)=>{
                        const file = dom[`file${n}`];
                        file.onchange = e=>this.loadFont(e.target.files[0], i);
                        dom[`clear${n}`].onclick = ()=>this.clearFont(i);
                        ['color', 'text', 'size', 'spacing', 'shift'].forEach(k=>dom[`${k}${n}`].oninput = refresh);
                        this.setupDragDrop(file.closest('.group'), file, i);
                    });
                }

                setupDragDrop(group, file, index) {
                    if (!group) return;
                    group.ondragenter = group.ondragover = e => { e.preventDefault(); group.classList.add('drag-active'); };
                    group.ondragleave = e => (!e.relatedTarget || !group.contains(e.relatedTarget)) && group.classList.remove('drag-active');
                    group.ondrop = e => {
                        e.preventDefault(); group.classList.remove('drag-active');
                        const f = e.dataTransfer.files[0];
                        if (f) {
                             const dt = new DataTransfer();
                             dt.items.add(f);
                             file.files = dt.files;
                             this.loadFont(f, index);
                        }
                    };
                }

                setTheme(theme) {
                    document.documentElement.classList.remove('light', 'dark');
                    theme !== 'auto' && document.documentElement.classList.add(theme);
                    dom.theme.value = theme;
                }

                async loadFont(file, index) {
                    this.loadErrors[index] = this.fonts[index] = null;
                    try {
                        if (!file) return;
                        if (file.size > 30 << 20) throw new Error('File too large (max 30MB)');
                        const font = opentype.parse(await file.arrayBuffer());
                        if (!font.draw) throw new Error('Invalid font');
                        this.fonts[index] = font;
                    } catch (e) {
                        this.loadErrors[index] = e.message;
                    } finally {
                        this.update();
                    }
                }

                clearFont(index) {
                    this.fonts[index] = null;
                    this.loadErrors[index] = null;
                    dom[`file${index + 1}`].value = '';
                    this.update();
                }

                computeMetrics(font, content, fontSize, tracking) {
                    const scale = fontSize / font.unitsPerEm;
                    const {os2, hhea} = font.tables;
                    const metric = keys=>Math.max(0, ...keys.map(key=>Math.abs(font[key] ?? os2?.[key] ?? hhea?.[key] ?? 0))) * scale;
                    const fontAscent = metric(['ascender', 'sTypoAscender', 'usWinAscent']);
                    const fontDescent = metric(['descender', 'sTypoDescender', 'usWinDescent']);
                    const options = {tracking};
                    const bounds = font.getPath(content, 0, 0, fontSize, options).getBoundingBox();
                    return {
                        ascent: Math.max(-bounds.y1, fontAscent),
                        descent: Math.max(bounds.y2, fontDescent),
                        actualAscent: -bounds.y1,
                        actualDescent: bounds.y2,
                        fontAscent,
                        fontDescent,
                        x1: bounds.x1,
                        x2: bounds.x2,
                        boundingBoxWidth: Math.ceil(bounds.x2 - bounds.x1),
                        advanceWidth: Math.ceil(font.getAdvanceWidth(content, fontSize, options))
                    };
                }

                analyze(index) {
                    const n = index + 1;
                    const font = this.fonts[index];
                    const content = dom[`text${n}`].value;
                    const fontSize = +dom[`size${n}`].value || 0;
                    if (!font || !content || !fontSize) return null;

                    try {
                        const size = Math.max(1, Math.min(fontSize, 2000));
                        const letterSpacing = +dom[`spacing${n}`].value || 0;
                        const tracking = letterSpacing ? (letterSpacing / size) * 1000 : 0;
                        const metrics = this.computeMetrics(font, content, size, tracking);
                        if (!metrics || (metrics.advanceWidth <= 0 && metrics.boundingBoxWidth <= 0))
                            return null;

                        const minX = Math.min(0, metrics.x1), maxX = Math.max(metrics.advanceWidth, metrics.x2);
                        const drawOffsetX = -minX, width = Math.ceil(maxX - minX);
                        const baseline = Math.ceil(metrics.ascent), height = Math.ceil(baseline + metrics.descent);

                        if (width > 32767 || height > 32767) throw new Error('Canvas dimensions too large');

                        const fontCanvas = this.analysisCanvases[index];
                        fontCanvas.width = Math.max(fontCanvas.width, width);
                        fontCanvas.height = Math.max(fontCanvas.height, height);
                        const context = fontCanvas.getContext('2d', { willReadFrequently: true });
                        context.clearRect(0, 0, width, height);
                        context.fillStyle = dom[`color${n}`].value;
                        font.draw(context, content, drawOffsetX, baseline, size, { tracking: tracking || 0 });

                        const pixels = this.analyzePixels(fontCanvas, width, height);
                        const hasInk = pixels.maxY >= pixels.minY;
                        const area = Math.max(1, dom.density.value === 'ink' ? (hasInk ? (pixels.maxX - pixels.minX + 1) * (pixels.maxY - pixels.minY + 1) : 1) : Math.max(1, metrics.advanceWidth) * (metrics.ascent + metrics.descent));

                        return {
                            ...pixels, ...metrics,
                            drawOffsetX, width, height, canvas: fontCanvas,
                            baseline, baselineShift: +dom[`shift${n}`].value || 0,
                            letterSpacing, fontSize: size, font,
                            density: ((pixels.inkPixels / area) * 100).toFixed(1),
                            yMin: hasInk ? Math.round(baseline - pixels.maxY) : 0,
                            yMax: hasInk ? Math.round(baseline - pixels.minY) : 0
                        };
                    } catch (error) { return { error: error.message }; }
                }

                analyzePixels(canvas, contentWidth, contentHeight) {
                    const width = contentWidth ?? canvas.width;
                    const height = contentHeight ?? canvas.height;
                    const {data} = canvas.getContext('2d', {willReadFrequently: true}).getImageData(0, 0, width, height);
                    const densityByRow = new Float32Array(height);
                    let inkPixels = 0, minX = width, maxX = -1, minY = height, maxY = -1;

                    for (let y = 0; y < height; y++) {
                        let rowInk = 0;
                        for (let x = 0, i = y * width * 4 + 3; x < width; x++, i += 4) {
                            if (data[i] >= 128) {
                                if (rowInk++ === 0 && x < minX) minX = x;
                                if (x > maxX) maxX = x;
                            }
                        }
                        if (rowInk > 0) {
                            inkPixels += rowInk;
                            densityByRow[y] = rowInk;
                            if (y < minY) minY = y;
                            maxY = y;
                        }
                    }
                    return {densityByRow, inkPixels, minX, maxX, minY, maxY};
                }

                update() {
                    this.analyses = [1, 2].map((n,i)=>{
                        dom[`dot${n}`].style.backgroundColor = dom[`color${n}`].value;
                        return this.analyze(i);
                    });
                    this.draw();
                    this.updateResults();
                }

                draw() {
                    const valid = this.analyses.filter(a => a && !a.error);
                    if (!valid.length) return this.renderEmpty();

                    const dim = this.computeDimensions(valid);
                    dom.canvas.width = dim.width;
                    dom.canvas.height = dim.height;

                    const side = dom.render.value === 'side' && valid.length > 1;
                    let tx = this.graphWidth + this.graphPadding + (side ? 0 : dim.maxDrawOffsetX);

                    this.analyses.forEach((a, i) => {
                        if (!a || a.error) return;
                        const y = dim.baseline - a.baseline - a.baselineShift;
                        const blend = i > 0 && this.analyses.every(Boolean);
                        const color = dom[`color${i + 1}`].value;
                        this.renderGraph(a, color, y, blend);
                        this.renderGlyphs(a, side ? tx + (a.drawOffsetX || 0) : tx, y, blend);
                        if (side) tx += a.canvas.width;
                    });
                    this.updateScale();
                }

                computeDimensions(analyses) {
                    const side = dom.render.value === 'side' && analyses.length > 1;
                    const max = fn => Math.max(0, ...analyses.map(fn));
                    const maxAscent = max(a=>a.baseline + a.baselineShift);
                    const maxDescent = max(a=>a.height - a.baseline - a.baselineShift);
                    const maxOffX = max(a=>a.drawOffsetX);
                    const width = side ? analyses.reduce((w,a)=>w + a.width, 0) : maxOffX + max(a=>a.width - a.drawOffsetX);
                    return {
                        width: Math.ceil(this.graphWidth + this.graphPadding + width),
                        height: Math.ceil(maxAscent + maxDescent),
                        baseline: Math.ceil(maxAscent),
                        maxDrawOffsetX: maxOffX
                    };
                }

                renderGraph(analysis, color, yOffset, blend) {
                    const max = Math.max(1, ...analysis.densityByRow);
                    this.context.fillStyle = color;
                    this.context.globalCompositeOperation = blend ? 'multiply' : 'source-over';
                    this.context.beginPath();
                    analysis.densityByRow.forEach((value,y)=>{
                        if (value) {
                            const width = (value / max) * this.graphWidth;
                            this.context.rect(this.graphWidth - width, y + yOffset, width, 1);
                        }
                    }
                    );
                    this.context.fill();
                    this.context.globalCompositeOperation = 'source-over';
                }

                renderGlyphs(analysis, originX, yOffset, blend) {
                    const {canvas, width, height} = analysis;
                    const w = width ?? canvas.width
                      , h = height ?? canvas.height;
                    this.context.globalCompositeOperation = blend ? 'multiply' : 'source-over';
                    this.context.drawImage(canvas, 0, 0, w, h, originX - (analysis.drawOffsetX || 0), yOffset, w, h);
                    this.context.globalCompositeOperation = 'source-over';
                }

                renderEmpty() {
                    dom.canvas.height = 150;
                    this.updateScale();
                }

                updateScale() {
                    const {canvas, container, preview} = dom;
                    const fit = dom.zoom.value === 'fit' && canvas.width;
                    canvas.style.transform = 'none';
                    container.style.width = container.style.height = container.style.overflow = '';
                    if (!fit)
                        return;
                    const style = getComputedStyle(container);
                    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
                    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
                    const scale = Math.min((preview.clientWidth - paddingX) / canvas.width, 1);
                    canvas.style.transform = `scale(${scale})`;
                    container.style.width = `${canvas.width * scale + paddingX}px`;
                    container.style.height = `${canvas.height * scale + paddingY}px`;
                    container.style.overflow = 'hidden';
                }

                updateResults() {
                    [1, 2].forEach((n,i)=>{
                        const analysis = this.analyses[i];
                        const loadError = this.loadErrors[i];
                        dom[`result${n}`].textContent = loadError ? `Error: ${loadError}` : analysis ? (analysis.error ? `Error: ${analysis.error}` : `Density: ${analysis.density}%\n\nInk Bounds:\n- Max Y: ${analysis.yMax}\n- Min Y: ${analysis.yMin}\n\nMetrics:\n- Ascent: ${Math.round(analysis.fontAscent)}\n- Descent: ${Math.round(analysis.fontDescent)}`) : this.fonts[i] ? 'Enter text.' : 'Load font.';
                    }
                    );
                }

                exportImage() {
                    const a = document.createElement('a');
                    a.href = dom.canvas.toDataURL();
                    a.download = `density_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.png`;
                    a.click();
                }
            }

            new DensityTool();
