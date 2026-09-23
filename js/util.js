'use strict';
// ---------------------------------------------------------------------------
// Shared helpers, constants and input handling.
// ---------------------------------------------------------------------------

const TILE = 16;
const DOWN = 0, UP = 1, LEFT = 2, RIGHT = 3;
const DX = [0, 0, -1, 1];
const DY = [1, -1, 0, 0];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const SEASON_NAMES = ['Spring', 'Summer', 'Fall', 'Winter'];
const DAYS_PER_SEASON = 28;
const DAY_START = 360;   // 6:00 AM
const DAY_END = 1560;    // 2:00 AM
const FONT_UI = '"Pixelify Sans", "Trebuchet MS", sans-serif';
const FONT_SYS = '"VT323", Consolas, "Courier New", monospace';

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randi(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
function chance(p) { return Math.random() < p; }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// weighted([[value, weight], ...])
function weighted(list, rng = Math.random) {
  let total = 0;
  for (const e of list) total += e[1];
  let r = rng() * total;
  for (const e of list) { r -= e[1]; if (r <= 0) return e[0]; }
  return list[list.length - 1][0];
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Deterministic 0..1 hash for tile decoration
function hash2(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
// amt > 0 lightens, < 0 darkens (-1..1)
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}

function fmtTime(min) {
  let h = Math.floor(min / 60) % 24;
  const m = Math.floor(min % 60);
  const ampm = h < 12 ? 'AM' : 'PM';
  let hh = h % 12; if (hh === 0) hh = 12;
  return hh + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}
function fmtNum(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString('en-US');
}

function wrapText(ctx, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

function pointInRect(px, py, r) {
  return px >= r.x && py >= r.y && px < r.x + r.w && py < r.y + r.h;
}

// ---------------------------------------------------------------------------
// Input (polling based). Modals and the world read from this each frame.
// ---------------------------------------------------------------------------
const Input = {
  down: new Set(),
  pressed: new Set(),
  mouse: { x: 0, y: 0, left: false, right: false, leftPressed: false, rightPressed: false, wheel: 0, moved: false },
  canvas: null,

  init(canvas) {
    this.canvas = canvas;
    const block = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
    window.addEventListener('keydown', e => {
      if (block.has(e.code)) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
      Audio2.unlock();
    });
    window.addEventListener('keyup', e => { this.down.delete(e.code); });
    window.addEventListener('blur', () => { this.down.clear(); });
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
      this.mouse.moved = true;
    });
    canvas.addEventListener('mousedown', e => {
      canvas.focus();
      if (e.button === 0) { this.mouse.left = true; this.mouse.leftPressed = true; }
      if (e.button === 2) { this.mouse.right = true; this.mouse.rightPressed = true; }
      Audio2.unlock();
    });
    window.addEventListener('mouseup', e => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.mouse.wheel += Math.sign(e.deltaY);
    }, { passive: false });
  },

  isDown(...codes) { return codes.some(c => this.down.has(c)); },
  wasPressed(...codes) { return codes.some(c => this.pressed.has(c)); },
  // Swallow everything pressed this frame (used when a modal opens/closes)
  consume() {
    this.pressed.clear();
    this.mouse.leftPressed = false;
    this.mouse.rightPressed = false;
    this.mouse.wheel = 0;
  },
  endFrame() {
    this.pressed.clear();
    this.mouse.leftPressed = false;
    this.mouse.rightPressed = false;
    this.mouse.wheel = 0;
    this.mouse.moved = false;
  },
};

const KEY_CONFIRM = ['Space', 'Enter', 'KeyF', 'NumpadEnter'];
const KEY_CANCEL = ['Escape', 'Backspace'];
const KEY_MENU = ['KeyE', 'KeyI', 'Tab'];
