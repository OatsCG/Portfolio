(function () {
  function createParticles(canvasFrontend) {
    const state = {}; // no floatId
    initParticles(canvasFrontend, state, SIM.numParticles);
    return state;
  }

  function initParticles(canvasFrontend, state, n) {
    canvasFrontend.setParticleCount(n);

    const data = canvasFrontend.particleData;
    const w = canvasFrontend.width;
    const h = canvasFrontend.height;

    for (let i = 0, j = 0; i < n; i++, j += 6) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const vx = (Math.random() - 0.5) * SIM.maxVelocity;
      const vy = (Math.random() - 0.5) * SIM.maxVelocity;

      data[j] = x;           // x
      data[j + 1] = y;       // y
      data[j + 2] = vx;      // vx
      data[j + 3] = vy;      // vy
      data[j + 4] = x;       // prevX
      data[j + 5] = y;       // prevY
    }
  }

  function add10k(canvasFrontend, state) {
    const add = 20000;
    const oldN = canvasFrontend.count;
    const newN = oldN + add;

    canvasFrontend.resizeParticles(newN);

    const data = canvasFrontend.particleData;
    const w = canvasFrontend.width;
    const h = canvasFrontend.height;

    for (let i = oldN, j = oldN * 6; i < newN; i++, j += 6) {
      const x = Math.random() * w;
      const y = Math.random() * h;

      data[j] = x;           // x
      data[j + 1] = y;       // y
      data[j + 2] = 0;       // vx
      data[j + 3] = 0;       // vy
      data[j + 4] = x;       // prevX
      data[j + 5] = y;       // prevY
    }
  }

  function remove10k(canvasFrontend, state) {
    const remove = 20000;
    const oldN = canvasFrontend.count;
    if (oldN <= remove) return;

    const newN = oldN - remove;
    canvasFrontend.resizeParticles(newN);
  }

  window.createParticles = createParticles;
  window.initParticles = initParticles;
  window.add10k = add10k;
  window.remove10k = remove10k;
})();

function toggleAnimation(blackout = true) {
  console.log("toggling")
    const canvas = document.getElementById("particleCanvas");

    if (SIM.is_animation_enabled === true) {
      console.log("toggling off")
        // Stop the simulation loop
        if (window.stopSimulation) {
          window.stopSimulation();
        }
        
        if (blackout == true) {
          console.log("blackout")
            canvas.style.animation = "fadeOut 0.5s ease-in forwards";
            canvas.addEventListener('animationend', () => {
                SIM.is_animation_enabled = false;
                console.log("stopped")
                canvas.style.opacity = 0;
            }, {
                once: true
            });
        } else {
            SIM.is_animation_enabled = false;
        }

    } else {
        SIM.is_animation_enabled = true;
        window.resizeCanvas()
        
        // Restart both simulation and rendering
        if (window.startSimulation) {
          window.startSimulation();
        }
        if (window.animate) {
          window.animate();
        }
        // Animate canvas in
        canvas.style.opacity = 1;
        canvas.style.animation = "fadeIn 0.5s ease-in forwards";
    }
}