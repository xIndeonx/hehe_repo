/* ------------------------------------------------------------
   a tiny adventure — core: content binding, sound, storage,
   chapter routing, shared drawing helpers, epilogue reply builder.
   Scenes live in scenes.js and register themselves on TA.scenes.
   ------------------------------------------------------------ */
(() => {
  'use strict';
  const C = window.TA_CONTENT;
  const SECRET = atob(C.secretEncoded);
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const app = $('app');
  if (!REDUCED) app.classList.add('anim');

  // ---------------------------------------------------------- content binding
  const getPath = (path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), C);
  document.querySelectorAll('[data-t]').forEach((el) => {
    const v = getPath(el.dataset.t);
    if (typeof v === 'string') el.textContent = v;
  });

  // ---------------------------------------------------------- storage (best effort)
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  const K_PROGRESS = 'tinyAdventure.chapter';
  const K_SOUND = 'tinyAdventure.sound';

  // ---------------------------------------------------------- sound
  // Preference: on by default. Browsers only allow audio after a user gesture, so the
  // AudioContext is created/resumed on the first real tap or key press (normally "begin").
  const Sound = {
    ctx: null, on: store.get(K_SOUND) === null ? C.soundDefault !== false : store.get(K_SOUND) === '1', ready: false, failed: false, noiseBuf: null,
    label() {
      const b = $('btnSound');
      b.textContent = this.failed ? 'sound: unavailable' : (this.on ? C.ui.soundOn : C.ui.soundOff);
      b.setAttribute('aria-pressed', String(this.on && !this.failed));
    },
    unlock() {
      if (this.ctx || this.failed) { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        const len = this.ctx.sampleRate * 1.2; this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.ready = true;
      } catch (e) { this.failed = true; this.on = false; }
      this.label();
    },
    toggle() {
      if (this.failed) return;
      this.on = !this.on;
      store.set(K_SOUND, this.on ? '1' : '0');
      this.unlock();
      if (this.ctx) { if (this.on && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }
      if (this.music) { if (this.on) this.music.start(); else this.music.pause(); }
      this.label();
      if (this.on) this.play('tap');
    },
    tone(freq, t0, dur, type = 'sine', vol = 0.16, glide = null, vib = 0) {
      const c = this.ctx; if (!c) return;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
      if (vib) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 7; lg.gain.value = vib; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.02); }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    },
    noise(t0, dur, fromHz, toHz, vol = 0.05, q = 1.2) {
      const c = this.ctx; if (!c || !this.noiseBuf) return;
      const src = c.createBufferSource(); src.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(fromHz, t0); f.frequency.exponentialRampToValueAtTime(toHz, t0 + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(c.destination); src.start(t0); src.stop(t0 + dur + 0.02);
    },
    play(name) {
      if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      const s = {
        tap: () => this.tone(520, t, 0.07, 'sine', 0.08),
        pick: () => this.tone(440, t, 0.09, 'triangle', 0.1, 660),
        place: () => { this.tone(392, t, 0.09, 'triangle', 0.1); this.tone(523, t + 0.09, 0.12, 'triangle', 0.1); },
        rustle: () => { this.noise(t, 0.18, 2500, 1200, 0.035, 0.8); },
        hop: () => this.tone(300, t, 0.14, 'sine', 0.1, 620),
        land: () => { this.tone(170, t, 0.09, 'triangle', 0.08, 120); this.noise(t, 0.08, 900, 400, 0.02, 1); },
        nope: () => { this.tone(392, t, 0.1, 'sine', 0.08); this.tone(311, t + 0.12, 0.16, 'sine', 0.08); },
        chime: () => { this.tone(1046, t, 0.16, 'sine', 0.06); this.tone(1568, t + 0.08, 0.24, 'sine', 0.05); },
        glide: () => { this.noise(t, 0.9, 1400, 3200, 0.03, 0.9); this.tone(523, t, 0.5, 'sine', 0.025, 740); },
        meow: () => { this.tone(620, t, 0.26, 'triangle', 0.045, 900, 14); this.tone(880, t + 0.1, 0.22, 'sine', 0.03, 620); },
        descend: () => { this.tone(1200, t, 0.9, 'sine', 0.03, 600); this.noise(t, 0.9, 3000, 1500, 0.015, 1.5); },
        unlock: () => { this.tone(660, t, 0.06, 'square', 0.03); this.tone(990, t + 0.09, 0.22, 'sine', 0.07); },
        flourish: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, t + i * 0.09, 0.3, 'triangle', 0.06)); this.tone(2093, t + 0.5, 0.6, 'sine', 0.04); this.noise(t + 0.3, 0.6, 4000, 7000, 0.015, 2); },
        tada: () => { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.11, 0.28, 'triangle', 0.08)); this.tone(1318, t + 0.46, 0.5, 'sine', 0.06); },
        // --- the comedy
        key: () => this.tone(1046 + Math.random() * 300, t, 0.07, 'square', 0.03),
        beepOk: () => { this.tone(880, t, 0.08, 'sine', 0.06); this.tone(1318, t + 0.1, 0.16, 'sine', 0.06); },
        buzz: () => { this.tone(196, t, 0.16, 'square', 0.035); this.tone(185, t + 0.2, 0.22, 'square', 0.035); },
        slip: () => { this.noise(t, 0.22, 2600, 900, 0.03, 0.8); this.tone(520, t, 0.16, 'sine', 0.05, 240); },
        hmm: () => { this.tone(523, t, 0.12, 'triangle', 0.04, 587); this.tone(659, t + 0.14, 0.18, 'triangle', 0.04); },
        plink: () => this.tone(1760, t, 0.12, 'sine', 0.04, 1500),
        tumble: () => { this.noise(t, 0.5, 700, 300, 0.02, 0.7); this.noise(t + 0.55, 0.5, 700, 300, 0.015, 0.7); },
        sting: () => { this.tone(110, t, 1.4, 'sawtooth', 0.03); [220, 277, 330].forEach((f) => { this.tone(f, t + 0.2, 0.5, 'square', 0.022); this.tone(f * 1.19, t + 0.75, 0.7, 'square', 0.025); }); this.noise(t + 0.7, 0.8, 300, 1200, 0.012, 0.5); },
        clank: () => { this.tone(880, t, 0.05, 'square', 0.05, 660); this.tone(1320, t + 0.02, 0.18, 'triangle', 0.04); this.noise(t, 0.08, 3000, 1500, 0.03, 1); },
        engine: () => { this.tone(64, t, 1.2, 'triangle', 0.05, 58, 7); this.noise(t, 1.2, 320, 220, 0.012, 0.7); },
        brake: () => { this.noise(t, 0.42, 3400, 1500, 0.03, 0.6); },
        ding: () => { this.tone(1318, t, 0.24, 'sine', 0.05); this.tone(1046, t + 0.22, 0.36, 'sine', 0.05); },
        swish: () => { this.noise(t, 0.22, 900, 2600, 0.025, 0.8); this.noise(t + 0.3, 0.22, 900, 2600, 0.025, 0.8); },
        crash: () => { this.noise(t, 0.3, 3400, 600, 0.09, 0.8); [1760, 2350, 1980, 2640].forEach((f, i) => this.tone(f, t + 0.02 + i * 0.045, 0.06, 'triangle', 0.03)); },
        creak: () => { this.tone(170, t, 0.5, 'triangle', 0.035, 250, 16); },
        sigh: () => { this.noise(t, 0.7, 1000, 320, 0.03, 0.6); this.tone(392, t, 0.6, 'sine', 0.025, 290); },
        scoop: () => { this.noise(t, 0.12, 1400, 700, 0.03, 0.9); this.noise(t + 0.08, 0.1, 1100, 500, 0.025, 0.9); },
        toss: () => { this.noise(t, 0.16, 2200, 900, 0.025, 0.8); },
        snowhit: () => { this.noise(t, 0.16, 900, 260, 0.07, 0.8); this.tone(180, t, 0.08, 'sine', 0.04, 110); },
        whistle: () => { this.tone(1180, t, 0.13, 'sine', 0.03, 1520); this.tone(1520, t + 0.16, 0.2, 'sine', 0.03, 1100); },
        boing: () => { this.tone(240, t, 0.32, 'sine', 0.06, 560, 9); },
        whoosh: () => { this.noise(t, 0.32, 2600, 380, 0.035, 0.7); },
        thunk: () => { this.tone(96, t, 0.16, 'triangle', 0.16, 52); this.noise(t, 0.1, 520, 140, 0.09, 1.1); this.tone(1900, t + 0.005, 0.03, 'square', 0.015); },
        coo: () => { this.tone(330, t, 0.16, 'sine', 0.05, 296); this.tone(300, t + 0.2, 0.24, 'sine', 0.05, 262); },
        flap: () => { [0, 0.09, 0.18, 0.27].forEach((d) => this.noise(t + d, 0.05, 1500, 700, 0.025, 0.9)); },
        kiss: () => { this.tone(1046, t, 0.07, 'sine', 0.07, 1568); this.tone(1318, t + 0.06, 0.12, 'sine', 0.06, 880); this.noise(t + 0.02, 0.05, 2400, 900, 0.015, 1); },
        sparkle: () => { this.tone(2093, t, 0.1, 'sine', 0.04); this.tone(2637, t + 0.07, 0.14, 'sine', 0.035); this.tone(3136, t + 0.15, 0.22, 'sine', 0.03); },
        meowShy: () => { this.tone(700, t, 0.28, 'triangle', 0.04, 480, 10); this.tone(900, t + 0.08, 0.2, 'sine', 0.025, 560); },
        mew: () => { this.tone(820, t, 0.12, 'triangle', 0.04, 1040, 12); },
        purr: () => { this.noise(t, 0.5, 90, 70, 0.03, 4); this.tone(60, t, 0.5, 'triangle', 0.03, 55, 20); },
        whirr: () => { this.tone(300, t, 1.6, 'sine', 0.03, 1400, 18); this.noise(t, 1.6, 800, 4000, 0.015, 0.8); },
        wobble: () => { this.tone(440, t, 0.9, 'sine', 0.04, 300, 40); this.tone(660, t + 0.1, 0.8, 'triangle', 0.02, 500, 30); },
        record: () => { this.noise(t, 0.3, 1800, 200, 0.05, 0.6); this.tone(900, t, 0.3, 'sawtooth', 0.02, 120); },
        soft: () => { [523, 659, 784].forEach((f, i) => this.tone(f, t + i * 0.16, 0.9, 'sine', 0.035)); this.tone(1046, t + 0.5, 1.2, 'sine', 0.025); },
        stamp: () => { this.tone(120, t, 0.08, 'square', 0.08, 70); this.noise(t, 0.12, 400, 150, 0.05, 1); },
        pop: () => this.tone(600, t, 0.06, 'sine', 0.06, 900),
        slapp: () => { this.noise(t, 0.09, 1800, 600, 0.09, 0.7); this.tone(220, t, 0.08, 'triangle', 0.07, 90); this.tone(1400, t + 0.01, 0.05, 'square', 0.02); },
      };
      if (s[name]) s[name]();
    },
  };
  // ---------------------------------------------------------- music (the attached cat cover, looped)
  // A plain <audio> element on purpose: on iPhone it keeps playing with the ringer switch on silent, and while
  // it plays, the little Web Audio effects pass the switch too. Its level is baked into the file (about -19 LUFS)
  // because iOS ignores the volume property. Browsers refuse sound before the first tap, so it starts then.
  const Music = {
    el: null, started: false,
    init() {
      this.el = $('bgm'); if (!this.el) return;
      this.el.loop = true; this.el.volume = 1;
      this.el.addEventListener('playing', () => { this.started = true; });
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); else if (this.started) this.start(); });
    },
    start() { if (!this.el || !Sound.on || this.el.error) return Promise.resolve(false); return this.el.play().then(() => true).catch(() => false); },
    pause() { if (this.el && !this.el.paused) this.el.pause(); },
    playing() { return !!(this.el && !this.el.paused && !this.el.ended); },
  };
  Sound.music = Music;
  Music.init();
  $('btnSound').addEventListener('click', () => Sound.toggle());
  // first gesture: create the effects context and start the music. touchstart/pointerdown do not count as a
  // gesture on iOS, so the release events are used, and the hook stays until both have actually started.
  const gestureEvents = ['pointerup', 'touchend', 'click', 'keydown'];
  const onGesture = () => {
    Sound.unlock();
    Music.start().then((ok) => {
      const ctxOk = Sound.failed || (Sound.ctx && Sound.ctx.state === 'running');
      if ((ok || !Sound.on || !Music.el) && ctxOk) gestureEvents.forEach((ev) => document.removeEventListener(ev, onGesture, true));
    });
  };
  gestureEvents.forEach((ev) => document.addEventListener(ev, onGesture, true));
  Music.start();   // allowed straight away only where the browser already trusts the page; otherwise the first tap does it
  Sound.label();

  // ---------------------------------------------------------- tiny helpers
  const SVGNS = 'http://www.w3.org/2000/svg';
  const ease = {
    inOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    out: (t) => 1 - (1 - t) * (1 - t),
    in: (t) => t * t,
    // a walk: a short ease-in, a constant stride, a short ease-out (no sprint in the middle)
    walk: (t) => { const a = 0.18; if (t < a) return (t * t) / (2 * a) / (1 - a); if (t > 1 - a) { const u = 1 - t; return 1 - (u * u) / (2 * a) / (1 - a); } return (t - a / 2) / (1 - a); },
  };
  function tween(dur, fn) {
    return new Promise((res) => {
      if (REDUCED || dur <= 0) { fn(1); res(); return; }
      const t0 = performance.now();
      const step = (now) => { const t = Math.min(1, (now - t0) / dur); fn(t); if (t < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step);
    });
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, REDUCED ? Math.min(ms, 180) : ms));
  function svgEl(name, attrs = {}, inner) {
    const e = document.createElementNS(SVGNS, name);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (inner !== undefined) e.innerHTML = inner;
    return e;
  }
  function flash(el, cls, ms) { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); }

  function spawnHearts(root, x, y, n = 3, spread = 30) {
    for (let i = 0; i < n; i++) {
      const u = svgEl('use', { href: '#sym-heart', x: x - 8 + (Math.random() - 0.5) * spread, y: y - 7 + (Math.random() - 0.5) * 14, width: 14 + Math.random() * 8, height: 13 + Math.random() * 7, class: 'fx-heart' });
      u.style.setProperty('--tilt', `${(Math.random() - 0.5) * 30}deg`);
      u.style.animationDelay = `${i * 120}ms`;
      root.appendChild(u);
      setTimeout(() => u.remove(), 1900 + i * 120);
    }
  }
  function spawnStar(root, x, y, size = 34) {
    const u = svgEl('use', { href: '#sym-star', x: x - size / 2, y: y - size / 2, width: size, height: size, class: 'fx-star' });
    root.appendChild(u); setTimeout(() => u.remove(), 1000);
    Sound.play('chime');
  }
  // the little ink doodles shared by scenes
  const Doodle = {
    heart: (x, y, s = 18, extra = '') => `<use href="#sym-heart" x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s * 0.92}" ${extra}/>`,
    star: (x, y, s = 20, extra = '') => `<use href="#sym-star" x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" ${extra}/>`,
    paw: (x, y, s = 12, extra = '') => `<use href="#sym-paw" x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" ${extra}/>`,
    // a little ticket booth: hut with pointed roof, counter window, sign
    booth: (x, y, w, h, opts = {}) => {
      const sw = opts.sw || 3;
      const roofH = h * 0.26, wallY = y + roofH;
      const sign = opts.sign !== false;
      return `
      <g class="booth">
        <rect x="${x + w * 0.06}" y="${wallY}" width="${w * 0.88}" height="${h - roofH}" rx="${w * 0.06}" fill="#fff" class="ink" stroke-width="${sw}"/>
        <path d="M${x} ${wallY + 4} L${x + w / 2} ${y} L${x + w} ${wallY + 4} Z" fill="${opts.roof || 'var(--pink)'}" class="ink" stroke-width="${sw}"/>
        <path d="M${x + w * 0.18} ${wallY + 4} v${(h - roofH) * 0.18} M${x + w * 0.82} ${wallY + 4} v${(h - roofH) * 0.18}" class="ink" stroke-width="${sw * 0.8}" fill="none"/>
        ${opts.window === false ? '' : `<rect x="${x + w * 0.24}" y="${wallY + (h - roofH) * 0.3}" width="${w * 0.52}" height="${(h - roofH) * 0.42}" rx="${w * 0.08}" fill="${opts.window || 'var(--rink)'}" class="ink" stroke-width="${sw}"/>`}
        ${sign ? `<rect x="${x + w * 0.2}" y="${wallY - roofH * 0.12}" width="${w * 0.6}" height="${roofH * 0.52}" rx="${roofH * 0.2}" fill="#fff" class="ink" stroke-width="${sw * 0.9}"/>
        <text x="${x + w / 2}" y="${wallY + roofH * 0.27}" text-anchor="middle" font-size="${roofH * 0.42}">tickets</text>` : ''}
        ${Doodle.heart(x + w * 0.5, wallY + (h - roofH) * 0.86, w * 0.16)}
      </g>`;
    },
    // open envelope drawn in the booklet's language (back, flap open, pocket front)
    envelopeOpen: (x, y, w, h, sw = 3) => `
      <g class="envelope-open">
        <path d="M${x} ${y} L${x + w / 2} ${y - h * 0.62} L${x + w} ${y} Z" fill="var(--pink)" class="ink" stroke-width="${sw}"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h * 0.08}" fill="#fff" class="ink" stroke-width="${sw}"/>
      </g>`,
    envelopeFront: (x, y, w, h, sw = 3) => `
      <path class="env-front ink" d="M${x} ${y + 2} L${x + w / 2} ${y + h * 0.56} L${x + w} ${y + 2} L${x + w} ${y + h - h * 0.08} q0 ${h * 0.08} -${h * 0.08} ${h * 0.08} h-${w - h * 0.16} q-${h * 0.08} 0 -${h * 0.08} -${h * 0.08} Z" fill="#fff" stroke="var(--ink)" stroke-width="${sw}" stroke-linejoin="round"/>`,
    // sealed envelope (closed) with heart
    envelope: (x, y, w, h, sw = 3, extra = '') => `
      <g class="envelope${/class="([^"]*)"/.test(extra) ? ' ' + /class="([^"]*)"/.exec(extra)[1] : ''}" ${extra.replace(/class="[^"]*"/, '')}>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h * 0.12}" fill="#fff" class="ink" stroke-width="${sw}"/>
        <path d="M${x + 2} ${y + 3} L${x + w / 2} ${y + h * 0.58} L${x + w - 2} ${y + 3}" fill="none" class="ink" stroke-width="${sw}"/>
        <path d="M${x + 3} ${y + h - 3} L${x + w * 0.38} ${y + h * 0.5} M${x + w - 3} ${y + h - 3} L${x + w * 0.62} ${y + h * 0.5}" fill="none" class="ink" stroke-width="${sw * 0.85}"/>
        ${Doodle.heart(x + w / 2, y + h * 0.6, h * 0.42)}
      </g>`,
    snowBush: (x, y, s = 1, sw = 3) => `
      <g transform="translate(${x} ${y}) scale(${s})">
        <path d="M-22 0 c -8 -8 -2 -20 10 -16 c 2 -10 16 -10 18 0 c 10 -4 18 6 10 14 z" fill="var(--rink)" class="ink" stroke-width="${sw / s}"/>
        <path d="M-6 -6 q4 3 8 0" fill="none" class="ink" stroke-width="${(sw * 0.7) / s}"/>
      </g>`,
    cloud: (x, y, s = 1, sw = 2.6) => `
      <path transform="translate(${x} ${y}) scale(${s})" d="M0 0 c-10 0 -14 -10 -6 -15 c 2 -10 16 -12 20 -4 c 8 -4 16 4 12 12 c 6 2 4 8 -2 8 z" fill="#fff" class="ink" stroke-width="${sw / s}"/>`,
    arrowCurve: (d, sw = 2.6, extra = '') => `<path d="${d}" fill="none" class="ink" stroke-width="${sw}" stroke-dasharray="6 5" ${extra}/>`,
    arrowHead: (x, y, angle, s = 10) => `<path transform="translate(${x} ${y}) rotate(${angle})" d="M-${s} -${s * 0.6} L0 0 L-${s} ${s * 0.6}" fill="none" class="ink" stroke-width="2.6"/>`,
    // dashed arrow from (x1,y1) to (x2,y2) with a head at the end
    arrow: (x1, y1, x2, y2, sw = 2.4, head = 7) => {
      const a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      return `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" class="ink" stroke-width="${sw}" stroke-dasharray="5 4"/><path transform="translate(${x2} ${y2}) rotate(${a})" d="M-${head} -${head * 0.62} L0 0 L-${head} ${head * 0.62}" fill="none" class="ink" stroke-width="${sw}"/>`;
    },
  };

  // ---------------------------------------------------------- chapters & routing
  // the scenes in order; the balcony is a little flashback between two chapters, not a chapter itself
  const ORDER = ['prologue', 'map', 'lane', 'balcony', 'stairs', 'rink', 'epilogue', 'office'];
  const CHAPTERS = ['map', 'lane', 'stairs', 'rink'];
  // what the header shows for a scene: the chapter number, or for the interlude the chapters done so far
  const chapterNo = (name) => { const i = CHAPTERS.indexOf(name); if (i >= 0) return i + 1; if (name === 'balcony') return 2; return 0; };
  const TA = window.TA = { scenes: {}, registerScene(name, factory) { this.scenes[name] = factory; }, helpers: { svgEl, tween, wait, ease, spawnHearts, spawnStar, Doodle, flash, REDUCED }, Sound, store };
  // telemetry (js/notify.js): every call is optional and can never get in the way of the story
  const tm = (fn, ...a) => { try { if (TA.tm && TA.tm[fn]) TA.tm[fn](...a); } catch (e) { /* ignore */ } };
  TA.note = (key) => tm('count', key);
  let current = null;        // chapter name
  let instance = null;       // active scene instance
  let completed = new Set();

  function sectionOf(name) { return $(`ch-${name}`); }
  // wide composition only on landscape-ish screens; a portrait tablet gets the portrait composition, capped in width
  // measured on the chapter (full width), not on the art box, whose width the 'tall' class caps
  function layoutOf(container) { const host = container.parentElement || container; const l = (host.clientWidth >= 620 && window.innerWidth > window.innerHeight * 0.95) ? 'wide' : 'tall'; container.classList.toggle('tall', l === 'tall'); return l; }

  function setProgress(name) {
    const n = chapterNo(name); const inter = name === 'balcony';
    const p = $('progress');
    app.classList.toggle('in-chapter', n >= 1);
    if (n >= 1) {
      p.hidden = false;
      $('progressText').textContent = C.ui.progressOf(n);
      // hearts: the chapters finished so far (during the flashback, the two before it)
      p.querySelectorAll('.progress-hearts i').forEach((h, i) => h.classList.toggle('on', i < (inter ? 2 : n - 1)));
    } else p.hidden = true;
  }
  function markHeart(idx) {
    const h = $('progress').querySelectorAll('.progress-hearts i')[idx];
    if (h) { h.classList.add('on'); flash(h, 'pop', 400); }
  }

  // ---------------------------------------------------------- fit: a chapter never scrolls on a phone
  // The scene drawing is capped so the header, the words above it and the controls below it all fit the
  // visible viewport (Safari's bars included); the epilogue is the one page that may scroll.
  function fitScene() {
    if (!current) return;
    const section = sectionOf(current); const art = section.querySelector('.scene-art'); const svg = art && art.querySelector('svg');
    if (!svg) return;
    if (current === 'epilogue' || current === 'office') { svg.style.maxHeight = ''; return; }   // the two pages that may scroll
    svg.style.maxHeight = '';
    const ok = section.querySelector('.scene-success'), ctrl = section.querySelector('.scene-controls');
    let reserve = 0;
    if (ok && ctrl) {   // the success panel replaces the controls and the helper line later; keep room for whichever is taller
      const help = section.querySelector('.scene-helper');
      const was = ok.hidden; ok.hidden = false; ok.style.visibility = 'hidden';   // measured in flow, so its text wraps as it will
      reserve = Math.max(0, ok.offsetHeight - (ctrl.hidden ? 0 : ctrl.offsetHeight) - (help && !help.hidden ? help.offsetHeight : 0)); ok.style.visibility = ''; ok.hidden = was;
    }
    const vh = Math.min(window.innerHeight, (window.visualViewport && window.visualViewport.height) || Infinity);
    const others = section.scrollHeight - art.offsetHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const bottomPad = parseFloat(getComputedStyle(app).paddingBottom) || 0;
    const avail = Math.floor(vh - top - others - reserve - bottomPad - 2);
    if (avail < art.offsetHeight) svg.style.maxHeight = Math.max(120, avail) + 'px';
  }
  TA.fitScene = fitScene;
  window.addEventListener('orientationchange', () => setTimeout(fitScene, 60));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitScene());

  function mountScene(name) {
    const section = sectionOf(name);
    const art = section.querySelector('.scene-art');
    const factory = TA.scenes[name];
    if (!factory) return;
    const ctx = {
      section, art, Sound, REDUCED,
      layout: () => layoutOf(art),
      progress(text) { const el = section.querySelector('.scene-progress'); if (el) el.textContent = text || ''; },
      announce(text) { $('srLive').textContent = text; },
      // a one-line caption over the drawing (the storytelling voice); empty text hides it
      caption(text, ms = 0) {
        let el = art.querySelector('.scene-caption');
        if (!el) { el = document.createElement('p'); el.className = 'scene-caption'; el.setAttribute('aria-live', 'polite'); art.appendChild(el); }
        clearTimeout(el._t);
        if (!text) { el.classList.remove('show'); el._t = setTimeout(() => { if (!el.classList.contains('show')) el.textContent = ''; }, 300); return; }
        el.classList.remove('show'); void el.offsetWidth; el.textContent = text; el.classList.add('show');
        if (ms) el._t = setTimeout(() => el.classList.remove('show'), ms);
      },
      complete() {
        completed.add(name); tm('done', name);
        const ci = CHAPTERS.indexOf(name); if (ci >= 0) markHeart(ci);
        const ctrl = section.querySelector('.scene-controls'); if (ctrl) ctrl.hidden = true;
        const help = section.querySelector('.scene-helper'); if (help) help.hidden = true;   // the how-to is done with; its line goes to the success panel
        const ok = section.querySelector('.scene-success'); if (ok) { ok.hidden = false; const b = ok.querySelector('button'); if (b) setTimeout(() => b.focus({ preventScroll: true }), 50); }
        const nxt = ORDER[ORDER.indexOf(name) + 1]; if (nxt && nxt !== 'epilogue') store.set(K_PROGRESS, nxt);
        if (name !== 'balcony') Sound.play('tada');
      },
      secret: SECRET,
    };
    instance = factory(ctx);
    instance.mount(art, layoutOf(art));
    fitScene();
  }

  async function go(name) {
    if (current === name) return;
    const prev = current ? sectionOf(current) : null;
    current = name; tm('enter', name);
    if (instance && instance.unmount) instance.unmount();
    instance = null;
    if (prev) { prev.classList.add('leaving'); await wait(260); prev.hidden = true; prev.classList.remove('leaving'); const oldArt = prev.querySelector('.scene-art'); if (oldArt) oldArt.innerHTML = ''; }
    document.querySelectorAll('.chapter').forEach((s) => { if (s.id !== `ch-${name}`) s.hidden = true; });
    const section = sectionOf(name);
    // reset per-chapter panels
    const ctrl = section.querySelector('.scene-controls'); if (ctrl) ctrl.hidden = false;
    const help = section.querySelector('.scene-helper'); if (help) help.hidden = false;
    const ok = section.querySelector('.scene-success'); if (ok) ok.hidden = true;
    section.hidden = false;
    setProgress(name);
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (name !== 'prologue' && name !== 'epilogue' && name !== 'office') store.set(K_PROGRESS, name);
    if (name === 'epilogue') { store.set(K_PROGRESS, 'done'); setupEpilogue(); }
    if (name === 'office') { store.set(K_PROGRESS, 'office'); setupOffice(); }
    mountScene(name);
    const h = section.querySelector('h1, h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  // chapter control buttons
  document.querySelectorAll('.chapter').forEach((section) => {
    section.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        Sound.play('tap');
        if (a === 'next') { const idx = ORDER.indexOf(current); go(ORDER[idx + 1]); }
        else if (a === 'hint' && instance && instance.hint) { tm('count', `${current}.hint`); instance.hint(); }
        else if (a === 'skip' && instance && instance.skip) { tm('count', `${current}.skip`); instance.skip(); }
      });
    });
  });
  $('btnStart').addEventListener('click', () => { Sound.play('tap'); tm('start'); go('map'); });
  $('btnReplay').addEventListener('click', () => { tm('count', 'replays'); store.del(K_PROGRESS); completed = new Set(); officeReady = false; Sound.play('tap'); go('prologue'); });

  // re-render the active scene when the layout flips (portrait phone vs wide)
  let lastLayout = null;
  const onResize = () => {
    if (!instance || !current) return;
    const art = sectionOf(current).querySelector('.scene-art');
    const l = layoutOf(art);
    if (l !== lastLayout) { lastLayout = l; instance.mount(art, l); }
    fitScene();
  };
  window.addEventListener('resize', () => { clearTimeout(onResize._t); onResize._t = setTimeout(onResize, 160); });

  // ---------------------------------------------------------- epilogue: just the word
  function setupEpilogue() { $('secretWord').textContent = SECRET; }

  // ---------------------------------------------------------- the paperwork: the application that doubles as her reply
  // The form is the official date application: her decision and the date are its fields, and it starts blank. Once both
  // are chosen the "stamp" button arms; pressing it plays the stamping (office.js), the imprint lands at the impact, the
  // pigeon collects the reply from the box, and the reply (overly formal, as is proper) appears below to be copied.
  const STAMP_ICON = '<svg class="stamp-ico" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="4.6" rx="4.6" ry="3.1" fill="currentColor"/><rect x="10" y="6.4" width="4" height="5" rx="1.2" fill="currentColor"/><rect x="4.5" y="11.2" width="15" height="5.6" rx="1.8" fill="currentColor"/><rect x="3" y="19" width="18" height="2.2" rx="1.1" fill="currentColor" opacity=".55"/></svg>';
  let officeReady = false, officeLetter = () => '', officeWired = false;
  function setupOffice() {
    if (officeReady) return;
    officeReady = true;
    const O = C.office, E = C.epilogue, D = O.doc;
    const kindOf = (answer) => ['yes', 'check', 'no'][E.answers.indexOf(answer)] || 'yes';
    const state = { answer: null, date: null, stamped: null, busy: false };
    const ready = () => !!(state.answer && state.date);
    const doc = $('paperwork');
    const rows = D.rows.map(([k, v]) => `<div class="doc-row"><dt>${k}</dt><dd>${v.replace('{word}', `<strong>${SECRET}</strong>`)}</dd></div>`).join('');
    doc.innerHTML = `<div class="doc-inner">
        <div class="doc-crest" aria-hidden="true"><svg viewBox="0 0 60 60" width="56" height="56"><circle cx="30" cy="30" r="27" fill="#fff" stroke="#191717" stroke-width="2.4"/><circle cx="30" cy="30" r="22" fill="none" stroke="#f49fbb" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M30 41 C 20 34, 16 28, 20 22 C 23 18, 28 19, 30 23 C 32 19, 37 18, 40 22 C 44 28, 40 34, 30 41 Z" fill="#f49fbb" stroke="#191717" stroke-width="2.2" stroke-linejoin="round"/></svg></div>
        <p class="doc-dept">${D.dept}</p>
        <h3 class="doc-title">${D.title}</h3>
        <dl class="doc-rows">${rows}<div class="doc-row doc-status"><dt>${D.statusLabel}</dt><dd id="docStatus">${D.status.none}</dd></div></dl>
        <div class="doc-fields">
          <fieldset class="choice-group"><legend>${O.decision}</legend><div class="chips" id="answerChips" role="radiogroup" aria-label="${O.decision}"></div></fieldset>
          <fieldset class="choice-group"><legend>${O.date}</legend><div class="chips" id="dateChips" role="radiogroup" aria-label="${O.date}"></div></fieldset>
          <div class="doc-actions">
            <button id="btnStamp" class="btn btn-primary btn-stamp is-waiting" type="button" aria-disabled="true" aria-describedby="stampWait">${STAMP_ICON}<span class="btn-stamp-label">${O.stampBtn}</span></button>
            <p class="stamp-wait" id="stampWait">${O.stampWait}</p>
          </div>
        </div>
        <div class="doc-bottom">
          <p class="doc-foot">${D.footnote}</p>
          <div class="doc-seal" id="docSeal"><span class="doc-seal-label">${O.sealLabel}</span><div class="doc-stamp" id="docStamp" aria-hidden="true" hidden><span></span></div></div>
        </div>
      </div>`;
    $('dispatch').hidden = true;
    function chipGroup(host, options, key, pink) {
      host.innerHTML = '';
      options.forEach((opt) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip' + (pink ? ' chip-pink' : ''); b.textContent = opt;
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.addEventListener('click', async () => {
          if (state.busy) return;   // the stamp is coming down: hands off the form
          // the two "no" decisions: the clerk drops onto the button and guards it (he never gives in)
          if (key === 'answer' && options.indexOf(opt) > 0 && TA.decisionGag) {
            flash(b, 'shake', 400); tm('count', 'office.bouncer');
            const allowed = await TA.decisionGag(b); if (!allowed) return;
          }
          state[key] = opt; host.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-checked', String(c === b))); Sound.play('tap'); update();
          if (key === 'answer' && TA.officeDecision) TA.officeDecision(kindOf(opt));
        });
        host.appendChild(b);
      });
    }
    chipGroup($('answerChips'), E.answers, 'answer', true);
    chipGroup($('dateChips'), E.dateChoices, 'date', false);
    const letter = () => (ready() ? O.letter(kindOf(state.answer), E.dateChoices.indexOf(state.date), SECRET) : '');
    officeLetter = letter;
    function arm() {
      const b = $('btnStamp'); const was = !b.classList.contains('is-waiting'); const ok = ready();
      b.classList.toggle('is-waiting', !ok); b.setAttribute('aria-disabled', String(!ok)); $('stampWait').hidden = ok;
      if (ok && !was) { flash(b, 'just-ready', 650); Sound.play('pop'); }
    }
    function update() { $('letterPreview').textContent = letter(); $('copyStatus').textContent = ''; $('copyFallback').hidden = true; arm(); }
    // the moment of impact: the imprint is on the paper, the status line follows
    function applyStamp(kind) {
      state.stamped = kind;
      const st = $('docStamp'); st.querySelector('span').textContent = O.stamps[kind];
      st.className = `doc-stamp stamp-${kind}`; st.hidden = false; void st.offsetWidth; st.classList.add('inked');
      $('docStatus').textContent = D.status[kind];
      flash(doc.querySelector('.doc-inner'), 'thump', 320);
      $('btnStamp').querySelector('.btn-stamp-label').textContent = O.restampBtn;
    }
    $('btnStamp').addEventListener('click', async () => {
      const b = $('btnStamp');
      if (state.busy) return;
      if (!ready()) { flash(b, 'shake', 400); flash($('stampWait'), 'nudge', 520); Sound.play('nope'); $('srLive').textContent = O.stampWait; return; }
      state.busy = true; b.classList.add('is-busy');
      try {
        const kind = kindOf(state.answer); const seal = $('docSeal'), st = $('docStamp');
        st.hidden = true; st.classList.remove('inked');
        const r = seal.getBoundingClientRect();
        if (r.top < 64 || r.bottom > window.innerHeight - 24) { seal.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' }); await wait(REDUCED ? 0 : 480); }
        if (TA.officeStampAnim) await TA.officeStampAnim(seal, st, kind, () => applyStamp(kind));
        else { applyStamp(kind); Sound.play('stamp'); }
        // the real pigeon: her answer goes to the department while the drawn one flies (js/notify.js)
        let sending = null; try { if (TA.notify) sending = TA.notify.stamped({ kind, answer: state.answer, date: state.date }); } catch (e) { sending = null; }
        if (sending) sending.then((res) => { if (res) { const n = $('notifyNote'); n.textContent = O.notified; n.hidden = false; } }).catch(() => {});
        if (TA.officeDeliver) await TA.officeDeliver(seal, kind);
        const d = $('dispatch'); $('dispatchNote').textContent = O.dispatched[kind]; update();
        if (d.hidden) { d.hidden = false; d.classList.remove('arrive'); void d.offsetWidth; d.classList.add('arrive'); }
        await wait(80); d.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'nearest' });
      } finally { state.busy = false; b.classList.remove('is-busy'); }
    });
    update();
    if (officeWired) return;   // the copy buttons live outside the form: wire them once
    officeWired = true;
    $('btnCopy').addEventListener('click', async () => {
      const text = officeLetter();
      let ok = false;
      try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); ok = true; } } catch (e) { ok = false; }
      if (!ok) {
        try {
          const ta = $('copyFallback'); ta.hidden = false; ta.value = text; ta.focus(); ta.select();
          ok = document.execCommand && document.execCommand('copy');
        } catch (e) { ok = false; }
      }
      if (ok) { $('copyStatus').textContent = O.copied; $('copyFallback').hidden = true; Sound.play('chime'); tm('flag', 'copied'); }
      else { $('copyStatus').textContent = O.copyFail; const ta = $('copyFallback'); ta.hidden = false; ta.value = text; ta.focus(); ta.select(); }
    });
    $('btnByHand').addEventListener('click', () => { $('copyStatus').textContent = O.byHandNote; Sound.play('tap'); tm('flag', 'byHand'); });
  }

  // ---------------------------------------------------------- boot (called by scenes.js once the scenes exist)
  TA.boot = () => {
    const h = (location.hash || '').replace('#', '');
    if (ORDER.includes(h)) { go(h); return; }
    const saved = store.get(K_PROGRESS);
    if (saved === 'done') go('epilogue');
    else if (saved === 'office') go('office');
    else if (saved && /^[1-4]$/.test(saved)) go(['map', 'lane', 'stairs', 'rink'][Number(saved) - 1]);   // an older visit stored a number
    else if (saved && ORDER.includes(saved)) go(saved);
    else go('prologue');
  };
})();
