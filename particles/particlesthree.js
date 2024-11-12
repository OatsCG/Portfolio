/**
 * CanvasFrontend class
 * Manages WebGL2 rendering and particle data for a particle simulation.
 * Provides methods to clear and resize the canvas, add particles, and update
 * particle positions. Particle rendering is handled using WebGL2 shaders for efficiency.
 */
class CanvasFrontend {
    /**
     * Constructor - initializes the canvas and its WebGL2 context.
     * Sets the canvas width and height to match the window size.
     * Initializes an empty particle array and sets up WebGL2 shaders and buffers.
     *
     * @param {string} canvasId - The ID of the canvas element.
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl2');

        if (!this.gl) {
            console.error('WebGL2 not supported by your browser.');
            return;
        }

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Particles Array
        this.particles = [];
        this.particleData = new Float32Array(0); // Combined buffer for position and velocity

        this.initGL();
    }

    /**
     * Initializes WebGL2 shaders, program, and buffers.
     * Sets up the vertex and fragment shaders and prepares attribute buffers.
     */
    initGL() {
        // Vertex Shader
        this.vertexShaderSource = `#version 300 es
        precision mediump float;
        in vec4 a_particleData; // x, y, vx, vy in a single attribute
        uniform vec2 u_resolution;
        uniform float u_maxVelocity;
        out float v_opacity;

        void main() {
            vec2 position = a_particleData.xy;
            vec2 velocity = a_particleData.zw;

            // Convert to clip space
            vec2 zeroToOne = position / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            gl_PointSize = 1.0;

            // Calculate opacity based on velocity magnitude
            float speed = length(velocity);
            v_opacity = pow((speed * 1.0) / u_maxVelocity, 1.5);
        }`;

        // Fragment Shader
        this.fragmentShaderSource = `#version 300 es
        precision mediump float;
        uniform vec3 u_color;
        in float v_opacity;
        out vec4 outColor;

        void main() {
            outColor = vec4(u_color, v_opacity);
        }`;

        // Compile shaders and link program
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Could not link WebGL program', this.gl.getProgramInfoLog(this.program));
            return;
        }

        // Use program
        this.gl.useProgram(this.program);

        // Create and bind a single particle data buffer
        this.particleBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleBuffer);

        // Enable particle data attribute
        this.particleDataLocation = this.gl.getAttribLocation(this.program, 'a_particleData');
        this.gl.vertexAttribPointer(this.particleDataLocation, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.particleDataLocation);

        // Get uniform locations
        this.colorUniformLocation = this.gl.getUniformLocation(this.program, 'u_color');
        this.maxVelocityUniformLocation = this.gl.getUniformLocation(this.program, 'u_maxVelocity');
        this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, 'u_resolution');

        // Set uniforms that don't change every frame
        this.gl.uniform2f(this.resolutionUniformLocation, this.width, this.height);

        // Enable blending and set blend function
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);

        // Set the clear color
        this.gl.clearColor(0, 0, 0, 0);
    }

    /**
     * Compiles a WebGL shader from the given source code.
     *
     * @param {number} type - The type of shader (vertex or fragment).
     * @param {string} source - The GLSL source code of the shader.
     * @returns {WebGLShader} The compiled shader.
     */
    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile failed with:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    /**
     * Clears the entire canvas by resetting its content.
     * Typically called at the start of each frame to prepare for new drawings.
     */
    clearCanvas() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    /**
     * Resizes the canvas to match the window dimensions.
     * Also updates the canvas width, height properties, and the WebGL viewport.
     * Should be called when the window resizes.
     */
    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.uniform2f(this.resolutionUniformLocation, this.width, this.height);
    }

    /**
     * Moves a particle to a new position.
     * Used for updating particle positions after external movement calculations.
     *
     * @param {number} index - The index of the particle in the particles array.
     * @param {number} x - The new x-coordinate of the particle.
     * @param {number} y - The new y-coordinate of the particle.
     */
    moveParticle(index, x, y) {
        this.particles[index].x = x;
        this.particles[index].y = y;
    }

    /**
     * Adds a new particle to the particles array.
     * Each particle should be an object with x, y, vx, and vy properties.
     *
     * @param {Object} particle - The particle to add, containing x, y, vx, and vy properties.
     */
    addParticle(particle) {
        this.particles.push(particle);
    }

    /**
     * Renders all particles to the canvas using WebGL2 shaders.
     * Should be called once all particle positions and velocities have been updated for a frame.
     * Updates buffers based on the current particle positions and velocities.
     *
     * @param {Object} color - The RGB color object to apply to each particle, with r, g, and b properties.
     * @param {number} maxVelocity - The maximum velocity to calculate particle opacity.
     */
    render(color, maxVelocity) {
        this.gl.useProgram(this.program);

        // Only set color and max velocity once per frame
        this.gl.uniform3f(
            this.colorUniformLocation,
            color.r / 255,
            color.g / 255,
            color.b / 255
        );
        this.gl.uniform1f(this.maxVelocityUniformLocation, maxVelocity);

        // Resize particle data array if necessary
        if (this.particleData.length !== this.particles.length * 4) {
            this.particleData = new Float32Array(this.particles.length * 4);
        }

        // Update particle data
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const index = i * 4;
            this.particleData[index] = particle.x;
            this.particleData[index + 1] = particle.y;
            this.particleData[index + 2] = particle.vx;
            this.particleData[index + 3] = particle.vy;
        }

        // Update particle buffer data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particleData, this.gl.DYNAMIC_DRAW);

        this.clearCanvas();

        // Draw particles
        this.gl.drawArrays(this.gl.POINTS, 0, this.particles.length);
    }
}



let is_animation_enabled = true;

// Create an instance of CanvasFrontend
const canvasFrontend = new CanvasFrontend('particleCanvas');

// Parameters
let numParticles = 40000;
const gridRows = 10;
const gridCols = 10;
const maxAngularVelocity = 0.02;
const angularVelocityChangeFactor = 0.001;
const frameInterval = 10;
const maxVelocity = 5;
const alignmentFactor = (0.029 * maxVelocity) ** 2;
let randomAccelFactor = 0;
let cellWidth, cellHeight;

// Color Definitions
const colors = {
    flow: {
        r: 255,
        g: 255,
        b: 255
    },
    straight: {
        r: 173,
        g: 216,
        b: 230
    },
    pointToCenter: {
        r: 139,
        g: 0,
        b: 0
    },
    wave: {
        r: 153,
        g: 73,
        b: 196
    }
};

const glowColors = {
    flow: {
        r: 255,
        g: 255,
        b: 255
    },
    straight: {
        r: 56,
        g: 90,
        b: 242
    },
    pointToCenter: {
        r: 255,
        g: 50,
        b: 50
    },
    wave: {
        r: 66,
        g: 123,
        b: 255
    }
};

// Variables
let directionModifiers;
let frameCounter = 0;
let isFlowMode = true;
let targetColor = colors.flow;
let currentColor = {
    r: 255,
    g: 255,
    b: 255
};
let targetGlowColor = glowColors.flow;
let currentGlowColor = {
    r: 255,
    g: 255,
    b: 255
};

// Mouse Influence Variables
let mouseX = 0,
    mouseY = 0;
let prevPositions = [
    [0, 0],
    [0, 0]
];
let mouseVelocityX = 0,
    mouseVelocityY = 0;
const mouseInfluenceRadius = 100;
const mouseInfluenceStrength = 0.01;
const decayFactor = 0.9;
let lastMoveTime = Date.now();

// Canvas Resize Handler
function resizeCanvas() {
    canvasFrontend.resizeCanvas();
    cellWidth = canvasFrontend.width / gridCols;
    cellHeight = canvasFrontend.height / gridRows;
    // numParticles = Math.min(initialNumParticles, canvasFrontend.width * canvasFrontend.height / 10);
    // console.log(numParticles)

    initializeDirectionModifiers();
    // initializeParticles();
}

window.addEventListener('resize', resizeCanvas);

// Initialize Direction Modifiers
function initializeDirectionModifiers() {
    directionModifiers = Array.from({
            length: gridRows
        }, () =>
        Array.from({
            length: gridCols
        }, () => {
            const angle = Math.random() * 2 * Math.PI;
            return {
                angle,
                angularVelocity: (Math.random() - 0.5) * maxAngularVelocity,
                targetVx: Math.cos(angle) * maxVelocity,
                targetVy: Math.sin(angle) * maxVelocity
            };
        })
    );
}

// Initialize Particles
function initializeParticles() {
    canvasFrontend.particles = Array.from({
        length: numParticles
    }, () => ({
        x: Math.random() * canvasFrontend.width,
        y: Math.random() * canvasFrontend.height,
        vx: (Math.random() - 0.5) * maxVelocity,
        vy: (Math.random() - 0.5) * maxVelocity
    }));
}

function add10k() {
    const additionalParticles = Array.from({ length: 20000 }, () => ({
        x: Math.random() * canvasFrontend.width,
        y: Math.random() * canvasFrontend.height,
        vx: 0 * maxVelocity,
        vy: 0 * maxVelocity,
    }));

    canvasFrontend.particles.push(...additionalParticles);
}

function remove10k() {
    // Only remove particles if there are 20,000 or more
    if (canvasFrontend.particles.length >= 30000) {
        canvasFrontend.particles.splice(-20000, 20000);
    }
}

// Helper Function: Color Transition
function transitionColor(current, target, factor = 0.05) {
    return {
        r: current.r + (target.r - current.r) * factor,
        g: current.g + (target.g - current.g) * factor,
        b: current.b + (target.b - current.b) * factor
    };
}

// Mode Setting Functions
function setStraightMode() {
    isFlowMode = false;
    randomAccelFactor = alignmentFactor * 2;
    targetColor = colors.straight;
    targetGlowColor = glowColors.straight;

    directionModifiers.forEach(row => {
        row.forEach(cell => {
            cell.angle = Math.PI;
            cell.angularVelocity = 0;
            cell.targetVx = -maxVelocity;
            cell.targetVy = 0;
        });
    });
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
    randomAccelFactor = alignmentFactor / 15
    targetColor = colors.flow;
    targetGlowColor = glowColors.straight;

    initializeDirectionModifiers();
}

function setClockwiseCircleMode() {
    isFlowMode = false;
    randomAccelFactor = alignmentFactor / 7;
    targetColor = colors.straight;
    targetGlowColor = glowColors.straight;

    const centerX = canvasFrontend.width / 2;
    const centerY = canvasFrontend.height / 2;

    directionModifiers.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const dx = (colIndex + 0.5) * cellWidth - centerX;
            const dy = (rowIndex + 0.5) * cellHeight - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            cell.targetVx = (dy / distance) * maxVelocity;
            cell.targetVy = -(dx / distance) * maxVelocity;
            cell.angularVelocity = 0;
        });
    });
}

// Set "Wave" mode
function setWaveMode() {
    isFlowMode = false;
    randomAccelFactor = alignmentFactor * 2;
    targetColor = colors.wave; // Pink
    targetGlowColor = glowColors.wave;

    const frequency = (2 * Math.PI * 3) / canvasFrontend.width; // 3 sine cycles across canvas width
    directionModifiers.forEach((row, rowIndex) => {
        const phaseShift = Math.random() * Math.PI; // Random phase shift per row
        row.forEach((cell, colIndex) => {
            const cellCenterX = (colIndex + 0.5) * cellWidth;
            const angle = Math.sin(frequency * cellCenterX + phaseShift);
            cell.targetVx = Math.cos(angle) * maxVelocity;
            cell.targetVy = Math.sin(angle) * maxVelocity * 1.5;
            cell.angularVelocity = 0;
        });
    });
}

// Mousemove Event Listener
canvasFrontend.canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    prevPositions.push([mouseX, mouseY]);

    if (prevPositions.length > 5) prevPositions.shift();
    mouseVelocityX = mouseX - prevPositions[0][0];
    mouseVelocityY = mouseY - prevPositions[0][1];
    lastMoveTime = Date.now();
});

// Calculate Distance from Point to Line Segment
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const lineLenSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (lineLenSquared === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLenSquared;
    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

function minDistanceToLineSegments(px, py, mouseX, mouseY, prevPositions) {
    let minDistance = Infinity;

    for (let i = 0; i < prevPositions.length; i++) {
        const [x1, y1] = prevPositions[i];
        const distance = distanceToLineSegment(px, py, x1, y1, mouseX, mouseY);
        minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
}


// Animation Loop
function animate() {
    canvasFrontend.clearCanvas();

    // Update Colors
    currentColor = transitionColor(currentColor, targetColor);
    currentGlowColor = transitionColor(currentGlowColor, targetGlowColor);

    // Glow Effect
    const glowColor = `rgb(${Math.floor(currentGlowColor.r)}, ${Math.floor(currentGlowColor.g)}, ${Math.floor(currentGlowColor.b)})`;
    canvasFrontend.canvas.style.filter = `drop-shadow(0px 0px 50px ${glowColor}) drop-shadow(0px 0px 10px ${glowColor})`;

    // Mouse Velocity Decay
    if (Date.now() - lastMoveTime > 100) {
        mouseVelocityX *= decayFactor;
        mouseVelocityY *= decayFactor;
        if (Math.abs(mouseVelocityX) <= 0.01 && Math.abs(mouseVelocityY) <= 0.01) prevPositions = [];
    }

    // Update Particles
    canvasFrontend.particles.forEach((particle, index) => {
        const cellX = Math.min(Math.max(Math.floor(particle.x / cellWidth), 0), gridCols - 1);
        const cellY = Math.min(Math.max(Math.floor(particle.y / cellHeight), 0), gridRows - 1);

        const {
            targetVx,
            targetVy
        } = directionModifiers[cellY][cellX];
        const dx = particle.x - (cellX + 0.5) * cellWidth;
        const dy = particle.y - (cellY + 0.5) * cellHeight;
        const distanceToCenterSquared = dx * dx + dy * dy;
        const maxDistanceSquared = (cellWidth / 2) ** 2 + (cellHeight / 2) ** 2;
        const influenceFactor = Math.pow(Math.max(0, 1 - distanceToCenterSquared / maxDistanceSquared), 2);
        const adjAlignFactor = alignmentFactor * influenceFactor;

        particle.vx += (targetVx - particle.vx) * adjAlignFactor;
        particle.vy += (targetVy - particle.vy) * adjAlignFactor;

        particle.vx += (Math.random() - 0.5) * randomAccelFactor;
        particle.vy += (Math.random() - 0.5) * randomAccelFactor;

        const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
        if (speed > maxVelocity) {
            const scale = maxVelocity / speed;
            particle.vx *= scale;
            particle.vy *= scale;
        }

        // Apply mouse influence
        let distanceToMouseLine = 1000;
        if (prevPositions.length > 0) {
            let minDistance = minDistanceToLineSegments(particle.x, particle.y, mouseX, mouseY, prevPositions);
            distanceToMouseLine = minDistance
        }

        if (distanceToMouseLine < mouseInfluenceRadius) {
            const mouseInfluence = Math.pow(1 - (distanceToMouseLine / mouseInfluenceRadius), 2);
            particle.vx += mouseVelocityX * mouseInfluence * mouseInfluenceStrength;
            particle.vy += mouseVelocityY * mouseInfluence * mouseInfluenceStrength;
        }

        // Update particle in CanvasFrontend
        canvasFrontend.moveParticle(index, (particle.x + particle.vx + canvasFrontend.width) % canvasFrontend.width, (particle.y + particle.vy + canvasFrontend.height) % canvasFrontend.height);
    });

    // Render the updated imageData
    canvasFrontend.render(currentColor, maxVelocity);

    frameCounter++;
    if (frameCounter % frameInterval === 0) updateDirectionModifiers();
    if (is_animation_enabled) requestAnimationFrame(animate);
}

// Update Direction Modifiers in Flow Mode
function updateDirectionModifiers() {
    if (isFlowMode) {
        directionModifiers.forEach(row => {
            row.forEach(cell => {
                cell.angle = (cell.angle + cell.angularVelocity + 2 * Math.PI) % (2 * Math.PI);
                cell.angularVelocity += (Math.random() - 0.5) * angularVelocityChangeFactor;
                cell.angularVelocity = Math.min(Math.max(cell.angularVelocity, -maxAngularVelocity), maxAngularVelocity);
                cell.targetVx = Math.cos(cell.angle) * maxVelocity;
                cell.targetVy = Math.sin(cell.angle) * maxVelocity;
            });
        });
    }
}

// Initialize and Start Animation
resizeCanvas();
initializeParticles();
animate();