/**
 * Optimized particle sim + WebGL2 frontend (with mouse-lag fix via cell-bucketing).
 *
 * Revisions included:
 *  - Particles stored in one interleaved Float32Array: [x,y,vx,vy] * N
 *  - gl.bufferSubData updates after one-time buffer allocation
 *  - Mouse influence is ONLY computed for particles in grid cells near the mouse trail
 *    (dramatically reduces work when mouse moves)
 *  - add10k() / remove10k() added back (adds/removes 10,000 particles)
 */

class CanvasFrontend {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.gl = this.canvas.getContext("webgl2");
    if (!this.gl) {
      console.error("WebGL2 not supported by your browser.");
      return;
    }

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.count = 0;
    this.particleData = new Float32Array(0);

    this.initGL();
    this.resizeCanvas();
  }

  initGL() {
    const gl = this.gl;

    const vertexShaderSource = `#version 300 es
      precision mediump float;
      in vec4 a_particleData; // x, y, vx, vy
      uniform vec2 u_resolution;
      uniform float u_maxVelocity;
      out float v_opacity;

      void main() {
        vec2 position = a_particleData.xy;
        vec2 velocity = a_particleData.zw;

        vec2 zeroToOne = position / u_resolution;
        vec2 clipSpace = zeroToOne * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        gl_PointSize = 1.0;

        float speed = length(velocity);
        v_opacity = pow(speed / u_maxVelocity, 1.0);
      }`;

    const fragmentShaderSource = `#version 300 es
      precision mediump float;
      uniform vec3 u_color;
      in float v_opacity;
      out vec4 outColor;

      void main() {
        outColor = vec4(u_color, v_opacity + 0.1);
      }`;

    const vs = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error("Could not link WebGL program", gl.getProgramInfoLog(this.program));
      return;
    }

    gl.useProgram(this.program);

    this.particleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);

    this.particleDataLocation = gl.getAttribLocation(this.program, "a_particleData");
    gl.enableVertexAttribArray(this.particleDataLocation);
    gl.vertexAttribPointer(this.particleDataLocation, 4, gl.FLOAT, false, 16, 0);

    this.colorUniformLocation = gl.getUniformLocation(this.program, "u_color");
    this.maxVelocityUniformLocation = gl.getUniformLocation(this.program, "u_maxVelocity");
    this.resolutionUniformLocation = gl.getUniformLocation(this.program, "u_resolution");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.clearColor(0, 0, 0, 0);
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile failed with:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  clearCanvas() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  resizeCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const gl = this.gl;
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.program);
    gl.uniform2f(this.resolutionUniformLocation, this.width, this.height);
  }

  setParticleCount(n) {
    this.count = n | 0;
    this.particleData = new Float32Array(this.count * 4);

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.particleData.byteLength, gl.DYNAMIC_DRAW);
  }

  resizeParticles(newCount) {
    newCount |= 0;
    if (newCount === this.count) return;

    const newData = new Float32Array(newCount * 4);
    const copyFloats = Math.min(this.count, newCount) * 4;
    newData.set(this.particleData.subarray(0, copyFloats), 0);

    this.count = newCount;
    this.particleData = newData;

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.particleData.byteLength, gl.DYNAMIC_DRAW);
  }

  render(color, maxVelocity) {
    const gl = this.gl;
    gl.useProgram(this.program);

    gl.uniform3f(
      this.colorUniformLocation,
      color.r / 255,
      color.g / 255,
      color.b / 255
    );
    gl.uniform1f(this.maxVelocityUniformLocation, maxVelocity);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particleData);

    this.clearCanvas();
    gl.drawArrays(gl.POINTS, 0, this.count);
  }
}

/* ------------------------ Simulation Params ------------------------ */

let is_animation_enabled = true;
const canvasFrontend = new CanvasFrontend("particleCanvas");

let numParticles = 40000;

const gridRows = 10;
const gridCols = 10;
const cellCount = gridRows * gridCols;

const maxAngularVelocity = 0.02;
const angularVelocityChangeFactor = 0.001;
const frameInterval = 10;

const maxVelocity = 5;
const maxVelocitySq = maxVelocity * maxVelocity;

const alignmentFactor = (0.029 * maxVelocity) ** 2;
let randomAccelFactor = 0;

let cellWidth = 1, cellHeight = 1, invCellWidth = 1, invCellHeight = 1;

/* ------------------------ Colors ------------------------ */

const colors = {
  flow: { r: 255, g: 255, b: 255 },
  straight: { r: 173, g: 216, b: 230 },
  pointToCenter: { r: 139, g: 0, b: 0 },
  wave: { r: 153, g: 73, b: 196 }
};

const glowColors = {
  flow: { r: 255, g: 255, b: 255 },
  straight: { r: 56, g: 90, b: 242 },
  pointToCenter: { r: 255, g: 50, b: 50 },
  wave: { r: 66, g: 123, b: 255 }
};

let frameCounter = 0;
let isFlowMode = true;

let targetColor = colors.flow;
let currentColor = { r: 255, g: 255, b: 255 };

let targetGlowColor = glowColors.flow;
let currentGlowColor = { r: 255, g: 255, b: 255 };

function transitionColor(current, target, factor = 0.05) {
  return {
    r: current.r + (target.r - current.r) * factor,
    g: current.g + (target.g - current.g) * factor,
    b: current.b + (target.b - current.b) * factor
  };
}

/* ------------------------ Direction Modifiers (Typed) ------------------------ */

let dir_angle = new Float32Array(cellCount);
let dir_angVel = new Float32Array(cellCount);
let dir_targetVx = new Float32Array(cellCount);
let dir_targetVy = new Float32Array(cellCount);

function initializeDirectionModifiers() {
  for (let i = 0; i < cellCount; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const av = (Math.random() - 0.5) * maxAngularVelocity;
    dir_angle[i] = angle;
    dir_angVel[i] = av;
    dir_targetVx[i] = Math.cos(angle) * maxVelocity;
    dir_targetVy[i] = Math.sin(angle) * maxVelocity;
  }
}

function updateDirectionModifiers() {
  if (!isFlowMode) return;

  for (let i = 0; i < cellCount; i++) {
    let angle = dir_angle[i] + dir_angVel[i];
    angle = (angle + 2 * Math.PI) % (2 * Math.PI);
    dir_angle[i] = angle;

    let av = dir_angVel[i] + (Math.random() - 0.5) * angularVelocityChangeFactor;
    if (av > maxAngularVelocity) av = maxAngularVelocity;
    else if (av < -maxAngularVelocity) av = -maxAngularVelocity;
    dir_angVel[i] = av;

    dir_targetVx[i] = Math.cos(angle) * maxVelocity;
    dir_targetVy[i] = Math.sin(angle) * maxVelocity;
  }
}

/* ------------------------ Particles (Typed) ------------------------ */

let floatId = new Float32Array(0);

function initializeParticles() {
  canvasFrontend.setParticleCount(numParticles);
  floatId = new Float32Array(numParticles);

  const data = canvasFrontend.particleData;
  const w = canvasFrontend.width;
  const h = canvasFrontend.height;

  for (let i = 0, j = 0; i < numParticles; i++, j += 4) {
    floatId[i] = Math.random() - 0.5;
    data[j] = Math.random() * w;
    data[j + 1] = Math.random() * h;
    data[j + 2] = (Math.random() - 0.5) * maxVelocity;
    data[j + 3] = (Math.random() - 0.5) * maxVelocity;
  }
}

function add10k() {
  const add = 10000;
  const oldN = canvasFrontend.count;
  const newN = oldN + add;

  canvasFrontend.resizeParticles(newN);

  const newFloat = new Float32Array(newN);
  newFloat.set(floatId, 0);
  floatId = newFloat;

  const data = canvasFrontend.particleData;
  const w = canvasFrontend.width;
  const h = canvasFrontend.height;

  for (let i = oldN, j = oldN * 4; i < newN; i++, j += 4) {
    floatId[i] = Math.random() - 0.5;
    data[j] = Math.random() * w;
    data[j + 1] = Math.random() * h;
    data[j + 2] = 0;
    data[j + 3] = 0;
  }

  // If mouse cell-buckets are allocated (they are), no extra action needed.
}

function remove10k() {
  const remove = 10000;
  const oldN = canvasFrontend.count;
  if (oldN < 10000 + 1) return;

  const newN = Math.max(0, oldN - remove);
  canvasFrontend.resizeParticles(newN);
  floatId = floatId.subarray(0, newN);
}

/* ------------------------ Mouse Influence (Optimized + Bucketing) ------------------------ */

let prevPositions = [];
let mouseVelocityX = 0, mouseVelocityY = 0;

const mouseInfluenceRadius = 100;
const mouseInfluenceRadiusSq = mouseInfluenceRadius * mouseInfluenceRadius;
const mouseInfluenceStrength = 0.11;

const decayFactor = 0.9;
let lastMoveTime = performance.now();
let mouseActive = false;

// Cell bucketing structures
const cellParticleIndices = Array.from({ length: cellCount }, () => []);
let cellsTouched = new Uint8Array(cellCount);          // 0/1 flags for touched cells
let touchedList = new Int32Array(cellCount);           // list of touched cell indices
let touchedCount = 0;

// Clear only the touched flags; also clear buckets each time mouse active.
function clearCellBuckets() {
  for (let i = 0; i < touchedCount; i++) {
    cellsTouched[touchedList[i]] = 0;
  }
  touchedCount = 0;

  for (let i = 0; i < cellCount; i++) {
    cellParticleIndices[i].length = 0;
  }
}

function bucketParticles() {
  const data = canvasFrontend.particleData;
  const N = canvasFrontend.count;

  for (let i = 0, j = 0; i < N; i++, j += 4) {
    const x = data[j], y = data[j + 1];
    let cx = (x * invCellWidth) | 0;
    let cy = (y * invCellHeight) | 0;

    if (cx < 0) cx = 0; else if (cx >= gridCols) cx = gridCols - 1;
    if (cy < 0) cy = 0; else if (cy >= gridRows) cy = gridRows - 1;

    cellParticleIndices[cy * gridCols + cx].push(i);
  }
}

// Cheap cell marking: bounding box of mouse polyline expanded by radius.
function markTouchedCellsFromMouse() {
  const n = prevPositions.length;
  if (n < 1) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const p = prevPositions[i];
    const x = p[0], y = p[1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  minX -= mouseInfluenceRadius; minY -= mouseInfluenceRadius;
  maxX += mouseInfluenceRadius; maxY += mouseInfluenceRadius;

  let c0 = (minX * invCellWidth) | 0;
  let r0 = (minY * invCellHeight) | 0;
  let c1 = (maxX * invCellWidth) | 0;
  let r1 = (maxY * invCellHeight) | 0;

  if (c0 < 0) c0 = 0;
  if (r0 < 0) r0 = 0;
  if (c1 >= gridCols) c1 = gridCols - 1;
  if (r1 >= gridRows) r1 = gridRows - 1;

  for (let r = r0; r <= r1; r++) {
    const base = r * gridCols;
    for (let c = c0; c <= c1; c++) {
      const idx = base + c;
      if (!cellsTouched[idx]) {
        cellsTouched[idx] = 1;
        touchedList[touchedCount++] = idx;
      }
    }
  }
}

// Squared distance point->segment (no sqrt)
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

canvasFrontend.canvas.addEventListener("mousemove", (event) => {
  const x = event.clientX;
  const y = event.clientY;

  prevPositions.push([x, y]);
  if (prevPositions.length > 5) prevPositions.shift();

  const oldest = prevPositions[0];
  mouseVelocityX = x - oldest[0];
  mouseVelocityY = y - oldest[1];

  lastMoveTime = performance.now();
  mouseActive = true;
});

/* ------------------------ Resize ------------------------ */

function resizeCanvas() {
  canvasFrontend.resizeCanvas();
  cellWidth = canvasFrontend.width / gridCols;
  cellHeight = canvasFrontend.height / gridRows;
  invCellWidth = 1 / cellWidth;
  invCellHeight = 1 / cellHeight;

  initializeDirectionModifiers();
}

window.addEventListener("resize", resizeCanvas);

/* ------------------------ Modes ------------------------ */

function setStraightMode() {
  isFlowMode = false;
  randomAccelFactor = alignmentFactor * 2;
  targetColor = colors.straight;
  targetGlowColor = glowColors.straight;

  for (let i = 0; i < cellCount; i++) {
    dir_angle[i] = Math.PI;
    dir_angVel[i] = 0;
    dir_targetVx[i] = -maxVelocity;
    dir_targetVy[i] = 0;
  }
}

function setFlowMode() {
  isFlowMode = true;
  randomAccelFactor = alignmentFactor / 15;
  targetColor = colors.flow;
  targetGlowColor = glowColors.flow;
  initializeDirectionModifiers();
}

function setBlueFlowMode() {
  isFlowMode = true;
  randomAccelFactor = alignmentFactor / 15;
  targetColor = colors.flow;
  targetGlowColor = glowColors.straight;
  initializeDirectionModifiers();
}

function setClockwiseCircleMode() {
  isFlowMode = false;
  randomAccelFactor = alignmentFactor / 7;
  targetColor = colors.straight;
  targetGlowColor = glowColors.straight;

  const centerX = canvasFrontend.width * 0.5;
  const centerY = canvasFrontend.height * 0.5;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const idx = row * gridCols + col;

      const cellCenterX = (col + 0.5) * cellWidth;
      const cellCenterY = (row + 0.5) * cellHeight;

      const dx = cellCenterX - centerX;
      const dy = cellCenterY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      dir_targetVx[idx] = (dy / dist) * maxVelocity;
      dir_targetVy[idx] = -(dx / dist) * maxVelocity;
      dir_angVel[idx] = 0;
    }
  }
}

function setWaveMode() {
  isFlowMode = false;
  randomAccelFactor = alignmentFactor * 2;
  targetColor = colors.wave;
  targetGlowColor = glowColors.wave;

  const frequency = (2 * Math.PI * 3) / canvasFrontend.width;

  for (let row = 0; row < gridRows; row++) {
    const phaseShift = Math.random() * Math.PI;
    for (let col = 0; col < gridCols; col++) {
      const idx = row * gridCols + col;
      const cellCenterX = (col + 0.5) * cellWidth;
      const angle = Math.sin(frequency * cellCenterX + phaseShift);

      dir_targetVx[idx] = Math.cos(angle) * maxVelocity;
      dir_targetVy[idx] = Math.sin(angle) * maxVelocity * 1.5;
      dir_angVel[idx] = 0;
    }
  }
}

/* ------------------------ Animation Loop ------------------------ */

function animate() {
  // Color transitions
  currentColor = transitionColor(currentColor, targetColor);
  currentGlowColor = transitionColor(currentGlowColor, targetGlowColor);

  // Optional perf tweak: update filter less often if needed (uncomment)
  // if ((frameCounter & 3) === 0) {
  const glowColor = `rgb(${currentGlowColor.r | 0}, ${currentGlowColor.g | 0}, ${currentGlowColor.b | 0})`;
  canvasFrontend.canvas.style.filter =
    `drop-shadow(0px 0px 50px ${glowColor}) drop-shadow(0px 0px 10px ${glowColor})`;
  // }

  // Mouse decay + activity gate
  const now = performance.now();
  if (mouseActive && now - lastMoveTime > 10) {
    mouseVelocityX *= decayFactor;
    mouseVelocityY *= decayFactor;

    if ((mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY) < 0.0001) {
      mouseVelocityX = 0;
      mouseVelocityY = 0;
      prevPositions.length = 0;
      mouseActive = false;
    }
  }

  const data = canvasFrontend.particleData;
  const N = canvasFrontend.count;
  const w = canvasFrontend.width;
  const h = canvasFrontend.height;

  const mouseVx = mouseVelocityX;
  const mouseVy = mouseVelocityY;

  const doMouse =
    mouseActive &&
    prevPositions.length >= 2 &&
    (mouseVx !== 0 || mouseVy !== 0);

  // Build cell buckets + touched list ONLY when mouse is active
  if (doMouse) {
    clearCellBuckets();
    bucketParticles();
    markTouchedCellsFromMouse();
  }

  const halfCellW = cellWidth * 0.5;
  const halfCellH = cellHeight * 0.5;
  const maxDistSq = halfCellW * halfCellW + halfCellH * halfCellH;

  // Main particle update (no per-particle mouse distance here)
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    let x = data[j];
    let y = data[j + 1];
    let vx = data[j + 2];
    let vy = data[j + 3];

    let cellX = (x * invCellWidth) | 0;
    let cellY = (y * invCellHeight) | 0;

    if (cellX < 0) cellX = 0;
    else if (cellX >= gridCols) cellX = gridCols - 1;
    if (cellY < 0) cellY = 0;
    else if (cellY >= gridRows) cellY = gridRows - 1;

    const idx = cellY * gridCols + cellX;

    const targetVx = dir_targetVx[idx];
    const targetVy = dir_targetVy[idx];

    const cx = cellX * cellWidth + halfCellW;
    const cy = cellY * cellHeight + halfCellH;

    const dx = x - cx;
    const dy = y - cy;
    const distCenterSq = dx * dx + dy * dy;

    let t = 1 - (distCenterSq / maxDistSq);
    if (t < 0) t = 0;
    const influenceFactor = t * t;
    const adjAlignFactor = alignmentFactor * influenceFactor;

    const fid = floatId[i];

    vx += (targetVx - vx) * adjAlignFactor + fid * 0.03;
    vy += (targetVy - vy) * adjAlignFactor + fid * 0.03;

    vx += (Math.random() - 0.5) * randomAccelFactor;
    vy += (Math.random() - 0.5) * randomAccelFactor;

    const sp2 = vx * vx + vy * vy;
    if (sp2 > maxVelocitySq) {
      const inv = maxVelocity / Math.sqrt(sp2);
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

  // Apply mouse influence ONLY to particles in touched cells
  if (doMouse && touchedCount > 0) {
    for (let ti = 0; ti < touchedCount; ti++) {
      const cellIdx = touchedList[ti];
      const arr = cellParticleIndices[cellIdx];

      for (let k = 0; k < arr.length; k++) {
        const i = arr[k];
        const j = i * 4;

        const x = data[j];
        const y = data[j + 1];

        const d2 = minDistanceToPolylineSq(x, y, prevPositions);
        if (d2 < mouseInfluenceRadiusSq) {
          let u = 1 - (d2 / mouseInfluenceRadiusSq);
          if (u < 0) u = 0;
          const infl = u * u;

          let vx = data[j + 2];
          let vy = data[j + 3];

          vx += mouseVx * infl * mouseInfluenceStrength;
          vy += mouseVy * infl * mouseInfluenceStrength;

          const sp2 = vx * vx + vy * vy;
          if (sp2 > maxVelocitySq) {
            const inv = maxVelocity / Math.sqrt(sp2);
            vx *= inv;
            vy *= inv;
          }

          data[j + 2] = vx;
          data[j + 3] = vy;
        }
      }
    }
  }

  // Render
  canvasFrontend.render(currentColor, maxVelocity);

  frameCounter++;
  if ((frameCounter % frameInterval) === 0) updateDirectionModifiers();

  if (is_animation_enabled) requestAnimationFrame(animate);
}

/* ------------------------ Init ------------------------ */

function resizeAndInit() {
  resizeCanvas();
  initializeDirectionModifiers();
  initializeParticles();
}

resizeAndInit();
animate();

/* ------------------------ Optional exports ------------------------ */
// window.setFlowMode = setFlowMode;
// window.setStraightMode = setStraightMode;
// window.setBlueFlowMode = setBlueFlowMode;
// window.setClockwiseCircleMode = setClockwiseCircleMode;
// window.setWaveMode = setWaveMode;
// window.add10k = add10k;
// window.remove10k = remove10k;
