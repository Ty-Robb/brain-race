// ============================================================
//  BRAIN RACE — sound effects (Web Audio, no files needed)
// ============================================================
"use strict";

const Sfx = (() => {
  let ctx = null, master = null, muted = false;
  let engine = null;

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
  }

  function tone(freq, dur, type = "sine", vol = 0.3, when = 0, slideTo = null) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, vol = 0.3, filterFreq = 1200, when = 0, type = "lowpass") {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  const api = {
    init,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.6;
      return muted;
    },
    click() { tone(660, 0.08, "triangle", 0.15); },
    correct() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", 0.25, i * 0.07)); },
    wrong() { tone(220, 0.25, "sawtooth", 0.12); tone(160, 0.35, "sawtooth", 0.12, 0.12); },
    fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.25, "square", 0.12, i * 0.13)); },
    beep(hi) { tone(hi ? 880 : 440, hi ? 0.5 : 0.22, "square", 0.18); },
    pickup() { [880, 1175, 1568].forEach((f, i) => tone(f, 0.12, "triangle", 0.22, i * 0.05)); },
    boost() { noise(0.9, 0.35, 2500, 0, "bandpass"); tone(200, 0.8, "sawtooth", 0.12, 0, 900); },
    crash() { noise(0.4, 0.6, 600); tone(90, 0.3, "square", 0.2, 0, 40); },
    bump() { noise(0.15, 0.35, 900); },

    engineStart() {
      if (!ctx || engine) return;
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
      o1.type = "sawtooth"; o2.type = "square";
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; f.Q.value = 4;
      const g = ctx.createGain(); g.gain.value = 0.0;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(master);
      o1.start(); o2.start();
      engine = { o1, o2, f, g };
    },
    engineUpdate(speedPct, boosting) {
      if (!engine) return;
      const t = ctx.currentTime;
      const base = 45 + speedPct * 150 + (boosting ? 40 : 0);
      engine.o1.frequency.setTargetAtTime(base, t, 0.05);
      engine.o2.frequency.setTargetAtTime(base * 0.5 + 3, t, 0.05);
      engine.f.frequency.setTargetAtTime(500 + speedPct * 1500 + (boosting ? 900 : 0), t, 0.05);
      engine.g.gain.setTargetAtTime(0.05 + speedPct * 0.06, t, 0.05);
    },
    engineStop() {
      if (!engine) return;
      const t = ctx.currentTime;
      engine.g.gain.setTargetAtTime(0, t, 0.1);
      const e = engine; engine = null;
      setTimeout(() => { try { e.o1.stop(); e.o2.stop(); } catch (_) {} }, 500);
    },
  };
  return api;
})();
