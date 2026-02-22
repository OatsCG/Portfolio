(function () {
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

      // Max number of conic gradient stops supported in shader
      this.MAX_GRADIENT_COLORS = 16;

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

        // Conic gradient uniforms
        uniform int u_gradientCount;
        uniform vec3 u_gradient[16];

        out float v_opacity;
        out vec3 v_color;

        const float PI = 3.1415926535897932384626433832795;

        vec3 sampleConicGradient(float t) {
          // t expected in [0, 1)
          if (u_gradientCount <= 0) {
            return vec3(1.0, 1.0, 1.0);
          }
          if (u_gradientCount == 1) {
            return u_gradient[0];
          }

          float n = float(u_gradientCount);
          float x = fract(t) * n;              // [0, n)
          int i0 = int(floor(x));              // current stop
          int i1 = (i0 + 1) % u_gradientCount; // next stop (wrap)
          float f = fract(x);                  // local interpolation

          return mix(u_gradient[i0], u_gradient[i1], f);
        }

        void main() {
          vec2 position = a_particleData.xy;
          vec2 velocity = a_particleData.zw;

          vec2 zeroToOne = position / u_resolution;
          vec2 clipSpace = zeroToOne * 2.0 - 1.0;
          gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
          gl_PointSize = 1.0;

          float speed = length(velocity);
          v_opacity = pow(clamp(speed / u_maxVelocity, 0.0, 1.0), 1.0);

          // Angle from velocity direction -> [0, 1) for conic gradient lookup
          // atan(y, x) returns [-PI, PI]
          float angle = atan(velocity.y, velocity.x);
          float t = (angle + PI) / (2.0 * PI);

          // If velocity is near zero, default to first gradient color
          if (speed < 0.00001) {
            v_color = (u_gradientCount > 0) ? u_gradient[0] : vec3(1.0);
          } else {
            v_color = sampleConicGradient(t);
          }
        }`;

      const fragmentShaderSource = `#version 300 es
        precision mediump float;

        in float v_opacity;
        in vec3 v_color;
        out vec4 outColor;

        void main() {
          outColor = vec4(v_color, v_opacity);
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

      this.maxVelocityUniformLocation = gl.getUniformLocation(this.program, "u_maxVelocity");
      this.resolutionUniformLocation = gl.getUniformLocation(this.program, "u_resolution");

      // New gradient uniforms
      this.gradientCountUniformLocation = gl.getUniformLocation(this.program, "u_gradientCount");
      this.gradientUniformLocation = gl.getUniformLocation(this.program, "u_gradient");

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
      document.getElementById("particleCount").textContent = n;

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
      document.getElementById("particleCount").textContent = newCount;

      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.particleData.byteLength, gl.DYNAMIC_DRAW);
    }

    // colors: array of {r,g,b} conic gradient stops
    render(colors, maxVelocity) {
      const gl = this.gl;
      gl.useProgram(this.program);

      // Fallback + clamp to shader max
      const stops = Array.isArray(colors) && colors.length
        ? colors.slice(0, this.MAX_GRADIENT_COLORS)
        : [{ r: 255, g: 255, b: 255 }];

      // Flatten to vec3 array (normalized 0..1)
      const gradientData = new Float32Array(this.MAX_GRADIENT_COLORS * 3);
      for (let i = 0; i < stops.length; i++) {
        const c = stops[i];
        gradientData[i * 3 + 0] = (c.r ?? 255) / 255;
        gradientData[i * 3 + 1] = (c.g ?? 255) / 255;
        gradientData[i * 3 + 2] = (c.b ?? 255) / 255;
      }

      gl.uniform1i(this.gradientCountUniformLocation, stops.length);
      gl.uniform3fv(this.gradientUniformLocation, gradientData);
      gl.uniform1f(this.maxVelocityUniformLocation, maxVelocity);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particleData);

      this.clearCanvas();
      gl.drawArrays(gl.POINTS, 0, this.count);
      mirrorParticleCanvasToBG()
    }
  }

  window.CanvasFrontend = CanvasFrontend;
})();

// Copies the already-rendered WebGL canvas pixels onto a 2D background canvas.
// No extra particle/sim calculations; it just blits the image.
function mirrorParticleCanvasToBG() {
  const src = document.getElementById("particleCanvas");     // WebGL2 canvas
  const dst = document.getElementById("particleCanvasBG");   // 2D canvas

  if (!src || !dst) return;

  // Match exact pixel size (your sim uses canvas.width/height = innerWidth/innerHeight)
  if (dst.width !== src.width) dst.width = src.width;
  if (dst.height !== src.height) dst.height = src.height;

  const ctx = dst.getContext("2d", { alpha: true });
  if (!ctx) return;

  // "copy" replaces pixels exactly (including alpha), no blending artifacts
  ctx.globalCompositeOperation = "copy";
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

function mirrorParticleCanvasToBGFullOpacity() {
  const src = document.getElementById("particleCanvas");
  const dst = document.getElementById("particleCanvasBG");

  if (!src || !dst) return;

  if (dst.width !== src.width) dst.width = src.width;
  if (dst.height !== src.height) dst.height = src.height;

  const ctx = dst.getContext("2d", { alpha: true });
  if (!ctx) return;

  // Draw original
  ctx.clearRect(0, 0, dst.width, dst.height);
  ctx.drawImage(src, 0, 0);

  // Read pixels
  const imageData = ctx.getImageData(0, 0, dst.width, dst.height);
  const data = imageData.data;

  // Force every pixel to full opacity
  for (let i = 3; i < data.length; i += 4) {
    data[i] = data[i] + data[i]; // alpha channel
  }

  ctx.putImageData(imageData, 0, 0);
}