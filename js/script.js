/* ====== EDIT THIS PART ====== */
const CONFIG = {
  title: "El día dehoy es una representación del pasado 5 de octubre",
  question: "¿Quieres ser mi novia?",
  // Pon tu sticker en la carpeta media/. Escribe el nombre SIN la extensión;
  // la página prueba png, webp, gif, jpg y jpeg automáticamente.
  sticker: "media/my_sticker",
  yesText: "¡Sí! Me hiciste la persona más feliz.",
  noText: "¿Estás segura?",
  finalText: "No, ¡Un no es un si, no puedes mentirte a ti misma! Sabemos que tu me amas.",
  noClicksNeeded: 5,
};
/* ============================ */

const $ = (id) => document.getElementById(id);
const noBtn = $("no");
const yesBtn = $("yes");
let noClicks = 0;

$("title").textContent = CONFIG.title;
$("question").textContent = CONFIG.question;
document.title = CONFIG.title;

/* ---------- YES ---------- */
yesBtn.addEventListener("click", () => celebrate(CONFIG.yesText));

/* ---------- NO ---------- */
noBtn.addEventListener("click", () => {
  noClicks += 1;
  if (noClicks >= CONFIG.noClicksNeeded) {
    celebrate(CONFIG.finalText);   // 5th click: it becomes a yes
    return;
  }
  noBtn.textContent = CONFIG.noText;
  moveNoButton();
});

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function overlaps(a, b, gap) {
  return !(a.right + gap < b.left || a.left - gap > b.right ||
           a.bottom + gap < b.top || a.top - gap > b.bottom);
}

function moveNoButton() {
  const pad = 12;

  // First move: pin the button where it is now so it doesn't jump
  if (!noBtn.classList.contains("is-running")) {
    const r = noBtn.getBoundingClientRect();
    noBtn.style.left = r.left + "px";
    noBtn.style.top = r.top + "px";
    noBtn.classList.add("is-running");
    void noBtn.offsetWidth; // force reflow so the transition runs
  }

  const w = noBtn.offsetWidth;
  const h = noBtn.offsetHeight;
  const maxX = window.innerWidth - w - pad;
  const maxY = window.innerHeight - h - pad;
  const yesRect = yesBtn.getBoundingClientRect();

  let x, y;
  for (let i = 0; i < 30; i++) {
    x = rand(pad, Math.max(pad, maxX));
    y = rand(pad, Math.max(pad, maxY));
    const box = { left: x, top: y, right: x + w, bottom: y + h };
    if (!overlaps(box, yesRect, 16)) break;   // never land on "Yes"
  }
  noBtn.style.left = x + "px";
  noBtn.style.top = y + "px";
}

/* ---------- RESULT SCREEN ---------- */
function loadSticker() {
  const img = $("sticker");
  const exts = ["png", "webp", "gif", "jpg", "jpeg"];
  let i = 0;
  img.onerror = () => {
    i += 1;
    if (i < exts.length) img.src = `${CONFIG.sticker}.${exts[i]}`;
    else img.hidden = true;   // no sticker found: hide it instead of a broken icon
  };
  img.src = `${CONFIG.sticker}.${exts[0]}`;
}

let done = false;
function celebrate(message) {
  if (done) return;
  done = true;
  $("ask").hidden = true;
  $("resultText").textContent = message;
  loadSticker();
  $("result").hidden = false;
  startConfetti();
}

/* ---------- CONFETTI + STREAMERS (no libraries) ---------- */
const canvas = $("confetti");
const ctx = canvas.getContext("2d");
const COLORS = ["#D0112B", "#FFFFFF"];   // red + white show up best on rosewood
let W = 0, H = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function makePiece(x, y, vx, vy) {
  const streamer = Math.random() < 0.35;
  return {
    x, y, vx, vy,
    streamer,
    w: streamer ? rand(4, 6) : rand(7, 11),
    h: streamer ? rand(28, 60) : rand(10, 16),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.2, 0.2),
    phase: rand(0, Math.PI * 2),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

function burst(fromLeft) {
  const out = [];
  for (let i = 0; i < 70; i++) {
    const angle = -Math.PI / 2 + (fromLeft ? 1 : -1) * rand(0.1, 0.8);
    const speed = rand(11, 22);
    out.push(makePiece(fromLeft ? 0 : W, H, Math.cos(angle) * speed, Math.sin(angle) * speed));
  }
  return out;
}

function startConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let pieces = [...burst(true), ...burst(false)];
  const start = performance.now();

  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);

    // Gentle rain from the top for the first 3.5 seconds
    if (t < 3500) {
      for (let i = 0; i < 2; i++) {
        pieces.push(makePiece(rand(0, W), -20, rand(-1.5, 1.5), rand(2, 5)));
      }
    }

    pieces = pieces.filter((p) => p.y < H + 80);
    for (const p of pieces) {
      p.vy += 0.3;          // gravity
      p.vx *= 0.985;        // air drag
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.phase += 0.15;
      p.rot += p.streamer ? 0 : p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.streamer) {
        ctx.rotate(Math.sin(p.phase) * 0.6 + p.vx * 0.05);   // streamers sway
      } else {
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.phase));                    // confetti flips
      }
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (pieces.length) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  }
  requestAnimationFrame(frame);
}
