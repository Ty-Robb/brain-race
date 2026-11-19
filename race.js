// ============================================================
//  BRAIN RACE — pseudo-3D racing game vs Jo Jo Johnson
//  Pure JavaScript + <canvas>. All art is drawn in code.
// ============================================================
"use strict";

const Race = (() => {
  // ---------- tuning ----------
  const SEG = 200, RUMBLE = 3, ROADW = 2000, LANES = 3, FOV = 100, CAMH = 1000, DRAW = 300, FOG = 5;
  const CAM_DEPTH = 1 / Math.tan((FOV / 2) * Math.PI / 180);
  const PLAYER_Z = CAMH * CAM_DEPTH;
  const MAX = SEG * 60;                 // top speed (world units / sec)
  const ACCEL = MAX / 5, BRAKE = -MAX, DECEL = -MAX / 5, OFF_DECEL = -MAX / 2, OFF_LIMIT = MAX / 4, CENTRIF = 0.3;
  const BOOST_TIME = 3, BOOST_MULT = 2;  // +1x speed = double, for 3 s
  const CAR_W = 720, CAR_ROAD_W = CAR_W / ROADW;
  const KMH = 220 / MAX, METRES = (220 / 3.6) / MAX;

  // ---------- colours ----------
  const SKY = ["#1b5fd1", "#3f8cf0", "#86c3ff", "#d9efff"];
  const FOG_COLOR = "#d9efff";
  const ZONES = [
    { name: "Meadow",        grass: ["#55c24a", "#4bb042"], hills: "#3f9a45", trees: ["oak", "pine", "oak", "bush", "flowers"] },
    { name: "Blossom Valley", grass: ["#86d468", "#78c65b"], hills: "#5fae58", trees: ["blossom", "blossom", "bush", "flowers", "oak"] },
    { name: "Autumn Woods",  grass: ["#d1a540", "#c29634"], hills: "#b5852f", trees: ["autumn", "autumn2", "pine", "rock", "autumn"] },
    { name: "Snowy Peaks",   grass: ["#f4f8fd", "#e2ebf5"], hills: "#cfdcec", trees: ["snowpine", "snowpine", "rock", "snowpine", "snowman"] },
  ];
  const ROAD = { light: "#76767f", dark: "#6c6c75", rumbleL: "#ffffff", rumbleD: "#e63946", edge: "#f8f8f8", lane: "#fffbe6" };

  // ---------- state ----------
  let canvas, ctx, W = 0, H = 0, dpr = 1;
  let segments = [], trackLength = 0, startDist = 0;
  const IMG = {}, SIZE = {};
  let bgClouds, bgMountains, bgHills, vignette;
  let cloudOff = 0, mountOff = 0, hillOff = 0;
  let powerups = [];
  let particles = [];
  let keys = {};
  let state = "idle";       // idle | intro | countdown | race | finished | paused
  let prevState = null;
  let raf = 0, lastT = 0, acc = 0, clock = 0;
  let opts = {};

  const P = { dist: 0, x: -0.45, speed: 0, boostT: 0, turbos: 0, topSpeed: 0, pickups: 0, turbosUsed: 0, crashCd: 0, steer: 0 };
  const J = { dist: 0, x: 0.45, speed: 0, boostT: 0, targetX: 0.45, laneT: 2, pickups: 0, skill: 0.9 };
  let timeLeft = 300, countT = 0, shakeT = 0, flashT = 0, lastLeader = 0, tauntCd = 0, finishT = 0;

  // ============================================================
  //  helpers
  // ============================================================
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeIn = (a, b, t) => a + (b - a) * Math.pow(t, 2);
  const easeInOut = (a, b, t) => a + (b - a) * ((-Math.cos(t * Math.PI) / 2) + 0.5);
  const wrap = (v, m) => ((v % m) + m) % m;
  const rand = (a, b) => a + Math.random() * (b - a);
  const fogAt = (d) => 1 / Math.pow(Math.E, d * d * FOG);
  const findSegment = z => segments[Math.floor(wrap(z, trackLength) / SEG) % segments.length];
  const overlap = (x1, w1, x2, w2) => Math.abs(x1 - x2) < (w1 + w2) / 2;

  function mk(w, h, fn) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    fn(c.getContext("2d"), w, h); return c;
  }

  // seeded random so background art is the same each time
  let seed = 7;
  const srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // ============================================================
  //  ART — sprites drawn with gradients
  // ============================================================
  function blob(g, x, y, r, c1, c2) {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  function trunk(g, x, y, w, h) {
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, "#5b3a1e"); gr.addColorStop(0.5, "#8b5a2b"); gr.addColorStop(1, "#4a2e16");
    g.fillStyle = gr; g.fillRect(x - w / 2, y, w, h);
  }
  function shadow(g, w, h) {
    g.fillStyle = "rgba(0,0,0,0.22)";
    g.beginPath(); g.ellipse(w / 2, h - 8, w * 0.38, 9, 0, 0, Math.PI * 2); g.fill();
  }
  function roundTree(colors) {
    return mk(300, 340, (g, w, h) => {
      shadow(g, w, h);
      trunk(g, w / 2, 200, 34, h - 210);
      const pts = [[150, 120, 95], [85, 160, 70], [215, 160, 72], [110, 85, 62], [195, 90, 64], [150, 190, 70], [150, 60, 55]];
      pts.forEach(([x, y, r], i) => blob(g, x, y, r, colors[0], colors[1 + (i % 2)]));
      for (let i = 0; i < 26; i++) {
        g.fillStyle = colors[3]; g.globalAlpha = 0.7;
        g.beginPath(); g.arc(rand(60, 240), rand(30, 220), rand(4, 9), 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
    });
  }
  function pineTree(snow) {
    return mk(220, 380, (g, w, h) => {
      shadow(g, w, h);
      trunk(g, w / 2, 300, 26, h - 305);
      const layers = [[300, 105], [235, 88], [175, 70], [120, 52]];
      layers.forEach(([y, hw], i) => {
        const top = y - 120 + i * 6;
        const gr = g.createLinearGradient(w / 2 - hw, 0, w / 2 + hw, 0);
        gr.addColorStop(0, "#14532d"); gr.addColorStop(0.45, "#1f7a3c"); gr.addColorStop(1, "#0f3d22");
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(w / 2, top); g.lineTo(w / 2 + hw, y); g.lineTo(w / 2 - hw, y); g.closePath(); g.fill();
        if (snow) {
          g.fillStyle = "#ffffff";
          g.beginPath(); g.moveTo(w / 2, top); g.lineTo(w / 2 + hw * 0.45, top + 50);
          for (let k = 4; k >= -4; k--) g.lineTo(w / 2 + hw * 0.11 * k, top + 50 + (k % 2 ? 10 : 0));
          g.lineTo(w / 2 - hw * 0.45, top + 50); g.closePath(); g.fill();
          g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(w / 2 - hw, y - 6, hw * 2, 6);
        }
      });
    });
  }
  const IMG_DEFS = {
    oak: () => roundTree(["#8be36b", "#2e9e3a", "#3cb04a", "#b8f59a"]),
    blossom: () => roundTree(["#ffd6ec", "#ff8fc7", "#ff6fb5", "#ffffff"]),
    autumn: () => roundTree(["#ffd166", "#f77f00", "#e85d04", "#ffe8a3"]),
    autumn2: () => roundTree(["#ff9f7a", "#d62828", "#c1121f", "#ffd6a5"]),
    pine: () => pineTree(false),
    snowpine: () => pineTree(true),
    bush: () => mk(220, 130, (g, w, h) => {
      shadow(g, w, h);
      [[60, 85, 45], [160, 85, 48], [110, 65, 55]].forEach(([x, y, r]) => blob(g, x, y, r, "#7bdc5b", "#237a2c"));
      const fc = ["#ff4d6d", "#ffd23f", "#ffffff", "#c77dff"];
      for (let i = 0; i < 14; i++) { g.fillStyle = fc[i % 4]; g.beginPath(); g.arc(rand(30, 190), rand(30, 100), 5, 0, Math.PI * 2); g.fill(); }
    }),
    flowers: () => mk(260, 100, (g, w, h) => {
      const fc = ["#ff4d6d", "#ffd23f", "#ff8fab", "#c77dff", "#4cc9f0", "#ffffff"];
      for (let i = 0; i < 26; i++) {
        const x = rand(15, 245), y = rand(40, 92);
        g.strokeStyle = "#2f8f2f"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, h); g.lineTo(x, y); g.stroke();
        g.fillStyle = fc[i % fc.length];
        for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5; g.beginPath(); g.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = "#ffe066"; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
      }
    }),
    rock: () => mk(220, 150, (g, w, h) => {
      shadow(g, w, h);
      const gr = g.createLinearGradient(0, 20, 0, h);
      gr.addColorStop(0, "#c9ced6"); gr.addColorStop(1, "#5c6370");
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(15, h - 10); g.lineTo(40, 50); g.lineTo(95, 18); g.lineTo(160, 35); g.lineTo(205, 90); g.lineTo(210, h - 10); g.closePath(); g.fill();
      g.fillStyle = "rgba(255,255,255,.35)";
      g.beginPath(); g.moveTo(40, 50); g.lineTo(95, 18); g.lineTo(110, 60); g.lineTo(60, 80); g.closePath(); g.fill();
    }),
    snowman: () => mk(160, 230, (g, w, h) => {
      shadow(g, w, h);
      blob(g, 80, 170, 52, "#ffffff", "#c8d6e8"); blob(g, 80, 95, 38, "#ffffff", "#c8d6e8"); blob(g, 80, 42, 28, "#ffffff", "#c8d6e8");
      g.fillStyle = "#1f2937"; [[70, 36], [90, 36], [80, 85], [80, 100], [80, 115]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); });
      g.fillStyle = "#f77f00"; g.beginPath(); g.moveTo(80, 44); g.lineTo(104, 49); g.lineTo(80, 50); g.fill();
      g.fillStyle = "#e63946"; g.fillRect(50, 64, 60, 12); g.fillRect(92, 64, 12, 34);
    }),
    chevR: () => chevron(1), chevL: () => chevron(-1),
    bb1: () => billboard(["#ff3d7a", "#7b2ff7"], "BRAIN RACE", "🏁 learn • quiz • race"),
    bb2: () => billboard(["#1d4ed8", "#06b6d4"], "JO JO JOHNSON", "racing team 🏎️"),
    bb3: () => billboard(["#f59e0b", "#ef4444"], "⚡ BOOST = ×2", "grab the glowing orbs!"),
    bb4: () => billboard(["#10b981", "#0ea5e9"], "KEEP LEARNING!", "every answer makes you faster"),
    gantry: () => mk(1100, 420, (g, w, h) => {
      const post = (x) => { const gr = g.createLinearGradient(x, 0, x + 34, 0); gr.addColorStop(0, "#9ca3af"); gr.addColorStop(0.5, "#f3f4f6"); gr.addColorStop(1, "#6b7280"); g.fillStyle = gr; g.fillRect(x, 60, 34, h - 60); };
      post(30); post(w - 64);
      const by = 50, bh = 110;
      for (let i = 0; i < 44; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#111" : "#fff"; g.fillRect(20 + i * 24.1, by + j * 18, 24.1, 18); }
      const gr = g.createLinearGradient(0, by + 36, 0, by + bh); gr.addColorStop(0, "#ff3d7a"); gr.addColorStop(1, "#b5179e");
      g.fillStyle = gr; g.fillRect(20, by + 36, w - 40, bh - 36);
      g.fillStyle = "#fff"; g.font = "bold 56px Fredoka, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("START  •  FINISH", w / 2, by + 74);
    }),
    orb: () => mk(160, 160, (g, w, h) => {
      const gl = g.createRadialGradient(80, 80, 10, 80, 80, 80);
      gl.addColorStop(0, "rgba(255,240,120,.9)"); gl.addColorStop(0.55, "rgba(255,180,0,.45)"); gl.addColorStop(1, "rgba(255,140,0,0)");
      g.fillStyle = gl; g.fillRect(0, 0, w, h);
      blob(g, 80, 80, 44, "#fff7b0", "#ff9e00");
      g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 4; g.beginPath(); g.arc(80, 80, 50, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "#ffffff"; g.strokeStyle = "#b45309"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(88, 46); g.lineTo(62, 86); g.lineTo(80, 86); g.lineTo(70, 116); g.lineTo(100, 72); g.lineTo(82, 72); g.closePath(); g.fill(); g.stroke();
    }),
    carPlayer: () => carSprite("#ff3d7a", "#a3123f", "#ffd1e0", "BRAIN"),
    carJo: () => carSprite("#2f80ff", "#0b3d91", "#cfe2ff", "JO JO"),
  };
  function chevron(dir) {
    return mk(140, 190, (g, w, h) => {
      g.fillStyle = "#6b7280"; g.fillRect(64, 90, 12, 100);
      g.fillStyle = "#ffd60a"; g.strokeStyle = "#111"; g.lineWidth = 5;
      g.beginPath(); g.roundRect ? g.roundRect(6, 10, 128, 90, 10) : g.rect(6, 10, 128, 90); g.fill(); g.stroke();
      g.fillStyle = "#111";
      for (let k = 0; k < 2; k++) {
        const cx = 50 + k * 40;
        g.beginPath();
        g.moveTo(cx - 14 * dir, 25); g.lineTo(cx + 14 * dir, 55); g.lineTo(cx - 14 * dir, 85);
        g.lineTo(cx - 26 * dir, 85); g.lineTo(cx + 2 * dir, 55); g.lineTo(cx - 26 * dir, 25); g.closePath(); g.fill();
      }
    });
  }
  function billboard(cols, title, sub) {
    return mk(520, 330, (g, w, h) => {
      g.fillStyle = "#4b5563"; g.fillRect(90, 180, 22, 150); g.fillRect(w - 112, 180, 22, 150);
      g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(16, 16, w - 24, 196);
      const gr = g.createLinearGradient(0, 0, w, 210); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
      g.fillStyle = gr; g.fillRect(8, 8, w - 24, 196);
      g.strokeStyle = "#fff"; g.lineWidth = 8; g.strokeRect(12, 12, w - 32, 188);
      g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.moveTo(8, 8); g.lineTo(w * 0.55, 8); g.lineTo(w * 0.35, 204); g.lineTo(8, 204); g.fill();
      g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = "bold 58px Fredoka, Arial"; g.fillText(title, w / 2 - 8, 88);
      g.font = "600 30px Fredoka, Arial"; g.fillText(sub, w / 2 - 8, 150);
    });
  }
  function carSprite(body, dark, light, plate) {
    return mk(320, 190, (g, w, h) => {
      // shadow
      g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(160, 178, 150, 14, 0, 0, Math.PI * 2); g.fill();
      // tyres
      const tyre = (x) => { const tg = g.createLinearGradient(x, 0, x + 52, 0); tg.addColorStop(0, "#111"); tg.addColorStop(0.5, "#3a3a3a"); tg.addColorStop(1, "#111"); g.fillStyle = tg; g.beginPath(); g.roundRect ? g.roundRect(x, 118, 52, 60, 10) : g.rect(x, 118, 52, 60); g.fill(); };
      tyre(14); tyre(254);
      // body
      const bg = g.createLinearGradient(0, 40, 0, 160); bg.addColorStop(0, light); bg.addColorStop(0.25, body); bg.addColorStop(1, dark);
      g.fillStyle = bg;
      g.beginPath(); g.moveTo(30, 150); g.lineTo(22, 105); g.quadraticCurveTo(30, 78, 70, 72); g.lineTo(250, 72); g.quadraticCurveTo(290, 78, 298, 105); g.lineTo(290, 150); g.quadraticCurveTo(160, 166, 30, 150); g.fill();
      // cabin + rear window
      g.fillStyle = dark; g.beginPath(); g.moveTo(80, 74); g.lineTo(104, 32); g.lineTo(216, 32); g.lineTo(240, 74); g.closePath(); g.fill();
      const wg = g.createLinearGradient(0, 36, 0, 72); wg.addColorStop(0, "#9ad8ff"); wg.addColorStop(1, "#1e293b");
      g.fillStyle = wg; g.beginPath(); g.moveTo(92, 72); g.lineTo(110, 40); g.lineTo(210, 40); g.lineTo(228, 72); g.closePath(); g.fill();
      g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(118, 42); g.lineTo(140, 42); g.lineTo(122, 70); g.lineTo(104, 70); g.fill();
      // spoiler
      g.fillStyle = "#111"; g.fillRect(40, 60, 240, 12); g.fillRect(70, 66, 10, 14); g.fillRect(240, 66, 10, 14);
      g.fillStyle = body; g.fillRect(40, 58, 240, 5);
      // racing stripe
      g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(146, 72, 10, 70); g.fillRect(164, 72, 10, 70);
      // tail lights
      [[36, 92], [234, 92]].forEach(([x, y]) => {
        const tl = g.createLinearGradient(x, y, x, y + 20); tl.addColorStop(0, "#ff8a8a"); tl.addColorStop(1, "#b00020");
        g.fillStyle = tl; g.fillRect(x, y, 50, 18);
        g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(x + 4, y + 3, 42, 3);
      });
      // plate
      g.fillStyle = "#fff"; g.fillRect(122, 112, 76, 24); g.strokeStyle = "#111"; g.lineWidth = 2; g.strokeRect(122, 112, 76, 24);
      g.fillStyle = "#111"; g.font = "bold 17px Fredoka, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(plate, 160, 125);
      // exhausts
      g.fillStyle = "#555"; g.beginPath(); g.arc(98, 150, 8, 0, 7); g.arc(222, 150, 8, 0, 7); g.fill();
      g.fillStyle = "#111"; g.beginPath(); g.arc(98, 150, 5, 0, 7); g.arc(222, 150, 5, 0, 7); g.fill();
    });
  }
  // world widths for each sprite (height follows the image aspect)
  const WORLD_W = { oak: 1500, blossom: 1500, autumn: 1500, autumn2: 1500, pine: 1000, snowpine: 1000, bush: 900, flowers: 1100, rock: 1000, snowman: 600,
    chevR: 520, chevL: 520, bb1: 2400, bb2: 2400, bb3: 2400, bb4: 2400, gantry: 4900, orb: 520, carPlayer: CAR_W, carJo: CAR_W };

  function buildArt() {
    if (IMG.oak) return;
    for (const k in IMG_DEFS) { IMG[k] = IMG_DEFS[k](); SIZE[k] = { w: WORLD_W[k], h: WORLD_W[k] * IMG[k].height / IMG[k].width }; }

    seed = 11;
    bgClouds = mk(2048, 360, (g, w, h) => {
      for (let i = 0; i < 9; i++) {
        const cx = 120 + i * 225 + srand() * 80, cy = 70 + srand() * 170, s = 0.6 + srand() * 0.8;
        for (let k = 0; k < 7; k++) {
          const x = cx + (k - 3) * 34 * s, y = cy - Math.sin((k / 6) * Math.PI) * 30 * s, r = (30 + srand() * 26) * s;
          const gr = g.createRadialGradient(x, y - r * 0.3, 2, x, y, r);
          gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(0.7, "rgba(255,255,255,.75)"); gr.addColorStop(1, "rgba(255,255,255,0)");
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        }
      }
    });
    const ridge = (n, rough) => { let pts = [0.5, 0.5]; for (let it = 0; it < n; it++) { const nx = []; for (let i = 0; i < pts.length - 1; i++) nx.push(pts[i], (pts[i] + pts[i + 1]) / 2 + (srand() - 0.5) * rough / (it + 1)); nx.push(pts[pts.length - 1]); pts = nx; } return pts; };
    bgMountains = mk(2048, 440, (g, w, h) => {
      const draw = (pts, top, bot, c1, c2, snow) => {
        const gr = g.createLinearGradient(0, top, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, h);
        pts.forEach((p, i) => g.lineTo(i / (pts.length - 1) * w, top + p * (bot - top)));
        g.lineTo(w, h); g.closePath(); g.fill();
        if (snow) {
          g.save(); g.clip();
          g.fillStyle = "rgba(255,255,255,.92)";
          g.beginPath(); g.moveTo(0, top + snow);
          pts.forEach((p, i) => g.lineTo(i / (pts.length - 1) * w, top + p * (bot - top)));
          g.lineTo(w, top + snow);
          for (let x = w; x >= 0; x -= 32) g.lineTo(x, top + snow + Math.sin(x * 0.07) * 10);
          g.closePath(); g.fill(); g.restore();
        }
      };
      const a = ridge(7, 1.6), b = ridge(7, 1.2);
      a[a.length - 1] = a[0]; b[b.length - 1] = b[0];
      draw(a.map(p => clamp(p, 0, 1)), 20, 330, "#9fb2e8", "#c9d8f5", 90);
      draw(b.map(p => clamp(p, 0, 1)), 140, 400, "#6f86c9", "#a9bce6", 60);
    });
    bgHills = mk(2048, 260, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#6cc95f"); gr.addColorStop(1, "#2f8a3a");
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, 110 + Math.sin(x / w * Math.PI * 6) * 40 + Math.sin(x / w * Math.PI * 14) * 18);
      g.lineTo(w, h); g.closePath(); g.fill();
      for (let i = 0; i < 160; i++) {
        const x = srand() * w, base = 110 + Math.sin(x / w * Math.PI * 6) * 40 + Math.sin(x / w * Math.PI * 14) * 18 + 12 + srand() * 30, r = 8 + srand() * 10;
        g.fillStyle = srand() < 0.5 ? "#23692c" : "#2c7d35"; g.beginPath(); g.arc(x, base, r, 0, Math.PI * 2); g.fill();
      }
    });
  }

  // ============================================================
  //  TRACK
  // ============================================================
  const LEN = { S: 25, M: 50, L: 100 }, CUR = { E: 2, M: 4, H: 6 }, HILL = { L: 20, M: 40, H: 60 };
  const lastY = () => segments.length ? segments[segments.length - 1].p2.world.y : 0;
  function addSegment(curve, y) {
    const n = segments.length;
    segments.push({ index: n, curve, sprites: [], pus: [],
      p1: { world: { y: lastY(), z: n * SEG }, camera: {}, screen: {} },
      p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} } });
  }
  function addRoad(enter, hold, leave, curve, height) {
    const sy = lastY(), ey = sy + height * SEG, tot = enter + hold + leave;
    for (let n = 0; n < enter; n++) addSegment(easeIn(0, curve, n / enter), easeInOut(sy, ey, n / tot));
    for (let n = 0; n < hold; n++) addSegment(curve, easeInOut(sy, ey, (enter + n) / tot));
    for (let n = 0; n < leave; n++) addSegment(easeInOut(curve, 0, n / leave), easeInOut(sy, ey, (enter + hold + n) / tot));
  }
  const straight = (n = LEN.M) => addRoad(n, n, n, 0, 0);
  const hill = (n, h) => addRoad(n, n, n, 0, h);
  const curve = (n, c, h = 0) => addRoad(n, n, n, c, h);
  function bumps() { [5, -2, -5, 8, 5, -7, 5, -2].forEach((h, i) => addRoad(10, 10, 10, i % 3 === 0 ? 1 : 0, h)); }
  function sCurves() { curve(LEN.M, -CUR.E); curve(LEN.M, CUR.M, HILL.M); curve(LEN.M, CUR.E, -HILL.L); curve(LEN.M, -CUR.E, HILL.M); curve(LEN.M, -CUR.M, -HILL.M); }

  function buildTrack() {
    segments = [];
    straight(LEN.S);
    hill(LEN.S, HILL.L);
    sCurves();
    curve(LEN.M, CUR.M, HILL.L);
    bumps();
    hill(LEN.M, -HILL.L);
    curve(LEN.L, -CUR.M, HILL.M);
    straight(LEN.M);
    sCurves();
    curve(LEN.L, CUR.H, -HILL.L);
    curve(LEN.L, -CUR.E, HILL.H);
    bumps();
    curve(LEN.M, CUR.M, -HILL.M);
    straight(LEN.L);
    curve(LEN.M, -CUR.H, HILL.L);
    sCurves();
    hill(LEN.M, HILL.M);
    curve(LEN.L, CUR.M, -HILL.H);
    bumps();
    curve(LEN.M, -CUR.M, 0);
    curve(LEN.M, CUR.E, HILL.L);
    addRoad(200, 200, 200, -CUR.E, -lastY() / SEG); // glide back down to the start height
    trackLength = segments.length * SEG;

    // colours + zones + textures
    const N = segments.length;
    segments.forEach(s => {
      s.zone = Math.min(3, Math.floor(s.index / N * 4));
      const alt = Math.floor(s.index / RUMBLE) % 2;
      const z = ZONES[s.zone];
      s.col = { grass: z.grass[alt], road: alt ? ROAD.dark : ROAD.light, rumble: alt ? ROAD.rumbleD : ROAD.rumbleL, lane: !alt };
      s.speck = Math.random() < 0.18;
    });

    // start line
    const startIdx = 12;
    startDist = startIdx * SEG;
    for (let i = 7; i < 10; i++) segments[startIdx + i].checker = true;
    segments[startIdx + 9].sprites.push({ img: "gantry", offset: 0, collide: false });

    // scenery
    const bbs = ["bb1", "bb2", "bb3", "bb4"]; let bbi = 0;
    for (let i = 25; i < N - 5; i++) {
      const s = segments[i], z = ZONES[s.zone];
      if (i % 4 === 0) {
        const side = Math.random() < 0.5 ? -1 : 1;
        s.sprites.push({ img: pick(z.trees), offset: side * rand(1.7, 4.8), collide: true });
      }
      if (i % 7 === 3) {
        const side = Math.random() < 0.5 ? -1 : 1;
        s.sprites.push({ img: pick(z.trees), offset: side * rand(5, 9), collide: true });
      }
      if (i % 180 === 90) s.sprites.push({ img: bbs[bbi++ % 4], offset: (bbi % 2 ? -1 : 1) * 1.9, collide: true });
      if (Math.abs(s.curve) >= 3 && i % 6 === 0) s.sprites.push({ img: s.curve > 0 ? "chevR" : "chevL", offset: s.curve > 0 ? -1.3 : 1.3, collide: true });
    }

    // speed power-ups
    powerups = [];
    for (let i = 120; i < N - 20; i += 200 + Math.floor(Math.random() * 90)) {
      const pu = { z: i * SEG + SEG / 2, x: pick([-0.66, 0, 0.66]), active: true, respawn: 0, seg: segments[i] };
      powerups.push(pu); segments[i].pus.push(pu);
    }
  }

  // ============================================================
  //  INPUT
  // ============================================================
  const KEYMAP = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", Space: "turbo" };
  function onKey(e, down) {
    if (state === "idle") return;
    const k = KEYMAP[e.code];
    if (k) { keys[k] = down; e.preventDefault(); if (k === "turbo" && down && !e.repeat) useTurbo(); }
    if (down && (e.code === "KeyP" || e.code === "Escape")) togglePause();
  }
  // ---- on-screen steering wheel + pedals ----
  let wheelVal = 0, wheelHeld = false, wheelAngle = 0;
  const WHEEL_MAX = 120; // degrees of lock
  function bindControls() {
    const wheel = $("wheel");
    let startA = 0, baseAngle = 0;
    const angleOf = e => { const r = wheel.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
    wheel.addEventListener("pointerdown", e => {
      e.preventDefault(); wheel.setPointerCapture(e.pointerId);
      wheelHeld = true; wheel.classList.remove("spring");
      startA = angleOf(e); baseAngle = wheelAngle;
    });
    wheel.addEventListener("pointermove", e => {
      if (!wheelHeld) return;
      let d = angleOf(e) - startA;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      wheelAngle = clamp(baseAngle + d, -WHEEL_MAX, WHEEL_MAX);
      if (Math.abs(d) > 90) { startA = angleOf(e); baseAngle = wheelAngle; } // allow hand-over-hand turning
      wheelVal = clamp(wheelAngle / 90, -1, 1);
    });
    const release = () => { if (!wheelHeld) return; wheelHeld = false; wheel.classList.add("spring"); wheelAngle = 0; wheelVal = 0; };
    wheel.addEventListener("pointerup", release); wheel.addEventListener("pointercancel", release); wheel.addEventListener("lostpointercapture", release);

    document.querySelectorAll(".pedal").forEach(p => {
      const k = p.dataset.k;
      const on = e => { e.preventDefault(); p.setPointerCapture && p.setPointerCapture(e.pointerId); keys["pedal_" + k] = true; };
      const off = e => { e.preventDefault(); keys["pedal_" + k] = false; };
      p.addEventListener("pointerdown", on); p.addEventListener("pointerup", off); p.addEventListener("pointercancel", off); p.addEventListener("lostpointercapture", off);
    });
    $("turboBtn").addEventListener("pointerdown", e => { e.preventDefault(); useTurbo(); });
  }
  function updateControlsUI() {
    // wheel follows keyboard steering too
    if (!wheelHeld) {
      const target = keys.left ? -70 : keys.right ? 70 : 0;
      if (target !== 0) $("wheel").classList.remove("spring");
      wheelAngle = target ? lerp(wheelAngle, target, 0.25) : (Math.abs(wheelAngle) < 1 ? 0 : wheelAngle);
      if (!target) $("wheel").classList.add("spring"), wheelAngle = 0;
    }
    $("wheel").firstElementChild.style.transform = `rotate(${wheelAngle}deg)`;
    document.querySelector(".pedal.gas").classList.toggle("down", !!(keys.up || keys.pedal_up));
    document.querySelector(".pedal.brake").classList.toggle("down", !!(keys.down || keys.pedal_down));
    $("turboBtn").classList.toggle("empty", P.turbos === 0);
  }

  // ============================================================
  //  GAME LOGIC
  // ============================================================
  function useTurbo() {
    if (state !== "race" || P.turbos <= 0) return;
    P.turbos--; P.turbosUsed++;
    P.boostT = BOOST_TIME; flashT = 0.25;
    Sfx.boost(); toast("🔥 TURBO!", "#ffcf3f");
  }
  function crossed(prev, cur, z) { const t = z + Math.ceil((prev - z) / trackLength) * trackLength; return t <= cur; }

  function toastMsg(txt, color) {
    const el = document.getElementById("toast");
    el.textContent = txt; el.style.color = color || "#fff";
    el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
    clearTimeout(toastMsg.t); toastMsg.t = setTimeout(() => el.classList.remove("show"), 1600);
  }
  const toast = toastMsg;

  function burst(x, y, n, colors, spd = 300, life = 0.8, size = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rand(spd * 0.3, spd);
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, c: pick(colors), s: rand(size * 0.5, size), g: 300 });
    }
  }

  function update(dt) {
    clock += dt;
    if (state === "countdown") {
      const before = Math.ceil(countT);
      countT -= dt;
      const now = Math.ceil(countT);
      const cd = document.getElementById("countdown");
      if (countT <= 0) {
        state = "race"; Sfx.beep(true);
        cd.textContent = "GO!"; cd.className = "countdown go";
        setTimeout(() => { cd.textContent = ""; }, 800);
      } else if (now !== before) { Sfx.beep(false); cd.textContent = now; cd.className = "countdown"; }
    }
    const racing = state === "race";
    const finished = state === "finished";
    if (racing) {
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; finish(); }
    }
    if (finished) finishT += dt;

    // ----- player -----
    const seg = findSegment(P.dist);
    const pct = P.speed / MAX;
    const steerAmt = dt * 2 * Math.min(pct, 1.25);
    const ctrl = racing;
    const steerIn = keys.left ? -1 : keys.right ? 1 : wheelVal;
    P.steer = ctrl ? steerIn : 0;
    if (ctrl) P.x += steerAmt * steerIn;
    const gas = keys.up || keys.pedal_up, brake = keys.down || keys.pedal_down;
    P.x -= steerAmt * Math.min(pct, 1.3) * seg.curve * CENTRIF;

    const boosting = P.boostT > 0;
    const top = MAX * (boosting ? BOOST_MULT : 1);
    if (ctrl && (gas || boosting)) P.speed += ACCEL * (boosting ? 3 : 1) * dt;
    else if (ctrl && brake) P.speed += BRAKE * dt;
    else P.speed += DECEL * (finished ? 1.5 : 1) * dt;
    if (P.speed > top) P.speed = Math.max(top, P.speed - MAX * 0.7 * dt);

    const offroad = Math.abs(P.x) > 1;
    if (offroad) {
      if (P.speed > OFF_LIMIT) P.speed += OFF_DECEL * dt;
      if (P.speed > 500 && Math.random() < 0.6) {
        const sc = ZONES[seg.zone].name === "Snowy Peaks" ? ["#ffffff", "#dbe7f5"] : ["#c8a26b", "#9b7a4b", "#7cc35e"];
        particles.push({ x: W / 2 + rand(-W * 0.08, W * 0.08), y: H * 0.97, vx: rand(-120, 120), vy: rand(-260, -120), life: 0.7, max: 0.7, c: pick(sc), s: rand(4, 10), g: 500 });
      }
      for (const s of seg.sprites) {
        if (!s.collide) continue;
        const sw = SIZE[s.img].w / ROADW;
        if (overlap(P.x, CAR_ROAD_W, s.offset, sw * 0.55)) {
          if (P.crashCd <= 0 && P.speed > MAX / 6) { Sfx.crash(); shakeT = 0.4; burst(W / 2, H * 0.85, 22, ["#ffd166", "#ffffff", "#ff8fab"], 420); P.crashCd = 0.6; }
          P.speed = Math.min(P.speed, MAX / 6);
          P.x += (s.offset > P.x ? -1 : 1) * 0.04;
        }
      }
    }
    P.crashCd -= dt;
    P.speed = Math.max(0, P.speed);
    P.x = clamp(P.x, -3, 3);
    const prevP = P.dist;
    P.dist += P.speed * dt;
    P.boostT = Math.max(0, P.boostT - dt);
    P.topSpeed = Math.max(P.topSpeed, P.speed);

    // ----- Jo Jo Johnson AI -----
    if (racing || finished) {
      const js = findSegment(J.dist);
      const gap = J.dist - P.dist;
      const rubber = gap > 0 ? clamp(1 - gap / 70000, 0.84, 1) : clamp(1 - gap / 30000, 1, 1.15);
      const curvePen = 1 - Math.min(Math.abs(js.curve), 6) * 0.012;
      let target = MAX * J.skill * rubber * curvePen * (J.boostT > 0 ? BOOST_MULT : 1);
      if (finished) target = 0;
      J.speed += clamp(target - J.speed, -MAX * 0.7 * dt, ACCEL * (J.boostT > 0 ? 3 : 1.05) * dt);

      J.laneT -= dt;
      if (J.laneT <= 0) { J.targetX = pick([-0.6, 0, 0.6]); J.laneT = rand(2, 5); }
      for (const pu of powerups) {
        if (!pu.active) continue;
        const d = wrap(pu.z - J.dist, trackLength);
        if (d > 2500 && d < 12000 && Math.random() < 0.02 + J.skill * 0.02) { J.targetX = pu.x; J.laneT = 2.5; break; }
      }
      const dz = wrap(P.dist - J.dist, trackLength);
      if (dz < 1800 && Math.abs(P.x - J.x) < 0.55 && J.speed > P.speed) J.targetX = P.x > 0 ? -0.6 : 0.6;
      J.x += clamp(J.targetX - J.x, -dt * 0.9, dt * 0.9);
      const prevJ = J.dist;
      J.dist += J.speed * dt;
      J.boostT = Math.max(0, J.boostT - dt);

      // power-up pickups (both drivers)
      for (const pu of powerups) {
        if (!pu.active) { pu.respawn -= dt; if (pu.respawn <= 0) pu.active = true; continue; }
        if (racing && crossed(prevP, P.dist, pu.z) && Math.abs(P.x - pu.x) < 0.42) {
          pu.active = false; pu.respawn = 12; P.boostT = BOOST_TIME; P.pickups++; flashT = 0.3;
          Sfx.pickup(); Sfx.boost(); toast("⚡ SPEED BOOST ×2!", "#ffe14d");
          burst(W / 2, H * 0.75, 40, ["#fff7b0", "#ffd60a", "#ff9e00", "#ffffff"], 600, 0.9, 8);
        } else if (crossed(prevJ, J.dist, pu.z) && Math.abs(J.x - pu.x) < 0.42) {
          pu.active = false; pu.respawn = 12; J.boostT = BOOST_TIME; J.pickups++;
          if (Math.abs(J.dist - P.dist) < 15000) toast("Jo Jo grabbed a boost! 😮", "#9fc3ff");
        }
      }

      // car-to-car bumping
      const d = J.dist - P.dist;
      if (Math.abs(d) < 420 && Math.abs(P.x - J.x) < CAR_ROAD_W * 1.15) {
        if (d > 0 && P.speed > J.speed) { P.speed = J.speed * 0.85; P.dist = J.dist - 420; }
        else if (d < 0 && J.speed > P.speed) { J.speed = P.speed * 0.85; J.dist = P.dist - 420; }
        const push = P.x < J.x ? -1 : 1;
        P.x += push * 0.06; J.x -= push * 0.06;
        if (P.crashCd <= 0) { Sfx.bump(); shakeT = 0.25; P.crashCd = 0.5; }
      }

      // overtakes & taunts
      tauntCd -= dt;
      const leader = P.dist >= J.dist ? 1 : -1;
      if (racing && leader !== lastLeader && tauntCd <= 0 && Math.abs(d) < 3000) {
        if (leader === 1) toast(pick(["You passed Jo Jo! 🎉", "Overtake! 💨", "Leading the race! 🥇"]), "#7dff9b");
        else toast(pick(["Jo Jo: \"See ya!\" 😜", "Jo Jo: \"Too slow!\" 😎", "Jo Jo zooms past! 💨"]), "#9fc3ff");
        tauntCd = 4;
      }
      lastLeader = leader;
    }

    // ----- background parallax -----
    const mov = P.speed * dt / SEG;
    cloudOff += 0.0008 * seg.curve * mov + dt * 0.004;
    mountOff += 0.0016 * seg.curve * mov;
    hillOff += 0.0032 * seg.curve * mov;

    // ----- effects -----
    if (P.boostT > 0 && Math.random() < 0.9) {
      for (const ex of [-0.19, 0.19]) particles.push({ x: W / 2 + ex * carDestW() + rand(-4, 4), y: carBaseY() - carDestW() * 0.125, vx: rand(-40, 40), vy: rand(60, 180), life: 0.35, max: 0.35, c: pick(["#fff3a0", "#ffb703", "#fb5607"]), s: rand(6, 13), g: 0, fire: true });
    }
    for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
    particles = particles.filter(p => p.life > 0);
    shakeT = Math.max(0, shakeT - dt); flashT = Math.max(0, flashT - dt);

    Sfx.engineUpdate(Math.min(P.speed / MAX, 2), P.boostT > 0);
  }

  function finish() {
    state = "finished"; finishT = 0;
    Sfx.engineStop();
    const win = P.dist >= J.dist;
    if (win) Sfx.fanfare(); else Sfx.wrong();
    toast(win ? "🏆 YOU WIN!" : "Jo Jo wins this time!", win ? "#ffd84d" : "#9fc3ff");
    setTimeout(() => showEnd(win), 2200);
  }

  // ============================================================
  //  RENDER
  // ============================================================
  function project(p, cx, cy, cz) {
    p.camera.x = (p.world.x || 0) - cx;
    p.camera.y = (p.world.y || 0) - cy;
    p.camera.z = (p.world.z || 0) - cz;
    p.screen.scale = CAM_DEPTH / p.camera.z;
    p.screen.x = Math.round(W / 2 + p.screen.scale * p.camera.x * W / 2);
    p.screen.y = Math.round(H / 2 - p.screen.scale * p.camera.y * H / 2);
    p.screen.w = Math.round(p.screen.scale * ROADW * W / 2);
  }
  function poly(x1, y1, x2, y2, x3, y3, x4, y4, c) {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill();
  }

  function renderBackground(playerY) {
    const horizon = H * 0.5 + clamp(playerY * 0.003, -40, 60);
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, SKY[0]); sky.addColorStop(0.35, SKY[1]); sky.addColorStop(0.75, SKY[2]); sky.addColorStop(1, SKY[3]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon + 2);

    // sun
    const sy = horizon * 0.38;
    const sunX = wrap(W * 1.02 - mountOff * W * 1.6, W * 1.6) - W * 0.3;
    const sg = ctx.createRadialGradient(sunX, sy, 10, sunX, sy, H * 0.35);
    sg.addColorStop(0, "rgba(255,250,210,1)"); sg.addColorStop(0.12, "rgba(255,236,150,.95)"); sg.addColorStop(0.3, "rgba(255,220,140,.35)"); sg.addColorStop(1, "rgba(255,220,140,0)");
    ctx.fillStyle = sg; ctx.fillRect(sunX - H * 0.35, sy - H * 0.35, H * 0.7, H * 0.7);
    ctx.save(); ctx.translate(sunX, sy); ctx.rotate(clock * 0.15);
    ctx.fillStyle = "rgba(255,245,200,.18)";
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(H * 0.3, -10); ctx.lineTo(H * 0.3, 10); ctx.fill(); }
    ctx.restore();

    const layer = (img, off, bottom, height) => {
      const dw = Math.max(W * 1.6, height * img.width / img.height);
      const x0 = -wrap(off, 1) * dw;
      ctx.drawImage(img, x0, bottom - height, dw, height);
      ctx.drawImage(img, x0 + dw, bottom - height, dw, height);
    };
    layer(bgClouds, cloudOff, horizon * 0.75, horizon * 0.55);
    layer(bgMountains, mountOff, horizon + 6, H * 0.3);
    layer(bgHills, hillOff, horizon + H * 0.06, H * 0.13);
    ctx.fillStyle = "#2f8a3a"; ctx.fillRect(0, horizon + H * 0.06 - 1, W, H);
  }

  function renderSegment(seg) {
    const p1 = seg.p1.screen, p2 = seg.p2.screen, c = seg.col;
    const y1 = p1.y, y2 = p2.y;
    ctx.fillStyle = c.grass; ctx.fillRect(0, y2, W, y1 - y2);
    if (seg.speck && y1 - y2 > 1) { // grass texture flecks
      ctx.fillStyle = "rgba(255,255,255,.08)";
      ctx.fillRect(0, y2, p2.x - p2.w * 1.6, y1 - y2);
    }
    const r1 = p1.w / 5, r2 = p2.w / 5;
    poly(p1.x - p1.w - r1, y1, p1.x - p1.w, y1, p2.x - p2.w, y2, p2.x - p2.w - r2, y2, c.rumble);
    poly(p1.x + p1.w + r1, y1, p1.x + p1.w, y1, p2.x + p2.w, y2, p2.x + p2.w + r2, y2, c.rumble);
    poly(p1.x - p1.w, y1, p1.x + p1.w, y1, p2.x + p2.w, y2, p2.x - p2.w, y2, c.road);
    // white edge lines
    const e1 = p1.w / 40, e2 = p2.w / 40;
    poly(p1.x - p1.w + e1, y1, p1.x - p1.w + e1 * 2.2, y1, p2.x - p2.w + e2 * 2.2, y2, p2.x - p2.w + e2, y2, ROAD.edge);
    poly(p1.x + p1.w - e1, y1, p1.x + p1.w - e1 * 2.2, y1, p2.x + p2.w - e2 * 2.2, y2, p2.x + p2.w - e2, y2, ROAD.edge);
    if (seg.checker) {
      const cells = 12;
      for (let i = 0; i < cells; i++) {
        const a = i / cells, b = (i + 1) / cells;
        const col = (i + seg.index) % 2 ? "#111" : "#fafafa";
        poly(lerp(p1.x - p1.w, p1.x + p1.w, a), y1, lerp(p1.x - p1.w, p1.x + p1.w, b), y1, lerp(p2.x - p2.w, p2.x + p2.w, b), y2, lerp(p2.x - p2.w, p2.x + p2.w, a), y2, col);
      }
    } else if (c.lane) {
      const l1 = p1.w / 36, l2 = p2.w / 36, lw1 = p1.w * 2 / LANES, lw2 = p2.w * 2 / LANES;
      for (let ln = 1; ln < LANES; ln++) {
        const lx1 = p1.x - p1.w + lw1 * ln, lx2 = p2.x - p2.w + lw2 * ln;
        poly(lx1 - l1 / 2, y1, lx1 + l1 / 2, y1, lx2 + l2 / 2, y2, lx2 - l2 / 2, y2, ROAD.lane);
      }
    }
    if (seg.fog < 1) {
      ctx.globalAlpha = 1 - seg.fog; ctx.fillStyle = FOG_COLOR;
      ctx.fillRect(0, y2, W, y1 - y2); ctx.globalAlpha = 1;
    }
  }

  function drawSprite(name, scale, x, y, clipY, alpha = 1, lift = 0, sizeMul = 1) {
    const img = IMG[name], sz = SIZE[name];
    const dw = sz.w * scale * W / 2 * sizeMul, dh = sz.h * scale * W / 2 * sizeMul;
    const dx = x - dw / 2, dy = y - dh - lift * dh;
    if (dw < 1 || dx > W || dx + dw < 0) return null;
    const clipH = clipY ? Math.max(0, dy + dh - clipY) : 0;
    if (clipH >= dh) return null;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, 0, 0, img.width, img.height * (1 - clipH / dh), dx, dy, dw, dh - clipH);
    ctx.globalAlpha = 1;
    return { dx, dy, dw, dh };
  }

  const carDestW = () => CAR_W * (CAM_DEPTH / PLAYER_Z) * W / 2;
  let carY = 0;
  const carBaseY = () => carY;

  function render() {
    const camPos = wrap(P.dist - PLAYER_Z, trackLength);
    const base = findSegment(camPos), basePct = (camPos % SEG) / SEG;
    const pSeg = findSegment(camPos + PLAYER_Z), pPct = (wrap(camPos + PLAYER_Z, trackLength) % SEG) / SEG;
    const playerY = lerp(pSeg.p1.world.y, pSeg.p2.world.y, pPct);
    const N = segments.length;

    ctx.save();
    if (shakeT > 0) ctx.translate(rand(-8, 8) * shakeT * 2, rand(-6, 6) * shakeT * 2);

    renderBackground(playerY);

    let maxy = H, x = 0, dx = -(base.curve * basePct);
    for (let n = 0; n < DRAW; n++) {
      const seg = segments[(base.index + n) % N];
      seg.looped = seg.index < base.index;
      seg.fog = fogAt(n / DRAW);
      seg.clip = maxy;
      const cz = camPos - (seg.looped ? trackLength : 0);
      project(seg.p1, P.x * ROADW - x, playerY + CAMH, cz);
      project(seg.p2, P.x * ROADW - x - dx, playerY + CAMH, cz);
      x += dx; dx += seg.curve;
      seg.drawn = !(seg.p1.camera.z <= CAM_DEPTH || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxy);
      if (!seg.drawn) continue;
      renderSegment(seg);
      maxy = seg.p1.screen.y;
    }

    // sprites, power-ups and Jo Jo — back to front
    const joZ = wrap(J.dist, trackLength), joSeg = findSegment(joZ);
    for (let n = DRAW - 1; n > 0; n--) {
      const seg = segments[(base.index + n) % N];
      if (seg.p1.camera.z <= CAM_DEPTH) continue;
      const sc = seg.p1.screen.scale, alpha = Math.min(1, seg.fog * 1.4);
      for (const s of seg.sprites) {
        drawSprite(s.img, sc, seg.p1.screen.x + sc * s.offset * ROADW * W / 2, seg.p1.screen.y, seg.clip, alpha);
      }
      for (const pu of seg.pus) {
        if (!pu.active) continue;
        const pulse = 1 + Math.sin(clock * 6 + pu.z) * 0.08;
        drawSprite("orb", sc, seg.p1.screen.x + sc * pu.x * ROADW * W / 2, seg.p1.screen.y, seg.clip, alpha, 0.25 + Math.sin(clock * 4 + pu.z) * 0.12, pulse);
      }
      if (seg === joSeg) {
        const pc = (joZ % SEG) / SEG;
        const s2 = lerp(seg.p1.screen.scale, seg.p2.screen.scale, pc);
        const jx = lerp(seg.p1.screen.x, seg.p2.screen.x, pc) + s2 * J.x * ROADW * W / 2;
        const jy = lerp(seg.p1.screen.y, seg.p2.screen.y, pc);
        const r = drawSprite("carJo", s2, jx, jy, seg.clip, alpha);
        if (r && J.boostT > 0) drawFlames(jx, r.dy + r.dh * 0.79, r.dw);
        if (r && r.dw > 34) nameTag(jx, r.dy - 8, r.dw);
      }
    }

    // player car
    const scale = CAM_DEPTH / PLAYER_Z;
    const camYp = lerp(pSeg.p1.camera.y, pSeg.p2.camera.y, pPct);
    const offroad = Math.abs(P.x) > 1;
    const bounce = P.speed > 0 ? (Math.random() * (offroad ? 5 : 1.5) * Math.min(1, P.speed / MAX)) : 0;
    carY = H / 2 - scale * camYp * H / 2 - H * 0.025 - bounce;
    const cw = carDestW(), ch = cw * IMG.carPlayer.height / IMG.carPlayer.width;
    ctx.save();
    ctx.translate(W / 2, carY);
    ctx.rotate(P.steer * 0.035 * Math.min(1, P.speed / MAX * 2));
    ctx.drawImage(IMG.carPlayer, -cw / 2, -ch, cw, ch);
    if ((keys.down || keys.pedal_down) && state === "race") { // brake lights glow
      for (const lx of [-0.31, 0.31]) {
        const g = ctx.createRadialGradient(lx * cw, -ch * 0.47, 2, lx * cw, -ch * 0.47, cw * 0.14);
        g.addColorStop(0, "rgba(255,80,80,.9)"); g.addColorStop(1, "rgba(255,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(lx * cw - cw * 0.15, -ch * 0.47 - cw * 0.15, cw * 0.3, cw * 0.3);
      }
    }
    ctx.restore();

    // particles
    for (const p of particles) {
      const a = p.life / p.max;
      ctx.globalAlpha = a;
      if (p.fire) ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (p.fire ? a : 1), 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;

    // speed lines while boosting
    if (P.boostT > 0 || P.speed > MAX * 1.05) {
      const k = Math.min(1, (P.speed - MAX * 0.9) / MAX);
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2;
      const cx = W / 2, cy = H * 0.48;
      ctx.beginPath();
      for (let i = 0; i < 40 * k; i++) {
        const a = Math.random() * Math.PI * 2, r1 = rand(0.35, 0.6) * W, r2 = r1 + rand(60, 200);
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.6);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.6);
      }
      ctx.stroke();
    }
    ctx.restore();

    ctx.drawImage(vignette, 0, 0, W, H);
    if (P.boostT > 0) {
      ctx.fillStyle = `rgba(255,170,0,${0.08 + Math.sin(clock * 20) * 0.03})`; ctx.fillRect(0, 0, W, H);
    }
    if (flashT > 0) { ctx.fillStyle = `rgba(255,240,180,${flashT * 1.6})`; ctx.fillRect(0, 0, W, H); }
  }

  function drawFlames(x, y, w) {
    ctx.globalCompositeOperation = "lighter";
    for (const ex of [-0.19, 0.19]) {
      const fl = w * (0.12 + Math.random() * 0.06);
      const g = ctx.createRadialGradient(x + ex * w, y, 1, x + ex * w, y, fl);
      g.addColorStop(0, "rgba(255,255,200,1)"); g.addColorStop(0.4, "rgba(255,170,0,.8)"); g.addColorStop(1, "rgba(255,60,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + ex * w, y, fl, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }
  function nameTag(x, y, w) {
    const fs = clamp(w * 0.13, 10, 22);
    ctx.font = `bold ${fs}px Fredoka, Arial`;
    const txt = "JO JO JOHNSON", tw = ctx.measureText(txt).width + fs;
    ctx.fillStyle = "rgba(20,60,160,.85)";
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - tw / 2, y - fs * 1.5, tw, fs * 1.5, fs * 0.5) : ctx.rect(x - tw / 2, y - fs * 1.5, tw, fs * 1.5); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y - fs * 0.72);
  }

  // ============================================================
  //  HUD
  // ============================================================
  const $ = id => document.getElementById(id);
  const hudCache = {};
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  function hud() {
    const m = Math.floor(timeLeft / 60), s = timeLeft - m * 60;
    setText("hTime", `${m}:${s < 10 ? "0" : ""}${s.toFixed(1)}`);
    $("hTime").parentElement.classList.toggle("low", timeLeft < 30 && state === "race");
    const lead = P.dist >= J.dist;
    setText("hPos", lead ? "1st" : "2nd");
    $("hPos").parentElement.className = "h-pos " + (lead ? "first" : "second");
    const gapM = Math.round(Math.abs(P.dist - J.dist) * METRES);
    setText("hGap", gapM < 5 ? "side by side!" : (lead ? `+${gapM} m ahead of Jo Jo` : `${gapM} m behind Jo Jo`));
    setText("hLap", String(Math.max(1, Math.floor((P.dist - startDist) / trackLength) + 1)));
    setText("hSpeed", String(Math.round(P.speed * KMH)));
    $("hBoost").style.width = (P.boostT / BOOST_TIME * 100) + "%";
    setText("hTurboN", String(P.turbos));
    $("hTurbo").classList.toggle("empty", P.turbos === 0);
    $("pMe").style.left = (wrap(P.dist - startDist, trackLength) / trackLength * 100) + "%";
    $("pJo").style.left = (wrap(J.dist - startDist, trackLength) / trackLength * 100) + "%";
  }

  // ============================================================
  //  LOOP / LIFECYCLE
  // ============================================================
  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vignette = mk(Math.max(1, Math.round(W)), Math.max(1, Math.round(H)), (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.max(w, h) * 0.75);
      gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,30,.45)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const now = t / 1000;
    let dt = Math.min(0.1, now - (lastT || now)); lastT = now;
    if (state !== "paused") {
      acc += dt;
      while (acc >= 1 / 60) { update(1 / 60); acc -= 1 / 60; }
    }
    render();
    hud();
    updateControlsUI();
  }

  function reset() {
    P.dist = startDist + PLAYER_Z * 0; P.x = -0.45; P.speed = 0; P.boostT = 0; P.turbos = opts.turbos || 0; P.topSpeed = 0; P.pickups = 0; P.turbosUsed = 0; P.crashCd = 0;
    J.dist = startDist + 1300; J.x = 0.4; J.targetX = 0.4; J.speed = 0; J.boostT = 0; J.laneT = 3; J.pickups = 0;
    J.skill = 0.86 + "ABCDE".indexOf(opts.band || "C") * 0.02;
    powerups.forEach(p => { p.active = true; p.respawn = 0; });
    particles = []; keys = {};
    timeLeft = opts.time || 300; lastLeader = 0; tauntCd = 2; shakeT = 0; flashT = 0;
    $("countdown").textContent = ""; $("raceEnd").classList.add("hidden"); $("pauseOv").classList.add("hidden");
  }

  function open(o) {
    opts = o;
    canvas = $("game"); ctx = canvas.getContext("2d");
    if (!open.bound) {
      open.bound = true;
      addEventListener("keydown", e => onKey(e, true));
      addEventListener("keyup", e => onKey(e, false));
      addEventListener("resize", resize);
      document.addEventListener("visibilitychange", () => { if (document.hidden && (state === "race" || state === "countdown")) togglePause(); });
      bindControls();
      $("raceGo").onclick = begin;
      $("resumeBtn").onclick = togglePause;
      $("quitBtn").onclick = () => { close(); opts.onQuit && opts.onQuit(); };
      $("againBtn").onclick = () => { reset(); $("raceIntro").classList.remove("hidden"); state = "intro"; Sfx.click(); };
      $("newQuizBtn").onclick = () => { close(); opts.onNewQuiz && opts.onNewQuiz(); };
    }
    buildArt();
    if (!segments.length) buildTrack();
    resize();
    reset();
    $("introName").textContent = opts.name || "You";
    $("introTurbo").textContent = opts.turbos || 0;
    $("raceIntro").classList.remove("hidden");
    state = "intro";
    cancelAnimationFrame(raf); lastT = 0; raf = requestAnimationFrame(frame);
  }

  function begin() {
    Sfx.init();
    $("raceIntro").classList.add("hidden");
    state = "countdown"; countT = 3;
    $("countdown").textContent = "3"; $("countdown").className = "countdown"; Sfx.beep(false);
    Sfx.engineStart();
  }

  function togglePause() {
    if (state === "paused") { state = prevState; $("pauseOv").classList.add("hidden"); if (state === "race" || state === "countdown") Sfx.engineStart(); }
    else if (state === "race" || state === "countdown") { prevState = state; state = "paused"; $("pauseOv").classList.remove("hidden"); Sfx.engineStop(); }
  }

  function showEnd(win) {
    const km = d => ((d - startDist) * METRES / 1000).toFixed(2) + " km";
    $("endTitle").textContent = win ? `🏆 ${opts.name || "You"} beat Jo Jo Johnson!` : "😤 Jo Jo Johnson won… this time!";
    const me = `<div class="p ${win ? "win" : "lose"}"><span>${win ? "🥇" : "🥈"}</span><b>${opts.name || "You"}</b>${km(P.dist)}</div>`;
    const jo = `<div class="p ${win ? "lose" : "win"}"><span>${win ? "🥈" : "🥇"}</span><b>Jo Jo Johnson</b>${km(J.dist)}</div>`;
    $("endPodium").innerHTML = win ? me + jo : jo + me;
    const laps = ((P.dist - startDist) / trackLength).toFixed(1);
    $("endStats").innerHTML = `
      <div>Top speed<b>${Math.round(P.topSpeed * KMH)} km/h</b></div>
      <div>Power-ups grabbed<b>⚡ ${P.pickups}</b></div>
      <div>Laps driven<b>${laps}</b></div>
      <div>Turbos used<b>🔥 ${P.turbosUsed}</b></div>
      <div>Winning margin<b>${Math.round(Math.abs(P.dist - J.dist) * METRES)} m</b></div>
      <div>Quiz score<b>⭐ ${opts.quizScore ?? "-"}/10</b></div>`;
    $("raceEnd").classList.remove("hidden");
    if (win && window.Confetti) Confetti.blast(200);
  }

  function close() {
    state = "idle"; cancelAnimationFrame(raf); Sfx.engineStop(); keys = {};
  }

  // test hook: simulate N seconds of game time
  function _sim(sec, k) { if (k) Object.assign(keys, k); for (let i = 0; i < sec * 60; i++) update(1 / 60); render(); hud(); return { state, speed: Math.round(P.speed * KMH), p: P.dist, j: J.dist, x: P.x, jx: J.x, t: timeLeft, pick: P.pickups, jp: J.pickups, turbos: P.turbos }; }
  return { open, close, _sim };
})();
