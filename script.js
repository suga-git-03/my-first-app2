const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const distanceEl = document.querySelector("#distance");
const starsEl = document.querySelector("#stars");
const messageEl = document.querySelector("#game-message");
const missionStatus = document.querySelector("#mission-status");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");

const W = canvas.width;
const H = canvas.height;
const keys = {};
const world = { width: 3600, camera: 0, stars: [], enemies: [], platforms: [] };
let player, state, lastTime = 0, animationId;

function resetGame() {
  player = { x: 90, y: 390, w: 29, h: 43, vx: 0, vy: 0, grounded: false, facing: 1, attack: 0, invincible: 0 };
  state = { running: true, paused: false, won: false, stars: 0, distance: 0 };
  world.camera = 0;
  world.platforms = [
    { x: 0, y: 470, w: 730, h: 70 }, { x: 850, y: 470, w: 590, h: 70 },
    { x: 1540, y: 405, w: 380, h: 135 }, { x: 2020, y: 470, w: 700, h: 70 },
    { x: 2830, y: 430, w: 770, h: 110 }, { x: 430, y: 355, w: 150, h: 18 },
    { x: 1060, y: 345, w: 155, h: 18 }, { x: 2230, y: 350, w: 160, h: 18 }
  ];
  world.stars = [
    { x: 280, y: 415, got: false }, { x: 530, y: 300, got: false },
    { x: 970, y: 420, got: false }, { x: 1140, y: 290, got: false }, { x: 1770, y: 355, got: false }
  ];
  world.enemies = [
    { x: 610, y: 430, w: 27, h: 40, min: 580, max: 700, dir: 1, alive: true },
    { x: 1210, y: 430, w: 27, h: 40, min: 920, max: 1360, dir: -1, alive: true },
    { x: 2320, y: 430, w: 27, h: 40, min: 2050, max: 2600, dir: 1, alive: true },
    { x: 3100, y: 390, w: 27, h: 40, min: 2900, max: 3450, dir: -1, alive: true }
  ];
  pauseButton.textContent = "Ⅱ PAUSE";
  messageEl.classList.add("hidden");
  missionStatus.textContent = "REACH THE GATE";
  updateHud();
}

function jump() {
  if (state.running && !state.paused && player.grounded) { player.vy = -650; player.grounded = false; }
}
function attack() { if (state.running && !state.paused) player.attack = .22; }
function onKeyDown(event) {
  keys[event.key.toLowerCase()] = true;
  if ([" ", "arrowup", "arrowleft", "arrowright"].includes(event.key.toLowerCase())) event.preventDefault();
  if (event.repeat) return;
  if (event.key.toLowerCase() === " " || event.key.toLowerCase() === "w" || event.key === "ArrowUp") jump();
  if (event.key.toLowerCase() === "j" || event.key === "Enter") attack();
  if (event.key.toLowerCase() === "p") togglePause();
  if (event.key.toLowerCase() === "r") resetGame();
}
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", event => { keys[event.key.toLowerCase()] = false; });
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", resetGame);

function togglePause() {
  if (!state.won) { state.paused = !state.paused; pauseButton.textContent = state.paused ? "▶ PLAY" : "Ⅱ PAUSE"; }
}
function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function update(dt) {
  if (!state.running || state.paused) return;
  const left = keys.a || keys.arrowleft, right = keys.d || keys.arrowright;
  player.vx = (right ? 230 : 0) - (left ? 230 : 0);
  if (player.vx) player.facing = player.vx > 0 ? 1 : -1;
  player.vy += 1550 * dt;
  const previousBottom = player.y + player.h;
  player.x = Math.max(0, Math.min(world.width - player.w, player.x + player.vx * dt));
  player.y += player.vy * dt;
  player.grounded = false;
  for (const platform of world.platforms) {
    if (player.x + player.w > platform.x && player.x < platform.x + platform.w &&
      previousBottom <= platform.y && player.y + player.h >= platform.y && player.vy >= 0) {
      player.y = platform.y - player.h; player.vy = 0; player.grounded = true;
    }
  }
  player.attack = Math.max(0, player.attack - dt);
  player.invincible = Math.max(0, player.invincible - dt);
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.dir * 45 * dt;
    if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.dir *= -1;
    const hitbox = { x: player.x + (player.facing > 0 ? player.w : -38), y: player.y + 8, w: 38, h: 25 };
    if (player.attack > 0 && intersects(hitbox, enemy)) enemy.alive = false;
    if (player.invincible <= 0 && intersects(player, enemy)) {
      player.x = Math.max(0, player.x - 80); player.vy = -300; player.invincible = 1.1;
    }
  }
  for (const star of world.stars) {
    if (!star.got && intersects(player, { x: star.x - 12, y: star.y - 12, w: 24, h: 24 })) { star.got = true; state.stars++; }
  }
  if (player.y > H + 80) { player.x = Math.max(0, player.x - 180); player.y = 300; player.vy = 0; }
  state.distance = Math.max(state.distance, Math.floor(player.x / 10));
  world.camera += (Math.max(0, Math.min(world.width - W, player.x - W * .35)) - world.camera) * 7 * dt;
  if (player.x > 3400) {
    state.won = true; missionStatus.textContent = "MISSION COMPLETE"; messageEl.classList.remove("hidden");
  }
  updateHud();
}
function updateHud() { distanceEl.textContent = String(state.distance).padStart(4, "0"); starsEl.textContent = state.stars; }

function draw() {
  ctx.clearRect(0, 0, W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#1c3446"); sky.addColorStop(1, "#0d1722");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  drawBackground();
  ctx.save(); ctx.translate(-world.camera, 0);
  for (const platform of world.platforms) drawPlatform(platform);
  for (const star of world.stars) if (!star.got) drawStar(star.x, star.y);
  for (const enemy of world.enemies) if (enemy.alive) drawEnemy(enemy);
  drawGate(); drawPlayer();
  ctx.restore();
  if (state.paused && !state.won) { ctx.fillStyle = "#0d1722aa"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#f4f1e9"; ctx.font = "500 22px 'DM Mono'"; ctx.textAlign = "center"; ctx.fillText("PAUSED", W / 2, H / 2); }
}
function drawBackground() {
  ctx.save(); ctx.translate(-world.camera * .18, 0); ctx.fillStyle = "#1b2b37"; ctx.beginPath();
  for (let x = -300; x < world.width + 500; x += 170) { ctx.lineTo(x, 420); ctx.lineTo(x + 85, 210 + (x % 80)); ctx.lineTo(x + 190, 420); } ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(-world.camera * .4, 0); ctx.fillStyle = "#223b4b";
  for (let x = -200; x < world.width + 400; x += 240) { ctx.beginPath(); ctx.arc(x, 155 + (x % 3) * 35, 2, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
}
function drawPlatform(p) {
  ctx.fillStyle = "#182631"; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = "#4e6871"; ctx.fillRect(p.x, p.y, p.w, 5);
  ctx.fillStyle = "#263d48"; for (let x = p.x + 13; x < p.x + p.w; x += 31) ctx.fillRect(x, p.y + 17, 2, Math.min(20, p.h - 17));
}
function drawStar(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = "#f5c451"; ctx.shadowColor = "#f5c451"; ctx.shadowBlur = 15; ctx.fillRect(-7, -7, 14, 14); ctx.restore();
}
function drawEnemy(e) {
  ctx.fillStyle = "#d9544d"; ctx.fillRect(e.x, e.y + 9, e.w, e.h - 9); ctx.fillStyle = "#f2775f"; ctx.fillRect(e.x + 4, e.y, e.w - 8, 12);
  ctx.fillStyle = "#171e26"; ctx.fillRect(e.x + 5, e.y + 7, 5, 5); ctx.fillRect(e.x + 17, e.y + 7, 5, 5);
}
function drawGate() {
  const x = 3450; ctx.strokeStyle = "#f5c451"; ctx.lineWidth = 8; ctx.shadowColor = "#f5c451"; ctx.shadowBlur = 22; ctx.strokeRect(x, 285, 85, 185); ctx.shadowBlur = 0;
  ctx.fillStyle = "#f5c451"; ctx.font = "10px 'DM Mono'"; ctx.fillText("EXIT", x + 25, 270);
}
function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible * 14) % 2 === 0) return;
  ctx.save(); ctx.translate(player.x + player.w / 2, player.y);
  ctx.fillStyle = "#f4f1e9"; ctx.fillRect(-10, 7, 20, 23); ctx.fillStyle = "#ff6b35"; ctx.fillRect(-14, 30, 12, 13); ctx.fillRect(2, 30, 12, 13);
  ctx.fillStyle = "#f5c451"; ctx.fillRect(-9, 0, 18, 14); ctx.fillStyle = "#15212b"; ctx.fillRect(player.facing * 2, 4, 6, 5);
  if (player.attack > 0) { ctx.fillStyle = "#f5c451"; ctx.fillRect(player.facing * 17, 10, player.facing * 30, 5); }
  ctx.restore();
}
function frame(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, .033); lastTime = timestamp; update(dt); draw(); animationId = requestAnimationFrame(frame);
}
resetGame(); animationId = requestAnimationFrame(frame);
