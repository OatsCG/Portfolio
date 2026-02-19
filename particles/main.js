(function () {
  "use strict";

  let is_animation_enabled = true;
  let useCelledMouse = true;

  const canvasFrontend = new CanvasFrontend("particleCanvas");
  const dir = createDirectionField();
  const particles = createParticles(canvasFrontend); // state now has no floatId
  const mouse = createMouse(canvasFrontend);

  const geom = {
    width: canvasFrontend.width,
    height: canvasFrontend.height,
    cellWidth: 1,
    cellHeight: 1,
    invCellWidth: 1,
    invCellHeight: 1
  };

  const mouseGeom = {
    rows: (SIM.mouseGridRows || SIM.gridRows) | 0,
    cols: (SIM.mouseGridCols || SIM.gridCols) | 0,
    cellWidth: 1,
    cellHeight: 1,
    invCellWidth: 1,
    invCellHeight: 1
  };

  const state = {
    frameCounter: 0,
    targetColor: colors.flow,
    currentColor: { r: 255, g: 255, b: 255 },
    targetGlowColor: glowColors.flow,
    currentGlowColor: { r: 255, g: 255, b: 255 },

    alignmentFactor: (0.028 * SIM.maxVelocity) ** 2,
    randomAccelFactor: 0.1
  };

  const maxVelocitySq = SIM.maxVelocity * SIM.maxVelocity;

  let mouseCellCount = mouseGeom.rows * mouseGeom.cols;

  let cellOffsets = new Uint32Array(mouseCellCount + 1);
  let cellCounts = new Uint32Array(mouseCellCount);
  let writePtr = new Uint32Array(mouseCellCount);

  let bucketIndices = new Int32Array(canvasFrontend.count);

  let mouseCellsTouched = new Uint8Array(mouseCellCount);
  let mouseTouchedList = new Int32Array(mouseCellCount);
  let mouseTouchedCount = 0;

  let lastBucketTime = 0;
  const bucketIntervalMs = (SIM.mouseBucketIntervalMs ?? 50);

  function rebuildMouseStructures() {
    mouseCellCount = mouseGeom.rows * mouseGeom.cols;

    cellOffsets = new Uint32Array(mouseCellCount + 1);
    cellCounts = new Uint32Array(mouseCellCount);
    writePtr = new Uint32Array(mouseCellCount);

    mouseCellsTouched = new Uint8Array(mouseCellCount);
    mouseTouchedList = new Int32Array(mouseCellCount);
    mouseTouchedCount = 0;

    if (bucketIndices.length < canvasFrontend.count) {
      bucketIndices = new Int32Array(canvasFrontend.count);
    }
  }

  function clearTouchedCellsOnly() {
    for (let i = 0; i < mouseTouchedCount; i++) {
      mouseCellsTouched[mouseTouchedList[i]] = 0;
    }
    mouseTouchedCount = 0;
  }

  function markTouchedMouseCellsFromMouse() {
    const pts = mouse.prevPositions;
    const n = pts.length;
    if (n < 1) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const x = p[0], y = p[1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    minX -= mouse.radius; minY -= mouse.radius;
    maxX += mouse.radius; maxY += mouse.radius;

    let c0 = (minX * mouseGeom.invCellWidth) | 0;
    let r0 = (minY * mouseGeom.invCellHeight) | 0;
    let c1 = (maxX * mouseGeom.invCellWidth) | 0;
    let r1 = (maxY * mouseGeom.invCellHeight) | 0;

    if (c0 < 0) c0 = 0;
    if (r0 < 0) r0 = 0;
    if (c1 >= mouseGeom.cols) c1 = mouseGeom.cols - 1;
    if (r1 >= mouseGeom.rows) r1 = mouseGeom.rows - 1;

    for (let r = r0; r <= r1; r++) {
      const base = r * mouseGeom.cols;
      for (let c = c0; c <= c1; c++) {
        const idx = base + c;
        if (!mouseCellsTouched[idx]) {
          mouseCellsTouched[idx] = 1;
          mouseTouchedList[mouseTouchedCount++] = idx;
        }
      }
    }
  }

  function bucketParticlesMouseGrid_Typed() {
    const data = canvasFrontend.particleData;
    const N = canvasFrontend.count;

    if (bucketIndices.length < N) bucketIndices = new Int32Array(N);

    cellCounts.fill(0);

    for (let i = 0, j = 0; i < N; i++, j += 4) {
      const x = data[j];
      const y = data[j + 1];

      let cx = (x * mouseGeom.invCellWidth) | 0;
      let cy = (y * mouseGeom.invCellHeight) | 0;

      if (cx < 0) cx = 0;
      else if (cx >= mouseGeom.cols) cx = mouseGeom.cols - 1;

      if (cy < 0) cy = 0;
      else if (cy >= mouseGeom.rows) cy = mouseGeom.rows - 1;

      cellCounts[cy * mouseGeom.cols + cx]++;
    }

    cellOffsets[0] = 0;
    for (let c = 0; c < mouseCellCount; c++) {
      cellOffsets[c + 1] = cellOffsets[c] + cellCounts[c];
    }

    for (let c = 0; c < mouseCellCount; c++) {
      writePtr[c] = cellOffsets[c];
    }

    for (let i = 0, j = 0; i < N; i++, j += 4) {
      const x = data[j];
      const y = data[j + 1];

      let cx = (x * mouseGeom.invCellWidth) | 0;
      let cy = (y * mouseGeom.invCellHeight) | 0;

      if (cx < 0) cx = 0;
      else if (cx >= mouseGeom.cols) cx = mouseGeom.cols - 1;

      if (cy < 0) cy = 0;
      else if (cy >= mouseGeom.rows) cy = mouseGeom.rows - 1;

      const cell = cy * mouseGeom.cols + cx;
      bucketIndices[writePtr[cell]++] = i;
    }
  }

  function transitionColor(current, target, factor = 0.05) {
    return {
      r: current.r + (target.r - current.r) * factor,
      g: current.g + (target.g - current.g) * factor,
      b: current.b + (target.b - current.b) * factor
    };
  }

  function resizeCanvas() {
    canvasFrontend.resizeCanvas();

    geom.width = canvasFrontend.width;
    geom.height = canvasFrontend.height;

    geom.cellWidth = geom.width / SIM.gridCols;
    geom.cellHeight = geom.height / SIM.gridRows;
    geom.invCellWidth = 1 / geom.cellWidth;
    geom.invCellHeight = 1 / geom.cellHeight;

    mouseGeom.cellWidth = geom.width / mouseGeom.cols;
    mouseGeom.cellHeight = geom.height / mouseGeom.rows;
    mouseGeom.invCellWidth = 1 / mouseGeom.cellWidth;
    mouseGeom.invCellHeight = 1 / mouseGeom.cellHeight;

    initializeDirectionField(dir);
  }

  window.addEventListener("resize", resizeCanvas);

  function animate() {
    state.currentColor = transitionColor(state.currentColor, state.targetColor);
    state.currentGlowColor = transitionColor(state.currentGlowColor, state.targetGlowColor);

    const glowColor =
      `rgb(${state.currentGlowColor.r | 0}, ${state.currentGlowColor.g | 0}, ${state.currentGlowColor.b | 0})`;
    canvasFrontend.canvas.style.filter =
      `drop-shadow(0px 0px 50px ${glowColor}) drop-shadow(0px 0px 10px ${glowColor})`;

    decayMouse(mouse);

    const data = canvasFrontend.particleData;
    const N = canvasFrontend.count;
    const w = geom.width;
    const h = geom.height;

    const doMouse =
      mouse.active &&
      mouse.prevPositions.length >= 2 &&
      (mouse.vx !== 0 || mouse.vy !== 0);

    if (doMouse && useCelledMouse) {
      const now = performance.now();

      clearTouchedCellsOnly();
      markTouchedMouseCellsFromMouse();

      if (now - lastBucketTime >= bucketIntervalMs) {
        lastBucketTime = now;
        bucketParticlesMouseGrid_Typed();
      }
    }

    const halfCellW = geom.cellWidth * 0.5;
    const halfCellH = geom.cellHeight * 0.5;
    const maxDistSq = halfCellW * halfCellW + halfCellH * halfCellH;

    for (let i = 0, j = 0; i < N; i++, j += 4) {
      let x = data[j];
      let y = data[j + 1];
      let vx = data[j + 2];
      let vy = data[j + 3];

      let cellX = (x * geom.invCellWidth) | 0;
      let cellY = (y * geom.invCellHeight) | 0;

      if (cellX < 0) cellX = 0;
      else if (cellX >= SIM.gridCols) cellX = SIM.gridCols - 1;

      if (cellY < 0) cellY = 0;
      else if (cellY >= SIM.gridRows) cellY = SIM.gridRows - 1;

      const idx = cellY * SIM.gridCols + cellX;
      const targetVx = dir.targetVx[idx];
      const targetVy = dir.targetVy[idx];

      const cx = cellX * geom.cellWidth + halfCellW;
      const cy = cellY * geom.cellHeight + halfCellH;

      const dx = x - cx;
      const dy = y - cy;
      const distCenterSq = dx * dx + dy * dy;

      let t = 1 - (distCenterSq / maxDistSq);
      if (t < 0) t = 0;
      const influenceFactor = t * t;
      const adjAlignFactor = state.alignmentFactor * influenceFactor;

      // floatid REMOVED: no per-particle bias
      vx += (targetVx - vx) * adjAlignFactor;
      vy += (targetVy - vy) * adjAlignFactor;

      vx += (Math.random() - 0.5) * state.randomAccelFactor;
      vy += (Math.random() - 0.5) * state.randomAccelFactor;

      const sp2 = vx * vx + vy * vy;
      if (sp2 > maxVelocitySq) {
        const inv = SIM.maxVelocity / Math.sqrt(sp2);
        vx *= inv;
        vy *= inv;
      }

      x += vx;
      y += vy;

      if (x < 0) x += w;
      else if (x >= w) x -= w;

      if (y < 0) y += h;
      else if (y >= h) y -= h;

      data[j] = x;
      data[j + 1] = y;
      data[j + 2] = vx;
      data[j + 3] = vy;
    }

    if (doMouse) {
      if (useCelledMouse) {
        for (let ti = 0; ti < mouseTouchedCount; ti++) {
          const cellIdx = mouseTouchedList[ti];

          const start = cellOffsets[cellIdx];
          const end = cellOffsets[cellIdx + 1];

          for (let p = start; p < end; p++) {
            const i = bucketIndices[p];
            const j = i * 4;

            const x = data[j];
            const y = data[j + 1];

            const d2 = minDistanceToPolylineSq(x, y, mouse.prevPositions);
            if (d2 < mouse.radiusSq) {
              const d = Math.sqrt(d2);
              const u = 1 - (d / mouse.radius);
              const infl = u * u;

              let vx = data[j + 2];
              let vy = data[j + 3];

              vx += mouse.vx * infl * mouse.strength;
              vy += mouse.vy * infl * mouse.strength;

              const sp2 = vx * vx + vy * vy;
              if (sp2 > maxVelocitySq * 1.2) {
                const inv = SIM.maxVelocity / Math.sqrt(sp2);
                vx *= inv;
                vy *= inv;
              }

              data[j + 2] = vx;
              data[j + 3] = vy;
            }
          }
        }
      } else {
        for (let i = 0; i < N; i++) {
          const j = i * 4;
          const x = data[j];
          const y = data[j + 1];

          const d2 = minDistanceToPolylineSq(x, y, mouse.prevPositions);
          if (d2 < mouse.radiusSq) {
            const d = Math.sqrt(d2);
            const u = 1 - (d / mouse.radius);
            const infl = u * u;

            let vx = data[j + 2];
            let vy = data[j + 3];

            vx += mouse.vx * infl * mouse.strength;
            vy += mouse.vy * infl * mouse.strength;

            const sp2 = vx * vx + vy * vy;
            if (sp2 > maxVelocitySq * 1.2) {
              const inv = SIM.maxVelocity / Math.sqrt(sp2);
              vx *= inv;
              vy *= inv;
            }

            data[j + 2] = vx;
            data[j + 3] = vy;
          }
        }
      }
    }

    canvasFrontend.render(state.currentColor, SIM.maxVelocity);

    state.frameCounter++;
    if ((state.frameCounter % SIM.frameInterval) === 0) updateDirectionField(dir);

    if (is_animation_enabled) requestAnimationFrame(animate);
  }

  // Init
  rebuildMouseStructures();
  resizeCanvas();
  initializeDirectionField(dir);
  initParticles(canvasFrontend, particles, SIM.numParticles);

  bucketParticlesMouseGrid_Typed();
  lastBucketTime = performance.now();

  animate();

  // Safe UI bindings (avoid recursion)
  const _setFlowMode = window.setFlowMode;
  const _setStraightMode = window.setStraightMode;
  const _setBlueFlowMode = window.setBlueFlowMode;
  const _setClockwiseCircleMode = window.setClockwiseCircleMode;
  const _setWaveMode = window.setWaveMode;

  window.setFlowMode = () => _setFlowMode(dir, state);
  window.setStraightMode = () => _setStraightMode(dir, state);
  window.setBlueFlowMode = () => _setBlueFlowMode(dir, state);
  window.setClockwiseCircleMode = () => _setClockwiseCircleMode(dir, state, geom);
  window.setWaveMode = () => _setWaveMode(dir, state, geom);

  const _add10k = window.add10k;
  const _remove10k = window.remove10k;

  window.add10k = () => {
    _add10k(canvasFrontend, particles);
    if (bucketIndices.length < canvasFrontend.count) {
      bucketIndices = new Int32Array(canvasFrontend.count);
    }
    lastBucketTime = 0;
  };

  window.remove10k = () => {
    _remove10k(canvasFrontend, particles);
    lastBucketTime = 0;
  };

  // Tuning hooks
  window.setUseCelledMouse = (v) => { useCelledMouse = !!v; };
  window.toggleCelledMouse = () => (useCelledMouse = !useCelledMouse);

  window.setMouseGrid = (rows, cols) => {
    rows = Math.max(1, rows | 0);
    cols = Math.max(1, cols | 0);
    mouseGeom.rows = rows;
    mouseGeom.cols = cols;

    mouseGeom.cellWidth = geom.width / mouseGeom.cols;
    mouseGeom.cellHeight = geom.height / mouseGeom.rows;
    mouseGeom.invCellWidth = 1 / mouseGeom.cellWidth;
    mouseGeom.invCellHeight = 1 / mouseGeom.cellHeight;

    rebuildMouseStructures();
    bucketParticlesMouseGrid_Typed();
    lastBucketTime = performance.now();

    return { rows: mouseGeom.rows, cols: mouseGeom.cols };
  };

})();
