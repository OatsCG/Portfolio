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
  { r: 210, g:  50, b: 230 }, // vivid violet
  { r: 255, g:  80, b: 200 }, // strong hot pink
  { r: 255, g: 110, b: 190 }, // bright pink
  { r: 220, g:  40, b: 210 }, // deep magenta
  { r: 153, g:  73, b: 196 }, // original base color
  { r: 130, g:  60, b: 210 }, // dark purple
  { r: 110, g:  40, b: 190 }, // deeper violet (less blue)
  { r: 160, g:  55, b: 215 }  // purple-pink wrap (minimal blue)
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
