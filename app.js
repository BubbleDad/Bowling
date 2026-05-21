(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const musicEl = document.getElementById("music");

  const TAU = Math.PI * 2;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const choice = arr => arr[Math.floor(Math.random() * arr.length)];
  const now = () => performance.now() / 1000;
  const ease = t => t * t * (3 - 2 * t);

  const PIN_COLORS = ["#ef4f69", "#ff8833", "#ffd24f", "#68c94a", "#28a7e9", "#875ae2", "#ff6ab8", "#24c9b9"];

  const state = {
    w: 0, h: 0, dpr: 1,
    lane: null,
    started: false,
    audioReady: false,
    audioCtx: null,
    currentLevelPins: 20,
    introStart: 0,
    introUntil: 0,
    celebrationStart: 0,
    celebrationUntil: 0,
    nextLevelAt: 0,
    ball: null,
    ballCategory: "cat",
    pins: [],
    sparkles: [],
    rolling: false,
    rollStartAt: 0,
    rollHitThisTime: false,
    forceAssistNextRoll: false,
    rollSound: null,
    tapPulse: 0,
    lastT: now(),
    paused: false,
    pauseTimer: null,
    pauseBeganAt: 0,
    wasHiddenPaused: false
  };

  function setupCanvas() {
    const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    const cssW = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 360);
    const cssH = Math.max(480, window.innerHeight || document.documentElement.clientHeight || 640);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.w = cssW; state.h = cssH; state.dpr = dpr;
    state.lane = {
      cx: cssW * 0.5,
      topY: cssH * 0.155,
      bottomY: cssH * 0.985,
      topW: cssW * 0.48,
      bottomW: cssW * 1.14,
      railTopW: cssW * 0.82,
      railBottomW: cssW * 1.38,
      deckY: cssH * 0.155
    };
    if (!state.ball) resetBall();
    if (!state.pins.length) newLevel();
  }

  function laneWidthAt(yw) {
    const t = ease(clamp(yw, 0, 1));
    return lerp(state.lane.topW, state.lane.bottomW, t);
  }

  function railWidthAt(yw) {
    const t = ease(clamp(yw, 0, 1));
    return lerp(state.lane.railTopW, state.lane.railBottomW, t);
  }

  function screenY(yw) {
    return lerp(state.lane.topY, state.lane.bottomY, clamp(yw, 0, 1));
  }

  function perspectiveScale(yw) {
    return lerp(0.72, 2.25, ease(clamp(yw, 0, 1)));
  }

  function project(xw, yw) {
    const sy = screenY(yw);
    const width = laneWidthAt(yw);
    return { x: state.lane.cx + (xw - 0.5) * width, y: sy, scale: perspectiveScale(yw), width };
  }

  function unprojectX(clientX, yw) {
    const width = laneWidthAt(yw);
    return clamp(0.5 + (clientX - state.lane.cx) / width, 0.05, 0.95);
  }

  function resetBall() {
    state.ball = {
      x: 0.5,
      y: 0.90,
      vx: 0,
      vy: 0,
      r: 0.054,
      spin: 0
    };
    state.rolling = false;
    stopRollSound();
  }

  function pickBallVariant() {
    // V3: only the selected ball directions: Cat-Faced Option 2 and Yarn Option 3.
    state.ballCategory = Math.random() < 0.52 ? "cat" : "yarn";
  }

  function makePin(x, y, color) {
    return {
      x, y,
      vx: 0, vy: 0,
      r: 0.044,
      color,
      angle: rand(-0.04, 0.04),
      av: 0,
      knocked: false,
      falling: 0,
      hitFlash: 0,
      lastImpactAt: 0
    };
  }

  function newLevel() {
    state.currentLevelPins = randInt(16, 24);
    state.pins = [];
    state.sparkles = [];
    pickBallVariant();

    // Perspective v3: pins are concentrated in the far half of the alley, but spread enough for 16-24 large pins.
    const minX = 0.14, maxX = 0.86;
    const minY = 0.13, maxY = 0.53;
    const minGap = 0.074;
    let attempts = 0;
    while (state.pins.length < state.currentLevelPins && attempts < 5000) {
      attempts++;
      const band = Math.random();
      const y = band < 0.42 ? rand(minY, 0.30) : band < 0.78 ? rand(0.30, 0.43) : rand(0.43, maxY);
      const center = 0.5 + rand(-0.08, 0.08);
      const spread = lerp(0.23, 0.40, clamp((y - minY) / (maxY - minY), 0, 1));
      const x = Math.random() < 0.68 ? center + rand(-spread, spread) : rand(minX, maxX);
      const c = { x: clamp(x, minX, maxX), y };
      let ok = true;
      for (const p of state.pins) {
        const dx = (p.x - c.x) * 1.15;
        const dy = (p.y - c.y);
        if (Math.hypot(dx, dy) < minGap) { ok = false; break; }
      }
      if (ok) state.pins.push(makePin(c.x, c.y, choice(PIN_COLORS)));
    }
    while (state.pins.length < state.currentLevelPins) {
      state.pins.push(makePin(rand(minX, maxX), rand(minY, maxY), choice(PIN_COLORS)));
    }

    resetBall();
    state.introStart = now();
    state.introUntil = state.introStart + 1.4;
    state.celebrationUntil = 0;
    state.nextLevelAt = 0;
    state.forceAssistNextRoll = false;
  }

  function unlockAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !state.audioCtx) state.audioCtx = new AudioContext();
    if (state.audioCtx && state.audioCtx.state === "suspended") state.audioCtx.resume().catch(() => {});
    if (musicEl) {
      musicEl.volume = 0.48;
      const p = musicEl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
    state.audioReady = true;
  }

  function playTone({ type = "sine", freq = 440, endFreq = null, duration = 0.12, volume = 0.08, attack = 0.005 }) {
    const ac = state.audioCtx;
    if (!ac || state.paused) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t0); osc.stop(t0 + duration + 0.03);
  }

  function playWallBounce() {
    playTone({ type: "triangle", freq: 240, endFreq: 150, duration: 0.10, volume: 0.08 });
    setTimeout(() => playTone({ type: "sine", freq: 560, endFreq: 380, duration: 0.07, volume: 0.05 }), 9);
  }

  function playPinFall(strong = false) {
    playTone({ type: "triangle", freq: strong ? 480 : 380, endFreq: strong ? 150 : 190, duration: strong ? 0.18 : 0.13, volume: strong ? 0.12 : 0.08 });
    setTimeout(() => playTone({ type: "square", freq: 110, endFreq: 75, duration: 0.05, volume: 0.018 }), 25);
  }

  function playMeow() {
    playTone({ type: "sine", freq: 520, endFreq: 860, duration: 0.16, volume: 0.12 });
    setTimeout(() => playTone({ type: "triangle", freq: 860, endFreq: 430, duration: 0.34, volume: 0.13 }), 150);
  }

  function startRollSound() {
    if (!state.audioCtx || state.rollSound || state.paused) return;
    const ac = state.audioCtx;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 80;
    gain.gain.value = 0.0001;
    osc.connect(gain); gain.connect(ac.destination);
    osc.start();
    state.rollSound = { osc, gain };
  }

  function updateRollSound() {
    if (!state.rollSound || !state.ball || !state.audioCtx) return;
    const speed = Math.hypot(state.ball.vx, state.ball.vy);
    state.rollSound.gain.gain.setTargetAtTime(clamp(speed * 0.11, 0, 0.06), state.audioCtx.currentTime, 0.025);
    state.rollSound.osc.frequency.setTargetAtTime(60 + speed * 55, state.audioCtx.currentTime, 0.035);
  }

  function stopRollSound() {
    if (!state.rollSound) return;
    const { osc, gain } = state.rollSound;
    if (state.audioCtx) gain.gain.setTargetAtTime(0.0001, state.audioCtx.currentTime, 0.02);
    setTimeout(() => { try { osc.stop(); } catch (e) {} }, 80);
    state.rollSound = null;
  }

  function targetForTap(clientX) {
    const standing = state.pins.filter(p => !p.knocked);
    if (!standing.length) return { x: 0.5, y: 0.24 };
    const aimX = unprojectX(clientX, 0.50);
    const sorted = standing.map(p => ({ p, d: Math.abs(p.x - aimX) + Math.abs(p.y - 0.34) * 0.20 })).sort((a, b) => a.d - b.d);
    // Clearly closest single pin gets the assist.
    if (sorted.length === 1 || sorted[0].d + 0.055 < sorted[1].d) return { x: sorted[0].p.x, y: sorted[0].p.y };
    // Otherwise target a useful mini-cluster.
    const near = sorted.slice(0, Math.min(5, sorted.length)).map(o => o.p);
    let cx = 0, cy = 0;
    near.forEach(p => { cx += p.x; cy += p.y; });
    cx /= near.length; cy /= near.length;
    cx = lerp(cx, aimX, state.forceAssistNextRoll ? 0.10 : 0.22);
    return { x: clamp(cx, 0.08, 0.92), y: cy };
  }

  function launchBall(clientX) {
    if (state.paused) return;
    pickBallVariant();
    resetBall();
    const target = targetForTap(clientX);
    const b = state.ball;
    const dx = target.x - b.x;
    const dy = target.y - b.y;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    const time = state.forceAssistNextRoll ? rand(1.20, 1.50) : rand(1.35, 1.75);
    const speed = clamp(len / time, 0.48, 0.76);
    const tapX = unprojectX(clientX, 0.78);
    const nudge = state.forceAssistNextRoll ? 0 : (tapX - 0.5) * 0.055;
    b.vx = (dx / len) * speed + nudge;
    b.vy = (dy / len) * speed;
    // Always give forward force toward the pins.
    b.vy = Math.min(b.vy, -0.48);
    b.spin = rand(-1.8, 1.8);
    state.rolling = true;
    state.rollStartAt = now();
    state.rollHitThisTime = false;
    startRollSound();
  }

  function handleTap(clientX, clientY) {
    if (state.paused) {
      resumeGame();
      return;
    }
    unlockAudio();
    if (!state.started) {
      state.started = true;
      launchBall(clientX);
      return;
    }
    if (state.celebrationUntil > now() || state.nextLevelAt > now()) return;
    if (!state.rolling) launchBall(clientX);
  }

  function update(dt) {
    if (state.paused) return;
    const t = now();
    state.tapPulse += dt;
    for (let i = state.sparkles.length - 1; i >= 0; i--) {
      const sp = state.sparkles[i];
      sp.life -= dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.rot += sp.vr * dt;
      if (sp.life <= 0) state.sparkles.splice(i, 1);
    }
    if (state.nextLevelAt && t >= state.nextLevelAt) { state.nextLevelAt = 0; newLevel(); }
    updateBall(dt);
    updatePins(dt);
    updatePinCollisions();
    updateRollSound();

    if (state.rolling) {
      const spd = Math.hypot(state.ball.vx, state.ball.vy);
      const inAction = t - state.rollStartAt;
      const tooLong = inAction > 5.2;
      const exited = state.ball.y < 0.02;
      const stopped = inAction > 1.2 && spd < 0.055;
      if (tooLong || exited || stopped) finishRoll();
    }

    if (state.started && !state.pins.some(p => !p.knocked) && !state.nextLevelAt && state.celebrationUntil < t) {
      const moving = state.pins.some(p => Math.hypot(p.vx, p.vy) > 0.045);
      if (!moving || t - Math.max(...state.pins.map(p => p.lastImpactAt || 0)) > 0.55) startCelebration();
    }
  }

  function updateBall(dt) {
    const b = state.ball;
    if (!b || !state.rolling) return;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.spin += b.vx * 8.5 * dt;

    // Low friction while traveling toward pins; enough force to reach the far end.
    b.vx *= Math.pow(0.992, dt * 60);
    b.vy *= Math.pow(0.996, dt * 60);
    if (b.y > 0.46 && b.vy > -0.44) b.vy = -0.44;

    // Soft bumpers, no gutters.
    const left = 0.035 + b.r * 0.65;
    const right = 0.965 - b.r * 0.65;
    if (b.x < left) {
      b.x = left;
      b.vx = Math.abs(b.vx) * 0.88 + 0.055;
      b.vy = -Math.max(Math.abs(b.vy) * 0.96, 0.38);
      playWallBounce(); addSparklesForWorld(b.x, b.y, 5, "#ffe36a", 0.22);
    } else if (b.x > right) {
      b.x = right;
      b.vx = -Math.abs(b.vx) * 0.88 - 0.055;
      b.vy = -Math.max(Math.abs(b.vy) * 0.96, 0.38);
      playWallBounce(); addSparklesForWorld(b.x, b.y, 5, "#ffe36a", 0.22);
    }

    for (const p of state.pins) {
      const hitR = b.r * 0.80 + p.r * 1.05;
      const dx = p.x - b.x, dy = p.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < hitR) {
        const nx = dx / d, ny = dy / d;
        const impact = Math.max(0.36, Math.hypot(b.vx, b.vy) * 0.95);
        p.vx += nx * impact * 0.86 + rand(-0.12, 0.12);
        p.vy += ny * impact * 0.86 + rand(-0.09, 0.09);
        p.av += rand(-7, 7);
        knockPin(p, true);
        b.vx -= nx * impact * 0.12;
        b.vy -= ny * impact * 0.08;
        if (b.y > 0.40 && b.vy > -0.34) b.vy = -0.34;
        state.rollHitThisTime = true;
        state.forceAssistNextRoll = false;
      }
    }
  }

  function updatePins(dt) {
    for (const p of state.pins) {
      p.hitFlash = Math.max(0, p.hitFlash - dt * 3.0);
      if (p.knocked && p.falling < 1) p.falling = clamp(p.falling + dt * 5.2, 0, 1);
      if (p.knocked) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.av * dt;
        p.vx *= Math.pow(0.955, dt * 60);
        p.vy *= Math.pow(0.955, dt * 60);
        p.av *= Math.pow(0.940, dt * 60);
        if (p.x < 0.045) { p.x = 0.045; p.vx = Math.abs(p.vx) * 0.50; }
        if (p.x > 0.955) { p.x = 0.955; p.vx = -Math.abs(p.vx) * 0.50; }
        if (p.y < 0.060) { p.y = 0.060; p.vy = Math.abs(p.vy) * 0.45; }
        if (p.y > 0.700) { p.y = 0.700; p.vy = -Math.abs(p.vy) * 0.35; }
      } else {
        p.angle += Math.sin(now() * 2.3 + p.x * 23) * 0.0005;
      }
    }
  }

  function updatePinCollisions() {
    const pins = state.pins;
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const a = pins[i], b = pins[j];
        const ar = a.knocked ? a.r * 1.45 : a.r * 0.92;
        const br = b.knocked ? b.r * 1.45 : b.r * 0.92;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const minD = ar + br;
        if (d > 0 && d < minD) {
          const nx = dx / d, ny = dy / d;
          const push = (minD - d) * 0.52;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
          const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          const impact = Math.max(0.05, Math.abs(rel));
          if (impact > 0.05 || a.knocked || b.knocked) {
            a.vx -= nx * impact * 0.35; a.vy -= ny * impact * 0.35;
            b.vx += nx * impact * 0.35; b.vy += ny * impact * 0.35;
            a.av += rand(-2.6, 2.6); b.av += rand(-2.6, 2.6);
            // V3: downed pins sweep into upright pins and knock them down.
            if (a.knocked && !b.knocked && Math.hypot(a.vx, a.vy) > 0.018) knockPin(b, false);
            if (b.knocked && !a.knocked && Math.hypot(b.vx, b.vy) > 0.018) knockPin(a, false);
          }
        }
      }
    }
  }

  function knockPin(p, fromBall) {
    const t = now();
    if (!p.knocked) {
      p.knocked = true;
      p.falling = 0;
      p.angle = rand(-0.85, 0.85);
      p.hitFlash = 1;
      p.lastImpactAt = t;
      if (Math.hypot(p.vx, p.vy) < 0.09) {
        p.vx += rand(-0.14, 0.14); p.vy += rand(-0.12, 0.18);
      }
      playPinFall(fromBall);
      addSparklesForWorld(p.x, p.y, fromBall ? 9 : 5, p.color, 0.42);
    } else {
      p.hitFlash = Math.max(p.hitFlash, 0.35);
      p.lastImpactAt = t;
    }
  }

  function finishRoll() {
    state.rolling = false;
    stopRollSound();
    if (!state.rollHitThisTime && state.pins.some(p => !p.knocked)) state.forceAssistNextRoll = true;
    resetBall();
  }

  function startCelebration() {
    const t = now();
    state.celebrationStart = t;
    state.celebrationUntil = t + 2.0;
    state.nextLevelAt = t + 2.08;
    state.rolling = false;
    stopRollSound();
    playMeow();
    addSparklesForWorld(0.5, 0.42, 40, "#ffe36a", 1.05);
    addSparklesForWorld(0.5, 0.42, 26, "#ff8bd1", 1.0);
  }

  function addSparklesForWorld(xw, yw, count, color, life = 0.7) {
    const p = project(xw, yw);
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU), spd = rand(22, 150);
      state.sparkles.push({ x: p.x + rand(-8, 8), y: p.y + rand(-8, 8), vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: rand(life * 0.55, life), maxLife: life, size: rand(2.5, 7), color, rot: rand(0, TAU), vr: rand(-4, 4) });
    }
  }

  function pauseGame() {
    if (state.paused) return;
    state.paused = true;
    state.pauseBeganAt = now();
    state.wasHiddenPaused = true;
    if (musicEl) musicEl.pause();
    stopRollSound();
  }

  function resumeGame() {
    if (!state.paused) return;
    unlockAudio();
    state.paused = false;
    state.wasHiddenPaused = false;
    state.lastT = now();
    if (state.rolling) startRollSound();
  }

  function scheduleVisibilityPause() {
    if (state.pauseTimer) clearTimeout(state.pauseTimer);
    state.pauseTimer = setTimeout(() => {
      state.pauseTimer = null;
      if (document.hidden) pauseGame();
    }, 500);
  }

  function cancelVisibilityPause() {
    if (state.pauseTimer) { clearTimeout(state.pauseTimer); state.pauseTimer = null; }
  }

  function roundedRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, state.w, state.h);
    drawBackground();
    drawAlley();

    const objects = [];
    for (const p of state.pins) objects.push({ type: "pin", obj: p, y: p.y });
    if (state.ball) objects.push({ type: "ball", obj: state.ball, y: state.ball.y });
    objects.sort((a, b) => a.y - b.y);
    for (const o of objects) {
      if (o.type === "pin") drawPin(o.obj);
      else drawBall();
    }

    drawGuides();
    drawSparkles();
    drawIntroStartAndBadges();
    drawCelebration();
    if (state.paused) drawPauseOverlay();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, state.h);
    g.addColorStop(0, "#101240"); g.addColorStop(0.42, "#412487"); g.addColorStop(1, "#180f36");
    ctx.fillStyle = g; ctx.fillRect(0, 0, state.w, state.h);
    ctx.save();
    ctx.globalAlpha = 0.65;
    drawMoon(state.w * 0.12, state.h * 0.075, Math.min(35, state.w * 0.09));
    for (let i = 0; i < 30; i++) {
      const x = (i * 83 + 47) % state.w;
      const y = (i * 127 + 31) % (state.h * 0.45);
      drawStar(x, y, 2 + (i % 4), i % 3 ? "#fff2a8" : "#ff9fe4", 0.55);
    }
    ctx.restore();
  }

  function drawAlley() {
    const L = state.lane;
    const topY = L.topY, bottomY = L.bottomY;
    const topW = L.topW, bottomW = L.bottomW;
    const railTop = L.railTopW, railBottom = L.railBottomW;
    const cx = L.cx;

    // Back wall / pin deck arch.
    ctx.save();
    const archW = state.w * 0.86;
    const archH = state.h * 0.15;
    roundedRect(ctx, cx - archW / 2, topY - archH * 0.78, archW, archH, 28);
    const archGrad = ctx.createLinearGradient(0, topY - archH, 0, topY + 40);
    archGrad.addColorStop(0, "#9259e4"); archGrad.addColorStop(1, "#4f239a");
    ctx.fillStyle = archGrad; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,208,255,.45)"; ctx.stroke();
    ctx.fillStyle = "#ffd65b";
    ctx.font = `900 ${clamp(state.w * 0.105, 32, 50)}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 5; ctx.strokeStyle = "#4a157d";
    ctx.strokeText("MEOWMOON", cx, topY - archH * 0.40);
    ctx.fillText("MEOWMOON", cx, topY - archH * 0.40);
    ctx.font = `900 ${clamp(state.w * 0.060, 20, 30)}px system-ui, sans-serif`;
    ctx.fillStyle = "#95eaff"; ctx.strokeText("BOWLING", cx, topY - archH * 0.08); ctx.fillText("BOWLING", cx, topY - archH * 0.08);

    // Black deck opening behind pins.
    roundedRect(ctx, cx - topW * 0.66, topY - 7, topW * 1.32, state.h * 0.075, 12);
    ctx.fillStyle = "#0b0920"; ctx.fill();
    ctx.restore();

    // Rails as trapezoids.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - railTop / 2, topY);
    ctx.lineTo(cx - topW / 2, topY);
    ctx.lineTo(cx - bottomW / 2, bottomY);
    ctx.lineTo(cx - railBottom / 2, bottomY);
    ctx.closePath();
    const rg = ctx.createLinearGradient(0, topY, 0, bottomY);
    rg.addColorStop(0, "#8b50da"); rg.addColorStop(1, "#5d2bad");
    ctx.fillStyle = rg; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + topW / 2, topY);
    ctx.lineTo(cx + railTop / 2, topY);
    ctx.lineTo(cx + railBottom / 2, bottomY);
    ctx.lineTo(cx + bottomW / 2, bottomY);
    ctx.closePath();
    ctx.fill();

    // Lane trapezoid.
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, topY);
    ctx.lineTo(cx + topW / 2, topY);
    ctx.lineTo(cx + bottomW / 2, bottomY);
    ctx.lineTo(cx - bottomW / 2, bottomY);
    ctx.closePath();
    const wood = ctx.createLinearGradient(0, topY, 0, bottomY);
    wood.addColorStop(0, "#ffd982"); wood.addColorStop(0.42, "#f4b34d"); wood.addColorStop(1, "#ffe0a0");
    ctx.fillStyle = wood; ctx.fill();

    // Wood planks converge in perspective.
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#834817";
    for (let i = 1; i < 11; i++) {
      const xTop = cx - topW / 2 + topW * i / 11;
      const xBot = cx - bottomW / 2 + bottomW * i / 11;
      ctx.beginPath(); ctx.moveTo(xTop, topY); ctx.lineTo(xBot, bottomY); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Side rail lights.
    for (let yw = 0.12; yw < 0.95; yw += 0.16) {
      const y = screenY(yw); const lw = laneWidthAt(yw); const rw = railWidthAt(yw);
      drawStar(cx - (lw / 2 + (rw - lw) * 0.25), y, 7, "#ffe36a", 0.75);
      drawStar(cx + (lw / 2 + (rw - lw) * 0.25), y, 7, "#ffe36a", 0.75);
    }
    ctx.restore();
  }

  function drawMoon(x, y, r) {
    ctx.save();
    ctx.fillStyle = "#ffdf68"; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(x + r * 0.36, y - r * 0.12, r * 0.92, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255,240,160,.4)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function drawGuides() {
    if (!state.ball || state.rolling || state.celebrationUntil > now() || state.paused) return;
    const b = state.ball;
    ctx.save(); ctx.globalAlpha = state.started ? 0.28 : 0.44;
    for (let i = 1; i <= 8; i++) {
      const yw = lerp(b.y - 0.05, 0.55, i / 9);
      const p = project(b.x, yw);
      drawCircle(p.x, p.y, Math.max(2, 6 * (1 - i / 11)), "#fff5ca");
    }
    ctx.restore();
  }

  function drawPin(p) {
    const pr = project(p.x, p.y);
    const base = clamp(state.w * 0.060 * pr.scale, 20, 54);
    ctx.save();
    ctx.translate(pr.x, pr.y);
    const fall = p.falling;
    const rot = p.angle + fall * Math.PI * 0.5;
    ctx.rotate(rot);
    ctx.shadowColor = "rgba(40, 20, 10, .35)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = base * 0.25;

    if (fall < 0.55) {
      // Upright pin, very large and readable.
      ctx.fillStyle = p.color;
      ctx.strokeStyle = "rgba(50,20,60,.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, base * 0.10, base * 0.46, base * 0.93, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -base * 0.72, base * 0.34, base * 0.38, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#fff9ee"; ctx.lineWidth = Math.max(3, base * 0.11);
      ctx.beginPath(); ctx.moveTo(-base * 0.34, -base * 0.52); ctx.lineTo(base * 0.34, -base * 0.52); ctx.stroke();
      ctx.globalAlpha = 0.32; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-base * 0.18, -base * 0.08, base * 0.12, base * 0.58, -0.2, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    } else {
      // Downed pin is unmistakably horizontal.
      ctx.fillStyle = p.color;
      ctx.strokeStyle = "rgba(50,20,60,.32)"; ctx.lineWidth = 1.5;
      roundedRect(ctx, -base * 0.95, -base * 0.28, base * 1.85, base * 0.56, base * 0.26); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(base * 0.88, 0, base * 0.33, base * 0.34, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#fff9ee"; ctx.lineWidth = Math.max(3, base * 0.10);
      ctx.beginPath(); ctx.moveTo(base * 0.40, -base * 0.26); ctx.lineTo(base * 0.40, base * 0.26); ctx.stroke();
    }
    if (p.hitFlash > 0) {
      ctx.globalAlpha = p.hitFlash * 0.35; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(0, 0, base * 0.75, base, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawBall() {
    const b = state.ball;
    const pr = project(b.x, b.y);
    const r = clamp(state.w * 0.085 * pr.scale, 34, 98);
    ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(b.spin);
    if (!state.rolling && !state.paused) {
      ctx.save(); ctx.rotate(-b.spin); ctx.globalAlpha = 0.42 + Math.sin(state.tapPulse * 3) * 0.08;
      ctx.strokeStyle = "#fff6cf"; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, r * 0.08, r * 1.24, r * 0.75, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (state.ballCategory === "cat") drawTuxedoCatBall(r); else drawRainbowYarnBall(r);
    ctx.restore();
  }

  function drawTuxedoCatBall(r) {
    // Cat-faced option 2: tuxedo cat.
    ctx.fillStyle = "#101018";
    ctx.beginPath(); ctx.moveTo(-r * .70, -r * .50); ctx.lineTo(-r * .42, -r * 1.05); ctx.lineTo(-r * .14, -r * .54); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r * .70, -r * .50); ctx.lineTo(r * .42, -r * 1.05); ctx.lineTo(r * .14, -r * .54); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ff93b5";
    ctx.beginPath(); ctx.moveTo(-r * .50, -r * .60); ctx.lineTo(-r * .40, -r * .84); ctx.lineTo(-r * .28, -r * .58); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r * .50, -r * .60); ctx.lineTo(r * .40, -r * .84); ctx.lineTo(r * .28, -r * .58); ctx.closePath(); ctx.fill();
    const g = ctx.createRadialGradient(-r * .28, -r * .34, r * .16, 0, 0, r);
    g.addColorStop(0, "#34343f"); g.addColorStop(1, "#050509");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 2; ctx.stroke();
    // White tuxedo face patch.
    ctx.fillStyle = "#fff8ec";
    ctx.beginPath();
    ctx.moveTo(-r * .56, -r * .18);
    ctx.quadraticCurveTo(-r * .32, -r * .42, 0, -r * .28);
    ctx.quadraticCurveTo(r * .32, -r * .42, r * .56, -r * .18);
    ctx.quadraticCurveTo(r * .42, r * .62, 0, r * .78);
    ctx.quadraticCurveTo(-r * .42, r * .62, -r * .56, -r * .18);
    ctx.fill();
    // Finger holes
    drawCircle(-r * .18, -r * .62, r * .14, "rgba(0,0,0,.72)");
    drawCircle(r * .16, -r * .62, r * .14, "rgba(0,0,0,.72)");
    drawCircle(0, -r * .36, r * .13, "rgba(0,0,0,.72)");
    // Face
    drawCircle(-r * .30, -r * .06, r * .12, "#1c1523"); drawCircle(r * .30, -r * .06, r * .12, "#1c1523");
    drawCircle(-r * .34, -r * .11, r * .035, "#fff"); drawCircle(r * .26, -r * .11, r * .035, "#fff");
    ctx.fillStyle = "#ff6f9b"; ctx.beginPath(); ctx.arc(0, r * .14, r * .07, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#251729"; ctx.lineWidth = Math.max(2, r * .035); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-r * .12, r * .28); ctx.quadraticCurveTo(0, r * .38, r * .12, r * .28); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * r * .18, r * .12); ctx.lineTo(side * r * .62, r * .03); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(side * r * .19, r * .22); ctx.lineTo(side * r * .60, r * .25); ctx.stroke();
    }
    ctx.globalAlpha = 0.18; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-r * .28, -r * .36, r * .18, r * .48, -.55, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }

  function drawRainbowYarnBall(r) {
    // Yarn ball option 3: rainbow yarn, dense overlapping strands.
    ctx.save();
    const grad = ctx.createRadialGradient(-r * .35, -r * .35, r * .12, 0, 0, r);
    grad.addColorStop(0, "#43d6ff"); grad.addColorStop(.18, "#2ba8e8"); grad.addColorStop(.36, "#42c76a"); grad.addColorStop(.54, "#ffd23b"); grad.addColorStop(.72, "#ff7f29"); grad.addColorStop(1, "#d327a6");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.clip();
    const colors = ["#ff3da8", "#7e4df2", "#1ea5ef", "#21c66b", "#ffd23b", "#ff7f29", "#e92962"];
    ctx.lineCap = "round";
    for (let k = 0; k < 34; k++) {
      ctx.save(); ctx.rotate((k / 34) * Math.PI + (k % 5) * 0.12);
      ctx.strokeStyle = colors[k % colors.length];
      ctx.lineWidth = Math.max(3.2, r * rand(0.055, 0.085));
      ctx.globalAlpha = 0.85;
      const yy = rand(-r * .75, r * .75);
      ctx.beginPath(); ctx.ellipse(0, yy, r * rand(.82, 1.14), r * rand(.13, .25), rand(-0.1, 0.1), 0, TAU); ctx.stroke();
      ctx.restore();
    }
    // Fine fibers.
    ctx.globalAlpha = 0.22; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1;
    for (let i = 0; i < 52; i++) {
      const a = rand(0, TAU); const rr = rand(0, r * .95);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); ctx.lineTo(Math.cos(a + .4) * (rr + rand(4, 15)), Math.sin(a + .4) * (rr + rand(4, 15))); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(25,10,35,.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    drawCircle(-r * .22, -r * .48, r * .13, "#05020a");
    drawCircle(r * .18, -r * .42, r * .13, "#05020a");
    drawCircle(-r * .02, -r * .16, r * .14, "#05020a");
  }

  function drawIntroStartAndBadges() {
    const t = now();
    if (!state.started) {
      drawBigText("Tap to Play!", state.w * .5, state.h * .45, clamp(state.w * .12, 38, 60));
      drawLevelBadge(`${state.currentLevelPins} Pin Level!`, state.w * .5, state.h * .53, 1);
    } else if (t < state.introUntil) {
      const alpha = clamp((state.introUntil - t) / (state.introUntil - state.introStart), 0, 1);
      drawLevelBadge(`${state.currentLevelPins} Pin Level!`, state.w * .5, state.h * .25 - (1 - alpha) * 18, alpha);
    }
  }

  function drawCelebration() {
    const t = now(); if (t > state.celebrationUntil) return;
    const progress = clamp((t - state.celebrationStart) / 2, 0, 1);
    const alpha = progress < .16 ? progress / .16 : progress > .84 ? (1 - progress) / .16 : 1;
    ctx.save(); ctx.globalAlpha = alpha;
    drawBigText("Meow!", state.w * .5, state.h * .41, clamp(state.w * .18, 60, 92));
    drawPauseMascot(state.w * .72, state.h * .54, clamp(state.w * .0016, .58, .78), true);
    ctx.restore();
  }

  function drawPauseOverlay() {
    ctx.save();
    ctx.fillStyle = "rgba(12, 8, 31, .58)"; ctx.fillRect(0, 0, state.w, state.h);
    const boxW = state.w * .86;
    const boxH = Math.min(state.h * .36, 270);
    const x = state.w * .5 - boxW / 2;
    const y = state.h * .27;
    roundedRect(ctx, x, y, boxW, boxH, 22);
    ctx.fillStyle = "rgba(80, 43, 150, .92)"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255, 236, 165, .80)"; ctx.stroke();
    ctx.fillStyle = "#fff8ff";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `900 ${clamp(state.w * .052, 18, 25)}px system-ui, sans-serif`;
    wrapText("The game is paused. Meowmoon wants to play with you again soon", state.w * .5, y + boxH * .30, boxW * .78, clamp(state.w * .075, 28, 38));
    drawPauseMascot(state.w * .5, y + boxH * .78, clamp(state.w * .0020, .65, .92), false);
    ctx.restore();
  }

  function drawPauseMascot(x, y, scale, mini) {
    const s = 92 * scale;
    ctx.save(); ctx.translate(x, y);
    // Tail
    ctx.fillStyle = "#f6a13d"; ctx.strokeStyle = "rgba(80,37,38,.28)"; ctx.lineWidth = 2;
    ctx.save(); ctx.rotate(-0.75); ctx.beginPath(); ctx.ellipse(-s*.48, s*.16, s*.18, s*.47, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    // Body
    ctx.beginPath(); ctx.ellipse(0, s*.24, s*.33, s*.42, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff2d4"; ctx.beginPath(); ctx.ellipse(0, s*.28, s*.18, s*.26, 0, 0, TAU); ctx.fill();
    // Head
    ctx.fillStyle = "#f6a13d"; ctx.beginPath(); ctx.arc(0, -s*.24, s*.38, 0, TAU); ctx.fill(); ctx.stroke();
    // Ears
    ctx.beginPath(); ctx.moveTo(-s*.27, -s*.48); ctx.lineTo(-s*.13, -s*.82); ctx.lineTo(s*.01, -s*.50); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s*.27, -s*.48); ctx.lineTo(s*.13, -s*.82); ctx.lineTo(-s*.01, -s*.50); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffc1cf"; ctx.beginPath(); ctx.moveTo(-s*.19, -s*.52); ctx.lineTo(-s*.13, -s*.70); ctx.lineTo(-s*.05, -s*.52); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s*.19, -s*.52); ctx.lineTo(s*.13, -s*.70); ctx.lineTo(s*.05, -s*.52); ctx.closePath(); ctx.fill();
    // Face
    ctx.fillStyle = "#fff2d4"; ctx.beginPath(); ctx.ellipse(-s*.04, -s*.18, s*.24, s*.18, 0, 0, TAU); ctx.fill();
    drawCircle(-s*.12, -s*.28, s*.04, "#2a2141"); drawCircle(s*.12, -s*.28, s*.04, "#2a2141");
    ctx.fillStyle = "#ff6e96"; ctx.beginPath(); ctx.arc(0, -s*.18, s*.035, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#2a2141"; ctx.lineWidth = Math.max(2, s*.028); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-s*.08, -s*.07); ctx.quadraticCurveTo(0, -s*.01, s*.08, -s*.07); ctx.stroke();
    // Both paws held up.
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * s*.34, -s*.08); ctx.rotate(side * .34);
      ctx.fillStyle = "#f6a13d"; ctx.beginPath(); ctx.ellipse(0, 0, s*.105, s*.20, 0, 0, TAU); ctx.fill(); ctx.stroke();
      drawPaw(0, -s*.02, s*.07, "#ffc1cf"); ctx.restore();
    }
    // feet
    ctx.fillStyle = "#f6a13d"; ctx.beginPath(); ctx.ellipse(-s*.16, s*.66, s*.12, s*.065, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(s*.16, s*.66, s*.12, s*.065, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawSparkles() {
    ctx.save();
    for (const sp of state.sparkles) {
      const alpha = clamp(sp.life / sp.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      drawStar(sp.x, sp.y, sp.size, sp.color, alpha);
    }
    ctx.restore();
  }

  function drawBigText(text, x, y, size) {
    ctx.save();
    ctx.font = `900 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(7, size*.18); ctx.strokeStyle = "#5b23a7"; ctx.strokeText(text, x, y);
    ctx.lineWidth = Math.max(3, size*.07); ctx.strokeStyle = "#ffb7ff"; ctx.strokeText(text, x, y);
    ctx.fillStyle = "#fff8ff"; ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawLevelBadge(text, x, y, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    const w = clamp(state.w*.58, 205, 305); const h = clamp(state.w*.115, 38, 50);
    roundedRect(ctx, x - w/2, y - h/2, w, h, h*.32); ctx.fillStyle = "#7746cf"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#fff0a6"; ctx.stroke();
    drawStar(x - w*.41, y, h*.22, "#ffe36a", 1); drawStar(x + w*.41, y, h*.22, "#ffe36a", 1);
    ctx.font = `900 ${clamp(state.w*.062, 22, 31)}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 5; ctx.strokeStyle = "#4b1c91"; ctx.strokeText(text, x, y + 1); ctx.fillStyle = "#fff8ff"; ctx.fillText(text, x, y + 1);
    ctx.restore();
  }

  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(" "); let line = ""; let lines = [];
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    }
    if (line) lines.push(line);
    const startY = y - (lines.length - 1) * lineHeight / 2;
    lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lineHeight));
  }

  function drawCircle(x, y, r, fill, stroke = null) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, r*.15); ctx.stroke(); }
  }

  function drawPaw(x, y, r, color) {
    ctx.fillStyle = color;
    drawCircle(x, y + r*.24, r*.50, color);
    drawCircle(x - r*.47, y - r*.26, r*.25, color);
    drawCircle(x, y - r*.40, r*.27, color);
    drawCircle(x + r*.47, y - r*.26, r*.25, color);
  }

  function drawStar(x, y, r, color, alpha = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate((x+y)*.01 + now()*.35); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r : r*.46;
      const a = -Math.PI/2 + i*Math.PI/5;
      const px = Math.cos(a)*rr, py = Math.sin(a)*rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function loop() {
    const t = now();
    const dt = clamp(t - state.lastT, 0, 1/20);
    state.lastT = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function pointerHandler(e) {
    e.preventDefault();
    const p = e.changedTouches ? e.changedTouches[0] : e;
    handleTap(p.clientX, p.clientY);
  }

  window.addEventListener("resize", setupCanvas, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(setupCanvas, 120), { passive: true });
  canvas.addEventListener("pointerdown", pointerHandler, { passive: false });
  canvas.addEventListener("touchstart", pointerHandler, { passive: false });
  window.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      if (state.paused) resumeGame();
      else handleTap(state.w * .5, state.h * .42);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) scheduleVisibilityPause();
    else cancelVisibilityPause();
  });
  window.addEventListener("pagehide", scheduleVisibilityPause);
  window.addEventListener("blur", scheduleVisibilityPause);
  window.addEventListener("focus", cancelVisibilityPause);

  setupCanvas();
  requestAnimationFrame(loop);
})();
