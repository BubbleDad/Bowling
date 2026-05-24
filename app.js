(() => {
  "use strict";

  /***************************************************************************
   * Meowmoon Bowling v0.1
   * First playable browser/PWA prototype.
   * Design: no choices, no score, no frames, no losing, no ads, no timers.
   **************************************************************************/

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const TAU = Math.PI * 2;
  const TITLE_HOLD_MS = 1450;
  const TITLE_FADE_MS = 850;
  const LEVEL_REWARD_MS = 1550;
  const NEXT_LEVEL_DELAY_MS = 550;
  const LONG_PRESS_MS = 3000;
  const AUTO_PAUSE_GRACE_MS = 500;
  const BALL_SPEED = 740; // CSS pixels per second; steady and not twitchy.

  const view = { w: 720, h: 1080, dpr: 1 };
  const layout = {
    unit: 36,
    topBand: 92,
    playTop: 126,
    playBottom: 810,
    wallLeft: 32,
    wallRight: 688,
    rollerX: 360,
    rollerY: 982,
    ballR: 30,
    pinH: 62,
    pinW: 26,
    catX: 255,
    catY: 986,
    textX: 484,
    textY: 884,
    textW: 205,
    textH: 150,
    launcherZoneTop: 832
  };

  const game = {
    level: 0,
    pins: [],
    ball: null,
    pathPreview: [],
    titleStartedAt: performance.now(),
    phase: "title", // title, playing, rolling, resolving, reward, paused
    previousPhase: "playing",
    rewardStartedAt: 0,
    nextLevelAt: 0,
    resolvingUntil: 0,
    forceHitNext: false,
    hold: null,
    pauseTimer: null,
    pausedAt: 0,
    messageIndex: 0,
    message: "Hi there, bowler! Tap anywhere to roll.",
    particles: [],
    nextBallSeed: 0
  };

  const messages = [
    "Hi there, bowler!\nTap anywhere to roll.",
    "Great roll!\nEvery roll helps.",
    "You can bounce\noff the sides!",
    "Meowmoon is cheering\nfor you!",
    "Knock down the pins\none roll at a time.",
    "Nice bowling!\nYou've got this!"
  ];

  const audio = {
    context: null,
    musicAudio: null,
    usingFileMusic: false,
    synthMusicTimer: null,
    synthNoteIndex: 0,
    nextNoteAt: 0,
    rollNoise: null,
    rollGain: null,
    isStarted: false,
    isMutedByPause: false,
    pattern: [
      392.00, 440.00, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00,
      392.00, 493.88, 587.33, 659.25, 587.33, 523.25, 493.88, 440.00
    ],

    async start() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.context = new AudioContext();
      }
      if (this.context && this.context.state === "suspended") {
        this.context.resume().catch(() => {});
      }
      this.isStarted = true;
      this.isMutedByPause = false;
      await this.startMusic();
    },

    async startMusic() {
      if (this.isMutedByPause) return;

      // Preferred path: user can place the Bach MP3 here without changing code.
      if (!this.musicAudio) {
        this.musicAudio = new Audio("assets/audio/bach-placeholder.mp3");
        this.musicAudio.loop = true;
        this.musicAudio.volume = 0.32;
        this.musicAudio.preload = "auto";
      }

      if (!this.usingFileMusic) {
        try {
          await this.musicAudio.play();
          this.usingFileMusic = true;
          this.stopSynthMusic();
          return;
        } catch (err) {
          this.usingFileMusic = false;
        }
      }

      this.startSynthMusic();
    },

    pauseMusic() {
      this.isMutedByPause = true;
      if (this.musicAudio) this.musicAudio.pause();
      this.stopSynthMusic();
      this.stopRolling();
    },

    resumeMusic() {
      this.isMutedByPause = false;
      if (!this.isStarted) return;
      this.startMusic();
    },

    startSynthMusic() {
      if (!this.context || this.synthMusicTimer) return;
      this.synthNoteIndex = 0;
      this.nextNoteAt = this.context.currentTime + 0.03;
      this.scheduleSynthMusic();
      this.synthMusicTimer = window.setInterval(() => this.scheduleSynthMusic(), 260);
    },

    stopSynthMusic() {
      if (this.synthMusicTimer) {
        window.clearInterval(this.synthMusicTimer);
        this.synthMusicTimer = null;
      }
    },

    scheduleSynthMusic() {
      if (!this.context || this.isMutedByPause) return;
      const horizon = this.context.currentTime + 1.1;
      while (this.nextNoteAt < horizon) {
        const freq = this.pattern[this.synthNoteIndex % this.pattern.length];
        this.playTone(freq, this.nextNoteAt, 0.34, 0.055, "triangle", 1200);
        if (this.synthNoteIndex % 4 === 0) {
          this.playTone(freq / 2, this.nextNoteAt, 0.48, 0.035, "sine", 700);
        }
        this.synthNoteIndex += 1;
        this.nextNoteAt += 0.31;
      }
    },

    playTone(freq, at, duration, gainValue, type = "sine", filterFreq = 2000) {
      if (!this.context) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, at);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.992), at + duration);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(gainValue, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);
      osc.start(at);
      osc.stop(at + duration + 0.04);
    },

    startRolling() {
      if (!this.context || this.isMutedByPause || this.rollNoise) return;
      const bufferSize = 2 * this.context.sampleRate;
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        const t = i / this.context.sampleRate;
        // Soft granular rumble, deliberately non-comedic.
        data[i] = (Math.random() * 2 - 1) * 0.24 * (0.65 + 0.35 * Math.sin(t * 68));
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 210;
      const gain = this.context.createGain();
      gain.gain.value = 0.018;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);
      source.start();
      this.rollNoise = source;
      this.rollGain = gain;
    },

    stopRolling() {
      if (!this.rollNoise) return;
      try { this.rollNoise.stop(); } catch (err) {}
      this.rollNoise = null;
      this.rollGain = null;
    },

    hitPins(count = 1) {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      const hits = Math.min(8, Math.max(1, count));
      for (let i = 0; i < hits; i += 1) {
        this.playTone(150 + i * 24, now + i * 0.025, 0.18, 0.08, "square", 600);
        this.playTone(420 + i * 30, now + i * 0.032, 0.12, 0.035, "triangle", 1600);
      }
    },

    pinFall(count = 1) {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime + 0.06;
      const falls = Math.min(6, Math.max(1, count));
      for (let i = 0; i < falls; i += 1) {
        this.playTone(260 - i * 14, now + i * 0.055, 0.16, 0.045, "sawtooth", 900);
      }
    },

    reward() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.playTone(f, now + i * 0.085, 0.34, 0.085, "triangle", 1800));
    }
  };

  const rand = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const nowMs = () => performance.now();

  function normalizeAngle(angle) {
    while (angle <= -Math.PI) angle += TAU;
    while (angle > Math.PI) angle -= TAU;
    return angle;
  }

  function angleDistance(a, b) {
    return Math.abs(normalizeAngle(a - b));
  }

  function resize() {
    view.dpr = Math.max(1, Math.min(2.4, window.devicePixelRatio || 1));
    view.w = Math.max(320, window.innerWidth || 720);
    view.h = Math.max(480, window.innerHeight || 1080);
    canvas.width = Math.floor(view.w * view.dpr);
    canvas.height = Math.floor(view.h * view.dpr);
    canvas.style.width = `${view.w}px`;
    canvas.style.height = `${view.h}px`;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    computeLayout();
  }

  function computeLayout() {
    layout.unit = clamp(Math.min(view.w / 15.8, view.h / 26.0), 22, 42);
    layout.topBand = clamp(view.h * 0.085, 60, 104);
    layout.playTop = layout.topBand + layout.unit * 1.05;
    layout.rollerY = view.h - Math.max(54, view.h * 0.078);
    layout.rollerX = view.w * 0.50;
    layout.ballR = clamp(layout.unit * 0.86, 22, 34);
    layout.pinH = clamp(layout.unit * 1.68, 44, 70);
    layout.pinW = layout.pinH * 0.43;
    layout.launcherZoneTop = layout.rollerY - layout.unit * 4.65;
    layout.playBottom = layout.launcherZoneTop - layout.unit * 0.25;
    layout.wallLeft = layout.ballR + 8;
    layout.wallRight = view.w - layout.ballR - 8;

    // Same relative mascot placement as Bubble Shooter v0.9 snippets: launcherX - radius*3.15.
    layout.catX = layout.rollerX - layout.ballR * 3.15;
    layout.catY = layout.rollerY + layout.ballR * 0.12;

    layout.textW = clamp(view.w * 0.30, 150, 240);
    layout.textH = clamp(view.h * 0.14, 112, 164);
    layout.textX = Math.min(view.w - layout.textW - 16, layout.rollerX + layout.ballR * 2.65);
    layout.textY = Math.min(view.h - layout.textH - 22, layout.rollerY - layout.textH * 0.62);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(resize, 150), { passive: true });

  function startLevel() {
    game.level += 1;
    game.pins = [];
    game.ball = null;
    game.pathPreview = [];
    game.phase = currentTitleAlpha(nowMs()) > 0.01 ? "title" : "playing";
    game.forceHitNext = false;
    game.particles = [];
    game.messageIndex = (game.level - 1) % messages.length;
    game.message = messages[game.messageIndex];
    generatePins();
  }

  function generatePins() {
    const count = randInt(16, 24);
    const minSep = layout.pinH * 0.76;
    const left = layout.wallLeft + layout.pinW * 0.45;
    const right = layout.wallRight - layout.pinW * 0.45;
    const top = layout.playTop + layout.pinH * 0.35;
    const bottom = Math.max(top + 160, layout.playBottom - layout.pinH * 0.35);

    const anchors = [];
    const groupCount = randInt(7, 10);
    for (let i = 0; i < groupCount; i += 1) {
      anchors.push({ x: rand(left, right), y: rand(top, bottom) });
    }

    let attempts = 0;
    while (game.pins.length < count && attempts < 900) {
      attempts += 1;
      const group = anchors[randInt(0, anchors.length - 1)];
      const mode = Math.random();
      let x = group.x + rand(-layout.pinH * 1.15, layout.pinH * 1.15);
      let y = group.y + rand(-layout.pinH * 0.90, layout.pinH * 0.90);
      if (mode < 0.22) {
        x = rand(left, right);
        y = rand(top, bottom);
      }
      x = clamp(x, left, right);
      y = clamp(y, top, bottom);

      const candidate = { x, y };
      const tooClose = game.pins.some(p => Math.hypot(p.x - x, p.y - y) < minSep * rand(0.82, 1.26));
      if (tooClose) continue;
      game.pins.push(createPin(x, y, game.pins.length));
    }

    // If the device is small and spacing prevented enough pins, fill with looser spacing.
    attempts = 0;
    while (game.pins.length < count && attempts < 600) {
      attempts += 1;
      const x = rand(left, right);
      const y = rand(top, bottom);
      const tooClose = game.pins.some(p => Math.hypot(p.x - x, p.y - y) < minSep * 0.68);
      if (!tooClose) game.pins.push(createPin(x, y, game.pins.length));
    }
  }

  function createPin(x, y, index) {
    return {
      id: `p${game.level}-${index}-${Math.random().toString(16).slice(2)}`,
      x,
      y,
      baseX: x,
      baseY: y,
      vx: 0,
      vy: 0,
      angle: rand(-0.025, 0.025),
      angularVelocity: 0,
      wobble: rand(0, TAU),
      fallen: false,
      falling: false,
      hitAt: 0,
      chainDepth: 0,
      scale: rand(0.94, 1.08)
    };
  }

  function currentTitleAlpha(current) {
    const elapsed = current - game.titleStartedAt;
    if (elapsed <= TITLE_HOLD_MS) return 1;
    return clamp(1 - (elapsed - TITLE_HOLD_MS) / TITLE_FADE_MS, 0, 1);
  }

  function pointerToGame(evt) {
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  function pointInCat(p) {
    const s = layout.ballR * 0.84;
    return Math.hypot(p.x - layout.catX, p.y - (layout.catY - s * 0.26)) < s * 1.55;
  }

  function onPointerDown(evt) {
    evt.preventDefault();
    const p = pointerToGame(evt);

    if (game.phase === "paused") {
      resumeFromPause();
      return;
    }

    if (pointInCat(p)) {
      beginCatHold(p, evt.pointerId);
      return;
    }

    if (currentTitleAlpha(nowMs()) > 0.12) return;
    if (game.phase !== "playing" || game.ball) return;
    if (p.y > layout.launcherZoneTop) return;

    audio.start();
    fireBall(p);
  }

  function onPointerMove(evt) {
    if (!game.hold) return;
    const p = pointerToGame(evt);
    if (!pointInCat(p)) cancelCatHold();
  }

  function onPointerUp(evt) {
    if (game.hold && game.hold.pointerId === evt.pointerId) cancelCatHold();
  }

  function beginCatHold(p, pointerId) {
    cancelCatHold();
    game.hold = { startedAt: nowMs(), pointerId };
    game.hold.timer = window.setTimeout(() => {
      game.hold = null;
      pauseGame("Meowmoon pause");
    }, LONG_PRESS_MS);
  }

  function cancelCatHold() {
    if (!game.hold) return;
    if (game.hold.timer) window.clearTimeout(game.hold.timer);
    game.hold = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("pointermove", onPointerMove, { passive: false });
  canvas.addEventListener("pointerup", onPointerUp, { passive: false });
  canvas.addEventListener("pointercancel", onPointerUp, { passive: false });

  function scheduleAutoPause() {
    if (game.phase === "paused") return;
    if (game.pauseTimer) window.clearTimeout(game.pauseTimer);
    game.pauseTimer = window.setTimeout(() => pauseGame("automatic pause"), AUTO_PAUSE_GRACE_MS);
  }

  function clearAutoPause() {
    if (game.pauseTimer) window.clearTimeout(game.pauseTimer);
    game.pauseTimer = null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) scheduleAutoPause();
    else clearAutoPause();
  });
  window.addEventListener("blur", scheduleAutoPause, { passive: true });
  window.addEventListener("focus", clearAutoPause, { passive: true });
  window.addEventListener("pagehide", scheduleAutoPause, { passive: true });

  function pauseGame(reason) {
    if (game.phase === "paused") return;
    clearAutoPause();
    cancelCatHold();
    game.previousPhase = game.phase === "title" ? "playing" : game.phase;
    game.phase = "paused";
    game.pausedAt = nowMs();
    audio.pauseMusic();
  }

  function resumeFromPause() {
    if (game.phase !== "paused") return;
    const pausedDuration = nowMs() - game.pausedAt;
    // Shift timers forward so animations do not jump.
    game.titleStartedAt += pausedDuration;
    game.rewardStartedAt += pausedDuration;
    game.nextLevelAt += pausedDuration;
    for (const p of game.particles) p.startedAt += pausedDuration;
    for (const pin of game.pins) pin.hitAt += pausedDuration;
    game.phase = game.previousPhase || "playing";
    if (game.phase === "title") game.phase = "playing";
    audio.resumeMusic();
    if (game.ball) audio.startRolling();
  }

  function fireBall(tap) {
    const targetInfo = chooseAssistedTarget(tap);
    if (!targetInfo) return;
    game.pathPreview = targetInfo.path;
    game.ball = {
      x: layout.rollerX,
      y: layout.rollerY - layout.ballR * 0.55,
      r: layout.ballR,
      path: targetInfo.path,
      segment: 0,
      distanceOnSegment: 0,
      targetPinId: targetInfo.pin ? targetInfo.pin.id : null,
      guaranteed: targetInfo.guaranteed,
      spin: 0,
      missed: false,
      colorSeed: game.nextBallSeed++
    };
    game.phase = "rolling";
    audio.startRolling();
  }

  function chooseAssistedTarget(tap) {
    const start = { x: layout.rollerX, y: layout.rollerY - layout.ballR * 0.55 };
    const uprightPins = game.pins.filter(p => !p.fallen && !p.falling);
    if (!uprightPins.length) return null;

    const rawAngle = Math.atan2(tap.y - start.y, tap.x - start.x);
    const scored = [];

    for (const pin of uprightPins) {
      const aimPoint = { x: pin.x, y: pin.y + layout.pinH * 0.16 };
      const options = pathOptionsTo(start, aimPoint);
      for (const opt of options) {
        const targetCloseness = Math.hypot(tap.x - aimPoint.x, tap.y - aimPoint.y) / Math.max(320, view.h);
        const angleScore = angleDistance(rawAngle, opt.initialAngle);
        const nearEdgeBonus = (pin.x < view.w * 0.17 || pin.x > view.w * 0.83) && opt.bounce ? -0.04 : 0;
        const guaranteedBonus = game.forceHitNext ? -0.65 : 0;
        const score = angleScore + targetCloseness * 0.44 + (opt.bounce ? 0.055 : 0) + nearEdgeBonus + guaranteedBonus;
        scored.push({ pin, path: opt.points, score, guaranteed: game.forceHitNext });
      }
    }

    scored.sort((a, b) => a.score - b.score);
    const best = scored[0];

    // If the child clearly aims at empty sky and the previous roll was not a miss,
    // allow a gentle miss sometimes. The next roll is then forced to be a hit.
    const nearestPinDist = Math.min(...uprightPins.map(pin => Math.hypot(tap.x - pin.x, tap.y - pin.y)));
    const emptySkyTap = nearestPinDist > layout.pinH * 2.7 && !game.forceHitNext;
    if (emptySkyTap && Math.random() < 0.18) {
      const missPath = missPathForTap(start, tap);
      return { pin: null, path: missPath, guaranteed: false };
    }

    return best;
  }

  function pathOptionsTo(start, point) {
    const options = [];
    const directAngle = Math.atan2(point.y - start.y, point.x - start.x);
    options.push({ points: [start, point], initialAngle: directAngle, bounce: false });

    const walls = [layout.wallLeft, layout.wallRight];
    for (const wallX of walls) {
      const mirrorX = wallX === layout.wallLeft ? (wallX * 2 - point.x) : (wallX * 2 - point.x);
      const mirror = { x: mirrorX, y: point.y };
      const denom = mirror.x - start.x;
      if (Math.abs(denom) < 1) continue;
      const t = (wallX - start.x) / denom;
      const bounceY = start.y + (mirror.y - start.y) * t;
      if (t > 0.06 && t < 0.94 && bounceY > layout.playTop - layout.pinH && bounceY < start.y - layout.ballR * 1.8) {
        const bounce = { x: wallX, y: bounceY };
        const initialAngle = Math.atan2(bounce.y - start.y, bounce.x - start.x);
        options.push({ points: [start, bounce, point], initialAngle, bounce: true });
      }
    }
    return options;
  }

  function missPathForTap(start, tap) {
    let angle = Math.atan2(tap.y - start.y, tap.x - start.x);
    // Keep shots generally upward.
    angle = clamp(angle, -Math.PI * 0.93, -Math.PI * 0.07);
    const end = projectedEdgePoint(start, angle);
    return [start, end];
  }

  function projectedEdgePoint(start, angle) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const candidates = [];
    if (dx < -0.001) candidates.push((layout.wallLeft - start.x) / dx);
    if (dx > 0.001) candidates.push((layout.wallRight - start.x) / dx);
    if (dy < -0.001) candidates.push((layout.playTop - layout.pinH * 1.2 - start.y) / dy);
    const t = Math.min(...candidates.filter(v => v > 20));
    return { x: start.x + dx * t, y: start.y + dy * t };
  }

  function update(current) {
    if (game.phase === "paused") return;
    const dt = clamp((current - lastFrame) / 1000, 0, 0.035);
    updateBall(dt);
    updatePins(current, dt);
    updateParticles(current, dt);
    updateReward(current);
  }

  function updateBall(dt) {
    if (!game.ball || game.phase !== "rolling") return;
    const ball = game.ball;
    ball.spin += dt * 7.5;
    let remaining = BALL_SPEED * dt;

    while (remaining > 0 && ball.segment < ball.path.length - 1) {
      const a = ball.path[ball.segment];
      const b = ball.path[ball.segment + 1];
      const segmentLength = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const left = segmentLength - ball.distanceOnSegment;
      const step = Math.min(left, remaining);
      ball.distanceOnSegment += step;
      remaining -= step;
      const t = ball.distanceOnSegment / segmentLength;
      ball.x = lerp(a.x, b.x, t);
      ball.y = lerp(a.y, b.y, t);

      const hitPin = detectBallPinHit(ball);
      if (hitPin) {
        resolveBallHit(hitPin);
        return;
      }

      if (ball.distanceOnSegment >= segmentLength - 0.5) {
        ball.segment += 1;
        ball.distanceOnSegment = 0;
        ball.x = b.x;
        ball.y = b.y;
      }
    }

    if (ball.segment >= ball.path.length - 1) {
      const target = ball.targetPinId ? game.pins.find(p => p.id === ball.targetPinId && !p.fallen && !p.falling) : null;
      if (target && ball.guaranteed) {
        resolveBallHit(target);
      } else {
        resolveMiss();
      }
    }
  }

  function detectBallPinHit(ball) {
    for (const pin of game.pins) {
      if (pin.fallen || pin.falling) continue;
      const hitRadius = layout.ballR * 0.78 + layout.pinW * 0.62;
      const targetPoint = { x: pin.x, y: pin.y + layout.pinH * 0.10 };
      if (Math.hypot(ball.x - targetPoint.x, ball.y - targetPoint.y) <= hitRadius) return pin;
    }
    return null;
  }

  function resolveBallHit(pin) {
    audio.stopRolling();
    const knocked = knockPinsFrom(pin);
    game.ball = null;
    game.pathPreview = [];
    game.forceHitNext = false;
    game.phase = "resolving";
    game.message = messages[(++game.messageIndex) % messages.length];
    audio.hitPins(knocked.length);
    audio.pinFall(knocked.length);
    makeImpactParticles(pin.x, pin.y, knocked.length);
    game.resolvingUntil = nowMs() + 560;
  }

  function resolveMiss() {
    audio.stopRolling();
    game.ball = null;
    game.pathPreview = [];
    game.forceHitNext = true;
    game.phase = "playing";
    game.message = "Good try!\nThe next roll will help.";
  }

  function knockPinsFrom(firstPin) {
    const remainingBefore = remainingUprightCount();
    const knocked = [];
    const queue = [{ pin: firstPin, depth: 0, power: 1 }];
    const seen = new Set();
    const current = nowMs();

    while (queue.length) {
      const item = queue.shift();
      const pin = item.pin;
      if (!pin || seen.has(pin.id) || pin.fallen || pin.falling) continue;
      seen.add(pin.id);
      knockOnePin(pin, item.depth, item.power, current);
      knocked.push(pin);

      const neighbors = game.pins
        .filter(p => !p.fallen && !p.falling && !seen.has(p.id))
        .map(p => ({ pin: p, d: Math.hypot(p.x - pin.x, p.y - pin.y) }))
        .filter(o => o.d < layout.pinH * (item.depth === 0 ? 1.45 : 1.15))
        .sort((a, b) => a.d - b.d);

      for (const n of neighbors) {
        const baseChance = item.depth === 0 ? 0.42 : 0.22;
        const distanceFactor = clamp(1 - n.d / (layout.pinH * 1.55), 0, 1);
        const chance = baseChance * (0.42 + distanceFactor) * item.power;
        if (Math.random() < chance) {
          queue.push({ pin: n.pin, depth: item.depth + 1, power: item.power * 0.67 });
        }
      }
    }

    // Chain reactions that clear the whole level are intentionally rare.
    if (remainingBefore > 3 && knocked.length >= remainingBefore && Math.random() > 0.10) {
      const saveCount = randInt(1, Math.min(3, knocked.length - 1));
      const saved = knocked.splice(knocked.length - saveCount, saveCount);
      for (const pin of saved) restorePin(pin);
    }

    return knocked;
  }

  function knockOnePin(pin, depth, power, current) {
    pin.falling = true;
    pin.hitAt = current + depth * 70;
    const direction = Math.random() < 0.5 ? -1 : 1;
    pin.vx = direction * rand(18, 50) * power;
    pin.vy = rand(-12, 18) * power;
    pin.angularVelocity = direction * rand(1.6, 2.8) * (0.8 + power);
    pin.chainDepth = depth;
  }

  function restorePin(pin) {
    pin.falling = false;
    pin.fallen = false;
    pin.x = pin.baseX;
    pin.y = pin.baseY;
    pin.vx = 0;
    pin.vy = 0;
    pin.angle = rand(-0.025, 0.025);
    pin.angularVelocity = 0;
    pin.hitAt = 0;
    pin.chainDepth = 0;
  }

  function updatePins(current, dt) {
    for (const pin of game.pins) {
      if (!pin.falling) continue;
      if (current < pin.hitAt) continue;
      pin.x += pin.vx * dt;
      pin.y += pin.vy * dt;
      pin.vy += 80 * dt;
      pin.angle += pin.angularVelocity * dt;
      const targetAngle = pin.angularVelocity >= 0 ? Math.PI * 0.53 : -Math.PI * 0.53;
      if (Math.abs(pin.angle) >= Math.abs(targetAngle)) {
        pin.angle = targetAngle;
        pin.falling = false;
        pin.fallen = true;
        pin.vx *= 0.22;
        pin.vy = 0;
      }
    }
  }

  function remainingUprightCount() {
    return game.pins.filter(p => !p.fallen && !p.falling).length;
  }

  function beginReward() {
    game.phase = "reward";
    game.rewardStartedAt = nowMs();
    game.nextLevelAt = game.rewardStartedAt + LEVEL_REWARD_MS + NEXT_LEVEL_DELAY_MS;
    game.message = "MEOW!\nYou knocked them down!";
    audio.reward();
    for (let i = 0; i < 80; i += 1) {
      game.particles.push({
        x: rand(view.w * 0.14, view.w * 0.86),
        y: rand(view.h * 0.18, view.h * 0.45),
        vx: rand(-90, 90),
        vy: rand(-130, 70),
        size: rand(4, 11),
        color: ["#fff7a8", "#ffffff", "#7bdfff", "#ff9acb", "#8d63ff"][randInt(0, 4)],
        shape: Math.random() < 0.56 ? "star" : "confetti",
        spin: rand(-5, 5),
        startedAt: nowMs(),
        duration: rand(1200, 2300)
      });
    }
  }

  function updateReward(current) {
    if (game.phase === "resolving" && current >= game.resolvingUntil) {
      if (remainingUprightCount() === 0) beginReward();
      else game.phase = "playing";
    }
    if (game.phase === "reward" && current >= game.nextLevelAt) startLevel();
  }

  function makeImpactParticles(x, y, strength) {
    const count = clamp(8 + strength * 4, 10, 34);
    for (let i = 0; i < count; i += 1) {
      game.particles.push({
        x,
        y,
        vx: rand(-120, 120),
        vy: rand(-130, 85),
        size: rand(3, 8),
        color: ["#ffffff", "#ffe36d", "#ef3340", "#bfeaff"][randInt(0, 3)],
        shape: Math.random() < 0.5 ? "star" : "confetti",
        spin: rand(-5, 5),
        startedAt: nowMs(),
        duration: rand(380, 850)
      });
    }
  }

  function updateParticles(current, dt) {
    for (const p of game.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 82 * dt;
      p.spin += dt * 4;
    }
    game.particles = game.particles.filter(p => current - p.startedAt < p.duration + 80);
  }

  function render(current) {
    drawBackground();
    drawTitleBar();
    drawPathPreview();
    drawPins(current);
    drawParticles(current);
    drawMascot();
    drawRoller();
    if (!game.ball && game.phase !== "reward") drawLoadedBall(layout.rollerX, layout.rollerY - layout.ballR * 0.60, layout.ballR, 0, game.nextBallSeed);
    drawBall();
    drawTextBox();
    drawHoldProgress(current);
    drawReward(current);
    drawTitleOverlay(current);
    if (game.phase === "paused") drawPauseOverlay();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, view.h);
    sky.addColorStop(0, "#35b9ff");
    sky.addColorStop(0.47, "#a6ecff");
    sky.addColorStop(1, "#effdff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, view.w, view.h);

    drawCloud(view.w * 0.10, view.h * 0.16, layout.unit * 1.34, 0.36);
    drawCloud(view.w * 0.85, view.h * 0.12, layout.unit * 1.25, 0.35);
    drawCloud(view.w * 0.46, view.h * 0.08, layout.unit * 0.92, 0.22);
    drawCloud(view.w * 0.30, view.h * 0.58, layout.unit * 1.15, 0.18);
    drawCloud(view.w * 0.72, view.h * 0.62, layout.unit * 1.05, 0.17);

    ctx.save();
    ctx.globalAlpha = 0.22;
    const glow = ctx.createRadialGradient(view.w * 0.5, view.h * 0.39, layout.unit, view.w * 0.5, view.h * 0.39, view.w * 0.56);
    glow.addColorStop(0, "rgba(255,255,255,0.82)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();

    drawBottomClouds();
  }

  function drawCloud(x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - size * 0.75, y + size * 0.10, size * 0.52, 0, TAU);
    ctx.arc(x - size * 0.22, y - size * 0.16, size * 0.64, 0, TAU);
    ctx.arc(x + size * 0.40, y, size * 0.54, 0, TAU);
    ctx.arc(x + size * 0.86, y + size * 0.14, size * 0.42, 0, TAU);
    ctx.rect(x - size * 1.22, y, size * 2.35, size * 0.60);
    ctx.fill();
    ctx.restore();
  }

  function drawBottomClouds() {
    const y = view.h - layout.unit * 1.1;
    drawCloud(view.w * 0.12, y, layout.unit * 1.9, 0.72);
    drawCloud(view.w * 0.42, y + layout.unit * 0.15, layout.unit * 2.05, 0.62);
    drawCloud(view.w * 0.78, y + layout.unit * 0.12, layout.unit * 2.0, 0.62);
  }

  function drawTitleBar() {
    const size = clamp(view.w * 0.072, 26, 55);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `1000 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.lineWidth = Math.max(4, size * 0.10);
    ctx.strokeStyle = "rgba(52, 47, 145, 0.72)";
    ctx.fillStyle = "#ffe36d";
    ctx.strokeText("Meowmoon", view.w / 2, layout.topBand * 0.43);
    ctx.fillText("Meowmoon", view.w / 2, layout.topBand * 0.43);

    ctx.font = `900 ${size * 0.52}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("BOWLING", view.w / 2, layout.topBand * 0.80);
    ctx.fillText("BOWLING", view.w / 2, layout.topBand * 0.80);

    drawMoon(view.w - layout.unit * 1.45, layout.unit * 1.06, layout.unit * 0.72);
    drawTinyStar(layout.unit * 1.0, layout.unit * 1.05, layout.unit * 0.28, "#fff7a8");
    drawTinyStar(view.w * 0.18, layout.unit * 2.05, layout.unit * 0.20, "#fff7a8");
    ctx.restore();
  }

  function drawMoon(x, y, r) {
    ctx.save();
    ctx.fillStyle = "#ffe893";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x - r * 0.34, y - r * 0.08, r * 0.96, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(104,77,142,0.42)";
    ctx.beginPath();
    ctx.arc(x + r * 0.26, y + r * 0.02, r * 0.06, 0, TAU);
    ctx.arc(x + r * 0.42, y + r * 0.22, r * 0.045, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawTinyStar(x, y, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    drawStar(x, y, r, r * 0.42, 5);
    ctx.restore();
  }

  function drawPathPreview() {
    if (!game.ball || !game.ball.path || game.ball.path.length < 2) return;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "#5534ca";
    ctx.lineWidth = Math.max(2, layout.unit * 0.08);
    ctx.setLineDash([7, 11]);
    ctx.beginPath();
    ctx.moveTo(game.ball.path[0].x, game.ball.path[0].y);
    for (let i = 1; i < game.ball.path.length; i += 1) ctx.lineTo(game.ball.path[i].x, game.ball.path[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function drawPins(current) {
    const ordered = game.pins.slice().sort((a, b) => a.y - b.y);
    for (const pin of ordered) drawPin(pin, current);
  }

  function drawPin(pin, current) {
    const w = layout.pinW * pin.scale;
    const h = layout.pinH * pin.scale;
    let x = pin.x;
    let y = pin.y;
    let angle = pin.angle;
    if (!pin.falling && !pin.fallen) {
      y += Math.sin(current / 900 + pin.wobble) * 0.7;
    }
    const shadowAlpha = pin.fallen ? 0.16 : 0.23;

    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = "#315e8f";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.05, y + h * 0.58, w * 0.78, h * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const body = ctx.createLinearGradient(-w * 0.62, -h * 0.52, w * 0.78, h * 0.62);
    body.addColorStop(0, "#d9d7d2");
    body.addColorStop(0.22, "#ffffff");
    body.addColorStop(0.62, "#f9f8f2");
    body.addColorStop(1, "#c9c6bc");

    ctx.fillStyle = body;
    ctx.strokeStyle = "rgba(125,118,105,0.45)";
    ctx.lineWidth = Math.max(1.2, w * 0.055);

    ctx.beginPath();
    ctx.moveTo(0, -h * 0.55);
    ctx.bezierCurveTo(w * 0.38, -h * 0.54, w * 0.44, -h * 0.22, w * 0.20, -h * 0.11);
    ctx.bezierCurveTo(w * 0.64, h * 0.03, w * 0.62, h * 0.42, w * 0.31, h * 0.52);
    ctx.bezierCurveTo(w * 0.16, h * 0.59, -w * 0.16, h * 0.59, -w * 0.31, h * 0.52);
    ctx.bezierCurveTo(-w * 0.62, h * 0.42, -w * 0.64, h * 0.03, -w * 0.20, -h * 0.11);
    ctx.bezierCurveTo(-w * 0.44, -h * 0.22, -w * 0.38, -h * 0.54, 0, -h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Classic red neck bands clipped to body shape.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.55);
    ctx.bezierCurveTo(w * 0.38, -h * 0.54, w * 0.44, -h * 0.22, w * 0.20, -h * 0.11);
    ctx.bezierCurveTo(w * 0.38, -h * 0.05, w * 0.39, h * 0.01, w * 0.30, h * 0.06);
    ctx.lineTo(-w * 0.30, h * 0.06);
    ctx.bezierCurveTo(-w * 0.39, h * 0.01, -w * 0.38, -h * 0.05, -w * 0.20, -h * 0.11);
    ctx.bezierCurveTo(-w * 0.44, -h * 0.22, -w * 0.38, -h * 0.54, 0, -h * 0.55);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#d91622";
    ctx.fillRect(-w * 0.40, -h * 0.24, w * 0.80, h * 0.065);
    ctx.fillRect(-w * 0.37, -h * 0.135, w * 0.74, h * 0.058);
    ctx.restore();

    // Highlights.
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-w * 0.18, -h * 0.27, w * 0.10, h * 0.20, -0.24, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.20;
    ctx.beginPath();
    ctx.ellipse(-w * 0.13, h * 0.16, w * 0.15, h * 0.25, -0.17, 0, TAU);
    ctx.fill();

    // Base ring.
    ctx.globalAlpha = 0.82;
    ctx.strokeStyle = "rgba(110,80,45,0.40)";
    ctx.lineWidth = Math.max(1, w * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, h * 0.52, w * 0.30, h * 0.045, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawRoller() {
    const x = layout.rollerX;
    const y = layout.rollerY;
    const r = layout.ballR;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const baseGrad = ctx.createLinearGradient(x - r * 2.0, y - r * 0.8, x + r * 2.0, y + r * 1.3);
    baseGrad.addColorStop(0, "#b99aff");
    baseGrad.addColorStop(0.55, "#8058dc");
    baseGrad.addColorStop(1, "#5130a8");
    ctx.fillStyle = baseGrad;
    ctx.strokeStyle = "rgba(55,35,125,0.62)";
    ctx.lineWidth = Math.max(2, r * 0.08);
    roundRect(ctx, x - r * 1.55, y - r * 0.16, r * 3.10, r * 1.15, r * 0.34);
    ctx.fill();
    ctx.stroke();

    const railGrad = ctx.createLinearGradient(x - r * 1.8, y - r * 1.35, x + r * 1.8, y + r * 0.2);
    railGrad.addColorStop(0, "#ffe36d");
    railGrad.addColorStop(1, "#ffb739");
    ctx.fillStyle = railGrad;
    roundRect(ctx, x - r * 1.75, y - r * 1.03, r * 0.64, r * 1.14, r * 0.28);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, x + r * 1.11, y - r * 1.03, r * 0.64, r * 1.14, r * 0.28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#236dcc";
    ctx.beginPath();
    ctx.arc(x, y + r * 0.56, r * 0.52, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffe36d";
    drawPaw(x, y + r * 0.55, r * 0.34);
    ctx.restore();
  }

  function drawLoadedBall(x, y, r, spin, seed = 0) {
    ctx.save();
    const grad = ctx.createRadialGradient(x - r * 0.34, y - r * 0.42, r * 0.14, x, y, r * 1.12);
    grad.addColorStop(0, "#cbe9ff");
    grad.addColorStop(0.18, "#2476c9");
    grad.addColorStop(0.56, "#0d3b83");
    grad.addColorStop(1, "#071b45");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.46)";
    ctx.lineWidth = Math.max(1.5, r * 0.055);
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin * 0.45 + seed * 0.2);
    ctx.fillStyle = "rgba(2,9,28,0.88)";
    ctx.beginPath();
    ctx.arc(r * 0.12, -r * 0.34, r * 0.14, 0, TAU);
    ctx.arc(r * 0.40, -r * 0.14, r * 0.13, 0, TAU);
    ctx.arc(r * 0.04, r * 0.11, r * 0.15, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 0.42;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x - r * 0.31, y - r * 0.45, r * 0.22, r * 0.10, -0.35, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBall() {
    if (!game.ball) return;
    drawLoadedBall(game.ball.x, game.ball.y, game.ball.r, game.ball.spin, game.ball.colorSeed);
  }

  function drawMascot() {
    const x = layout.catX;
    const y = layout.catY;
    const s = layout.ballR * 0.84;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Tail behind body. This follows the v0.9 drawn-mascot geometry available in snippets.
    ctx.strokeStyle = "#d9651f";
    ctx.lineWidth = s * 0.28;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y + s * 0.18);
    ctx.bezierCurveTo(x - s * 1.45, y - s * 0.2, x - s * 1.2, y - s * 1.25, x - s * 0.42, y - s * 0.88);
    ctx.stroke();

    const bodyGrad = ctx.createRadialGradient(x - s * 0.18, y - s * 0.48, s * 0.2, x, y, s * 1.2);
    bodyGrad.addColorStop(0, "#ffbd63");
    bodyGrad.addColorStop(1, "#f07b28");
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = "#b74f18";
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.12, s * 0.62, s * 0.78, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y - s * 0.65, s * 0.58, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Ears.
    ctx.fillStyle = "#f07b28";
    ctx.beginPath();
    ctx.moveTo(x - s * 0.42, y - s * 1.03);
    ctx.lineTo(x - s * 0.72, y - s * 1.44);
    ctx.lineTo(x - s * 0.14, y - s * 1.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.42, y - s * 1.03);
    ctx.lineTo(x + s * 0.72, y - s * 1.44);
    ctx.lineTo(x + s * 0.14, y - s * 1.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffd1b4";
    ctx.beginPath();
    ctx.moveTo(x - s * 0.42, y - s * 1.10);
    ctx.lineTo(x - s * 0.58, y - s * 1.30);
    ctx.lineTo(x - s * 0.25, y - s * 1.17);
    ctx.closePath();
    ctx.moveTo(x + s * 0.42, y - s * 1.10);
    ctx.lineTo(x + s * 0.58, y - s * 1.30);
    ctx.lineTo(x + s * 0.25, y - s * 1.17);
    ctx.closePath();
    ctx.fill();

    // Face.
    ctx.fillStyle = "#3b245f";
    ctx.beginPath();
    ctx.arc(x - s * 0.22, y - s * 0.72, s * 0.055, 0, TAU);
    ctx.arc(x + s * 0.22, y - s * 0.72, s * 0.055, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#3b245f";
    ctx.lineWidth = s * 0.045;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.06, y - s * 0.56);
    ctx.quadraticCurveTo(x, y - s * 0.50, x + s * 0.06, y - s * 0.56);
    ctx.stroke();

    ctx.fillStyle = "#fff5dd";
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.52, s * 0.11, s * 0.07, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(80,46,92,0.65)";
    ctx.lineWidth = s * 0.028;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * s * 0.18, y - s * 0.53);
      ctx.lineTo(x + side * s * 0.56, y - s * 0.62);
      ctx.moveTo(x + side * s * 0.18, y - s * 0.48);
      ctx.lineTo(x + side * s * 0.58, y - s * 0.46);
      ctx.stroke();
    }

    // Paws.
    ctx.fillStyle = "#fff5dd";
    ctx.strokeStyle = "#b74f18";
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.arc(x - s * 0.28, y + s * 0.38, s * 0.13, 0, TAU);
    ctx.arc(x + s * 0.28, y + s * 0.38, s * 0.13, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Moon collar.
    ctx.fillStyle = "#ffe36d";
    ctx.beginPath();
    ctx.arc(x, y - s * 0.02, s * 0.13, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f07b28";
    ctx.beginPath();
    ctx.arc(x + s * 0.04, y - s * 0.06, s * 0.13, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawTextBox() {
    const { textX: x, textY: y, textW: w, textH: h } = layout;
    ctx.save();
    ctx.fillStyle = "rgba(255, 252, 221, 0.94)";
    ctx.strokeStyle = "rgba(122, 73, 205, 0.62)";
    ctx.lineWidth = Math.max(2, layout.unit * 0.06);
    roundRect(ctx, x, y, w, h, layout.unit * 0.32);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffe36d";
    drawStar(x + layout.unit * 0.17, y + layout.unit * 0.12, layout.unit * 0.30, layout.unit * 0.14, 5);
    ctx.fillStyle = "#70c8ff";
    drawStar(x + w - layout.unit * 0.25, y + h - layout.unit * 0.20, layout.unit * 0.26, layout.unit * 0.12, 5);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = game.message.split("\n");
    const fontSize = clamp(w * 0.108, 16, 26);
    ctx.font = `850 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.lineWidth = Math.max(2, fontSize * 0.10);
    lines.forEach((line, index) => {
      const yy = y + h * 0.40 + (index - (lines.length - 1) / 2) * fontSize * 1.28;
      ctx.strokeStyle = "rgba(255,255,255,0.74)";
      ctx.fillStyle = index === 0 ? "#6333a7" : "#1264c8";
      ctx.strokeText(line, x + w / 2, yy);
      ctx.fillText(line, x + w / 2, yy);
    });
    ctx.restore();
  }

  function drawHoldProgress(current) {
    if (!game.hold) return;
    const t = clamp((current - game.hold.startedAt) / LONG_PRESS_MS, 0, 1);
    const s = layout.ballR * 0.84;
    ctx.save();
    ctx.strokeStyle = "rgba(94, 56, 180, 0.80)";
    ctx.lineWidth = Math.max(3, s * 0.10);
    ctx.beginPath();
    ctx.arc(layout.catX, layout.catY - s * 0.38, s * 1.08, -Math.PI / 2, -Math.PI / 2 + TAU * t);
    ctx.stroke();
    ctx.restore();
  }

  function drawReward(current) {
    if (game.phase !== "reward") return;
    const t = clamp((current - game.rewardStartedAt) / LEVEL_REWARD_MS, 0, 1);
    const pulse = 1 + Math.sin(t * Math.PI * 5) * 0.035;
    const alpha = t < 0.82 ? 1 : clamp(1 - (t - 0.82) / 0.18, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = clamp(view.w * 0.20, 72, 150) * pulse;
    ctx.font = `1000 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.lineWidth = Math.max(7, size * 0.08);
    ctx.strokeStyle = "rgba(71, 55, 160, 0.72)";
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("MEOW!", view.w / 2, view.h * 0.43);
    ctx.fillText("MEOW!", view.w / 2, view.h * 0.43);
    ctx.restore();
  }

  function drawTitleOverlay(current) {
    const alpha = currentTitleAlpha(current);
    if (alpha <= 0) {
      if (game.phase === "title") game.phase = "playing";
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    const bg = ctx.createLinearGradient(0, 0, 0, view.h);
    bg.addColorStop(0, "rgba(54, 172, 255, 0.94)");
    bg.addColorStop(0.65, "rgba(171, 236, 255, 0.90)");
    bg.addColorStop(1, "rgba(255, 255, 255, 0.78)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, view.w, view.h);

    ctx.globalAlpha = alpha * 0.22;
    drawPins(current);
    drawMascot();
    drawRoller();

    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const titleSize = clamp(view.w * 0.105, 36, 82);
    const y = view.h * 0.34;
    ctx.font = `1000 ${titleSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.lineWidth = Math.max(4, titleSize * 0.11);
    ctx.strokeStyle = "rgba(38, 72, 160, 0.72)";
    ctx.fillStyle = "#ffe36d";
    ctx.strokeText("Meowmoon", view.w / 2, y - titleSize * 0.34);
    ctx.fillText("Meowmoon", view.w / 2, y - titleSize * 0.34);
    ctx.font = `900 ${titleSize * 0.62}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("Bowling", view.w / 2, y + titleSize * 0.52);
    ctx.fillText("Bowling", view.w / 2, y + titleSize * 0.52);
    ctx.font = `750 ${clamp(view.w * 0.044, 17, 28)}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = "#34308b";
    ctx.fillText("Tap anywhere in the sky to roll", view.w / 2, y + titleSize * 1.45);
    ctx.restore();
  }

  function drawPauseOverlay() {
    ctx.save();
    ctx.fillStyle = "rgba(40, 37, 105, 0.42)";
    ctx.fillRect(0, 0, view.w, view.h);

    const panelW = Math.min(view.w * 0.82, 570);
    const panelH = Math.min(view.h * 0.44, 400);
    const x = (view.w - panelW) / 2;
    const y = view.h * 0.28;
    ctx.fillStyle = "rgba(255, 252, 229, 0.97)";
    ctx.strokeStyle = "rgba(111,73,201,0.78)";
    ctx.lineWidth = Math.max(3, layout.unit * 0.08);
    roundRect(ctx, x, y, panelW, panelH, layout.unit * 0.45);
    ctx.fill();
    ctx.stroke();

    drawPauseCat(view.w / 2, y + panelH * 0.34, layout.unit * 1.35);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#4a2b99";
    ctx.font = `900 ${clamp(panelW * 0.075, 25, 40)}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillText("The game is paused.", view.w / 2, y + panelH * 0.62);
    ctx.font = `750 ${clamp(panelW * 0.045, 17, 25)}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = "#1264c8";
    wrapCenteredText("Meowmoon wants to play with you again soon.", view.w / 2, y + panelH * 0.76, panelW * 0.78, clamp(panelW * 0.052, 20, 28));
    ctx.font = `700 ${clamp(panelW * 0.038, 14, 21)}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = "#7a49cd";
    ctx.fillText("Tap anywhere to resume", view.w / 2, y + panelH * 0.91);
    ctx.restore();
  }

  function drawPauseCat(x, y, s) {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.fillStyle = "#f07b28";
    ctx.strokeStyle = "#b74f18";
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.18, s * 0.60, s * 0.66, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - s * 0.45, s * 0.56, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.40, y - s * 0.82);
    ctx.lineTo(x - s * 0.64, y - s * 1.18);
    ctx.lineTo(x - s * 0.12, y - s * 0.96);
    ctx.closePath();
    ctx.moveTo(x + s * 0.40, y - s * 0.82);
    ctx.lineTo(x + s * 0.64, y - s * 1.18);
    ctx.lineTo(x + s * 0.12, y - s * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Raised paws.
    ctx.fillStyle = "#fff5dd";
    ctx.beginPath();
    ctx.arc(x - s * 0.62, y - s * 0.02, s * 0.17, 0, TAU);
    ctx.arc(x + s * 0.62, y - s * 0.02, s * 0.17, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#b74f18";
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.43, y + s * 0.18);
    ctx.lineTo(x - s * 0.60, y - s * 0.02);
    ctx.moveTo(x + s * 0.43, y + s * 0.18);
    ctx.lineTo(x + s * 0.60, y - s * 0.02);
    ctx.stroke();

    ctx.fillStyle = "#3b245f";
    ctx.beginPath();
    ctx.arc(x - s * 0.20, y - s * 0.52, s * 0.055, 0, TAU);
    ctx.arc(x + s * 0.20, y - s * 0.52, s * 0.055, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#3b245f";
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.arc(x, y - s * 0.37, s * 0.18, 0.05, Math.PI - 0.05);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles(current) {
    for (const p of game.particles) {
      const age = current - p.startedAt;
      const alpha = clamp(1 - age / p.duration, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      if (p.shape === "star") drawStar(0, 0, p.size, p.size * 0.44, 5);
      else {
        roundRect(ctx, -p.size * 0.55, -p.size * 0.25, p.size * 1.1, p.size * 0.5, p.size * 0.12);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawStar(x, y, outer, inner, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawPaw(x, y, s) {
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.18, s * 0.34, s * 0.30, 0, 0, TAU);
    ctx.ellipse(x - s * 0.34, y - s * 0.16, s * 0.16, s * 0.19, 0, 0, TAU);
    ctx.ellipse(x - s * 0.11, y - s * 0.31, s * 0.16, s * 0.20, 0, 0, TAU);
    ctx.ellipse(x + s * 0.13, y - s * 0.31, s * 0.16, s * 0.20, 0, 0, TAU);
    ctx.ellipse(x + s * 0.36, y - s * 0.15, s * 0.16, s * 0.19, 0, 0, TAU);
    ctx.fill();
  }

  function roundRect(context, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + w - radius, y);
    context.quadraticCurveTo(x + w, y, x + w, y + radius);
    context.lineTo(x + w, y + h - radius);
    context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    context.lineTo(x + radius, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  function wrapCenteredText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * lineHeight));
  }

  let lastFrame = nowMs();
  function loop(current) {
    update(current);
    lastFrame = current;
    render(current);
    requestAnimationFrame(loop);
  }

  resize();
  startLevel();
  requestAnimationFrame(loop);
})();
