window.SIM = {
  numParticles: 100000,

  gridRows: 10,
  gridCols: 10,

  // Flow field motion
  maxAngularVelocity: 0.02,
  angularVelocityChangeFactor: 0.001,
  frameInterval: 10,

  maxVelocity: 5,

  // Mouse
  mouseInfluenceRadius: 100,
  mouseInfluenceStrength: 0.11,
  decayFactor: 0.9,

  // NEW: independent mouse bucketing grid (tune this!)
  // Try 30x30, 40x25, etc.
  mouseGridRows: 25,
  mouseGridCols: 40,

  // NEW: how often we rebuild particle buckets while mouse is active (ms)
  // 50ms = 20Hz; 33ms = 30Hz; 80ms = 12.5Hz
  mouseBucketIntervalMs: 50
};

window.colors = {
  flow: { r: 255, g: 255, b: 255 },
  straight: { r: 173, g: 216, b: 230 },
  pointToCenter: { r: 139, g: 0, b: 0 },
  wave: { r: 153, g: 73, b: 196 }
};

window.glowColors = {
  flow: { r: 255, g: 255, b: 255 },
  straight: { r: 56, g: 90, b: 242 },
  pointToCenter: { r: 255, g: 50, b: 50 },
  wave: { r: 66, g: 123, b: 255 }
};
