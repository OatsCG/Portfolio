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

    for (let i = 0, j = 0; i < n; i++, j += 4) {
      data[j] = Math.random() * w;                 // x
      data[j + 1] = Math.random() * h;             // y
      data[j + 2] = (Math.random() - 0.5) * SIM.maxVelocity; // vx
      data[j + 3] = (Math.random() - 0.5) * SIM.maxVelocity; // vy
    }
  }

  function add10k(canvasFrontend, state) {
    const add = 10000;
    const oldN = canvasFrontend.count;
    const newN = oldN + add;

    canvasFrontend.resizeParticles(newN);

    const data = canvasFrontend.particleData;
    const w = canvasFrontend.width;
    const h = canvasFrontend.height;

    for (let i = oldN, j = oldN * 4; i < newN; i++, j += 4) {
      data[j] = Math.random() * w;
      data[j + 1] = Math.random() * h;
      data[j + 2] = 0;
      data[j + 3] = 0;
    }
  }

  function remove10k(canvasFrontend, state) {
    const remove = 10000;
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
