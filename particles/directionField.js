(function () {
  function createDirectionField() {
    const cellCount = SIM.gridRows * SIM.gridCols;
    const dir = {
      cellCount,
      angle: new Float32Array(cellCount),
      angVel: new Float32Array(cellCount),
      targetVx: new Float32Array(cellCount),
      targetVy: new Float32Array(cellCount),
      isFlowMode: true
    };
    initializeDirectionField(dir);
    return dir;
  }

  function initializeDirectionField(dir) {
    for (let i = 0; i < dir.cellCount; i++) {
      const a = Math.random() * 2 * Math.PI;
      const av = (Math.random() - 0.5) * SIM.maxAngularVelocity;
      dir.angle[i] = a;
      dir.angVel[i] = av;
      dir.targetVx[i] = Math.cos(a) * SIM.maxVelocity;
      dir.targetVy[i] = Math.sin(a) * SIM.maxVelocity;
    }
  }

  function updateDirectionField(dir) {
    if (!dir.isFlowMode) return;

    for (let i = 0; i < dir.cellCount; i++) {
      let angle = dir.angle[i] + dir.angVel[i];
      angle = (angle + 2 * Math.PI) % (2 * Math.PI);
      dir.angle[i] = angle;

      let av = dir.angVel[i] + (Math.random() - 0.5) * SIM.angularVelocityChangeFactor;
      if (av > SIM.maxAngularVelocity) av = SIM.maxAngularVelocity;
      else if (av < -SIM.maxAngularVelocity) av = -SIM.maxAngularVelocity;
      dir.angVel[i] = av;

      dir.targetVx[i] = Math.cos(angle) * SIM.maxVelocity;
      dir.targetVy[i] = Math.sin(angle) * SIM.maxVelocity;
    }
  }

  window.createDirectionField = createDirectionField;
  window.initializeDirectionField = initializeDirectionField;
  window.updateDirectionField = updateDirectionField;
})();
