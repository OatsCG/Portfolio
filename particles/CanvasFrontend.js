(function () {
  class CanvasFrontend {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.gl = this.canvas.getContext("webgl2", {
        alpha: true,
        preserveDrawingBuffer: false,
        antialias: false,
        depth: false,
        stencil: false,
      });

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

      this.MAX_GRADIENT_COLORS = 16;
      this.fadeFactor = 0.95; // keep 90% of previous frame each render

      this.initGL();
      this.resizeCanvas();
    }

    initGL() {
      const gl = this.gl;

      // -----------------------------
      // PARTICLE PROGRAM
      // -----------------------------
      const vertexShaderSource = `#version 300 es
        precision mediump float;

        in vec4 a_particleData;     // x, y, vx, vy
        in vec2 a_prevParticlePos;  // prevX, prevY
        
        uniform vec2 u_resolution;
        uniform float u_maxVelocity;

        uniform int u_gradientCount;
        uniform vec3 u_gradient[16];

        out float v_opacity;
        out vec3 v_color;
        out float v_lineDistance;

        const float PI = 3.1415926535897932384626433832795;

        vec3 sampleConicGradient(float t) {
          if (u_gradientCount <= 0) {
            return vec3(1.0, 1.0, 1.0);
          }
          if (u_gradientCount == 1) {
            return u_gradient[0];
          }

          float n = float(u_gradientCount);
          float x = fract(t) * n;
          int i0 = int(floor(x));
          int i1 = (i0 + 1) % u_gradientCount;
          float f = fract(x);

          return mix(u_gradient[i0], u_gradient[i1], f);
        }

        void main() {
          // Use gl_VertexID to determine which endpoint of the line we're rendering
          // 0 = previous position, 1 = current position
          vec2 position = (gl_VertexID == 0) ? a_prevParticlePos : a_particleData.xy;
          vec2 velocity = a_particleData.zw;

          // Calculate distance between prev and current position to detect wraparound
          vec2 delta = a_particleData.xy - a_prevParticlePos;
          v_lineDistance = length(delta);

          vec2 zeroToOne = position / u_resolution;
          vec2 clipSpace = zeroToOne * 2.0 - 1.0;
          gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);

          float speed = length(velocity);
          v_opacity = pow(clamp(speed / u_maxVelocity, 0.0, 1.0), 1.0);

          float angle = atan(velocity.y, velocity.x);
          float t = (angle + PI) / (2.0 * PI);

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
        in float v_lineDistance;
        
        uniform float u_maxLineDistance;
        
        out vec4 outColor;

        void main() {
          // Discard fragments if the line segment is too long (wraparound detection)
          if (v_lineDistance > u_maxLineDistance) {
            discard;
          }
          outColor = vec4(v_color * v_opacity * 0.66, v_opacity * v_opacity * 0.66);
        }`;

      const vs = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
      const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

      this.program = gl.createProgram();
      gl.attachShader(this.program, vs);
      gl.attachShader(this.program, fs);
      gl.linkProgram(this.program);

      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        console.error("Could not link WebGL particle program", gl.getProgramInfoLog(this.program));
        return;
      }

      // Particle VAO
      this.particleVAO = gl.createVertexArray();
      gl.bindVertexArray(this.particleVAO);

      this.particleBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);

      this.particleDataLocation = gl.getAttribLocation(this.program, "a_particleData");
      gl.enableVertexAttribArray(this.particleDataLocation);
      gl.vertexAttribPointer(this.particleDataLocation, 4, gl.FLOAT, false, 24, 0);
      gl.vertexAttribDivisor(this.particleDataLocation, 2);

      this.prevParticlePosLocation = gl.getAttribLocation(this.program, "a_prevParticlePos");
      gl.enableVertexAttribArray(this.prevParticlePosLocation);
      gl.vertexAttribPointer(this.prevParticlePosLocation, 2, gl.FLOAT, false, 24, 16);
      gl.vertexAttribDivisor(this.prevParticlePosLocation, 2);

      gl.bindVertexArray(null);

      this.maxVelocityUniformLocation = gl.getUniformLocation(this.program, "u_maxVelocity");
      this.resolutionUniformLocation = gl.getUniformLocation(this.program, "u_resolution");
      this.gradientCountUniformLocation = gl.getUniformLocation(this.program, "u_gradientCount");
      this.gradientUniformLocation = gl.getUniformLocation(this.program, "u_gradient");
      this.maxLineDistanceUniformLocation = gl.getUniformLocation(this.program, "u_maxLineDistance");

      // -----------------------------
      // FULLSCREEN COPY/FADE PROGRAM
      // -----------------------------
      const screenVS = `#version 300 es
        precision mediump float;

        out vec2 v_uv;

        const vec2 pos[6] = vec2[](
          vec2(-1.0, -1.0), vec2( 1.0, -1.0), vec2(-1.0,  1.0),
          vec2(-1.0,  1.0), vec2( 1.0, -1.0), vec2( 1.0,  1.0)
        );

        void main() {
          vec2 p = pos[gl_VertexID];
          v_uv = p * 0.5 + 0.5;
          gl_Position = vec4(p, 0.0, 1.0);
        }`;

      const screenFS = `#version 300 es
        precision mediump float;

        in vec2 v_uv;
        uniform sampler2D u_texture;
        uniform float u_fadeFactor;
        out vec4 outColor;

        void main() {
          vec4 c = texture(u_texture, v_uv);

          // Fade both color and alpha
          c *= u_fadeFactor;

          // Kill tiny leftovers so they actually go black
          if (c.r < 0.04 && c.g < 0.04 && c.b < 0.04 && c.a < 0.04) {
            c = vec4(0.0);
          }

          outColor = c;
        }`;

      const svs = this.compileShader(gl.VERTEX_SHADER, screenVS);
      const sfs = this.compileShader(gl.FRAGMENT_SHADER, screenFS);

      this.screenProgram = gl.createProgram();
      gl.attachShader(this.screenProgram, svs);
      gl.attachShader(this.screenProgram, sfs);
      gl.linkProgram(this.screenProgram);

      if (!gl.getProgramParameter(this.screenProgram, gl.LINK_STATUS)) {
        console.error("Could not link WebGL screen program", gl.getProgramInfoLog(this.screenProgram));
        return;
      }

      this.screenTextureUniformLocation = gl.getUniformLocation(this.screenProgram, "u_texture");
      this.screenFadeUniformLocation = gl.getUniformLocation(this.screenProgram, "u_fadeFactor");

      // Empty VAO for gl_VertexID fullscreen draws
      this.fullscreenVAO = gl.createVertexArray();

      gl.clearColor(0, 0, 0, 0);

      // Reusable gradient array
      this.gradientData = new Float32Array(this.MAX_GRADIENT_COLORS * 3);

      // Ping-pong render targets
      this.textures = [null, null];
      this.framebuffers = [null, null];
      this.readIndex = 0;
      this.writeIndex = 1;

      this.createPingPongTargets();
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

    createRenderTexture(width, height) {
      const gl = this.gl;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );

      gl.bindTexture(gl.TEXTURE_2D, null);
      return tex;
    }

    createFramebufferForTexture(texture) {
      const gl = this.gl;
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer is not complete.");
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return fbo;
    }

    createPingPongTargets() {
      const gl = this.gl;

      // Clean up old
      for (let i = 0; i < 2; i++) {
        if (this.textures[i]) gl.deleteTexture(this.textures[i]);
        if (this.framebuffers[i]) gl.deleteFramebuffer(this.framebuffers[i]);
      }

      this.textures[0] = this.createRenderTexture(this.width, this.height);
      this.textures[1] = this.createRenderTexture(this.width, this.height);

      this.framebuffers[0] = this.createFramebufferForTexture(this.textures[0]);
      this.framebuffers[1] = this.createFramebufferForTexture(this.textures[1]);

      // Clear both targets
      for (let i = 0; i < 2; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[i]);
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      this.readIndex = 0;
      this.writeIndex = 1;
    }

    // Fade previous texture into write target
    clearCanvas() {
      const gl = this.gl;

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.writeIndex]);
      gl.viewport(0, 0, this.width, this.height);

      gl.disable(gl.BLEND);
      gl.useProgram(this.screenProgram);
      gl.bindVertexArray(this.fullscreenVAO);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[this.readIndex]);
      gl.uniform1i(this.screenTextureUniformLocation, 0);
      gl.uniform1f(this.screenFadeUniformLocation, this.fadeFactor);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.bindVertexArray(null);
    }

    drawParticlesToWriteTarget(colors, maxVelocity) {
      const gl = this.gl;

      const stops = Array.isArray(colors) && colors.length
        ? colors.slice(0, this.MAX_GRADIENT_COLORS)
        : [{ r: 255, g: 255, b: 255 }];

      this.gradientData.fill(0);
      for (let i = 0; i < stops.length; i++) {
        const c = stops[i];
        this.gradientData[i * 3 + 0] = (c.r ?? 255) / 255;
        this.gradientData[i * 3 + 1] = (c.g ?? 255) / 255;
        this.gradientData[i * 3 + 2] = (c.b ?? 255) / 255;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.writeIndex]);
      gl.viewport(0, 0, this.width, this.height);

      gl.useProgram(this.program);
      gl.bindVertexArray(this.particleVAO);

      gl.uniform1i(this.gradientCountUniformLocation, stops.length);
      gl.uniform3fv(this.gradientUniformLocation, this.gradientData);
      gl.uniform1f(this.maxVelocityUniformLocation, maxVelocity);
      
      // Set max line distance threshold to ~20% of max screen dimension to catch wraparounds
      const maxLineDist = Math.max(this.width, this.height) * 0.2;
      gl.uniform1f(this.maxLineDistanceUniformLocation, maxLineDist);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particleData);

      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      gl.drawArraysInstanced(gl.LINES, 0, 2, this.count);

      gl.bindVertexArray(null);
    }

    presentToScreen() {
      const gl = this.gl;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.width, this.height);

      gl.disable(gl.BLEND);
      gl.useProgram(this.screenProgram);
      gl.bindVertexArray(this.fullscreenVAO);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[this.writeIndex]);
      gl.uniform1i(this.screenTextureUniformLocation, 0);
      gl.uniform1f(this.screenFadeUniformLocation, 1.0); // no extra fade when presenting

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.bindVertexArray(null);
    }

    swapTargets() {
      const temp = this.readIndex;
      this.readIndex = this.writeIndex;
      this.writeIndex = temp;
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

      this.createPingPongTargets();
    }

    setParticleCount(n) {
      this.count = n | 0;
      this.particleData = new Float32Array(this.count * 6);
      document.getElementById("particleCount").textContent = n;

      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.particleData.byteLength, gl.DYNAMIC_DRAW);
    }

    resizeParticles(newCount) {
      newCount |= 0;
      if (newCount === this.count) return;

      const newData = new Float32Array(newCount * 6);
      const copyFloats = Math.min(this.count, newCount) * 6;
      newData.set(this.particleData.subarray(0, copyFloats), 0);

      this.count = newCount;
      this.particleData = newData;
      document.getElementById("particleCount").textContent = newCount;

      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.particleData.byteLength, gl.DYNAMIC_DRAW);
    }

    render(colors, maxVelocity) {
      this.clearCanvas();                         // read -> write with fade
      this.drawParticlesToWriteTarget(colors, maxVelocity); // add new particles into write
      this.presentToScreen();                    // write -> screen
      this.swapTargets();                        // write becomes next frame's read
      mirrorParticleCanvasToBG();
    }
  }

  window.CanvasFrontend = CanvasFrontend;
})();

// Copies the already-rendered WebGL canvas pixels onto a 2D background canvas.
function mirrorParticleCanvasToBG() {
  const src = document.getElementById("particleCanvas");
  const dst = document.getElementById("particleCanvasBG");

  if (!src || !dst) return;

  if (dst.width !== src.width) dst.width = src.width;
  if (dst.height !== src.height) dst.height = src.height;

  const ctx = dst.getContext("2d", { alpha: true });
  if (!ctx) return;

  ctx.globalCompositeOperation = "copy";
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}