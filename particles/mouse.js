(function () {
  function createMouse(canvasFrontend) {
    const mouse = {
      prevPositions: [],
      vx: 0,
      vy: 0,
      lastMoveTime: performance.now(),
      active: false,

      radius: SIM.mouseInfluenceRadius,
      radiusSq: SIM.mouseInfluenceRadius * SIM.mouseInfluenceRadius,
      strength: SIM.mouseInfluenceStrength,

      // throttle mousemove processing (ms)
      _lastSample: 0
    };

    function toCanvasXY(event) {
      const rect = canvasFrontend.canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvasFrontend.width / rect.width);
      const y = (event.clientY - rect.top) * (canvasFrontend.height / rect.height);
      return [x, y];
    }

    canvasFrontend.canvas.addEventListener("mousemove", (event) => {
      if (!SIM.is_animation_enabled) { return }
      const now = performance.now();

      // Light throttle so we don’t over-sample mousemove at 200–500Hz
      if (now - mouse._lastSample < 8) return; // ~125Hz max
      mouse._lastSample = now;

      const [x, y] = toCanvasXY(event);

      // Adaptive trail length for huge particle counts (cuts segment checks)
      // 3 points => 2 segments (much cheaper than 5 points => 4 segments)
      const maxTrail = (canvasFrontend.count >= 200000) ? 3 : 5;

      mouse.prevPositions.push([x, y]);
      if (mouse.prevPositions.length > maxTrail) mouse.prevPositions.shift();

      const oldest = mouse.prevPositions[0];
      mouse.vx = x - oldest[0];
      mouse.vy = y - oldest[1];

      mouse.lastMoveTime = now;
      mouse.active = true;
    });

    return mouse;
  }

  function decayMouse(mouse) {
    const now = performance.now();
    if (mouse.active && now - mouse.lastMoveTime > 10) {
      mouse.vx *= SIM.decayFactor;
      mouse.vy *= SIM.decayFactor;

      if ((mouse.vx * mouse.vx + mouse.vy * mouse.vy) < 0.0001) {
        mouse.vx = 0;
        mouse.vy = 0;
        mouse.prevPositions.length = 0;
        mouse.active = false;
      }
    }
  }

  function distancePointToSegmentSq(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;

    const abLenSq = abx * abx + aby * aby;
    if (abLenSq === 0) return apx * apx + apy * apy;

    let t = (apx * abx + apy * aby) / abLenSq;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    const cx = ax + t * abx;
    const cy = ay + t * aby;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy;
  }

  function minDistanceToPolylineSq(px, py, pts) {
    const n = pts.length;
    if (n < 2) return Infinity;

    let minSq = Infinity;
    for (let i = 0; i < n - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const d2 = distancePointToSegmentSq(px, py, a[0], a[1], b[0], b[1]);
      if (d2 < minSq) minSq = d2;
    }
    return minSq;
  }

  window.createMouse = createMouse;
  window.decayMouse = decayMouse;
  window.minDistanceToPolylineSq = minDistanceToPolylineSq;
})();
