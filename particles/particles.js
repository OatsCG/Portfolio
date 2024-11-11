var is_animation_enabled = true


// Get the canvas and set up its context
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

// Parameters
grandtotalspeed = 1;

const initialNumParticles = 50000;
const gridRows = 10;
const gridCols = 10;
const maxAngularVelocity = 0.01; // Max angular speed for direction change
const angularVelocityChangeFactor = 0.001; // Max random change in angular velocity per update
const frameInterval = 10; // Update direction every frame

const maxVelocity = 5;
const alignmentFactor = (0.029 * maxVelocity) ** 2; // Factor controlling how quickly particles align to cell vector
var randomAccelFactor = alignmentFactor / 7; // Maximum random adjustment to velocity

// Colors for each mode
const colors = {
    flow: { r: 255, g: 255, b: 255 },           // White
    straight: { r: 173, g: 216, b: 230 },       // Light blue
    pointToCenter: { r: 139, g: 0, b: 0 },      // Dark red
    wave: { r: 153, g: 73, b: 196 }            // Pink
};

// Glow colors for each mode
const glowColors = {
    flow: { r: 255, g: 255, b: 255 },
    straight: { r: 56, g: 90, b: 242 },
    pointToCenter: { r: 255, g: 50, b: 50 },
    wave: { r: 66, g: 123, b: 255}
};

// Variables to hold calculated values for canvas and grid cells
let cellWidth, cellHeight;
let numParticles;
let directionModifiers;
let frameCounter = 0;
let isFlowMode = true; // Track if we're in "Flow" mode
let targetColor = colors.flow; // Default color for Flow mode
let currentColor = { r: 255, g: 255, b: 255 }; // Start with white
let targetGlowColor = glowColors.flow;
let currentGlowColor = { r: 255, g: 255, b: 255 };

// Resize the canvas and recalculate cell sizes
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Recalculate cell width and height
    cellWidth = canvas.width / gridCols;
    cellHeight = canvas.height / gridRows;

    // Reinitialize direction modifiers with angle, angular velocity, and target velocity (targetVx, targetVy)
    directionModifiers = Array.from({ length: gridRows }, () => 
        Array.from({ length: gridCols }, () => {
            const angle = Math.random() * 2 * Math.PI; // Random initial angle in radians
            const targetVx = Math.cos(angle) * maxVelocity; // Initial target velocity in x
            const targetVy = Math.sin(angle) * maxVelocity; // Initial target velocity in y
            return {
                angle, // Store initial angle
                angularVelocity: (Math.random() - 0.5) * maxAngularVelocity, // Random angular velocity
                targetVx, // Target x velocity based on angle
                targetVy  // Target y velocity based on angle
            };
        })
    );

    numParticles = Math.min(initialNumParticles, canvas.width * canvas.height / 50);
}

// Initialize particles array
let particles = [];
function initializeParticles() {
    particles = Array.from({ length: numParticles }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * maxVelocity,
        vy: (Math.random() - 0.5) * maxVelocity
    }));
}

// Call resize to initialize everything
resizeCanvas();
initializeParticles();
window.addEventListener('resize', () => {
    resizeCanvas();
    initializeParticles(); // Reset particles if needed for new canvas size
});

// Helper function to gradually transition color
function transitionColor(current, target, factor = 0.05) {
    return {
        r: current.r + (target.r - current.r) * factor,
        g: current.g + (target.g - current.g) * factor,
        b: current.b + (target.b - current.b) * factor
    };
}

// Set "Straight" mode
function setStraightMode() {
    isFlowMode = false;
    randomAccelFactor = alignmentFactor * 2;
    targetColor = colors.straight; // Light blue
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

// Set "Flow" mode
function setFlowMode() {
    isFlowMode = true;
    randomAccelFactor = alignmentFactor / 7;
    targetColor = colors.flow; // White
	targetGlowColor = glowColors.flow;

    directionModifiers.forEach(row => {
        row.forEach(cell => {
            cell.angle = Math.random() * 2 * Math.PI;
            cell.targetVx = Math.cos(cell.angle) * maxVelocity;
            cell.targetVy = Math.sin(cell.angle) * maxVelocity;
            cell.angularVelocity = (Math.random() - 0.5) * maxAngularVelocity;
        });
    });
}

function setBlueFlowMode() {
    isFlowMode = true;
    randomAccelFactor = alignmentFactor / 7;
    targetColor = colors.flow; // White
	targetGlowColor = glowColors.straight;

    directionModifiers.forEach(row => {
        row.forEach(cell => {
            cell.angle = Math.random() * 2 * Math.PI;
            cell.targetVx = Math.cos(cell.angle) * maxVelocity;
            cell.targetVy = Math.sin(cell.angle) * maxVelocity;
            cell.angularVelocity = (Math.random() - 0.5) * maxAngularVelocity;
        });
    });
}

// Set "Clockwise Circle" mode
function setClockwiseCircleMode() {
    isFlowMode = false;
    randomAccelFactor = alignmentFactor / 7;
    targetColor = colors.straight; // Default color for circular mode
    targetGlowColor = glowColors.straight;

    // Center of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    directionModifiers.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            // Calculate direction vector from the center of the cell to the center of the canvas
            const cellCenterX = (colIndex + 0.5) * cellWidth;
            const cellCenterY = (rowIndex + 0.5) * cellHeight;
            const dx = cellCenterX - centerX;
            const dy = cellCenterY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Set velocity perpendicular to the radius vector to create clockwise circular motion
            cell.targetVx = (dy / distance) * maxVelocity;
            cell.targetVy = -(dx / distance) * maxVelocity;

            cell.angularVelocity = 0; // No rotation for this mode
        });
    });
}


// Set "Point to Center Column" mode
function setPointToCenterMode() {
    isFlowMode = false;
	randomAccelFactor = alignmentFactor / 2;
    targetColor = colors.pointToCenter; // Dark red
	targetGlowColor = glowColors.pointToCenter;

    const centerColumnX = canvas.width / 2;
    directionModifiers.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellCenterX = (colIndex + 0.5) * cellWidth;
            const dx = centerColumnX - cellCenterX;
            const distance = Math.abs(dx);
            cell.targetVx = (dx / distance) * maxVelocity;
            cell.targetVy = 0;
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

    const frequency = (2 * Math.PI * 3) / canvas.width; // 3 sine cycles across canvas width
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

// Update cell directions based on angles every frame interval
function updateDirectionModifiers() {
    if (isFlowMode) {
        directionModifiers.forEach(row => {
            row.forEach(cell => {
                cell.angle += cell.angularVelocity;
                if (cell.angle > 2 * Math.PI) cell.angle -= 2 * Math.PI;
                if (cell.angle < 0) cell.angle += 2 * Math.PI;
                cell.angularVelocity += (Math.random() - 0.5) * angularVelocityChangeFactor;
                cell.angularVelocity = Math.min(Math.max(cell.angularVelocity, -maxAngularVelocity), maxAngularVelocity);
                cell.targetVx = Math.cos(cell.angle) * maxVelocity;
                cell.targetVy = Math.sin(cell.angle) * maxVelocity;
            });
        });
    }
}

const TWO_PI = 2 * Math.PI; // Cache 2 * PI

// Add these variables to track the mouse
let mouseX = 0;
let mouseY = 0;
let prevPositions = [[0, 0], [0, 0]];
let mouseVelocityX = 0;
let mouseVelocityY = 0;
const mouseInfluenceRadius = 100; // Radius around the mouse line where particles are influenced
const mouseInfluenceStrength = 0.01; // Strength of the mouse influence on particles
const decayFactor = 0.9; // Factor to gradually reduce velocity when the mouse stops moving
let lastMoveTime = Date.now(); // Track the last time the mouse was moved

// Update mouse position and calculate velocity
canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    prev = [mouseX, mouseY];
    prevPositions.push(prev);
    if (prevPositions.length > 5) {
        prevPositions.shift();
    }

    // Calculate mouse velocity
    mouseVelocityX = mouseX - prevPositions[0][0];
    mouseVelocityY = mouseY - prevPositions[0][1];

    // Update the last move time
    lastMoveTime = Date.now();
});

// Function to calculate the distance of a point from a line segment
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const lineLenSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (lineLenSquared === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLenSquared;
    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

// Modified animation loop to apply mouse influence on particles
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update color gradually
    currentColor = transitionColor(currentColor, targetColor);
    currentGlowColor = transitionColor(currentGlowColor, targetGlowColor);

    // Update the drop-shadow filter for glow
    const glowColor = `rgb(${Math.floor(currentGlowColor.r)}, ${Math.floor(currentGlowColor.g)}, ${Math.floor(currentGlowColor.b)})`;
    canvas.style.filter = `drop-shadow(0px 0px 50px ${glowColor}) drop-shadow(0px 0px 20px ${glowColor})`;

    // Gradually decay mouse velocity if no recent movement
    if (Date.now() - lastMoveTime > 100) {
        mouseVelocityX *= decayFactor;
        mouseVelocityY *= decayFactor;
        if (Math.abs(mouseVelocityX) <= 0.01 && Math.abs(mouseVelocityY) <= 0.01) {
            prevPositions = []
        }
    }

    // Use ImageData for direct pixel manipulation
    const imageData = ctx.createImageData(canvas.width, canvas.height);

    particles.forEach(particle => {
        const cellX = Math.min(Math.max(Math.floor(particle.x / cellWidth), 0), gridCols - 1);
        const cellY = Math.min(Math.max(Math.floor(particle.y / cellHeight), 0), gridRows - 1);

        const cellCenterX = (cellX + 0.5) * cellWidth;
        const cellCenterY = (cellY + 0.5) * cellHeight;

        const dx = particle.x - cellCenterX;
        const dy = particle.y - cellCenterY;
        const distanceToCenterSquared = dx * dx + dy * dy;
        const maxDistanceSquared = (cellWidth / 2) ** 2 + (cellHeight / 2) ** 2;
        const influenceFactor = Math.pow(Math.max(0, 1 - distanceToCenterSquared / maxDistanceSquared), 2);

        const { targetVx, targetVy } = directionModifiers[cellY][cellX];
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

        // Apply mouse influence based on proximity to the line segment
        var distanceToMouseLine = 1000;
        if (prevPositions.length > 0) {
            distanceToMouseLine = distanceToLineSegment(
                particle.x,
                particle.y,
                mouseX,
                mouseY,
                prevPositions[0][0],
                prevPositions[0][1]
            );
        }

        if (distanceToMouseLine < mouseInfluenceRadius) {
            // Calculate influence based on distance to the line
            const mouseInfluence = Math.pow(1 - (distanceToMouseLine / mouseInfluenceRadius), 2);

            // Adjust particle velocity based on the mouse velocity and influence factor
            particle.vx += mouseVelocityX * mouseInfluence * mouseInfluenceStrength;
            particle.vy += mouseVelocityY * mouseInfluence * mouseInfluenceStrength;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = canvas.width - 1;
        if (particle.x > canvas.width) particle.x = 1;
        if (particle.y < 0) particle.y = canvas.height - 1;
        if (particle.y > canvas.height) particle.y = 1;

        // Map particle to pixel color in imageData
        const opacity = Math.pow((speed * 1) / maxVelocity, 1);
        const r = Math.floor(currentColor.r * opacity);
        const g = Math.floor(currentColor.g * opacity);
        const b = Math.floor(currentColor.b * opacity);

        // Find particle's pixel location in imageData array
        const pixelIndex = ((Math.floor(particle.y) * canvas.width) + Math.floor(particle.x)) * 4;
        imageData.data[pixelIndex] += r;
        imageData.data[pixelIndex + 1] += g;
        imageData.data[pixelIndex + 2] += b;
        imageData.data[pixelIndex + 3] += opacity * 255; // Full opacity for pixel itself
    });

    // Draw all particles at once using putImageData
    ctx.putImageData(imageData, 0, 0);

    frameCounter++;
    if (frameCounter % frameInterval === 0) {
        updateDirectionModifiers();
    }
    if (is_animation_enabled == true) {
        requestAnimationFrame(animate);
    }
}

// Start the animation loop
animate();
