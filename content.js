// ============================================================
//  BRAIN RACE — learning content
//  Year bands: A = Y1-2, B = Y3-4, C = Y5-6, D = Y7-9, E = Y10-13
// ============================================================
"use strict";

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

function bandForYear(y) {
  if (y <= 2) return "A";
  if (y <= 4) return "B";
  if (y <= 6) return "C";
  if (y <= 9) return "D";
  return "E";
}

// Make 4 unique multiple-choice options from a correct answer and some wrong ones.
function makeOptions(correct, wrongs, fallback) {
  const set = [String(correct)];
  for (const w of wrongs) {
    const s = String(w);
    if (!set.includes(s) && set.length < 4) set.push(s);
  }
  let guard = 0;
  while (set.length < 4 && guard++ < 50) {
    const s = String(fallback ? fallback() : isNaN(Number(correct)) ? "None of these" : (Number(correct) + rnd(-10, 10)));
    if (!set.includes(s)) set.push(s);
  }
  return shuffle(set);
}
const near = (n, spread = 5) => () => n + (rnd(0, 1) ? 1 : -1) * rnd(1, spread);

// ------------------------------------------------------------
//  MATHS — procedurally generated, with worked explanations
// ------------------------------------------------------------
const MATHS = {
  A: [
    () => { const a = rnd(2, 10), b = rnd(1, 9), s = a + b, big = Math.max(a, b), small = Math.min(a, b);
      const steps = []; for (let i = 1; i <= small; i++) steps.push(big + i);
      return { topic: "Adding", q: `${a} + ${b} = ?`, answer: s, options: makeOptions(s, [s + 1, s - 1, s + 2, a * b], near(s, 3)),
        hint: `Hold the bigger number (${big}) in your head and count on ${small} more.`,
        explain: `Start at the bigger number <b>${big}</b> and count on <b>${small}</b>: ${steps.join(", ")}. So ${a} + ${b} = <b>${s}</b>. Tip: adding in any order gives the same answer!` }; },
    () => { const a = rnd(6, 20), b = rnd(1, Math.min(9, a - 1)), d = a - b;
      return { topic: "Taking away", q: `${a} − ${b} = ?`, answer: d, options: makeOptions(d, [d + 1, d - 1, a + b, d + 2], near(d, 3)),
        hint: `Start at ${a} and count back ${b}.`,
        explain: `Subtraction means taking away. Start at <b>${a}</b> and count back <b>${b}</b> steps to land on <b>${d}</b>. Check it: ${d} + ${b} = ${a} ✔ (adding is the opposite of taking away).` }; },
    () => { const a = rnd(1, 9), b = 10 - a;
      return { topic: "Number bonds", q: `What goes with ${a} to make 10?`, answer: b, options: makeOptions(b, [b + 1, b - 1, a, 10 + a], near(b, 3)),
        hint: "Number bonds to 10 are pairs that add up to 10, like 3 and 7.",
        explain: `${a} + <b>${b}</b> = 10. Number bonds to 10 are: 0+10, 1+9, 2+8, 3+7, 4+6, 5+5. Knowing these by heart makes bigger sums super quick — e.g. ${a}0 + ${b}0 = 100!` }; },
    () => { const a = rnd(2, 12), d = a * 2;
      return { topic: "Doubling", q: `What is double ${a}?`, answer: d, options: makeOptions(d, [d + 1, d - 2, a + 1, d + 2], near(d, 3)),
        hint: "Doubling means adding a number to itself.",
        explain: `Double means "two lots of". ${a} + ${a} = <b>${d}</b>. Doubles are always even numbers!` }; },
    () => { const a = pick([4, 6, 8, 10, 12, 14, 16, 18, 20]), h = a / 2;
      return { topic: "Halving", q: `What is half of ${a}?`, answer: h, options: makeOptions(h, [h + 1, h - 1, a * 2, a - 2], near(h, 3)),
        hint: "Halving means sharing into 2 equal groups.",
        explain: `Half means splitting into <b>2 equal groups</b>. ${a} shared into 2 groups gives <b>${h}</b> in each. Check: ${h} + ${h} = ${a} ✔. Halving is the opposite of doubling.` }; },
    () => { const s = pick([["triangle", 3], ["square", 4], ["rectangle", 4], ["pentagon", 5], ["hexagon", 6], ["octagon", 8]]);
      return { topic: "Shapes", q: `How many sides does a ${s[0]} have?`, answer: s[1], options: makeOptions(s[1], [3, 4, 5, 6, 8].filter(x => x !== s[1]), near(s[1], 2)),
        hint: "Picture the shape and count each straight edge.",
        explain: `A ${s[0]} has <b>${s[1]} sides</b>. Shape names help: <i>tri</i> = 3, <i>quad</i> = 4, <i>penta</i> = 5, <i>hexa</i> = 6, <i>octa</i> = 8 (an octopus has 8 legs!).` }; },
    () => { const a = rnd(11, 49), b = rnd(11, 49), big = Math.max(a, b);
      if (a === b) return MATHS.A[0]();
      return { topic: "Comparing", q: `Which number is bigger: ${a} or ${b}?`, answer: big, options: makeOptions(big, [Math.min(a, b), big + 10, Math.min(a, b) - 10]),
        hint: "Look at the tens digit first.",
        explain: `Compare the <b>tens</b> first, then the ones. ${big} is bigger. ${a} has ${Math.floor(a / 10)} tens and ${b} has ${Math.floor(b / 10)} tens.` }; },
  ],
  B: [
    () => { const a = rnd(2, 10), b = rnd(2, 12), p = a * b; const cnt = []; for (let i = 1; i <= b; i++) cnt.push(a * i);
      return { topic: "Times tables", q: `${a} × ${b} = ?`, answer: p, options: makeOptions(p, [p + a, p - a, a + b, p + 1], near(p, 6)),
        hint: `Count up in ${a}s, ${b} times.`,
        explain: `${a} × ${b} means <b>${b} groups of ${a}</b>. Count in ${a}s: ${cnt.join(", ")}. So the answer is <b>${p}</b>. Also ${b} × ${a} = ${p} — multiplication works both ways!` }; },
    () => { const a = rnd(2, 10), b = rnd(2, 12), p = a * b;
      return { topic: "Division", q: `${p} ÷ ${a} = ?`, answer: b, options: makeOptions(b, [b + 1, b - 1, a, p - a], near(b, 3)),
        hint: `Which number times ${a} makes ${p}?`,
        explain: `Division is the <b>inverse</b> (opposite) of multiplication. Because ${a} × ${b} = ${p}, we know ${p} ÷ ${a} = <b>${b}</b>. Use your times tables to divide!` }; },
    () => { const a = rnd(15, 68), b = rnd(15, 68), s = a + b, o = (a % 10) + (b % 10);
      return { topic: "Column addition", q: `${a} + ${b} = ?`, answer: s, options: makeOptions(s, [s - 10, s + 10, s + 1, s - 1], near(s, 12)),
        hint: "Add the ones first, then the tens.",
        explain: `Column method: ones first: ${a % 10} + ${b % 10} = ${o}${o >= 10 ? ` → write ${o % 10}, <b>carry 1 ten</b>` : ""}. Tens: ${Math.floor(a / 10)} + ${Math.floor(b / 10)}${o >= 10 ? " + 1 (carried)" : ""} = ${Math.floor(s / 10)}. Answer: <b>${s}</b>.` }; },
    () => { const d = pick([2, 3, 4, 5, 10]), k = rnd(2, 10), n = d * k;
      return { topic: "Fractions", q: `What is 1/${d} of ${n}?`, answer: k, options: makeOptions(k, [k + 1, k - 1, n - d, d], near(k, 3)),
        hint: `Finding 1/${d} means dividing by ${d}.`,
        explain: `To find a unit fraction of an amount, <b>divide by the bottom number</b> (the denominator). ${n} ÷ ${d} = <b>${k}</b>. The denominator tells you how many equal parts to split into.` }; },
    () => { const n = rnd(1000, 9999), ds = String(n).split(""), i = rnd(0, 3), names = ["thousands", "hundreds", "tens", "ones"], v = Number(ds[i]) * [1000, 100, 10, 1][i];
      if (ds[i] === "0") return MATHS.B[0]();
      return { topic: "Place value", q: `What is the value of the digit ${ds[i]} in ${n.toLocaleString()}?`, answer: v, options: makeOptions(v, [ds[i], ds[i] * 10, ds[i] * 100, ds[i] * 1000].filter(x => Number(x) !== v)),
        hint: "Work out which column the digit is in: thousands, hundreds, tens or ones.",
        explain: `In ${n.toLocaleString()} the ${ds[i]} is in the <b>${names[i]}</b> column, so it is worth <b>${v.toLocaleString()}</b>. Each column is 10 times bigger than the one to its right.` }; },
    () => { const a = rnd(300, 900), b = rnd(100, a - 50), d = a - b;
      return { topic: "Column subtraction", q: `${a} − ${b} = ?`, answer: d, options: makeOptions(d, [d + 10, d - 10, d + 100, d + 1], near(d, 15)),
        hint: "Line up hundreds, tens and ones. Subtract the ones first.",
        explain: `Subtract column by column, starting with the ones. If the top digit is smaller, <b>exchange</b> 1 from the next column (borrow 10). ${a} − ${b} = <b>${d}</b>. Check by adding back: ${d} + ${b} = ${a} ✔` }; },
  ],
  C: [
    () => { const a = rnd(12, 89), b = rnd(3, 9), t = Math.floor(a / 10) * 10, o = a % 10, p = a * b;
      return { topic: "Multiplying", q: `${a} × ${b} = ?`, answer: p, options: makeOptions(p, [p + b, p - 10, t * b + o, p + 10], near(p, 20)),
        hint: `Split ${a} into ${t} and ${o}, multiply each by ${b}, then add.`,
        explain: `<b>Partitioning</b>: ${a} = ${t} + ${o}. ${t} × ${b} = ${t * b}, and ${o} × ${b} = ${o * b}. Add them: ${t * b} + ${o * b} = <b>${p}</b>.` }; },
    () => { const f = pick([[1, 2, 50, "0.5"], [1, 4, 25, "0.25"], [3, 4, 75, "0.75"], [1, 5, 20, "0.2"], [2, 5, 40, "0.4"], [1, 10, 10, "0.1"], [3, 10, 30, "0.3"], [7, 10, 70, "0.7"], [3, 5, 60, "0.6"]]);
      return { topic: "Fractions → %", q: `What is ${f[0]}/${f[1]} as a percentage?`, answer: f[2] + "%", options: makeOptions(f[2] + "%", [f[0] * 10 + "%", f[1] * 10 + "%", (100 - f[2]) + "%", f[0] + f[1] + "%"], () => rnd(1, 19) * 5 + "%"),
        hint: "Percent means 'out of 100'. Make the bottom number 100.",
        explain: `Percent means <b>out of 100</b>. Multiply top and bottom so the bottom is 100: ${f[0]}/${f[1]} = ${f[2]}/100 = <b>${f[2]}%</b>. As a decimal that is ${f[3]}.` }; },
    () => { const l = rnd(3, 15), w = rnd(2, 12), A = l * w, P = 2 * (l + w);
      return { topic: "Area", q: `A rectangle is ${l} cm long and ${w} cm wide. What is its area?`, answer: A + " cm²", options: makeOptions(A + " cm²", [P + " cm²", (l + w) + " cm²", (A + l) + " cm²"], () => (A + rnd(-9, 9)) + " cm²"),
        hint: "Area of a rectangle = length × width.",
        explain: `Area is the space <b>inside</b> a shape. For a rectangle: <b>length × width</b> = ${l} × ${w} = <b>${A} cm²</b>. (Don't mix it up with perimeter — the distance around the edge — which would be ${P} cm.)` }; },
    () => { const l = rnd(3, 20), w = rnd(2, 15), P = 2 * (l + w);
      return { topic: "Perimeter", q: `What is the perimeter of a rectangle ${l} m by ${w} m?`, answer: P + " m", options: makeOptions(P + " m", [l * w + " m", (l + w) + " m", (P + 2) + " m"], () => (P + rnd(-8, 8)) + " m"),
        hint: "Perimeter is the distance all the way around the edge.",
        explain: `Perimeter = add all 4 sides: ${l} + ${w} + ${l} + ${w} = <b>${P} m</b>. Shortcut: 2 × (length + width).` }; },
    () => { const n = rnd(1001, 9999), to = pick([10, 100, 1000]), r = Math.round(n / to) * to;
      return { topic: "Rounding", q: `Round ${n.toLocaleString()} to the nearest ${to.toLocaleString()}.`, answer: r.toLocaleString(), options: makeOptions(r.toLocaleString(), [(r - to).toLocaleString(), (r + to).toLocaleString(), (Math.floor(n / to) * to === r ? Math.ceil(n / to) * to : Math.floor(n / to) * to).toLocaleString()], () => (r + rnd(-3, 3) * to).toLocaleString()),
        hint: "Look at the digit to the right of the place you're rounding to. 5 or more → round up.",
        explain: `Look at the digit just to the right of the ${to.toLocaleString()}s place. If it is <b>5 or more, round up</b>; if it is 4 or less, round down. ${n.toLocaleString()} → <b>${r.toLocaleString()}</b>.` }; },
    () => { const a = rnd(2, 12), s = a * a;
      return { topic: "Square numbers", q: `What is ${a}²?`, answer: s, options: makeOptions(s, [a * 2, s + a, s - 1, (a + 1) * (a + 1)], near(s, 10)),
        hint: `${a}² means ${a} × ${a}.`,
        explain: `The little ² means "squared": multiply the number by itself. ${a} × ${a} = <b>${s}</b>. It's called square because ${s} dots make a perfect ${a}-by-${a} square!` }; },
    () => { const a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9), r = a + b * c;
      return { topic: "Order of operations", q: `${a} + ${b} × ${c} = ?`, answer: r, options: makeOptions(r, [(a + b) * c, r + 1, a * b + c], near(r, 8)),
        hint: "BODMAS: Multiply before you Add!",
        explain: `<b>BODMAS</b> = Brackets, Orders, Division, Multiplication, Addition, Subtraction. Multiply first: ${b} × ${c} = ${b * c}, then add: ${a} + ${b * c} = <b>${r}</b>. Working left to right would wrongly give ${(a + b) * c}.` }; },
  ],
  D: [
    () => { const a = -rnd(2, 12), b = rnd(-12, 12) || 5, r = a + b;
      return { topic: "Negative numbers", q: `(${a}) + (${b}) = ?`, answer: r, options: makeOptions(r, [-r, a - b, r + 2, r - 2], near(r, 4)),
        hint: "Use a number line: adding a positive moves right, adding a negative moves left.",
        explain: `On a number line start at <b>${a}</b>. ${b >= 0 ? `Adding ${b} moves <b>right</b> ${b} places` : `Adding ${b} is the same as subtracting ${-b}, so move <b>left</b> ${-b} places`}. You land on <b>${r}</b>.` }; },
    () => { const x = rnd(-5, 12), a = rnd(2, 9), b = rnd(1, 20), c = a * x + b;
      return { topic: "Solving equations", q: `Solve: ${a}x + ${b} = ${c}`, answer: "x = " + x, options: makeOptions("x = " + x, ["x = " + (x + 1), "x = " + (c - b), "x = " + ((c + b) / a).toFixed(0)], () => "x = " + (x + rnd(-6, 6))),
        hint: "Undo the + first, then undo the ×. Do the same to both sides.",
        explain: `Do the same thing to both sides to keep the equation balanced. Subtract ${b}: ${a}x = ${c - b}. Divide by ${a}: <b>x = ${x}</b>. Check: ${a} × ${x} + ${b} = ${c} ✔` }; },
    () => { const p = pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 75]), n = rnd(2, 20) * 20, r = p * n / 100;
      return { topic: "Percentages", q: `What is ${p}% of ${n}?`, answer: r, options: makeOptions(r, [n / 10, r + n / 20, n - r, p + n / 10], near(r, 10)),
        hint: "Find 10% first (divide by 10), then build up.",
        explain: `10% of ${n} = ${n / 10}. 5% is half of that = ${n / 20}. Build ${p}% from these pieces: ${p}% = <b>${r}</b>. Or use the multiplier: ${n} × ${p / 100} = ${r}.` }; },
    () => { const a = rnd(25, 90), b = rnd(20, 150 - a), c = 180 - a - b;
      return { topic: "Angles", q: `A triangle has angles ${a}° and ${b}°. What is the third angle?`, answer: c + "°", options: makeOptions(c + "°", [(360 - a - b) + "°", (c + 10) + "°", (a + b) + "°"], () => (c + rnd(-15, 15)) + "°"),
        hint: "Angles in a triangle always add to 180°.",
        explain: `The angles inside any triangle add to <b>180°</b>. ${a} + ${b} = ${a + b}, and 180 − ${a + b} = <b>${c}°</b>. (Angles round a point add to 360°, angles on a straight line add to 180°.)` }; },
    () => { const a = rnd(1, 5), b = rnd(1, 5) + (rnd(0, 1)), k = rnd(2, 12), n = (a + b) * k;
      return { topic: "Ratio", q: `Share £${n} in the ratio ${a}:${b}. How much is the first share?`, answer: "£" + a * k, options: makeOptions("£" + a * k, ["£" + b * k, "£" + n / 2, "£" + (a * k + k)], () => "£" + (a * k + rnd(-5, 5))),
        hint: "Add the ratio parts to find how many parts in total.",
        explain: `Total parts = ${a} + ${b} = ${a + b}. One part = £${n} ÷ ${a + b} = £${k}. First share = ${a} × £${k} = <b>£${a * k}</b> (second share is £${b * k}; together £${n} ✔).` }; },
    () => { const b = rnd(2, 12) * 2, h = rnd(2, 12), A = b * h / 2;
      return { topic: "Area of triangles", q: `A triangle has base ${b} cm and height ${h} cm. What is its area?`, answer: A + " cm²", options: makeOptions(A + " cm²", [b * h + " cm²", (b + h) + " cm²", A * 4 + " cm²"], () => (A + rnd(-9, 9)) + " cm²"),
        hint: "Area of triangle = ½ × base × height.",
        explain: `A triangle is half of a rectangle. Area = <b>½ × base × height</b> = ½ × ${b} × ${h} = <b>${A} cm²</b>.` }; },
    () => { const x = rnd(2, 6), a = rnd(2, 5), b = rnd(1, 9), r = a * x * x + b;
      return { topic: "Substitution", q: `If x = ${x}, what is ${a}x² + ${b}?`, answer: r, options: makeOptions(r, [(a * x) * (a * x) + b, a * x * 2 + b, r + a], near(r, 10)),
        hint: "Square x first, then multiply by the number in front.",
        explain: `Replace x with ${x}. Powers come before multiplication (BIDMAS): x² = ${x * x}, then ${a} × ${x * x} = ${a * x * x}, then + ${b} = <b>${r}</b>.` }; },
  ],
  E: [
    () => { let p = rnd(-7, 7) || 2, q = rnd(-7, 7) || -3; if (p === -q || p === q) q = p === 7 ? -2 : p + 1; if (q === 0) q = 3; const B = -(p + q), C = p * q;
      const fmt = (c, v) => c === 0 ? "" : (c > 0 ? ` + ${c === 1 && v ? "" : c}${v}` : ` − ${c === -1 && v ? "" : -c}${v}`);
      const ans = `x = ${Math.min(p, q)} or x = ${Math.max(p, q)}`;
      return { topic: "Quadratics", q: `Solve: x²${fmt(B, "x")}${fmt(C, "")} = 0`, answer: ans, options: makeOptions(ans, [`x = ${-Math.max(p, q)} or x = ${-Math.min(p, q)}`, `x = ${p} or x = ${-q}`, `x = ${B} or x = ${C}`], () => `x = ${rnd(-8, 0)} or x = ${rnd(1, 8)}`),
        hint: `Find two numbers that multiply to ${C} and add to ${B}.`,
        explain: `Factorise: find two numbers that <b>multiply to ${C}</b> and <b>add to ${B}</b>: they are ${-p} and ${-q}. So (x ${-p >= 0 ? "+" : "−"} ${Math.abs(p)})(x ${-q >= 0 ? "+" : "−"} ${Math.abs(q)}) = 0. If two things multiply to make 0, one must be 0, so <b>${ans}</b>.` }; },
    () => { const t = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), k = rnd(1, 3), a = t[0] * k, b = t[1] * k, c = t[2] * k;
      return { topic: "Pythagoras", q: `A right-angled triangle has shorter sides ${a} cm and ${b} cm. How long is the hypotenuse?`, answer: c + " cm", options: makeOptions(c + " cm", [(a + b) + " cm", (c + 1) + " cm", Math.round(Math.sqrt(b * b - a * a)) + " cm"], () => (c + rnd(-5, 5)) + " cm"),
        hint: "a² + b² = c², where c is the longest side.",
        explain: `Pythagoras' theorem: <b>a² + b² = c²</b>. ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}. √${c * c} = <b>${c} cm</b>. (${t.join("-")} is a Pythagorean triple — worth remembering!)` }; },
    () => { const a = rnd(1, 9), b = rnd(-9, 9) || 4, s = a + b, p = a * b;
      const sg = n => (n >= 0 ? `+ ${n}` : `− ${-n}`);
      const ans = `x² ${sg(s)}x ${sg(p)}`.replace("+ 1x", "+ x").replace("− 1x", "− x").replace(" + 0x", "");
      return { topic: "Expanding brackets", q: `Expand: (x ${sg(a)})(x ${sg(b)})`, answer: ans, options: makeOptions(ans, [`x² ${sg(p)}x ${sg(s)}`, `x² ${sg(a * b)}`, `2x ${sg(s)}`, `x² ${sg(s)}x ${sg(a + b)}`], () => `x² ${sg(s + rnd(1, 4))}x ${sg(p + rnd(-6, 6))}`),
        hint: "Multiply every term in the first bracket by every term in the second (FOIL).",
        explain: `<b>FOIL</b>: First x·x = x², Outer x·(${b}) = ${b}x, Inner (${a})·x = ${a}x, Last ${a}·(${b}) = ${p}. Collect like terms: <b>${ans}</b>.` }; },
    () => { const x1 = rnd(-5, 5), y1 = rnd(-5, 5), m = pick([-3, -2, -1, 1, 2, 3, 4]), dx = rnd(1, 4), x2 = x1 + dx, y2 = y1 + m * dx;
      return { topic: "Gradient", q: `What is the gradient of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`, answer: m, options: makeOptions(m, [-m, dx, m * dx, m + 1]),
        hint: "Gradient = change in y ÷ change in x.",
        explain: `Gradient = <b>rise ÷ run</b> = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${y2 - y1} ÷ ${dx} = <b>${m}</b>. Positive gradient slopes up, negative slopes down. In y = mx + c, m is the gradient.` }; },
    () => { const a = rnd(2, 9), b = rnd(3, 9) === a ? a + 1 : rnd(3, 9), t = rnd(0, 2);
      if (t === 0) return { topic: "Indices", q: `Simplify: x^${a} × x^${b}`, answer: `x^${a + b}`, options: makeOptions(`x^${a + b}`, [`x^${a * b}`, `2x^${a + b}`, `x^${Math.abs(a - b)}`]), hint: "When multiplying powers of the same base, add the indices.",
        explain: `x^${a} means ${a} x's multiplied together, x^${b} means ${b} more. Altogether ${a + b} x's: <b>x^${a + b}</b>. Rule: x^a × x^b = x^(a+b).` };
      if (t === 1) return { topic: "Indices", q: `Simplify: (x^${a})^${b}`, answer: `x^${a * b}`, options: makeOptions(`x^${a * b}`, [`x^${a + b}`, `${b}x^${a}`, `x^${a}${b}`]), hint: "Power of a power: multiply the indices.",
        explain: `(x^${a})^${b} means x^${a} multiplied by itself ${b} times, so you have ${a} × ${b} = ${a * b} x's: <b>x^${a * b}</b>. Rule: (x^a)^b = x^(ab).` };
      const big = Math.max(a, b) + 2;
      return { topic: "Indices", q: `Simplify: x^${big} ÷ x^${a}`, answer: `x^${big - a}`, options: makeOptions(`x^${big - a}`, [`x^${big + a}`, `x^${big * a}`, `1`]), hint: "When dividing powers of the same base, subtract the indices.",
        explain: `Dividing cancels ${a} of the x's from the ${big} on top, leaving <b>x^${big - a}</b>. Rule: x^a ÷ x^b = x^(a−b). (And x^0 = 1!)` };
    },
    () => { const x = rnd(1, 12), y = rnd(1, 9) === x ? x + 1 : rnd(1, 9), s = x + y, d = x - y;
      return { topic: "Simultaneous equations", q: `x + y = ${s} and x − y = ${d}. Find x and y.`, answer: `x = ${x}, y = ${y}`, options: makeOptions(`x = ${x}, y = ${y}`, [`x = ${y}, y = ${x}`, `x = ${s}, y = ${d}`, `x = ${x + 1}, y = ${y - 1}`], () => `x = ${x + rnd(-3, 3)}, y = ${y + rnd(-3, 3)}`),
        hint: "Add the two equations together — the y's cancel!",
        explain: `<b>Elimination</b>: add the equations: 2x = ${s + d}, so x = ${x}. Substitute back: ${x} + y = ${s}, so y = ${y}. Answer: <b>x = ${x}, y = ${y}</b>.` }; },
    () => { const r = rnd(1, 9), b = rnd(1, 9), g = rnd(0, 6), t = r + b + g, k = gcd(r, t);
      const ans = `${r / k}/${t / k}`;
      return { topic: "Probability", q: `A bag has ${r} red, ${b} blue${g ? ` and ${g} green` : ""} counters. What is P(red)?`, answer: ans, options: makeOptions(ans, [`${r}/${b + g || 1}`, `${b}/${t}`, `1/${r}`, `${t}/${r}`], () => `${rnd(1, 9)}/${t + rnd(1, 6)}`),
        hint: "Probability = number of ways it can happen ÷ total outcomes.",
        explain: `P(red) = red counters ÷ total counters = ${r}/${t}${k > 1 ? ` = <b>${ans}</b> (simplified by dividing by ${k})` : ` = <b>${ans}</b>`}. Probabilities are always between 0 (impossible) and 1 (certain).` }; },
  ],
};

// ------------------------------------------------------------
//  ENGLISH — spelling test words (w, definition, sentence, tip)
// ------------------------------------------------------------
const SPELLING = {
  A: [
    ["said", "the past tense of 'say'", "She ____ hello to me.", "A tricky word! The 'ai' makes a short 'e' sound here: s-ai-d."],
    ["friend", "someone you like and trust", "My best ____ came to play.", "Remember: a fr-<b>i-end</b> stays with you to the <b>end</b>."],
    ["because", "for the reason that", "I wore a coat ____ it was cold.", "<b>B</b>ig <b>E</b>lephants <b>C</b>an <b>A</b>lways <b>U</b>nderstand <b>S</b>mall <b>E</b>lephants!"],
    ["night", "the dark time when we sleep", "The stars shine at ____.", "'<b>igh</b>' makes the long 'i' sound: n-igh-t, l-igh-t, br-igh-t."],
    ["house", "a building where people live", "We painted our ____ blue.", "'<b>ou</b>' makes the 'ow' sound: h-ou-se, m-ou-se, l-ou-d."],
    ["water", "the clear liquid we drink", "Fish swim in the ____.", "After a 'w', the letter 'a' often sounds like 'or': w-<b>a</b>-ter, w-<b>a</b>-sh."],
    ["happy", "feeling glad", "The puppy looks very ____.", "Short vowel → <b>double the p</b>. A 'y' at the end makes an 'ee' sound."],
    ["people", "more than one person", "Lots of ____ came to the party.", "The 'eo' is unusual: say it 'pe-<b>o</b>-ple' in your head when you write it."],
    ["school", "where children go to learn", "I walk to ____ every day.", "Here '<b>ch</b>' makes a hard 'k' sound: s-ch-oo-l."],
    ["little", "small", "A ____ mouse ran past.", "Double t, then the '<b>-le</b>' ending: lit-tle (like bottle, kettle)."],
    ["one", "the number 1", "I have ____ nose.", "Sounds like 'won' but it is spelled <b>o-n-e</b>. A word you just have to learn!"],
    ["there", "in that place", "Put the box over ____.", "'There' is about a <b>place</b> — and it has '<b>here</b>' inside it!"],
    ["jumped", "leapt into the air (in the past)", "The frog ____ into the pond.", "Past tense '<b>-ed</b>' can sound like 't', but we still write 'ed'."],
    ["rain", "water falling from clouds", "Take an umbrella in the ____.", "'<b>ai</b>' usually goes in the middle of a word: r-ai-n, tr-ai-n. 'ay' goes at the end: pl-ay."],
  ],
  B: [
    ["different", "not the same", "My shoes are ____ colours.", "Three syllables: <b>dif-fer-ent</b>. Double f, and say every part."],
    ["beautiful", "very pretty", "What a ____ sunset!", "'<b>B</b>ig <b>E</b>lephants <b>A</b>re <b>U</b>gly' gives b-e-a-u, then -ti-ful. <b>-ful</b> has only one L!"],
    ["favourite", "the one you like best", "Pizza is my ____ food.", "British spelling: <b>favour + ite</b>. Don't forget the 'u'!"],
    ["important", "really matters", "It is ____ to drink water.", "im-por-<b>tant</b> — the ending is '-ant'."],
    ["separate", "apart, not together", "Keep the eggs ____ from the flour.", "There's '<b>a rat</b>' in sep-<b>a-rat</b>-e!"],
    ["answer", "a reply to a question", "Write your ____ on the line.", "Silent '<b>w</b>': ans-w-er. Say 'ans-wer' to remember it."],
    ["believe", "think something is true", "I ____ you can do it.", "Never be<b>lie</b>ve a <b>lie</b>! Also 'i before e except after c'."],
    ["caught", "the past of 'catch'", "She ____ the ball.", "'<b>augh</b>' makes the 'or' sound: c-augh-t, t-augh-t, d-augh-ter."],
    ["island", "land with water all around", "We sailed to a small ____.", "Silent '<b>s</b>'. An island <b>is land</b> surrounded by water."],
    ["February", "the second month", "My birthday is in ____.", "Don't forget the first 'r': Feb-<b>ru</b>-ar-y. Months need a capital letter!"],
    ["knowledge", "what you know", "Reading grows your ____.", "Silent '<b>k</b>': <b>know</b> + <b>ledge</b>."],
    ["surprise", "something you didn't expect", "The party was a ____!", "<b>sur</b>-prise: there is an 'r' after 'su' that's easy to miss."],
    ["calendar", "a chart of days and months", "Check the ____ for the date.", "It ends in '<b>-ar</b>': cal-en-dar."],
    ["interest", "wanting to know more", "I have an ____ in space.", "Say all three syllables: <b>in-ter-est</b>."],
  ],
  C: [
    ["necessary", "needed", "Is it ____ to bring a coat?", "One <b>C</b>ollar, two <b>S</b>leeves: ne-<b>c</b>-e-<b>ss</b>-ary."],
    ["accommodate", "to have room for", "The hotel can ____ fifty guests.", "It's big enough to accommodate <b>two c's and two m's</b>."],
    ["rhythm", "a regular beat", "Clap along to the ____.", "<b>R</b>hythm <b>H</b>elps <b>Y</b>our <b>T</b>wo <b>H</b>ips <b>M</b>ove."],
    ["definitely", "certainly", "I will ____ be there.", "It has '<b>finite</b>' inside: de-<b>finite</b>-ly. No 'a'!"],
    ["environment", "the natural world around us", "We must protect the ____.", "There's '<b>iron</b>' in env<b>iron</b>ment."],
    ["government", "the people who run a country", "The ____ made a new law.", "<b>Govern + ment</b> — don't drop the 'n'."],
    ["immediately", "straight away", "Come here ____!", "Double m: <b>im-me-di-ate-ly</b>."],
    ["embarrass", "to make someone feel awkward", "Please don't ____ me.", "Two r's and two s's: you go <b>R</b>eally <b>R</b>ed and <b>S</b>mile <b>S</b>hyly."],
    ["parliament", "where laws are made", "The ____ voted today.", "I <b>am</b> in parl-<b>ia</b>-ment: parl-I-AM-ent."],
    ["queue", "a line of people waiting", "We stood in the ____ for an hour.", "q + <b>ueue</b> — the letters themselves queue up!"],
    ["restaurant", "a place to buy and eat meals", "We ate at an Italian ____.", "rest-<b>au</b>-rant: there's 'au' in the middle."],
    ["vegetable", "a plant we eat, like a carrot", "Broccoli is a green ____.", "Four syllables: <b>veg-e-ta-ble</b>."],
    ["sincerely", "honestly; truly", "Yours ____, Sam.", "<b>sincere + ly</b> — keep the 'e' when you add -ly."],
    ["conscience", "your inner sense of right and wrong", "My ____ told me to tell the truth.", "<b>con + science</b>."],
  ],
  D: [
    ["conscientious", "careful and hard-working", "She is a ____ student.", "<b>conscien</b>ce + <b>tious</b>: con-sci-en-tious."],
    ["millennium", "a thousand years", "The year 2000 began a new ____.", "Double l, double n: <b>mill-enn-ium</b> (Latin <i>mille</i> = thousand, <i>annus</i> = year)."],
    ["onomatopoeia", "a word that sounds like its meaning, e.g. 'buzz'", "'Sizzle' is an example of ____.", "on-o-mat-o-<b>poe</b>-ia — like a <b>poe</b>t using sound words."],
    ["privilege", "a special right or advantage", "It is a ____ to meet you.", "No 'd' and no 'edge': privi-<b>lege</b>."],
    ["questionnaire", "a set of written questions", "Please fill in the ____.", "<b>question + naire</b> — double n."],
    ["liaison", "communication between groups", "She acts as ____ between the teams.", "An 'i' on <b>both sides</b> of the 'a': l-<b>i</b>-a-<b>i</b>-son."],
    ["miscellaneous", "of various kinds; mixed", "The drawer is full of ____ items.", "<b>misc + ell + aneous</b>: mis-cel-la-ne-ous."],
    ["pronunciation", "how a word is spoken", "Check the ____ in a dictionary.", "There's no 'noun' in it: pro-<b>nun</b>-ciation."],
    ["recommend", "to suggest as good", "I ____ this book.", "One c, double m: <b>re + commend</b>."],
    ["occasionally", "sometimes", "We ____ go to the cinema.", "Double c, single s: o-<b>cc</b>-a-<b>s</b>-ion-al-ly."],
    ["exaggerate", "to make something seem bigger than it is", "Don't ____ — it wasn't that big!", "Double g: ex-a-<b>gg</b>-er-ate."],
    ["independent", "free; not relying on others", "She is very ____.", "Ends in '<b>-ent</b>', not '-ant'."],
    ["acquire", "to get or gain", "You will ____ new skills.", "<b>ac + quire</b>: a 'c' sneaks in before the 'q'."],
    ["achievement", "something done successfully", "Passing the exam was a great ____.", "<b>i before e</b> except after c: ach-<b>ie</b>-ve-ment."],
  ],
  E: [
    ["bureaucracy", "a system with lots of rules and officials", "The ____ slowed everything down.", "<b>bureau + cracy</b> — 'bureau' is French for office/desk."],
    ["connoisseur", "an expert judge of taste", "He is a ____ of fine cheese.", "French origin: con-<b>noi</b>-<b>sseur</b> — double n, double s."],
    ["entrepreneur", "someone who starts a business", "The young ____ launched an app.", "<b>entre + pre + neur</b>: the 'eur' ending comes from French."],
    ["idiosyncrasy", "an unusual personal habit", "Humming while he works is an odd ____ of his.", "Ends in '<b>-sy</b>' not '-cy' (Greek <i>synkrasis</i> = mixture)."],
    ["mischievous", "playfully naughty", "The ____ kitten knocked over a cup.", "Only <b>three syllables</b>: mis-chie-vous. There is no 'i' before '-ous'!"],
    ["unnecessary", "not needed", "That comment was ____.", "<b>un + necessary</b>: double n, one c, double s."],
    ["supersede", "to replace something older", "New rules will ____ the old ones.", "The <b>only</b> common English word ending in '<b>-sede</b>'."],
    ["surveillance", "close watching, especially by police", "The area is under ____.", "<b>sur + veil + lance</b> — think of watching through a veil."],
    ["haemorrhage", "heavy bleeding", "The doctors stopped the ____.", "British spelling: h-<b>ae</b>-mo-<b>rrh</b>-age (Greek <i>haima</i> = blood)."],
    ["consensus", "general agreement", "The group reached a ____.", "Linked to '<b>consent</b>', not 'census': con-<b>sen</b>-sus."],
    ["inoculate", "to protect with a vaccine", "Doctors ____ children against measles.", "One n, one c: <b>in-oc-u-late</b>."],
    ["dilemma", "a hard choice between options", "She faced a real ____.", "Double m, no n: di-le-<b>mm</b>-a."],
    ["sacrilegious", "disrespectful to something sacred", "Some found the act ____.", "Linked to <b>sacrilege</b>, not 'religious': sacri-<b>leg</b>-ious."],
    ["ubiquitous", "found everywhere", "Smartphones are now ____.", "<b>ubi</b> (Latin: where) + <b>quit</b> + <b>ous</b>."],
  ],
};

// ------------------------------------------------------------
//  BIOLOGY — [question, correct, wrong1, wrong2, wrong3, explanation]
// ------------------------------------------------------------
const BIOLOGY = {
  A: [
    ["Which of these animals is a mammal?", "Dog", "Frog", "Snake", "Goldfish", "Mammals have <b>hair or fur</b>, breathe air with lungs and feed their babies <b>milk</b>. Dogs, cats, whales and humans are all mammals!"],
    ["What do plants need to grow?", "Water and light", "Only sand", "Chocolate", "Total darkness", "Plants need <b>water, light, air and warmth</b> to grow healthily. They use sunlight to make their own food in their leaves."],
    ["Which part of a plant takes in water from the soil?", "Roots", "Petals", "Leaves", "Flower", "<b>Roots</b> grow under the ground, soak up water and hold the plant firmly in place. The stem carries the water up to the leaves."],
    ["What does a caterpillar turn into?", "A butterfly", "A spider", "A bird", "A snail", "A caterpillar makes a chrysalis and changes into a <b>butterfly</b>. This big change is called <b>metamorphosis</b>."],
    ["How many legs does an insect have?", "6", "8", "4", "10", "All insects have <b>6 legs</b> and 3 body parts (head, thorax, abdomen). Spiders have 8 legs, so spiders are <b>not</b> insects!"],
    ["What do we use our nose for?", "Smelling", "Hearing", "Seeing", "Touching", "We have <b>5 senses</b>: sight (eyes), hearing (ears), smell (nose), taste (tongue) and touch (skin)."],
    ["What does a herbivore eat?", "Only plants", "Only meat", "Plants and meat", "Rocks", "<b>Herbivores</b> eat only plants (like rabbits and cows). <b>Carnivores</b> eat meat (like lions). <b>Omnivores</b> eat both (like humans and bears)."],
    ["Which animal lays eggs?", "Chicken", "Cow", "Horse", "Cat", "Birds like <b>chickens</b> lay eggs. So do most reptiles, fish, amphibians and insects. Cows, horses and cats give birth to live babies."],
    ["What is a baby frog called?", "Tadpole", "Kitten", "Calf", "Foal", "Frogs lay <b>frogspawn</b> (eggs) which hatch into <b>tadpoles</b>. Tadpoles grow legs, lose their tails and become frogs."],
    ["What do fish use to breathe underwater?", "Gills", "Lungs", "Fins", "Scales", "Fish breathe using <b>gills</b>, which take oxygen out of the water. Fins are for swimming and scales protect their skin."],
    ["In which season do many trees lose their leaves?", "Autumn", "Summer", "Spring", "They never do", "Trees that drop their leaves in <b>autumn</b> are called <b>deciduous</b>. Trees that keep their leaves all year (like pine trees) are <b>evergreen</b>."],
    ["What holds your body up and protects your insides?", "Your skeleton", "Your hair", "Your nails", "Your eyebrows", "Your <b>skeleton</b> is made of over 200 bones. It holds you up, protects organs (your skull protects your brain!) and works with muscles to help you move."],
    ["Which is healthiest to eat every day?", "Fruit and vegetables", "Sweets", "Crisps", "Fizzy drinks", "Try to eat at least <b>5 portions of fruit and vegetables</b> a day. They contain vitamins and fibre that keep your body healthy."],
    ["What do bees collect from flowers?", "Nectar and pollen", "Water", "Leaves", "Seeds", "Bees collect sweet <b>nectar</b> (to make honey) and <b>pollen</b>. Carrying pollen from flower to flower helps plants make seeds — this is <b>pollination</b>."],
  ],
  B: [
    ["Which organ pumps blood around the body?", "The heart", "The lungs", "The brain", "The stomach", "The <b>heart</b> is a muscle that pumps blood through blood vessels. The blood carries oxygen and nutrients to every part of your body. It beats about 100,000 times a day!"],
    ["Which gas do plants take in to make food?", "Carbon dioxide", "Oxygen", "Nitrogen", "Helium", "In <b>photosynthesis</b> plants take in <b>carbon dioxide</b> and water, and use sunlight energy to make glucose (sugar). They give out <b>oxygen</b>, which we breathe!"],
    ["What is the main job of the lungs?", "To take in oxygen and remove carbon dioxide", "To digest food", "To pump blood", "To clean the blood of salt", "Your <b>lungs</b> swap gases: oxygen goes from the air into your blood, and carbon dioxide (a waste gas) leaves your blood to be breathed out."],
    ["Which teeth are mainly used for cutting food?", "Incisors", "Molars", "Canines", "Wisdom teeth", "<b>Incisors</b> (front) cut, <b>canines</b> (pointy) tear, and <b>molars</b> (back) grind and crush food."],
    ["Which part of a flower makes pollen?", "Stamen", "Petal", "Sepal", "Stem", "The <b>stamen</b> is the male part and makes pollen. The <b>carpel</b> is the female part, which contains the ovary where seeds form."],
    ["A food chain always starts with a…", "Producer (a green plant)", "Predator", "Top carnivore", "Decomposer", "Food chains start with a <b>producer</b> — a green plant that makes its own food using sunlight. E.g. grass → rabbit → fox. The arrows show which way energy flows."],
    ["Which nutrient is most important for growth and repair of muscles?", "Protein", "Sugar", "Fat", "Water", "<b>Protein</b> (in meat, fish, eggs, beans) helps the body grow and repair. Carbohydrates give energy, fats store energy, and vitamins & minerals keep us healthy."],
    ["What is it called when an animal sleeps through winter?", "Hibernation", "Migration", "Germination", "Pollination", "<b>Hibernation</b> is a deep winter sleep to save energy when food is scarce (hedgehogs, bats). <b>Migration</b> is travelling to a warmer place (swallows)."],
    ["Which of these animals is a vertebrate (has a backbone)?", "Shark", "Jellyfish", "Earthworm", "Octopus", "<b>Vertebrates</b> have a backbone: fish, amphibians, reptiles, birds and mammals. A <b>shark</b> is a fish with a skeleton made of cartilage."],
    ["Which blood vessels carry blood AWAY from the heart?", "Arteries", "Veins", "Capillaries", "Nerves", "<b>A</b>rteries carry blood <b>A</b>way from the heart. Veins bring it back. Tiny capillaries connect them and let oxygen pass into your cells."],
    ["What is the main job of the small intestine?", "To absorb nutrients into the blood", "To pump blood", "To make urine", "To store bones", "After your stomach churns food, the <b>small intestine</b> finishes digesting it and absorbs the nutrients into your blood. It's about 6 metres long!"],
    ["Who developed the theory of evolution by natural selection?", "Charles Darwin", "Isaac Newton", "Albert Einstein", "Marie Curie", "<b>Charles Darwin</b> studied finches and other animals on the Galápagos Islands. He realised that living things best suited to their environment survive and pass on their features."],
    ["How are dandelion seeds dispersed?", "By the wind", "By exploding pods", "By animals eating them", "By floating on rivers only", "Dandelion seeds have fluffy 'parachutes' so the <b>wind</b> carries them far away. Seeds spread out so new plants don't compete with the parent for light and water."],
    ["What does the skeleton NOT do?", "Digest food", "Support the body", "Protect organs", "Help us move", "The skeleton <b>supports</b>, <b>protects</b> (ribs guard the heart and lungs) and helps <b>movement</b> with muscles. It even makes blood cells inside bone marrow! Digestion is done by the digestive system."],
  ],
  D: [
    ["Which part of a cell is where aerobic respiration happens?", "Mitochondria", "Nucleus", "Cell membrane", "Ribosomes", "<b>Mitochondria</b> are the 'powerhouses' of the cell — they release energy from glucose by aerobic respiration."],
    ["What does the nucleus of a cell contain?", "Genetic material (DNA)", "Chlorophyll", "Cell sap", "Only water", "The <b>nucleus</b> contains <b>DNA</b> arranged in chromosomes. It controls the cell's activities."],
    ["Which structure is found in plant cells but NOT animal cells?", "Cell wall", "Nucleus", "Cell membrane", "Cytoplasm", "Plant cells have a <b>cell wall</b> (made of cellulose, for strength), <b>chloroplasts</b> and a <b>permanent vacuole</b>. Animal cells don't have these."],
    ["What is the word equation for aerobic respiration?", "Glucose + oxygen → carbon dioxide + water", "Carbon dioxide + water → glucose + oxygen", "Glucose → lactic acid", "Oxygen + water → glucose", "<b>Glucose + oxygen → carbon dioxide + water</b> (+ energy released). It's the reverse of photosynthesis! It happens in every living cell, all the time."],
    ["Where in a plant cell does photosynthesis take place?", "Chloroplasts", "Mitochondria", "Vacuole", "Cell wall", "<b>Chloroplasts</b> contain green <b>chlorophyll</b>, which absorbs light energy to make glucose from carbon dioxide and water."],
    ["What is an enzyme?", "A biological catalyst that speeds up reactions", "A type of fat", "A hormone made by the brain", "A kind of white blood cell", "<b>Enzymes</b> are proteins that speed up chemical reactions without being used up. Each one fits its substrate like a <b>lock and key</b>. High temperatures denature them."],
    ["What is diffusion?", "Movement of particles from high to low concentration", "Movement of water only", "Movement that needs energy", "Movement from low to high concentration", "In <b>diffusion</b> particles spread out from where there are lots (high concentration) to where there are few (low concentration). E.g. oxygen diffusing into the blood in the lungs."],
    ["Which blood cells help fight infection?", "White blood cells", "Red blood cells", "Platelets", "Plasma", "<b>White blood cells</b> engulf pathogens and make antibodies. <b>Red blood cells</b> carry oxygen. <b>Platelets</b> help blood clot. <b>Plasma</b> is the liquid part."],
    ["Why are red blood cells red?", "They contain haemoglobin, which carries oxygen", "They are full of iron filings", "They contain chlorophyll", "They have a red nucleus", "Red blood cells are packed with <b>haemoglobin</b>, which binds oxygen. They have <b>no nucleus</b>, leaving more room, and a biconcave shape for a big surface area."],
    ["What is made in muscles during anaerobic respiration?", "Lactic acid", "Carbon dioxide and water", "Glucose", "Alcohol", "Without enough oxygen, muscles do <b>anaerobic respiration</b>: glucose → <b>lactic acid</b>. It releases less energy and causes muscle fatigue (and an 'oxygen debt')."],
    ["Which chemical is used to test for starch?", "Iodine (turns blue-black)", "Benedict's (turns brick red)", "Biuret (turns purple)", "Ethanol (turns cloudy)", "<b>Iodine</b> turns from orange-brown to <b>blue-black</b> with starch. Benedict's tests for sugar, Biuret for protein, ethanol (emulsion test) for fats."],
    ["What is a gamete?", "A sex cell, such as a sperm or egg", "A type of bone", "A virus", "A muscle cell", "<b>Gametes</b> are sex cells: sperm and egg in animals, pollen and ovules in plants. Each has half the normal number of chromosomes, so fertilisation restores the full set."],
    ["Which of these is caused only by the environment?", "A scar", "Eye colour", "Blood group", "Natural hair colour", "Variation can be <b>inherited</b> (from genes, like eye colour and blood group) or <b>environmental</b> (from life experiences, like a scar or a language you speak)."],
    ["Where are villi found?", "The small intestine", "The lungs", "The heart", "The kidneys", "<b>Villi</b> are finger-like projections lining the <b>small intestine</b>. They give a huge surface area, thin walls and a rich blood supply for absorbing food. (Lungs have alveoli.)"],
  ],
  E: [
    ["What does mitosis produce?", "Two genetically identical diploid cells", "Four genetically different haploid cells", "Two haploid gametes", "One large cell", "<b>Mitosis</b> is for growth and repair: one cell divides into <b>two identical</b> daughter cells, each with the full (diploid) set of chromosomes."],
    ["What does meiosis produce?", "Four genetically different haploid gametes", "Two identical body cells", "Four identical diploid cells", "Two diploid gametes", "<b>Meiosis</b> makes gametes: <b>four</b> cells, each <b>haploid</b> (half the chromosomes) and <b>genetically different</b>, creating variation."],
    ["In DNA, adenine (A) always pairs with…", "Thymine (T)", "Guanine (G)", "Cytosine (C)", "Uracil (U)", "Complementary base pairing: <b>A–T</b> and <b>C–G</b>. The sequence of bases is the genetic code; every 3 bases code for one amino acid."],
    ["Which hormone lowers blood glucose?", "Insulin", "Glucagon", "Adrenaline", "Testosterone", "<b>Insulin</b>, made by the pancreas, makes cells take up glucose and the liver store it as glycogen. <b>Glucagon</b> does the opposite, raising blood glucose."],
    ["What is osmosis?", "Diffusion of water across a partially permeable membrane", "Movement of any particles using energy", "The breakdown of glucose", "Movement of salt into cells", "<b>Osmosis</b> is the net movement of <b>water</b> from a dilute solution to a more concentrated one, across a <b>partially permeable membrane</b>."],
    ["What type of pathogen causes malaria?", "A protist", "A virus", "A bacterium", "A fungus", "Malaria is caused by a <b>protist</b> (Plasmodium) spread by the <b>Anopheles mosquito</b> (a vector). Prevented with nets, insecticide and stopping mosquitoes breeding."],
    ["Antibiotics do NOT work against…", "Viruses", "Bacteria", "Bacterial infections", "Streptococcus", "<b>Antibiotics kill bacteria</b>, not viruses, because viruses live inside our own cells. Overusing antibiotics leads to <b>antibiotic resistance</b> (e.g. MRSA)."],
    ["Which neurone carries impulses from receptors to the CNS?", "Sensory neurone", "Motor neurone", "Relay neurone", "Effector neurone", "Reflex arc: stimulus → receptor → <b>sensory</b> neurone → <b>relay</b> neurone (CNS) → <b>motor</b> neurone → effector → response."],
    ["What is homeostasis?", "Keeping the internal environment of the body constant", "Growing new cells", "Producing offspring", "Breathing quickly during exercise", "<b>Homeostasis</b> keeps conditions like body temperature, blood glucose and water levels stable so enzymes and cells work properly — mostly by negative feedback."],
    ["When is a recessive allele expressed?", "When two copies are present (homozygous)", "Always", "When only one copy is present", "Never", "A <b>recessive</b> allele (small letter, e.g. 'a') only shows when there's <b>no dominant</b> allele: genotype <b>aa</b>. With Aa, the dominant allele is expressed."],
    ["Which is NOT a limiting factor of photosynthesis?", "Oxygen concentration", "Light intensity", "Carbon dioxide concentration", "Temperature", "Photosynthesis is limited by <b>light intensity, CO₂ concentration, temperature</b> (and amount of chlorophyll). Oxygen is a product, not a limiting factor."],
    ["Two parents are both Aa. What's the probability of an aa child?", "25%", "50%", "75%", "0%", "Punnett square: AA, Aa, aA, aa → <b>1 in 4 = 25%</b> chance of aa. The ratio of dominant to recessive phenotypes is 3:1."],
    ["What do memory cells do after a vaccination?", "Quickly make antibodies if the real pathogen infects you", "Kill all bacteria in the body", "Produce insulin", "Carry oxygen", "A vaccine contains dead/inactive pathogens. White blood cells make antibodies and <b>memory cells</b>, so if you meet the real pathogen your body responds <b>fast</b> before you get ill."],
    ["What does active transport need that diffusion doesn't?", "Energy from respiration", "A concentration gradient going downhill", "Light", "Water", "<b>Active transport</b> moves substances <b>against</b> a concentration gradient (low → high), using <b>energy from respiration</b>. E.g. root hair cells taking in mineral ions."],
  ],
};
BIOLOGY.C = BIOLOGY.B;

// ------------------------------------------------------------
//  Build a 10-question quiz
// ------------------------------------------------------------
function buildQuiz(subject, year) {
  const band = bandForYear(year);
  const out = [];
  if (subject === "maths") {
    const gens = MATHS[band];
    let order = shuffle(gens);
    for (let i = 0; i < 10; i++) {
      if (i > 0 && i % gens.length === 0) order = shuffle(gens);
      const q = order[i % gens.length]();
      out.push({ type: "mc", ...q, answer: String(q.answer) });
    }
  } else if (subject === "english") {
    for (const [w, def, sent, tip] of shuffle(SPELLING[band]).slice(0, 10))
      out.push({ type: "spell", topic: "Spelling", word: w, def, sent, tip });
  } else {
    for (const [q, right, ...rest] of shuffle(BIOLOGY[band]).slice(0, 10)) {
      const explain = rest.pop();
      out.push({ type: "mc", topic: "Biology", q, answer: right, options: shuffle([right, ...rest]), hint: null, explain });
    }
  }
  return out;
}
