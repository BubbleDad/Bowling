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
  const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const dist2 = (a, b) => {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy;
  };
  const now = () => performance.now() / 1000;

  const state = {
    w: 0,
    h: 0,
    dpr: 1,
    lane: null,
    started: false,
    audioReady: false,
    audioCtx: null,
    currentLevelPins: 20,
    introUntil: 0,
    introStart: 0,
    celebrationUntil: 0,
    celebrationStart: 0,
    nextLevelAt: 0,
    rolling: false,
    rollStartAt: 0,
    lastRollHit: true,
    forceAssistNextRoll: false,
    ball: null,
    ballSeed: 1,
    ballCategory: "cat",
    ballVariant: {},
    pins: [],
    sparkles: [],
    stars: [],
    tapHintPulse: 0,
    lastT: now(),
    rollSound: null,
    levelJustLoadedAt: 0
  };

  const PIN_COLORS = [
    "#ed4b63", "#ff7c2f", "#ffbd3b", "#52bf3e", "#1fa7e8",
    "#7d55df", "#f05bb5", "#21bebc", "#d94a38", "#7bd33b"
  ];

  function setupCanvas() {
    const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    const cssW = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 360);
    const cssH = Math.max(480, window.innerHeight || document.documentElement.clientHeight || 640);

    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.w = cssW;
    state.h = cssH;
    state.dpr = dpr;

    const safeTop = 10;
    const safeBottom = 8;
    const railW = clamp(cssW * 0.075, 22, 42);
    state.lane = {
      x: railW * 0.72,
      y: safeTop,
      w: cssW - railW * 1.44,
      h: cssH - safeTop - safeBottom,
      railW
    };

    if (!state.ball) resetBall();
    if (!state.pins.length) newLevel();
    else keepObjectsInsideLane();
  }

  function keepObjectsInsideLane() {
    const lane = state.lane;
    for (const p of state.pins) {
      p.x = clamp(p.x, lane.x + p.r + 4, lane.x + lane.w - p.r - 4);
      p.y = clamp(p.y, lane.y + p.r + 4, lane.y + lane.h - p.r - 4);
    }
    resetBall();
  }

  function laneScale() {
    return Math.min(state.w / 390, state.h / 760);
  }

  function resetBall() {
    if (!state.lane) return;
    const s = laneScale();
    const r = clamp(state.w * 0.08, 25, 38);
    state.ball = {
      x: state.lane.x + state.lane.w * 0.5,
      y: state.lane.y + state.lane.h - clamp(82 * s, 66, 104),
      vx: 0,
      vy: 0,
      r,
      spin: 0
    };
    state.rolling = false;
    stopRollSound();
  }

  function pickBallVariant() {
    const category = choice(["cat", "toy", "yarn"]);
    let variant;
    if (category === "cat") {
      variant = {
        base: choice(["#8c5ae6", "#f8f2e8", "#f7a43a", "#73c7ff"]),
        patch: choice(["#5a3da3", "#33364a", "#ff9f2f", "#ffffff"]),
        ear: choice(["#ff8ab3", "#ffa6bd", "#ffd1dc"]),
        face: "#27213b"
      };
    } else if (category === "toy") {
      variant = {
        base: choice(["#2f8cf0", "#7d55df", "#ff7c2f", "#21bebc", "#f05bb5"]),
        deco: choice(["stars", "dots", "paw"]),
        accent: choice(["#ffe36a", "#ffffff", "#ff9fd0"])
      };
    } else {
      variant = {
        base: choice(["#ff77b7", "#68c3ff", "#ffb24a", "#a476ff", "#7ee075"]),
        accent: choice(["#ffd2e8", "#ffffff", "#ffc1da", "#ffeeaa"]),
        face: "#2a2141"
      };
    }
    state.ballCategory = category;
    state.ballVariant = variant;
    state.ballSeed++;
  }

  function newLevel() {
    state.currentLevelPins = randInt(16, 24);
    state.pins = [];
    state.sparkles = [];
    state.stars = [];
    pickBallVariant();

    const lane = state.lane;
    const s = laneScale();
    const pinR = clamp(state.w * 0.035, 13, 19);
    const minGap = pinR * 2.35;
    const minGap2 = minGap * minGap;
    const minX = lane.x + lane.railW * 0.34 + pinR;
    const maxX = lane.x + lane.w - lane.railW * 0.34 - pinR;
    const minY = lane.y + clamp(52 * s, 32, 72);
    const maxY = lane.y + lane.h * 0.64;

    let attempts = 0;
    while (state.pins.length < state.currentLevelPins && attempts < 2500) {
      attempts++;
      // Bias placement toward the upper and middle lane, leaving a launch lane at bottom.
      const band = Math.random();
      const xBias = Math.random() < 0.68
        ? lane.x + lane.w * 0.5 + rand(-lane.w * 0.34, lane.w * 0.34)
        : rand(minX, maxX);
      const yBias = band < 0.62
        ? rand(minY, lane.y + lane.h * 0.43)
        : rand(lane.y + lane.h * 0.43, maxY);

      const candidate = { x: clamp(xBias, minX, maxX), y: clamp(yBias, minY, maxY) };
      let ok = true;
      for (const p of state.pins) {
        if (dist2(candidate, p) < minGap2) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      state.pins.push(makePin(candidate.x, candidate.y, pinR, choice(PIN_COLORS)));
    }

    // If spacing rules could not place all pins, relax placement.
    while (state.pins.length < state.currentLevelPins) {
      const x = rand(minX, maxX);
      const y = rand(minY, maxY);
      state.pins.push(makePin(x, y, pinR, choice(PIN_COLORS)));
    }

    resetBall();
    state.started = state.started; // keep current start state
    state.introStart = now();
    state.introUntil = state.introStart + 1.55;
    state.celebrationUntil = 0;
    state.nextLevelAt = 0;
    state.forceAssistNextRoll = false;
    state.lastRollHit = true;
    state.levelJustLoadedAt = now();
  }

  function makePin(x, y, r, color) {
    return {
      x, y,
      vx: 0, vy: 0,
      r,
      color,
      angle: rand(-0.22, 0.22),
      av: 0,
      knocked: false,
      falling: 0,
      hitFlash: 0,
      sleep: false
    };
  }

  function unlockAudio() {
    if (state.audioReady) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !state.audioCtx) {
      state.audioCtx = new AudioContext();
    }
    if (state.audioCtx && state.audioCtx.state === "suspended") {
      state.audioCtx.resume().catch(() => {});
    }
    // Start music from the user gesture. It may fail in some browsers; gameplay continues.
    if (musicEl) {
      musicEl.volume = 0.48;
      const p = musicEl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
    state.audioReady = true;
  }

  function playTone({ type = "sine", freq = 440, endFreq = null, duration = 0.12, volume = 0.1, attack = 0.005 }) {
    const ac = state.audioCtx;
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function playWallBounce() {
    playTone({ type: "triangle", freq: 210, endFreq: 150, duration: 0.11, volume: 0.07 });
    setTimeout(() => playTone({ type: "sine", freq: 520, endFreq: 360, duration: 0.08, volume: 0.045 }), 8);
  }

  function playPinFall(strong = false) {
    playTone({ type: "triangle", freq: strong ? 420 : 340, endFreq: strong ? 170 : 210, duration: strong ? 0.17 : 0.12, volume: strong ? 0.105 : 0.075 });
    setTimeout(() => playTone({ type: "square", freq: 120, endFreq: 80, duration: 0.06, volume: 0.018 }), 20);
  }

  function playMeow() {
    // Cute synthetic meow: upward chirp, then downward tail.
    playTone({ type: "sine", freq: 520, endFreq: 820, duration: 0.16, volume: 0.12 });
    setTimeout(() => playTone({ type: "triangle", freq: 820, endFreq: 420, duration: 0.34, volume: 0.13 }), 145);
  }

  function startRollSound() {
    if (!state.audioCtx || state.rollSound) return;
    const ac = state.audioCtx;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 74;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    state.rollSound = { osc, gain };
  }

  function updateRollSound() {
    if (!state.rollSound || !state.ball) return;
    const ac = state.audioCtx;
    const speed = Math.hypot(state.ball.vx, state.ball.vy);
    const target = clamp(speed / 900, 0, 0.055);
    state.rollSound.gain.gain.setTargetAtTime(target, ac.currentTime, 0.025);
    state.rollSound.osc.frequency.setTargetAtTime(60 + speed * 0.04, ac.currentTime, 0.04);
  }

  function stopRollSound() {
    if (!state.rollSound || !state.audioCtx) return;
    const ac = state.audioCtx;
    const { osc, gain } = state.rollSound;
    gain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.03);
    setTimeout(() => {
      try { osc.stop(); } catch (e) {}
    }, 110);
    state.rollSound = null;
  }

  function handleStartOrRoll(clientX, clientY) {
    unlockAudio();

    if (!state.started) {
      state.started = true;
      launchBall(clientX, clientY);
      return;
    }

    if (state.celebrationUntil > now() || state.nextLevelAt > now()) return;
    if (!state.rolling) {
      launchBall(clientX, clientY);
    }
  }

  function targetForTap(clientX) {
    const lane = state.lane;
    const standingPins = state.pins.filter(p => !p.knocked);
    if (!standingPins.length) return { x: lane.x + lane.w * 0.5, y: lane.y + lane.h * 0.25 };

    const tapT = clamp((clientX - lane.x) / lane.w, 0.05, 0.95);
    const intendedX = lane.x + lane.w * tapT;

    // If one pin is clearly closest to the horizontal tap aim, target it.
    let sorted = standingPins
      .map(p => ({ p, d: Math.abs(p.x - intendedX) + Math.abs(p.y - (lane.y + lane.h * 0.36)) * 0.10 }))
      .sort((a, b) => a.d - b.d);
    if (sorted.length === 1 || sorted[0].d + lane.w * 0.055 < sorted[1].d) {
      return { x: sorted[0].p.x, y: sorted[0].p.y };
    }

    // Otherwise target a small cluster centroid.
    const near = sorted.slice(0, Math.min(5, sorted.length)).map(o => o.p);
    let cx = 0, cy = 0;
    for (const p of near) { cx += p.x; cy += p.y; }
    cx /= near.length;
    cy /= near.length;

    // Tap influences the shot gently.
    cx = lerp(cx, intendedX, state.forceAssistNextRoll ? 0.12 : 0.24);
    return { x: clamp(cx, lane.x + 28, lane.x + lane.w - 28), y: cy };
  }

  function launchBall(clientX, clientY) {
    if (!state.ball) resetBall();
    pickBallVariant();
    resetBall();

    const target = targetForTap(clientX);
    const b = state.ball;
    const dx = target.x - b.x;
    const dy = target.y - b.y;

    // Accessible: heavy assist, gentle tap influence, and a speed that takes about 2-3 seconds.
    const len = Math.max(1, Math.hypot(dx, dy));
    const desiredTime = state.forceAssistNextRoll ? rand(1.85, 2.25) : rand(2.1, 2.65);
    let speed = clamp(len / desiredTime, state.h * 0.26, state.h * 0.46);

    // If assist is not forced, let the user influence the line a little.
    const tapInfluence = clamp((clientX - (state.lane.x + state.lane.w * 0.5)) / state.lane.w, -0.5, 0.5);
    const sideNudge = state.forceAssistNextRoll ? 0 : tapInfluence * state.w * 0.065;

    b.vx = (dx / len) * speed + sideNudge;
    b.vy = (dy / len) * speed;
    b.spin = rand(-1.5, 1.5);
    state.rolling = true;
    state.rollStartAt = now();
    state.rollHitThisTime = false;
    state.lastRollHit = false;
    startRollSound();
  }

  function update(dt) {
    const t = now();
    state.tapHintPulse += dt;

    for (let i = state.sparkles.length - 1; i >= 0; i--) {
      const sp = state.sparkles[i];
      sp.life -= dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.rot += sp.vr * dt;
      if (sp.life <= 0) state.sparkles.splice(i, 1);
    }

    if (state.nextLevelAt && t >= state.nextLevelAt) {
      state.nextLevelAt = 0;
      newLevel();
    }

    updateBall(dt);
    updatePins(dt);
    updatePinCollisions(dt);
    updateRollSound();

    if (state.rolling) {
      const speed = Math.hypot(state.ball.vx, state.ball.vy);
      const oldEnough = t - state.rollStartAt > 0.75;
      const tooLong = t - state.rollStartAt > 6.2;
      const belowLane = state.ball.y < state.lane.y - state.ball.r * 2;
      const stopped = oldEnough && speed < 38;
      if (tooLong || belowLane || stopped) {
        finishRoll();
      }
    }

    const standing = state.pins.some(p => !p.knocked);
    if (state.started && !standing && !state.nextLevelAt && state.celebrationUntil < t) {
      startCelebration();
    }
  }

  function updateBall(dt) {
    const b = state.ball;
    if (!b || !state.rolling) return;
    const lane = state.lane;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.spin += (b.vx * 0.009) * dt;

    // Gentle friction.
    b.vx *= Math.pow(0.985, dt * 60);
    b.vy *= Math.pow(0.989, dt * 60);

    // Side bumper walls.
    const left = lane.x + lane.railW * 0.34 + b.r;
    const right = lane.x + lane.w - lane.railW * 0.34 - b.r;
    if (b.x < left) {
      b.x = left;
      b.vx = Math.abs(b.vx) * 0.82 + 18;
      b.vy *= 0.98;
      playWallBounce();
      addSparkles(b.x, b.y, 5, "#ffe36a", 0.18);
    } else if (b.x > right) {
      b.x = right;
      b.vx = -Math.abs(b.vx) * 0.82 - 18;
      b.vy *= 0.98;
      playWallBounce();
      addSparkles(b.x, b.y, 5, "#ffe36a", 0.18);
    }

    // Ball-pin collisions.
    for (const p of state.pins) {
      if (p.knocked && Math.hypot(p.vx, p.vy) < 12) continue;
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      const minD = b.r * 0.72 + p.r * 1.1; // generous hitbox
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < minD) {
        const nx = dx / d, ny = dy / d;
        const push = minD - d;
        p.x += nx * push * 0.65;
        p.y += ny * push * 0.65;

        const impact = Math.max(170, Math.hypot(b.vx, b.vy) * 0.62);
        p.vx += nx * impact + rand(-45, 45);
        p.vy += ny * impact + rand(-35, 35);
        p.av += rand(-6, 6);
        knockPin(p, true);

        b.vx -= nx * impact * 0.12;
        b.vy -= ny * impact * 0.10;
        state.rollHitThisTime = true;
        state.lastRollHit = true;
        state.forceAssistNextRoll = false;
      }
    }
  }

  function updatePins(dt) {
    const lane = state.lane;
    const minX = lane.x + lane.railW * 0.26;
    const maxX = lane.x + lane.w - lane.railW * 0.26;
    const minY = lane.y + 6;
    const maxY = lane.y + lane.h - 6;

    for (const p of state.pins) {
      p.hitFlash = Math.max(0, p.hitFlash - dt * 2.8);
      if (p.knocked) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.av * dt;

        p.vx *= Math.pow(0.965, dt * 60);
        p.vy *= Math.pow(0.965, dt * 60);
        p.av *= Math.pow(0.95, dt * 60);

        if (p.x < minX + p.r) {
          p.x = minX + p.r;
          p.vx = Math.abs(p.vx) * 0.52;
        } else if (p.x > maxX - p.r) {
          p.x = maxX - p.r;
          p.vx = -Math.abs(p.vx) * 0.52;
        }
        if (p.y < minY + p.r) {
          p.y = minY + p.r;
          p.vy = Math.abs(p.vy) * 0.52;
        } else if (p.y > maxY - p.r) {
          p.y = maxY - p.r;
          p.vy = -Math.abs(p.vy) * 0.52;
        }
      } else {
        // Tiny idle wobble.
        p.angle += Math.sin(now() * 2.1 + p.x * 0.02) * 0.0008;
      }
    }
  }

  function updatePinCollisions(dt) {
    const pins = state.pins;
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const a = pins[i], b = pins[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const minD = a.r * 1.55 + b.r * 1.55;
        if (d > 0 && d < minD) {
          const nx = dx / d, ny = dy / d;
          const push = (minD - d) * 0.5;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;

          const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (rel > 18) {
            const impulse = Math.min(280, rel * 0.55);
            a.vx -= nx * impulse; a.vy -= ny * impulse;
            b.vx += nx * impulse; b.vy += ny * impulse;
            a.av += rand(-2.8, 2.8);
            b.av += rand(-2.8, 2.8);
            if (a.knocked && !b.knocked) knockPin(b, false);
            if (b.knocked && !a.knocked) knockPin(a, false);
          }
        }
      }
    }
  }

  function knockPin(p, fromBall) {
    if (!p.knocked) {
      p.knocked = true;
      p.falling = 1;
      p.hitFlash = 1;
      p.angle += rand(-0.8, 0.8);
      playPinFall(fromBall);
      addSparkles(p.x, p.y, fromBall ? 9 : 5, p.color, 0.34);
    } else {
      p.hitFlash = Math.max(p.hitFlash, 0.45);
    }
  }

  function finishRoll() {
    state.rolling = false;
    stopRollSound();
    const hit = !!state.rollHitThisTime;
    state.lastRollHit = hit;
    if (!hit && state.pins.some(p => !p.knocked)) {
      state.forceAssistNextRoll = true;
    }
    resetBall();
  }

  function startCelebration() {
    const t = now();
    state.celebrationStart = t;
    state.celebrationUntil = t + 2.0;
    state.nextLevelAt = t + 2.05;
    state.rolling = false;
    stopRollSound();
    playMeow();
    const cx = state.lane.x + state.lane.w * 0.5;
    const cy = state.lane.y + state.lane.h * 0.38;
    addSparkles(cx, cy, 44, "#ffe36a", 1.1);
    addSparkles(cx, cy, 28, "#ff8bd1", 1.0);
  }

  function addSparkles(x, y, count, color, life = 0.7) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const spd = rand(20, 145);
      state.sparkles.push({
        x: x + rand(-8, 8),
        y: y + rand(-8, 8),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: rand(2.5, 7),
        color,
        life: rand(life * 0.55, life),
        maxLife: life,
        rot: rand(0, TAU),
        vr: rand(-4, 4)
      });
    }
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
    const w = state.w, h = state.h;
    ctx.clearRect(0, 0, w, h);

    drawBackground();
    drawLane();

    // Draw pins sorted by y for a simple depth feel.
    const sortedPins = [...state.pins].sort((a, b) => a.y - b.y);
    for (const p of sortedPins) drawPin(p);

    drawAimingGuides();

    if (state.ball) drawBall();

    drawMascot();
    drawSparkles();

    drawIntroAndStartText();
    drawCelebration();

    if (w > h) drawPortraitHint();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, state.h);
    g.addColorStop(0, "#422176");
    g.addColorStop(0.45, "#6e4fc4");
    g.addColorStop(1, "#2b185d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    // Small stars outside lane.
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 20; i++) {
      const x = ((i * 73) % Math.max(1, state.w));
      const y = ((i * 131) % Math.max(1, state.h));
      drawStar(x, y, 3 + (i % 3), "#fff0a6", 0.5);
    }
    ctx.restore();
  }

  function drawLane() {
    const lane = state.lane;
    const railW = lane.railW;
    const radius = clamp(state.w * 0.07, 22, 42);

    // Outer bumper board
    ctx.save();
    roundedRect(ctx, lane.x - railW * 0.58, lane.y, lane.w + railW * 1.16, lane.h, radius + 8);
    const railGrad = ctx.createLinearGradient(0, lane.y, 0, lane.y + lane.h);
    railGrad.addColorStop(0, "#9a65e8");
    railGrad.addColorStop(0.55, "#7440c9");
    railGrad.addColorStop(1, "#5b2ba9");
    ctx.fillStyle = railGrad;
    ctx.fill();

    // Lane surface
    roundedRect(ctx, lane.x, lane.y + 10, lane.w, lane.h - 18, radius);
    const wood = ctx.createLinearGradient(0, lane.y, 0, lane.y + lane.h);
    wood.addColorStop(0, "#ffd070");
    wood.addColorStop(0.45, "#f8b84d");
    wood.addColorStop(1, "#ffd988");
    ctx.fillStyle = wood;
    ctx.fill();

    // Wood stripes
    ctx.globalAlpha = 0.13;
    ctx.lineWidth = 1;
    for (let x = lane.x + 18; x < lane.x + lane.w; x += Math.max(18, lane.w / 11)) {
      ctx.strokeStyle = "#8a4e18";
      ctx.beginPath();
      ctx.moveTo(x, lane.y + 18);
      ctx.lineTo(x + Math.sin(x) * 8, lane.y + lane.h - 18);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Inner bumper highlights
    drawRail(lane.x - railW * 0.53, lane.y + 18, railW * 0.62, lane.h - 38, true);
    drawRail(lane.x + lane.w - railW * 0.09, lane.y + 18, railW * 0.62, lane.h - 38, false);

    // Side bolts/stars
    const boltY = [0.12, 0.36, 0.62, 0.86];
    for (const t of boltY) {
      drawCircle(lane.x - railW * 0.29, lane.y + lane.h * t, railW * 0.18, "#ffc447", "#d97722");
      drawCircle(lane.x + lane.w + railW * 0.29, lane.y + lane.h * t, railW * 0.18, "#ffc447", "#d97722");
    }

    // Top rounded bumper cap
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#4d208f";
    ctx.lineWidth = 3;
    roundedRect(ctx, lane.x + 3, lane.y + 10, lane.w - 6, lane.h - 18, radius);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawRail(x, y, w, h, left) {
    roundedRect(ctx, x, y, w, h, w * 0.45);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, left ? "#b582ff" : "#6b39bd");
    g.addColorStop(0.55, "#8c55dc");
    g.addColorStop(1, left ? "#6b39bd" : "#b582ff");
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.38;
    for (let yy = y + 40; yy < y + h - 10; yy += 72) {
      drawStar(x + w * 0.5, yy, Math.min(8, w * 0.27), "#ffe36a", 0.55);
    }
    ctx.restore();
  }

  function drawCircle(x, y, r, fill, stroke = null) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = Math.max(1, r * 0.18);
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function drawAimingGuides() {
    if (!state.ball || state.rolling || state.celebrationUntil > now()) return;
    const b = state.ball;
    const lane = state.lane;
    ctx.save();
    ctx.globalAlpha = state.started ? 0.34 : 0.45;
    ctx.fillStyle = "#fff6cc";
    const dots = 9;
    for (let i = 1; i <= dots; i++) {
      const t = i / (dots + 1);
      const y = lerp(b.y - b.r * 1.25, lane.y + lane.h * 0.52, t);
      const r = lerp(4, 2.5, t);
      drawCircle(b.x, y, r, "#fff6cc");
    }
    ctx.globalAlpha = state.started ? 0.20 : 0.30;
    ctx.fillStyle = "#fff0a6";
    for (let i = 0; i < 5; i++) {
      const y = b.y - b.r * 2.1 - i * 18;
      drawChevron(b.x, y, 18 - i * 1.6);
    }
    ctx.restore();
  }

  function drawChevron(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.6);
    ctx.lineTo(x - size, y + size * 0.45);
    ctx.lineTo(x - size * 0.38, y + size * 0.45);
    ctx.lineTo(x, y - size * 0.15);
    ctx.lineTo(x + size * 0.38, y + size * 0.45);
    ctx.lineTo(x + size, y + size * 0.45);
    ctx.closePath();
    ctx.fill();
  }

  function drawPin(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle + (p.knocked ? Math.PI * 0.5 : 0));
    const r = p.r;
    const scaleY = p.knocked ? 1.0 : 1.28;

    ctx.shadowColor = "rgba(55, 28, 15, 0.28)";
    ctx.shadowBlur = 9;
    ctx.shadowOffsetY = 5;

    // Pin body as stacked rounded shapes.
    ctx.fillStyle = p.color;
    ctx.strokeStyle = "rgba(70, 35, 70, 0.25)";
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.ellipse(0, r * 0.16, r * 0.72, r * 1.05 * scaleY, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, -r * 0.62 * scaleY, r * 0.48, r * 0.54, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Highlight
    ctx.shadowColor = "transparent";
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-r * 0.24, -r * 0.2, r * 0.17, r * 0.58, -0.2, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Neck stripes
    ctx.strokeStyle = "#fff7ea";
    ctx.lineWidth = Math.max(2, r * 0.17);
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 0.48 * scaleY);
    ctx.lineTo(r * 0.42, -r * 0.48 * scaleY);
    ctx.stroke();

    if (p.hitFlash > 0) {
      ctx.globalAlpha = p.hitFlash * 0.4;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.9, r * 1.35, 0, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBall() {
    const b = state.ball;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.spin);

    // Start ring
    if (!state.rolling) {
      ctx.save();
      ctx.rotate(-b.spin);
      ctx.globalAlpha = 0.48 + Math.sin(state.tapHintPulse * 3) * 0.08;
      ctx.strokeStyle = "#fff6cc";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.r * 1.36, b.r * 1.16, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    if (state.ballCategory === "cat") drawCatBall(b.r, state.ballVariant);
    else if (state.ballCategory === "toy") drawToyBall(b.r, state.ballVariant);
    else drawYarnBall(b.r, state.ballVariant);

    ctx.restore();
  }

  function drawCatBall(r, v) {
    // ears
    ctx.fillStyle = v.base;
    ctx.strokeStyle = "rgba(35, 20, 60, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, -r * 0.55);
    ctx.lineTo(-r * 0.38, -r * 1.08);
    ctx.lineTo(-r * 0.12, -r * 0.52);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.72, -r * 0.55);
    ctx.lineTo(r * 0.38, -r * 1.08);
    ctx.lineTo(r * 0.12, -r * 0.52);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = v.ear;
    ctx.beginPath();
    ctx.moveTo(-r * 0.53, -r * 0.66);
    ctx.lineTo(-r * 0.39, -r * 0.88);
    ctx.lineTo(-r * 0.28, -r * 0.62);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.53, -r * 0.66);
    ctx.lineTo(r * 0.39, -r * 0.88);
    ctx.lineTo(r * 0.28, -r * 0.62);
    ctx.closePath(); ctx.fill();

    const g = ctx.createRadialGradient(-r * 0.22, -r * 0.25, r * 0.2, 0, 0, r);
    g.addColorStop(0, lighten(v.base, 0.22));
    g.addColorStop(1, v.base);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(35,20,60,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Patch
    ctx.fillStyle = v.patch;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.42, r * 0.35, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Finger holes
    ctx.fillStyle = "rgba(31,24,52,0.55)";
    drawCircle(-r * 0.22, -r * 0.58, r * 0.13, "rgba(31,24,52,0.55)");
    drawCircle(r * 0.08, -r * 0.66, r * 0.12, "rgba(31,24,52,0.55)");
    drawCircle(r * 0.25, -r * 0.45, r * 0.12, "rgba(31,24,52,0.55)");

    drawBallFace(r, v.face || "#27213b");
  }

  function drawToyBall(r, v) {
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.15, 0, 0, r);
    g.addColorStop(0, lighten(v.base, 0.35));
    g.addColorStop(1, v.base);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(35,20,60,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(-0.3);
    if (v.deco === "stars") {
      drawStar(-r * 0.42, -r * 0.14, r * 0.22, v.accent, 1);
      drawStar(r * 0.28, r * 0.22, r * 0.18, v.accent, 1);
      drawStar(r * 0.37, -r * 0.34, r * 0.13, v.accent, 1);
    } else if (v.deco === "paw") {
      drawPaw(-r * 0.32, -r * 0.10, r * 0.2, v.accent);
      drawPaw(r * 0.25, r * 0.25, r * 0.16, v.accent);
    } else {
      for (let i = 0; i < 8; i++) {
        drawCircle(Math.cos(i * TAU / 8) * r * 0.55, Math.sin(i * TAU / 8) * r * 0.35, r * 0.07, v.accent);
      }
    }
    ctx.restore();

    drawCircle(-r * 0.18, -r * 0.58, r * 0.13, "rgba(31,24,52,0.65)");
    drawCircle(r * 0.13, -r * 0.60, r * 0.12, "rgba(31,24,52,0.65)");
    drawCircle(r * 0.02, -r * 0.34, r * 0.12, "rgba(31,24,52,0.65)");
  }

  function drawYarnBall(r, v) {
    ctx.fillStyle = v.base;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(35,20,60,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.strokeStyle = v.accent;
    ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.globalAlpha = 0.78;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.ellipse(0, i * r * 0.12, r * 0.95, r * 0.18, rand(-0.5, 0.5), 0, TAU);
      ctx.stroke();
    }
    ctx.rotate(1.0);
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(0, i * r * 0.13, r * 0.92, r * 0.16, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    drawBallFace(r, v.face);
  }

  function drawBallFace(r, color) {
    ctx.fillStyle = color;
    drawCircle(-r * 0.33, -r * 0.04, r * 0.105, color);
    drawCircle(r * 0.33, -r * 0.04, r * 0.105, color);
    ctx.fillStyle = "#ff7ca8";
    ctx.beginPath();
    ctx.arc(0, r * 0.14, r * 0.075, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, r * 0.045);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, r * 0.28);
    ctx.quadraticCurveTo(0, r * 0.40, r * 0.12, r * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.52, r * 0.14);
    ctx.lineTo(-r * 0.26, r * 0.19);
    ctx.moveTo(r * 0.52, r * 0.14);
    ctx.lineTo(r * 0.26, r * 0.19);
    ctx.stroke();
  }

  function drawMascot() {
    const lane = state.lane;
    const s = clamp(state.w / 390, 0.82, 1.25);
    const size = clamp(state.w * 0.18, 58, 84);
    const x = lane.x + size * 0.52;
    const y = lane.y + lane.h - size * 0.58;
    ctx.save();
    ctx.translate(x, y);

    // Simple full-body cat mascot, bubble-shooter-like.
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(80, 37, 38, 0.25)";
    ctx.fillStyle = "#f6a13d";

    // Tail
    ctx.save();
    ctx.rotate(-0.55);
    ctx.beginPath();
    ctx.ellipse(-size * 0.55, size * 0.13, size * 0.18, size * 0.42, 0, 0, TAU);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(166, 85, 28, 0.6)";
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.68, size * 0.08 + i * 7);
      ctx.lineTo(-size * 0.44, size * 0.02 + i * 7);
      ctx.stroke();
    }
    ctx.restore();

    // Body
    ctx.fillStyle = "#f6a13d";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.28, size * 0.34, size * 0.42, 0, 0, TAU);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff2d4";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.34, size * 0.19, size * 0.28, 0, 0, TAU);
    ctx.fill();

    // Head
    ctx.fillStyle = "#f6a13d";
    ctx.beginPath();
    ctx.arc(0, -size * 0.17, size * 0.39, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Ears
    ctx.beginPath();
    ctx.moveTo(-size * 0.28, -size * 0.43);
    ctx.lineTo(-size * 0.16, -size * 0.79);
    ctx.lineTo(size * 0.00, -size * 0.44);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.28, -size * 0.43);
    ctx.lineTo(size * 0.16, -size * 0.79);
    ctx.lineTo(size * 0.00, -size * 0.44);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffc0ca";
    ctx.beginPath();
    ctx.moveTo(-size * 0.20, -size * 0.48);
    ctx.lineTo(-size * 0.15, -size * 0.67);
    ctx.lineTo(-size * 0.06, -size * 0.46);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.20, -size * 0.48);
    ctx.lineTo(size * 0.15, -size * 0.67);
    ctx.lineTo(size * 0.06, -size * 0.46);
    ctx.closePath(); ctx.fill();

    // Face patch
    ctx.fillStyle = "#fff2d4";
    ctx.beginPath();
    ctx.ellipse(-size * 0.08, -size * 0.09, size * 0.22, size * 0.18, 0, 0, TAU);
    ctx.fill();

    // Stripes
    ctx.strokeStyle = "rgba(168, 88, 28, 0.75)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.18 + i * size * 0.09, -size * 0.48);
      ctx.lineTo(-size * 0.12 + i * size * 0.06, -size * 0.34);
      ctx.stroke();
    }

    // Eyes and face
    ctx.strokeStyle = "#30213d";
    ctx.fillStyle = "#2e233d";
    drawCircle(-size * 0.13, -size * 0.18, size * 0.035, "#2e233d");
    // wink
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size * 0.09, -size * 0.20);
    ctx.quadraticCurveTo(size * 0.16, -size * 0.15, size * 0.23, -size * 0.20);
    ctx.stroke();
    ctx.fillStyle = "#ff6d94";
    ctx.beginPath();
    ctx.arc(0, -size * 0.08, size * 0.035, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#2e233d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.06, size * 0.01);
    ctx.quadraticCurveTo(0, size * 0.07, size * 0.06, size * 0.01);
    ctx.stroke();

    // Raised paw
    ctx.save();
    ctx.translate(size * 0.34, -size * 0.10);
    ctx.rotate(-0.35 + Math.sin(now() * 3) * 0.05);
    ctx.fillStyle = "#f6a13d";
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.10, size * 0.17, 0, 0, TAU);
    ctx.fill(); ctx.stroke();
    drawPaw(0, -size * 0.01, size * 0.07, "#ffc0ca");
    ctx.restore();

    // Other paw and feet
    ctx.fillStyle = "#f6a13d";
    ctx.beginPath();
    ctx.ellipse(-size * 0.24, size * 0.20, size * 0.08, size * 0.16, -0.4, 0, TAU);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-size * 0.16, size * 0.72, size * 0.13, size * 0.07, 0, 0, TAU);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(size * 0.16, size * 0.72, size * 0.13, size * 0.07, 0, 0, TAU);
    ctx.fill(); ctx.stroke();

    // Collar tag
    drawCircle(0, size * 0.10, size * 0.075, "#ffd24d", "#c47b22");
    drawPaw(0, size * 0.10, size * 0.04, "#a06620");

    ctx.restore();
  }

  function drawPaw(x, y, r, color) {
    ctx.fillStyle = color;
    drawCircle(x, y + r * 0.25, r * 0.55, color);
    drawCircle(x - r * 0.48, y - r * 0.28, r * 0.28, color);
    drawCircle(x, y - r * 0.44, r * 0.30, color);
    drawCircle(x + r * 0.48, y - r * 0.28, r * 0.28, color);
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

  function drawStar(x, y, r, color, alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((x + y) * 0.01 + now() * 0.4);
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawIntroAndStartText() {
    const t = now();
    const lane = state.lane;

    if (!state.started) {
      drawTextBadge("Tap to Play!", lane.x + lane.w * 0.5, lane.y + lane.h * 0.34, clamp(state.w * 0.115, 38, 58), true);
      drawLevelBadge(`${state.currentLevelPins} Pin Level!`, lane.x + lane.w * 0.5, lane.y + lane.h * 0.43, 1);
      return;
    }

    if (t < state.introUntil) {
      const life = (state.introUntil - t) / (state.introUntil - state.introStart);
      const y = lane.y + lane.h * 0.20 - (1 - life) * 18;
      drawLevelBadge(`${state.currentLevelPins} Pin Level!`, lane.x + lane.w * 0.5, y, clamp(life * 1.15, 0, 1));
    }
  }

  function drawTextBadge(text, x, y, size, big = false) {
    ctx.save();
    ctx.font = `900 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(7, size * 0.18);
    ctx.strokeStyle = "#5f2baa";
    ctx.strokeText(text, x, y);
    ctx.lineWidth = Math.max(3, size * 0.07);
    ctx.strokeStyle = "#f9b5ff";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#fff8ff";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawLevelBadge(text, x, y, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const s = laneScale();
    const w = clamp(state.w * 0.58, 205, 300);
    const h = clamp(40 * s, 36, 50);
    roundedRect(ctx, x - w / 2, y - h / 2, w, h, h * 0.32);
    ctx.fillStyle = "#7d48d2";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#51219a";
    ctx.stroke();
    ctx.setLineDash([6, 6]);
    ctx.globalAlpha = alpha * 0.45;
    ctx.strokeStyle = "#fff6cc";
    roundedRect(ctx, x - w / 2 + 7, y - h / 2 + 7, w - 14, h - 14, h * 0.23);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = alpha;
    drawStar(x - w * 0.40, y, h * 0.22, "#ffe36a", 1);
    drawStar(x + w * 0.40, y, h * 0.22, "#ffe36a", 1);

    ctx.font = `900 ${clamp(24 * s, 20, 31)}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#52219b";
    ctx.strokeText(text, x, y + 1);
    ctx.fillStyle = "#fff8ff";
    ctx.fillText(text, x, y + 1);
    ctx.restore();
  }

  function drawCelebration() {
    const t = now();
    if (t > state.celebrationUntil) return;
    const lane = state.lane;
    const progress = clamp((t - state.celebrationStart) / 2.0, 0, 1);
    const alpha = progress < 0.18 ? progress / 0.18 : progress > 0.82 ? (1 - progress) / 0.18 : 1;
    const cx = lane.x + lane.w * 0.5;
    const cy = lane.y + lane.h * 0.38;

    ctx.save();
    ctx.globalAlpha = alpha;

    drawTextBadge("Meow!", cx, cy, clamp(state.w * 0.17, 54, 82), true);

    // Quick mascot pop beside the word.
    ctx.save();
    const pop = Math.sin(clamp(progress / 0.22, 0, 1) * Math.PI);
    ctx.translate(cx + state.w * 0.22, cy + state.h * 0.11 - pop * 16);
    ctx.scale(0.58, 0.58);
    // mini cat head only here so it doesn't block too much, while main mascot remains full-body
    drawCircle(0, 0, 42, "#f6a13d", "rgba(80,37,38,0.35)");
    ctx.fillStyle = "#f6a13d";
    ctx.beginPath(); ctx.moveTo(-28,-22); ctx.lineTo(-16,-54); ctx.lineTo(-3,-24); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(28,-22); ctx.lineTo(16,-54); ctx.lineTo(3,-24); ctx.closePath(); ctx.fill();
    drawCircle(-14, -4, 4.5, "#30213d");
    ctx.strokeStyle = "#30213d"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(10, -5); ctx.quadraticCurveTo(18, 1, 26, -5); ctx.stroke();
    ctx.fillStyle = "#ff7ca8"; ctx.beginPath(); ctx.arc(0, 8, 4, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  function drawPortraitHint() {
    ctx.save();
    ctx.globalAlpha = 0.86;
    roundedRect(ctx, state.w * 0.18, state.h * 0.40, state.w * 0.64, state.h * 0.20, 18);
    ctx.fillStyle = "#32185e";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Portrait works best", state.w * 0.5, state.h * 0.48);
    ctx.font = "600 15px system-ui, sans-serif";
    ctx.fillText("Please rotate back", state.w * 0.5, state.h * 0.53);
    ctx.restore();
  }

  function lighten(hex, amount) {
    const c = hex.replace("#", "");
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(lerp(r, 255, amount));
    g = Math.round(lerp(g, 255, amount));
    b = Math.round(lerp(b, 255, amount));
    return `rgb(${r},${g},${b})`;
  }

  function loop() {
    const t = now();
    let dt = clamp(t - state.lastT, 0, 1 / 20);
    state.lastT = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function onPointerDown(e) {
    e.preventDefault();
    const p = e.changedTouches ? e.changedTouches[0] : e;
    handleStartOrRoll(p.clientX, p.clientY);
  }

  window.addEventListener("resize", setupCanvas, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(setupCanvas, 120), { passive: true });
  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("touchstart", onPointerDown, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      handleStartOrRoll(state.lane.x + state.lane.w * 0.5, state.lane.y + state.lane.h * 0.35);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (musicEl) musicEl.pause();
      stopRollSound();
    } else if (state.audioReady && musicEl) {
      const p = musicEl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  });

  setupCanvas();
  requestAnimationFrame(loop);
})();
