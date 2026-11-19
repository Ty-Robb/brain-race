// ============================================================
//  BRAIN RACE — quiz flow, spelling test, confetti
// ============================================================
"use strict";

const $ = id => document.getElementById(id);

// ---------- confetti ----------
const Confetti = (() => {
  const c = $("confetti"), g = c.getContext("2d");
  let bits = [], running = false;
  const cols = ["#ff3d7a", "#ffc93c", "#22c55e", "#3b82f6", "#a855f7", "#06b6d4", "#ffffff"];
  function size() { c.width = innerWidth; c.height = innerHeight; }
  addEventListener("resize", size); size();
  function tick() {
    g.clearRect(0, 0, c.width, c.height);
    bits.forEach(b => {
      b.vy += 0.25; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.life--;
      g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.globalAlpha = Math.min(1, b.life / 40);
      g.fillStyle = b.c; g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 2)));
      g.restore();
    });
    bits = bits.filter(b => b.life > 0 && b.y < c.height + 40);
    if (bits.length) requestAnimationFrame(tick); else { running = false; g.clearRect(0, 0, c.width, c.height); }
  }
  return {
    blast(n = 90, x = innerWidth / 2, y = innerHeight * 0.4) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 10;
        bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, w: 6 + Math.random() * 8, h: 8 + Math.random() * 8, c: cols[i % cols.length], life: 120 + Math.random() * 60 });
      }
      if (!running) { running = true; requestAnimationFrame(tick); }
    },
  };
})();
window.Confetti = Confetti;

// ---------- Rick Roll (plays for 15 s on a wrong answer) ----------
const RickRoll = (() => {
  const RR_SECONDS = 15;
  let ov = null, timer = 0, then = null;
  function build() {
    ov = document.createElement("div");
    ov.className = "rickroll";
    ov.innerHTML = `<div class="rr-box">
        <div class="rr-title">❌ WRONG! You've been… <b>RICK ROLLED!</b> 🕺</div>
        <div class="rr-video"></div>
        <div class="rr-count">Back to learning in <b>15</b>…</div>
        <div class="rr-bar"><div></div></div>
      </div>`;
    document.body.appendChild(ov);
  }
  return {
    play(done) {
      if (!ov) build();
      then = done;
      ov.querySelector(".rr-video").innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1" allow="autoplay; encrypted-media" title="Never Gonna Give You Up"></iframe>';
      ov.classList.add("show");
      const bar = ov.querySelector(".rr-bar div");
      bar.style.transition = "none"; bar.style.width = "100%"; void bar.offsetWidth;
      bar.style.transition = `width ${RR_SECONDS}s linear`; bar.style.width = "0%";
      let left = RR_SECONDS;
      ov.querySelector(".rr-count b").textContent = left;
      clearInterval(timer);
      timer = setInterval(() => {
        left--;
        ov.querySelector(".rr-count b").textContent = left;
        if (left <= 0) this.stop();
      }, 1000);
    },
    stop() {
      clearInterval(timer);
      if (!ov) return;
      ov.classList.remove("show");
      ov.querySelector(".rr-video").innerHTML = ""; // removing the video stops the music
      const cb = then; then = null; cb && cb();
    },
    get playing() { return !!ov && ov.classList.contains("show"); },
  };
})();

// ---------- app state ----------
const PASS_MARK = 8; // 8 out of 10 = 80%
const S = { attempts: 0, name: "You", year: 5, subject: "maths", quiz: [], i: 0, score: 0, streak: 0, best: 0, answered: false, hintUsed: false, log: [] };
const SUBJ_NAME = { maths: "Maths", english: "English Spelling", biology: "Biology" };

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
  document.body.classList.toggle("racing", id === "scr-race");
  $("muteBtn").style.display = "";
  window.scrollTo(0, 0);
}

// ---------- title ----------
$("startBtn").onclick = () => {
  Sfx.init(); Sfx.click();
  S.name = ($("nameInput").value.trim() || "You").slice(0, 14);
  show("scr-year");
};
$("nameInput").addEventListener("keydown", e => { if (e.key === "Enter") $("startBtn").click(); });
$("muteBtn").onclick = () => { Sfx.init(); $("muteBtn").textContent = Sfx.toggleMute() ? "🔇" : "🔊"; };

// ---------- year ----------
(function buildYears() {
  const grid = $("yearGrid");
  for (let y = 1; y <= 13; y++) {
    const b = document.createElement("button");
    const hue = 260 - y * 17;
    b.style.background = `linear-gradient(160deg,hsl(${hue},85%,62%),hsl(${hue - 25},80%,45%))`;
    b.innerHTML = `Year ${y}<small>${y <= 6 ? "Primary" : y <= 11 ? "Secondary" : "Sixth form"}</small>`;
    b.onclick = () => { Sfx.click(); S.year = y; $("subjSub").textContent = `Year ${y} — what do you want to learn today?`; show("scr-subject"); };
    grid.appendChild(b);
  }
})();
document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => { Sfx.click(); show(b.dataset.back); });

// ---------- subject ----------
document.querySelectorAll(".subj").forEach(b => b.onclick = () => { Sfx.click(); startQuiz(b.dataset.s); });

function startQuiz(subject) {
  if (subject !== S.subject) S.attempts = 0;
  S.attempts++;
  Object.assign(S, { subject, quiz: buildQuiz(subject, S.year), i: 0, score: 0, streak: 0, best: 0, log: [] });
  $("qSubject").textContent = `${SUBJ_NAME[subject]} · Year ${S.year}${S.attempts > 1 ? " · Try " + S.attempts : ""}`;
  $("qDots").innerHTML = "<i></i>".repeat(10);
  show("scr-quiz");
  renderQuestion();
}

// ---------- speech (spelling test) ----------
function say(text, rate = 0.85) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB"; u.rate = rate;
  const v = speechSynthesis.getVoices().find(v => v.lang === "en-GB") || speechSynthesis.getVoices().find(v => v.lang.startsWith("en"));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
if ("speechSynthesis" in window) speechSynthesis.getVoices();
$("sayWord").onclick = () => say(S.quiz[S.i].word);
$("saySlow").onclick = () => say(S.quiz[S.i].word, 0.45);
$("saySentence").onclick = () => { const q = S.quiz[S.i]; say(`${q.word}. ${q.sent.replace("____", q.word)}`); };

// ---------- quiz ----------
function renderQuestion() {
  const q = S.quiz[S.i];
  S.answered = false; S.hintUsed = false;
  [...$("qDots").children].forEach((d, k) => d.classList.toggle("cur", k === S.i));
  $("qNum").textContent = `Question ${S.i + 1} of 10`;
  $("qTopic").textContent = q.topic;
  $("qScore").textContent = S.score; $("qStreak").textContent = S.streak;
  $("feedback").classList.remove("show");
  $("hintBox").classList.remove("show"); $("hintBtn").style.display = "";
  const card = $("qCard"); card.style.animation = "none"; void card.offsetWidth; card.style.animation = "fadeIn .4s ease";

  if (q.type === "mc") {
    $("spellArea").style.display = "none"; $("mcArea").style.display = "";
    $("qText").innerHTML = q.q;
    $("mcArea").innerHTML = "";
    q.options.forEach((o, k) => {
      const b = document.createElement("button");
      b.className = "opt"; b.dataset.v = o;
      b.innerHTML = `<span class="k">${k + 1}</span><span>${o}</span>`;
      b.onclick = () => answerMC(b);
      $("mcArea").appendChild(b);
    });
  } else {
    $("mcArea").style.display = "none"; $("spellArea").style.display = "";
    $("qText").textContent = "Listen and spell the word 👂";
    $("spDef").textContent = q.def;
    $("spSent").textContent = q.sent;
    $("spInput").value = ""; $("spInput").disabled = false; $("spCheck").disabled = false;
    setTimeout(() => { $("spInput").focus(); say(q.word); }, 350);
  }
}

$("hintBtn").onclick = () => {
  const q = S.quiz[S.i];
  if (S.answered) return;
  S.hintUsed = true; Sfx.click();
  let html;
  if (q.type === "spell") html = `It starts with <b>"${q.word[0]}"</b> and has <b>${q.word.length} letters</b>: ${q.word[0]} ${"_ ".repeat(q.word.length - 1)}`;
  else if (q.hint) html = q.hint;
  else { // 50:50 for biology
    const wrong = [...$("mcArea").children].filter(b => b.dataset.v !== q.answer);
    wrong.sort(() => Math.random() - 0.5).slice(0, 2).forEach(b => { b.classList.add("faded"); b.disabled = true; });
    html = "50 : 50 — two wrong answers have been removed!";
  }
  $("hintBox").innerHTML = "💡 " + html; $("hintBox").classList.add("show");
  $("hintBtn").style.display = "none";
};

function answerMC(btn) {
  if (S.answered) return;
  const q = S.quiz[S.i], ok = btn.dataset.v === q.answer;
  [...$("mcArea").children].forEach(b => {
    b.disabled = true;
    if (b.dataset.v === q.answer) b.classList.add("right");
    else if (b === btn) b.classList.add("wrong");
    else b.classList.add("faded");
  });
  $("fbDiff").innerHTML = "";
  result(ok, ok ? "" : `The answer is <b>${q.answer}</b>.`, q.explain, q.q, q.answer, btn.dataset.v);
}

$("spCheck").onclick = checkSpelling;
$("spInput").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); if (!S.answered) checkSpelling(); else next(); } });

function checkSpelling() {
  if (S.answered) return;
  const q = S.quiz[S.i], typed = $("spInput").value.trim();
  if (!typed) { $("spInput").focus(); return; }
  const ok = typed.toLowerCase() === q.word.toLowerCase();
  $("spInput").disabled = true; $("spCheck").disabled = true;
  const t = typed.toLowerCase();
  const letters = [...q.word].map((ch, k) => `<span class="${t[k] === ch.toLowerCase() ? "g" : "r"}">${ch}</span>`).join("");
  $("fbDiff").innerHTML = ok ? `<span class="g">${q.word}</span>` : `${letters}<small>You wrote: “${escapeHtml(typed)}” — red letters show where it went wrong.</small>`;
  const syll = q.word.length > 5 ? "Say it in chunks as you write it, then cover it, write it again and check!" : "Look, say, cover, write, check!";
  result(ok, "", `${q.tip}<br><br><b>Meaning:</b> ${q.def}.<br><b>Example:</b> ${q.sent.replace("____", "<u>" + q.word + "</u>")}<br><br>✍️ <i>${syll}</i>`,
    `Spell: ${q.word}`, q.word, typed);
}
function escapeHtml(s) { return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function result(ok, extra, explain, qText, answer, given) {
  S.answered = true;
  const dot = $("qDots").children[S.i];
  dot.classList.add(ok ? "ok" : "no");
  if (ok) {
    S.score++; S.streak++; S.best = Math.max(S.best, S.streak);
    Sfx.correct();
    const r = $("qCard").getBoundingClientRect();
    Confetti.blast(S.streak >= 3 ? 110 : 60, r.left + r.width / 2, r.top + 120);
  } else {
    S.streak = 0; Sfx.wrong();
    const card = $("qCard"); card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
  }
  const praise = ["Brilliant!", "Correct!", "Nailed it!", "Superstar!", "Awesome!", "Spot on!"];
  const streakTxt = ok && S.streak >= 3 ? ` 🔥 ${S.streak} in a row!` : "";
  $("fbHead").className = "fbhead " + (ok ? "ok" : "no");
  $("fbHead").innerHTML = ok ? `✅ ${pick(praise)}${streakTxt}` : `❌ Not quite. ${extra}`;
  $("fbExplain").innerHTML = explain;
  $("feedback").classList.add("show");
  $("hintBtn").style.display = "none";
  $("qScore").textContent = S.score; $("qStreak").textContent = S.streak;
  $("nextBtn").textContent = S.i === 9 ? "See my results 🏆" : "Next ▶";
  setTimeout(() => $("nextBtn").focus(), 50);
  S.log.push({ ok, q: qText, answer, given, explain });
  if (!ok) {
    const isSpell = S.quiz[S.i].type === "spell";
    RickRoll.play(() => { if (isSpell) say(answer); $("nextBtn").focus(); });
  }
}

$("nextBtn").onclick = next;
function next() {
  if (RickRoll.playing) return;
  Sfx.click();
  if (S.i < 9) { S.i++; renderQuestion(); }
  else showResults();
}

document.addEventListener("keydown", e => {
  if (!$("scr-quiz").classList.contains("active")) return;
  const q = S.quiz[S.i];
  if (!S.answered && q.type === "mc" && /^[1-4]$/.test(e.key)) {
    const b = $("mcArea").children[Number(e.key) - 1];
    if (b && !b.disabled) b.click();
  } else if (S.answered && e.key === "Enter" && document.activeElement !== $("nextBtn")) { e.preventDefault(); next(); }
});

// ---------- results ----------
function turbosFor(score) { return Math.floor(score / 2) + (score === 10 ? 1 : 0); }

function showResults() {
  show("scr-results");
  const sc = S.score, stars = sc >= 9 ? 3 : sc >= 6 ? 2 : sc >= 3 ? 1 : 0;
  const passed = sc >= PASS_MARK;
  $("failBanner").classList.toggle("show", !passed);
  $("toRaceBtn").style.display = passed ? "" : "none";
  $("retryBtn").style.display = passed ? "none" : "";
  $("resReward").style.display = passed ? "" : "none";
  $("resScore").textContent = sc;
  $("resStars").innerHTML = [0, 1, 2].map(k => `<span style="animation-delay:${0.2 + k * 0.25}s">${k < stars ? "⭐" : "☆"}</span>`).join("");
  $("resTitle").textContent = !passed ? `You scored ${sc * 10}% — not quite there yet` : sc === 10 ? "PERFECT SCORE! 🤩 You passed!" : "🎉 You passed! Race unlocked!";
  $("resMsg").innerHTML = passed
    ? `<span class="passline">✅ PASSED with ${sc * 10}%${S.attempts > 1 ? " on try " + S.attempts : ""}</span><br>${SUBJ_NAME[S.subject]}, Year ${S.year}. Best streak: ${S.best} 🔥`
    : `You need ${PASS_MARK - sc} more correct answer${PASS_MARK - sc === 1 ? "" : "s"} to pass. Study the notes below — the next quiz has <b>new questions</b>, so learn the rules, not just the answers!`;
  const t = turbosFor(sc);
  $("resReward").innerHTML = `🎁 You earned <b>${t} turbo boost${t === 1 ? "" : "s"}</b> for the race! (1 for every 2 correct answers${sc === 10 ? " + 1 bonus for a perfect score" : ""})`;
  $("resList").innerHTML = S.log.map((l, k) => `
    <div class="rv ${l.ok ? "ok" : "no"}">
      <div class="rq">${k + 1}. ${l.q}</div>
      <div class="ra">Answer: <b>${l.answer}</b>${l.ok ? "" : ` — you said “${escapeHtml(String(l.given))}”`}</div>
      <div>${l.explain}</div>
    </div>`).join("");
  if (passed) { setTimeout(() => Confetti.blast(160), 300); Sfx.fanfare(); }
  else Sfx.wrong();
}

$("retryBtn").onclick = () => { Sfx.click(); startQuiz(S.subject); };

$("toRaceBtn").onclick = () => {
  if (S.score < PASS_MARK) return; // race is locked until you pass
  Sfx.init(); Sfx.click();
  show("scr-race");
  $("muteBtn").style.display = "";
  Race.open({
    name: S.name, turbos: turbosFor(S.score), band: bandForYear(S.year), quizScore: S.score,
    time: 300,
    onNewQuiz: () => show("scr-subject"),
    onQuit: () => show("scr-results"),
  });
};

