(function () {
  function setStraightMode(dir, state) {
    dir.isFlowMode = false;
    state.randomAccelFactor = state.alignmentFactor * 4;
    state.targetColors = colors.straight;
    state.targetGlowColor = glowColors.straight;

    for (let i = 0; i < dir.cellCount; i++) {
      dir.angle[i] = Math.PI;
      dir.angVel[i] = 0;
      dir.targetVx[i] = -SIM.maxVelocity;
      dir.targetVy[i] = 0;
    }
  }

  function setFlowMode(dir, state) {
    dir.isFlowMode = true;
    state.randomAccelFactor = 0.1;
    state.targetColors = colors.flow;
    state.targetGlowColor = glowColors.flow;
    initializeDirectionField(dir);
  }

  function setBlueFlowMode(dir, state) {
  dir.isFlowMode = false;
  state.randomAccelFactor = state.alignmentFactor / 15;
  state.targetColors = colors.flow;
  state.targetGlowColor = glowColors.straight;

  const rows = SIM.gridRows;
  const cols = SIM.gridCols;

  const cx = (cols - 1) * 0.5;
  const cy = (rows - 1) * 0.5;

  // --- noise controls ---
  // Small angle jitter (radians). 0.10 ≈ 5.7°, 0.17 ≈ 9.7°
  const ANGLE_NOISE = 0.12;

  // Optional: also vary speed slightly (keep small to avoid obvious "pulsing")
  const SPEED_NOISE = 0.03; // ±3%

  for (let row = 0; row < rows; row++) {
    const isTop = row < cy;

    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;

      const isLeft = col < cx;

      // Base quadrant direction
      let baseVy = 1; // always downward
      let baseVx;
      if (isTop) {
        baseVx = isLeft ? 1 : -1;   // inward on top
      } else {
        baseVx = isLeft ? -1 : 1;   // outward on bottom
      }

      // Convert base direction to an angle, then add slight angular noise
      let ang = Math.atan2(baseVy, baseVx);
      ang += (Math.random() * 2 - 1) * ANGLE_NOISE;

      // Base speed with slight noise
      let speed = SIM.maxVelocity * 0.7 * (1 + (Math.random() * 2 - 1) * SPEED_NOISE);

      // Back to vector
      let vx = Math.cos(ang) * speed;
      let vy = Math.sin(ang) * speed;

      dir.targetVx[idx] = vx;
      dir.targetVy[idx] = vy;
      dir.angVel[idx] = 0;
      dir.angle[idx] = ang;
    }
  }
}

  function setClockwiseCircleMode(dir, state, geom) {
    dir.isFlowMode = false;
    state.randomAccelFactor = state.alignmentFactor * 2;
    state.targetColors = colors.circle;
    state.targetGlowColor = glowColors.circle;

    const centerX = geom.width * 0.5;
    const centerY = geom.height * 0.5;

    for (let row = 0; row < SIM.gridRows; row++) {
      for (let col = 0; col < SIM.gridCols; col++) {
        const idx = row * SIM.gridCols + col;

        const cellCenterX = (col + 0.5) * geom.cellWidth;
        const cellCenterY = (row + 0.5) * geom.cellHeight;

        const dx = cellCenterX - centerX;
        const dy = cellCenterY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        dir.targetVx[idx] = (dy / dist) * SIM.maxVelocity * 0.7;
        dir.targetVy[idx] = -(dx / dist) * SIM.maxVelocity * 0.7;
        dir.angVel[idx] = 0;
      }
    }
  }

  function setWaveMode(dir, state, geom) {
    dir.isFlowMode = false;
    state.randomAccelFactor = state.alignmentFactor * 2;
    state.targetColors = colors.wave;
    state.targetGlowColor = glowColors.wave;

    const frequency = (2 * Math.PI * 3) / geom.width;

    for (let row = 0; row < SIM.gridRows; row++) {
      const phaseShift = Math.random() * Math.PI;
      for (let col = 0; col < SIM.gridCols; col++) {
        const idx = row * SIM.gridCols + col;
        const cellCenterX = (col + 0.5) * geom.cellWidth;
        const angle = Math.sin(frequency * cellCenterX + phaseShift);

        dir.targetVx[idx] = Math.cos(angle) * SIM.maxVelocity * 0.7;
        dir.targetVy[idx] = Math.sin(angle) * SIM.maxVelocity * 1.5 * 0.7;
        dir.angVel[idx] = 0;
      }
    }
  }

  function setClockwiseOffsetCircleMode(dir, state, geom) {
    dir.isFlowMode = false;
    state.randomAccelFactor = state.alignmentFactor * 2;
    state.targetColors = colors.flow;      // or make a new palette if you want
    state.targetGlowColor = glowColors.circle;

    // Center at (75% width, 50% height)
    const centerX = geom.width * 0.75;
    const centerY = geom.height * 0.25;

    for (let row = 0; row < SIM.gridRows; row++) {
      for (let col = 0; col < SIM.gridCols; col++) {
        const idx = row * SIM.gridCols + col;

        const cellCenterX = (col + 0.5) * geom.cellWidth;
        const cellCenterY = (row + 0.5) * geom.cellHeight;

        const dx = cellCenterX - centerX;
        const dy = cellCenterY - centerY;
        const dist = -Math.sqrt(dx * dx + dy * dy) || 1;

        // Clockwise tangent: (dy, -dx) normalized
        dir.targetVx[idx] = (dy / dist) * SIM.maxVelocity * 0.7;
        dir.targetVy[idx] = -(dx / dist) * SIM.maxVelocity * 0.7;

        dir.angVel[idx] = 0;

        // Optional (only if you rely on dir.angle elsewhere)
        dir.angle[idx] = Math.atan2(dir.targetVy[idx], dir.targetVx[idx]);
      }
    }
  }

  window.setFlowMode = setFlowMode;
  window.setStraightMode = setStraightMode;
  window.setBlueFlowMode = setBlueFlowMode;
  window.setClockwiseCircleMode = setClockwiseCircleMode;
  window.setWaveMode = setWaveMode;
  window.setClockwiseOffsetCircleMode = setClockwiseOffsetCircleMode;
})();
