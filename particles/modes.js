(function () {
  function setStraightMode(dir, state) {
    dir.isFlowMode = false;
    state.randomAccelFactor = state.alignmentFactor * 2;
    state.targetColor = colors.straight;
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
    state.randomAccelFactor = state.alignmentFactor / 15;
    state.targetColor = colors.flow;
    state.targetGlowColor = glowColors.flow;
    initializeDirectionField(dir);
  }

  function setBlueFlowMode(dir, state) {
    dir.isFlowMode = true;
    state.randomAccelFactor = state.alignmentFactor / 15;
    state.targetColor = colors.flow;
    state.targetGlowColor = glowColors.straight;
    initializeDirectionField(dir);
  }

  function setClockwiseCircleMode(dir, state, geom) {
    dir.isFlowMode = false;
    state.randomAccelFactor = state.alignmentFactor / 7;
    state.targetColor = colors.straight;
    state.targetGlowColor = glowColors.straight;

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

        dir.targetVx[idx] = (dy / dist) * SIM.maxVelocity;
        dir.targetVy[idx] = -(dx / dist) * SIM.maxVelocity;
        dir.angVel[idx] = 0;
      }
    }
  }

  function setWaveMode(dir, state, geom) {
    dir.isFlowMode = false;
    state.randomAccelFactor = state.alignmentFactor * 2;
    state.targetColor = colors.wave;
    state.targetGlowColor = glowColors.wave;

    const frequency = (2 * Math.PI * 3) / geom.width;

    for (let row = 0; row < SIM.gridRows; row++) {
      const phaseShift = Math.random() * Math.PI;
      for (let col = 0; col < SIM.gridCols; col++) {
        const idx = row * SIM.gridCols + col;
        const cellCenterX = (col + 0.5) * geom.cellWidth;
        const angle = Math.sin(frequency * cellCenterX + phaseShift);

        dir.targetVx[idx] = Math.cos(angle) * SIM.maxVelocity;
        dir.targetVy[idx] = Math.sin(angle) * SIM.maxVelocity * 1.5;
        dir.angVel[idx] = 0;
      }
    }
  }

  window.setFlowMode = setFlowMode;
  window.setStraightMode = setStraightMode;
  window.setBlueFlowMode = setBlueFlowMode;
  window.setClockwiseCircleMode = setClockwiseCircleMode;
  window.setWaveMode = setWaveMode;
})();
