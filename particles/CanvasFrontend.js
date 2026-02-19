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
          outColor = vec4(u_color * v_opacity, v_opacity);
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

  window.CanvasFrontend = CanvasFrontend;
})();
