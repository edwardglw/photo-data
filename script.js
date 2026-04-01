const canvas = document.getElementById("art-canvas");
const ctx = canvas.getContext("2d");
const uploadInput = document.getElementById("image-upload");
const navPills = [...document.querySelectorAll(".nav-pill")];
const panels = [...document.querySelectorAll(".panel")];
const cardsLayer = document.getElementById("cards-layer");
const cardTemplate = document.getElementById("card-template");
const saveArtworkBtn = document.getElementById("save-artwork");
const topNav = document.querySelector(".top-nav");
const pageTitle = document.getElementById("page-title");
const replacePhotoBtn = document.getElementById("replace-photo");

const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: 0 };
let t = 0;
let particles = [];
let sourceImage = null;
let metrics = {
  dominant: ["#6544ff", "#1ad6ff", "#ff74e4", "#f9ff85", "#ffffff"],
  contrast: 44,
  complexity: 49,
  texture: 40,
  balance: 64,
  imageEnergy: 42,
  motionEnergy: 14,
  abstraction: 63,
  interaction: 0,
  state: "idle synthesis",
};

const cardDefs = [
  { key: "dominant", title: "Chromatic Bloom" },
  { key: "contrast", title: "Contrast Tension" },
  { key: "complexity", title: "Shape Complexity" },
  { key: "texture", title: "Texture Intensity" },
  { key: "balance", title: "Composition Balance" },
  { key: "imageEnergy", title: "Image Energy" },
  { key: "motionEnergy", title: "Motion Energy" },
  { key: "abstraction", title: "Abstraction Intensity" },
  { key: "interaction", title: "Interaction Flux" },
  { key: "state", title: "Generative State" },
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  seedParticles();
}

function seedParticles() {
  const count = Math.max(30, Math.round((window.innerWidth * window.innerHeight) / 42000));
  particles = new Array(count).fill(0).map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: 20 + Math.random() * 110,
    hueOffset: Math.random() * 360,
  }));
}

function render() {
  t += 0.012;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createRadialGradient(
    pointer.x,
    pointer.y,
    40,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.95
  );
  gradient.addColorStop(0, hexWithAlpha(metrics.dominant[1], 0.35));
  gradient.addColorStop(0.3, hexWithAlpha(metrics.dominant[2], 0.16));
  gradient.addColorStop(1, "#04050c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawSourceImageLayer();

  particles.forEach((p, i) => {
    p.x += p.vx + Math.sin(t + i) * 0.22 + (pointer.x - canvas.width / 2) / canvas.width;
    p.y += p.vy + Math.cos(t * 1.2 + i) * 0.22 + (pointer.y - canvas.height / 2) / canvas.height;
    if (p.x < -160) p.x = canvas.width + 160;
    if (p.x > canvas.width + 160) p.x = -160;
    if (p.y < -160) p.y = canvas.height + 160;
    if (p.y > canvas.height + 160) p.y = -160;

    const wobble = Math.sin(t * 2 + i) * metrics.motionEnergy * 0.05;
    const radius = p.size + wobble;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
    const c1 = metrics.dominant[i % metrics.dominant.length];
    const c2 = metrics.dominant[(i + 1) % metrics.dominant.length];
    g.addColorStop(0, hexWithAlpha(c1, 0.26));
    g.addColorStop(0.8, hexWithAlpha(c2, 0.05));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  metrics.motionEnergy = Math.min(100, Math.max(6, metrics.motionEnergy * 0.97 + pointer.active * 6));
  metrics.interaction = Math.min(100, metrics.interaction * 0.92 + pointer.active * 8);
  metrics.state = pointer.active > 0.4 ? "kinetic bloom" : metrics.imageEnergy > 60 ? "luminous drift" : "slow tide";
  updateCards();

  requestAnimationFrame(render);
}

function createCards() {
  cardDefs.forEach((def) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.key = def.key;
    card.querySelector("h3").textContent = def.title;

    const btn = card.querySelector(".expand-btn");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      card.classList.toggle("expanded");
    });

    cardsLayer.appendChild(card);
  });
  updateCards();
}

function updateCards() {
  [...cardsLayer.querySelectorAll(".dash-card")].forEach((card) => {
    const key = card.dataset.key;
    const body = card.querySelector(".card-content");

    if (key === "dominant") {
      body.innerHTML = `<div class="palette">${metrics.dominant
        .map((c) => `<span class="swatch" style="background:${c}"></span>`)
        .join("")}</div>`;
      return;
    }

    if (key === "state") {
      body.innerHTML = `<p>${metrics.state}</p><div class="metric-grid">${[metrics.contrast, metrics.texture, metrics.motionEnergy]
        .map((v) => `<div class="metric-pill">${Math.round(v)}%</div>`)
        .join("")}</div>`;
      return;
    }

    const value = Number(metrics[key] ?? 0);
    body.innerHTML = `<p>${Math.round(value)}%</p><div class="bar"><span style="width:${value}%"></span></div>`;
  });
}

function drawSourceImageLayer() {
  if (!sourceImage) return;
  const scale = Math.max(canvas.width / sourceImage.width, canvas.height / sourceImage.height);
  const drawW = sourceImage.width * scale;
  const drawH = sourceImage.height * scale;
  const dx = (canvas.width - drawW) / 2;
  const dy = (canvas.height - drawH) / 2;
  const driftX = Math.sin(t * 0.4) * 8;
  const driftY = Math.cos(t * 0.5) * 8;

  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.filter = `contrast(${95 + metrics.contrast * 0.3}%) saturate(${100 + metrics.abstraction * 0.5}%) blur(1.2px)`;
  ctx.drawImage(sourceImage, dx + driftX, dy + driftY, drawW, drawH);
  ctx.restore();
}

function sampleImage(file) {
  const img = new Image();
  const reader = new FileReader();
  reader.onload = (event) => {
    img.src = event.target.result;
  };
  img.onload = () => {
    sourceImage = img;
    const c = document.createElement("canvas");
    c.width = 80;
    c.height = 80;
    const ic = c.getContext("2d");
    ic.drawImage(img, 0, 0, 80, 80);
    const data = ic.getImageData(0, 0, 80, 80).data;

    const paletteBuckets = new Map();
    let totalLum = 0;
    let edges = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalLum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
      paletteBuckets.set(key, (paletteBuckets.get(key) ?? 0) + 1);
      if (i > 320) {
        const dr = Math.abs(r - data[i - 320]);
        const dg = Math.abs(g - data[i - 319]);
        const db = Math.abs(b - data[i - 318]);
        edges += (dr + dg + db) / 3;
      }
    }

    metrics.dominant = [...paletteBuckets.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rgb]) => {
        const [r, g, b] = rgb.split(",").map(Number);
        return rgbToHex(r, g, b);
      });

    const avgLum = totalLum / (data.length / 4);
    metrics.contrast = Math.min(100, Math.abs(128 - avgLum) * 1.3 + (edges / 10000) * 20);
    metrics.texture = Math.min(100, (edges / 10000) * 30);
    metrics.complexity = Math.min(100, paletteBuckets.size * 1.4);
    metrics.balance = Math.min(100, 100 - Math.abs(50 - (avgLum / 255) * 100));
    metrics.imageEnergy = Math.min(100, (metrics.contrast + metrics.texture + metrics.complexity) / 2);
    metrics.abstraction = Math.min(100, (metrics.imageEnergy + metrics.complexity) / 2);
    metrics.state = "image infused";
    navPills[1].click();
  };

  reader.readAsDataURL(file);
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function hexWithAlpha(hex, alpha) {
  const val = hex.replace("#", "");
  const [r, g, b] = [val.substring(0, 2), val.substring(2, 4), val.substring(4, 6)].map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

function saveArtworkSnapshot() {
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = `photo-pulse-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
  anchor.click();
  metrics.state = "snapshot archived";
}

uploadInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) sampleImage(file);
});
saveArtworkBtn.addEventListener("click", saveArtworkSnapshot);
replacePhotoBtn.addEventListener("click", () => uploadInput.click());

window.addEventListener("mousemove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = 1;
  clearTimeout(window.__activeTimeout);
  window.__activeTimeout = setTimeout(() => (pointer.active = 0), 220);
});

window.addEventListener("touchmove", (e) => {
  if (!e.touches[0]) return;
  pointer.x = e.touches[0].clientX;
  pointer.y = e.touches[0].clientY;
  pointer.active = 1;
  clearTimeout(window.__activeTimeout);
  window.__activeTimeout = setTimeout(() => (pointer.active = 0), 220);
});

navPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    const page = pill.dataset.page;
    navPills.forEach((n) => n.classList.toggle("active", n === pill));
    panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.page === page));
    topNav.classList.toggle("hidden-on-upload", page === "upload");
    pageTitle.textContent = pill.textContent;
  });
});

resizeCanvas();
createCards();
render();
topNav.classList.add("hidden-on-upload");
window.addEventListener("resize", resizeCanvas);
