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
  flow: [
  { r: 230, g: 120, b: 120 }, // soft red
  { r: 230, g: 160, b: 110 }, // soft orange
  { r: 230, g: 210, b: 120 }, // soft yellow
  { r: 120, g: 200, b: 130 }, // soft green
  { r: 110, g: 190, b: 210 }, // soft cyan
  { r: 120, g: 140, b: 220 }, // soft blue
  { r: 180, g: 130, b: 210 }  // soft violet
],
  straight: [{ r: 173, g: 216, b: 230 }],
  pointToCenter: [{ r: 139, g: 0, b: 0 }],
  wave: [
  { r: 170, g:  85, b: 210 }, // bright purple
  { r: 200, g:  90, b: 215 }, // pink-leaning purple
  { r: 225, g: 110, b: 200 }, // soft pink
  { r: 185, g:  95, b: 220 }, // magenta-violet
  { r: 153, g:  73, b: 196 }, // your original color
  { r: 120, g:  95, b: 220 }, // periwinkle
  { r: 100, g: 120, b: 235 }, // soft blue
  { r: 135, g: 100, b: 220 }  // blue-violet (wrap back)
],
  circle: [
  { r: 110, g: 190, b: 220 }, // aqua-blue
  { r:  90, g: 205, b: 185 }, // teal
  { r: 120, g: 175, b: 230 }, // sky blue
  { r: 140, g: 150, b: 235 }, // blue-violet
  { r: 173, g: 216, b: 230 }, // original light blue (center axis)
  { r: 140, g: 150, b: 235 }, // mirror
  { r: 120, g: 175, b: 230 }, // mirror
  { r:  90, g: 205, b: 185 }, // mirror
  { r: 110, g: 190, b: 220 }  // mirror
],
};

window.glowColors = {
  flow: { r: 255, g: 255, b: 255 },
  straight: { r: 56, g: 90, b: 242 },
  pointToCenter: { r: 255, g: 50, b: 50 },
  wave: { r: 66, g: 123, b: 255 },
  circle: { r: 56, g: 149, b: 242 },
};
