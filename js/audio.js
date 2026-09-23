'use strict';
// ---------------------------------------------------------------------------
// Tiny WebAudio synth: sound effects + a procedural chiptune sequencer.
// ---------------------------------------------------------------------------

const Audio2 = {
  ctx: null,
  master: null,
  sfxGain: null,
  musicGain: null,
  noiseBuf: null,
  musicOn: true,
  sfxOn: true,

  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return; }
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.55;
      this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicOn ? 0.35 : 0;
      this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (Music.pending) Music.play(Music.pending, true);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  setMusic(on) {
    this.musicOn = on;
    if (this.musicGain) this.musicGain.gain.value = on ? 0.35 : 0;
  },

  tone(freq, dur, o = {}) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    if (o.vib) {
      const lfo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      lfo.frequency.value = o.vibRate || 18;
      lg.gain.value = o.vib;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t); lfo.stop(t + dur + 0.05);
    }
    const vol = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.bus || this.sfxGain);
    osc.start(t); osc.stop(t + dur + 0.05);
  },

  noise(dur, o = {}) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 1200, t);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    f.Q.value = o.q || 1;
    const g = this.ctx.createGain();
    const vol = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  },

  arp(notes, step, o = {}) {
    notes.forEach((n, i) => this.tone(n, o.dur || step * 1.6, Object.assign({}, o, { delay: (o.delay || 0) + i * step })));
  },

  play(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'hoe': this.noise(0.12, { freq: 600, vol: 0.35 }); this.tone(90, 0.08, { type: 'triangle', vol: 0.25 }); break;
      case 'water': this.noise(0.35, { freq: 2500, slide: 800, filter: 'bandpass', q: 2, vol: 0.25 }); break;
      case 'refill': this.noise(0.5, { freq: 700, slide: 2400, filter: 'bandpass', q: 3, vol: 0.25 }); break;
      case 'chop': this.tone(140, 0.09, { type: 'square', vol: 0.18, slide: 70 }); this.noise(0.06, { freq: 900, vol: 0.2 }); break;
      case 'pick': this.tone(1200, 0.07, { type: 'triangle', vol: 0.18, slide: 900 }); this.noise(0.05, { freq: 3000, filter: 'highpass', vol: 0.12 }); break;
      case 'break': this.noise(0.25, { freq: 1400, slide: 200, vol: 0.35 }); break;
      case 'treefall': this.noise(0.7, { freq: 500, slide: 80, vol: 0.4 }); this.tone(80, 0.5, { type: 'triangle', slide: 40, vol: 0.2 }); break;
      case 'swing': this.noise(0.1, { freq: 1800, slide: 600, filter: 'bandpass', vol: 0.18 }); break;
      case 'hit': this.tone(300, 0.1, { type: 'square', vol: 0.18, slide: 90 }); this.noise(0.08, { freq: 1500, vol: 0.2 }); break;
      case 'hurt': this.tone(220, 0.25, { type: 'sawtooth', vol: 0.2, slide: 60 }); break;
      case 'kill': this.noise(0.2, { freq: 1600, slide: 200, vol: 0.25 }); this.tone(520, 0.12, { type: 'square', vol: 0.1, slide: 1040, delay: 0.05 }); break;
      case 'pickup': this.tone(660, 0.06, { type: 'square', vol: 0.08 }); this.tone(990, 0.08, { type: 'square', vol: 0.08, delay: 0.05 }); break;
      case 'coin': this.tone(988, 0.07, { type: 'square', vol: 0.08 }); this.tone(1319, 0.2, { type: 'square', vol: 0.08, delay: 0.07 }); break;
      case 'menu': this.tone(880, 0.04, { type: 'square', vol: 0.06 }); break;
      case 'open': this.tone(520, 0.06, { type: 'square', vol: 0.07 }); this.tone(780, 0.08, { type: 'square', vol: 0.07, delay: 0.05 }); break;
      case 'close': this.tone(780, 0.06, { type: 'square', vol: 0.07 }); this.tone(520, 0.08, { type: 'square', vol: 0.07, delay: 0.05 }); break;
      case 'error': this.tone(110, 0.18, { type: 'square', vol: 0.12 }); break;
      case 'plant': this.tone(300, 0.06, { type: 'triangle', vol: 0.15 }); this.noise(0.05, { freq: 800, vol: 0.12 }); break;
      case 'harvest': this.tone(520, 0.08, { type: 'triangle', vol: 0.18, slide: 1040 }); break;
      case 'scream':
        this.tone(900, 0.9, { type: 'sawtooth', vol: 0.16, slide: 1600, vib: 120, vibRate: 22 });
        this.tone(1300, 0.9, { type: 'square', vol: 0.06, slide: 700, vib: 80, vibRate: 15 });
        break;
      case 'boom':
        this.noise(1.1, { freq: 900, slide: 60, vol: 0.7 });
        this.tone(70, 0.8, { type: 'sine', vol: 0.5, slide: 30 });
        break;
      case 'fuse': this.noise(0.1, { freq: 5000, filter: 'highpass', vol: 0.05 }); break;
      case 'magic': this.tone(600, 0.25, { type: 'sine', vol: 0.12, slide: 1800 }); this.tone(900, 0.2, { type: 'triangle', vol: 0.05, slide: 2400, delay: 0.03 }); break;
      case 'achievement': this.arp([523, 659, 784, 1047, 1319], 0.08, { type: 'square', vol: 0.09 }); this.tone(1568, 0.5, { type: 'triangle', vol: 0.08, delay: 0.42 }); break;
      case 'levelup': this.arp([392, 523, 659, 784], 0.1, { type: 'triangle', vol: 0.14 }); break;
      case 'splash': this.noise(0.3, { freq: 1600, slide: 400, filter: 'bandpass', vol: 0.3 }); break;
      case 'bite': this.tone(1400, 0.05, { type: 'square', vol: 0.12 }); this.tone(1400, 0.05, { type: 'square', vol: 0.12, delay: 0.09 }); break;
      case 'door': this.noise(0.15, { freq: 400, vol: 0.25 }); this.tone(160, 0.1, { type: 'triangle', vol: 0.15, delay: 0.05 }); break;
      case 'stairs': this.arp([400, 330, 262, 196], 0.07, { type: 'triangle', vol: 0.12 }); break;
      case 'meow': this.tone(700, 0.28, { type: 'sine', vol: 0.12, slide: 1100, vib: 30, vibRate: 9 }); this.tone(1000, 0.2, { type: 'sine', vol: 0.08, slide: 600, delay: 0.2 }); break;
      case 'roar': this.tone(500, 0.3, { type: 'sawtooth', vol: 0.1, slide: 900, vib: 60, vibRate: 30 }); break;
      case 'eat': this.noise(0.08, { freq: 900, vol: 0.2 }); this.noise(0.08, { freq: 900, vol: 0.2, delay: 0.14 }); this.noise(0.08, { freq: 900, vol: 0.2, delay: 0.28 }); break;
      case 'ship': this.tone(200, 0.1, { type: 'triangle', vol: 0.2 }); this.noise(0.12, { freq: 700, vol: 0.2, delay: 0.05 }); break;
      case 'lootbox': this.arp([330, 415, 494, 659, 831], 0.06, { type: 'square', vol: 0.08 }); this.noise(0.4, { freq: 6000, filter: 'highpass', vol: 0.08, delay: 0.3 }); break;
      case 'system': this.tone(1760, 0.05, { type: 'square', vol: 0.05 }); this.tone(1320, 0.07, { type: 'square', vol: 0.05, delay: 0.06 }); break;
      case 'blip': this.tone(1200, 0.02, { type: 'square', vol: 0.025 }); break;
      case 'shoot': this.noise(0.15, { freq: 2000, slide: 500, filter: 'bandpass', vol: 0.15 }); break;
      case 'die': this.arp([392, 330, 262, 196, 131], 0.12, { type: 'sawtooth', vol: 0.12 }); break;
      case 'sleep': this.arp([523, 440, 392, 330], 0.18, { type: 'sine', vol: 0.12 }); break;
      case 'rooster': this.arp([523, 659, 784, 659, 784, 1047], 0.09, { type: 'triangle', vol: 0.1 }); break;
    }
  },
};

// ---------------------------------------------------------------------------
// Procedural music. Each track is a seeded 4-bar loop: bass + lead + hat.
// ---------------------------------------------------------------------------
const Music = {
  current: null,
  pending: null,
  timer: null,
  step: 0,
  nextTime: 0,
  pattern: null,

  tracks: {
    title:   { bpm: 92,  root: 57, scale: [0, 2, 4, 7, 9],      prog: [0, 5, 3, 4], lead: 'triangle', bass: 'sine', density: 0.55, seed: 4, hat: false },
    farm:    { bpm: 100, root: 60, scale: [0, 2, 4, 7, 9],      prog: [0, 5, 3, 4], lead: 'triangle', bass: 'triangle', density: 0.6, seed: 17, hat: true },
    summer:  { bpm: 112, root: 62, scale: [0, 2, 4, 7, 9],      prog: [0, 3, 5, 4], lead: 'square', bass: 'triangle', density: 0.55, seed: 23, hat: true, leadVol: 0.035 },
    fall:    { bpm: 90,  root: 57, scale: [0, 2, 3, 7, 9],      prog: [0, 3, 4, 3], lead: 'triangle', bass: 'sine', density: 0.5, seed: 31, hat: true },
    winter:  { bpm: 76,  root: 64, scale: [0, 2, 4, 7, 11],     prog: [0, 5, 3, 4], lead: 'sine', bass: 'sine', density: 0.45, seed: 41, hat: false },
    town:    { bpm: 116, root: 60, scale: [0, 2, 4, 5, 7, 9],   prog: [0, 3, 4, 0], lead: 'square', bass: 'triangle', density: 0.6, seed: 7, hat: true, leadVol: 0.035 },
    night:   { bpm: 68,  root: 57, scale: [0, 2, 3, 7, 8],      prog: [0, 5, 3, 4], lead: 'sine', bass: 'sine', density: 0.35, seed: 5, hat: false },
    dungeon: { bpm: 84,  root: 45, scale: [0, 3, 5, 7, 10],     prog: [0, 0, 5, 3], lead: 'sawtooth', bass: 'square', density: 0.35, seed: 13, hat: true, leadVol: 0.025, minor: true },
    deep:    { bpm: 96,  root: 43, scale: [0, 1, 5, 7, 8],      prog: [0, 1, 0, 5], lead: 'sawtooth', bass: 'square', density: 0.4, seed: 66, hat: true, leadVol: 0.025, minor: true },
    boss:    { bpm: 150, root: 40, scale: [0, 1, 5, 7, 8, 10],  prog: [0, 1, 0, 6], lead: 'square', bass: 'sawtooth', density: 0.75, seed: 99, hat: true, leadVol: 0.03, minor: true },
    safe:    { bpm: 88,  root: 60, scale: [0, 4, 7, 9, 11],     prog: [0, 5, 3, 4], lead: 'sine', bass: 'sine', density: 0.4, seed: 3, hat: false },
  },

  build(t) {
    const rng = mulberry32(t.seed * 7919);
    const steps = 32;
    const lead = [];
    let deg = 2;
    for (let i = 0; i < steps; i++) {
      const strong = i % 4 === 0;
      if (rng() < (strong ? t.density + 0.25 : t.density)) {
        deg = clamp(deg + Math.floor(rng() * 5) - 2, 0, t.scale.length * 2 - 1);
        lead.push(deg);
      } else lead.push(null);
    }
    return { lead };
  },

  play(name, force) {
    if (!force && this.current === name) return;
    this.current = name;
    if (!Audio2.ctx) { this.pending = name; return; }
    this.pending = null;
    const t = this.tracks[name];
    if (!t) { this.stop(); return; }
    this.pattern = this.build(t);
    this.step = 0;
    this.nextTime = Audio2.ctx.currentTime + 0.1;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 50);
  },

  stop() {
    this.current = null;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  },

  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },

  tick() {
    const ac = Audio2.ctx;
    if (!ac || !this.current) return;
    const t = this.tracks[this.current];
    const stepDur = 60 / t.bpm / 2;
    while (this.nextTime < ac.currentTime + 0.25) {
      const i = this.step % 32;
      const bar = Math.floor(i / 8);
      const chordRoot = t.scale[t.prog[bar] % t.scale.length] + (t.prog[bar] >= t.scale.length ? 12 : 0);
      const time = this.nextTime - ac.currentTime;
      if (Audio2.musicOn) {
        // bass on beats
        if (i % 4 === 0) {
          Audio2.tone(this.midi(t.root - 12 + chordRoot), stepDur * 3.2, { type: t.bass, vol: 0.09, delay: time, bus: Audio2.musicGain });
        } else if (i % 4 === 2 && !t.minor) {
          Audio2.tone(this.midi(t.root - 12 + chordRoot + 7), stepDur * 1.5, { type: t.bass, vol: 0.05, delay: time, bus: Audio2.musicGain });
        }
        const d = this.pattern.lead[i];
        if (d != null) {
          const oct = Math.floor(d / t.scale.length);
          const note = t.root + t.scale[d % t.scale.length] + oct * 12;
          Audio2.tone(this.midi(note), stepDur * 1.7, { type: t.lead, vol: t.leadVol || 0.05, delay: time, bus: Audio2.musicGain });
        }
        if (t.hat && i % 2 === 1 && Audio2.ctx) this.hat(time);
      }
      this.nextTime += stepDur;
      this.step++;
    }
  },

  hat(delay) {
    const ac = Audio2.ctx;
    const tt = ac.currentTime + delay;
    const src = ac.createBufferSource();
    src.buffer = Audio2.noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 7000;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.025, tt);
    g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.04);
    src.connect(f); f.connect(g); g.connect(Audio2.musicGain);
    src.start(tt, Math.random() * 0.5); src.stop(tt + 0.06);
  },
};
