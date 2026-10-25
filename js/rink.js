/* ------------------------------------------------------------
   Chapter 4 — one little spin to unlock it
   A tiny show venue: string lights, a soft crowd behind the
   boards, spotlights on the ice. The two cats perform four
   choreographed beats; a beat state machine (idle → busy → idle)
   keeps taps from overlapping. Portrait and landscape compositions
   share one coordinate space per layout.
   ------------------------------------------------------------ */
(() => {
  'use strict';
  const TA = window.TA;
  const C = window.TA_CONTENT;
  const { svgEl, tween, wait, ease, spawnHearts, Doodle, flash, REDUCED } = TA.helpers;
  const Sound = TA.Sound; const Cat = TA.cat;

  TA.registerScene('rink', (ctx) => {
    const LAY = {
      tall: { vb: '0 0 420 500', W: 420, H: 500, catH: 64, gap: 34,
        env: { cx: 210, cy: 70, w: 96, h: 64 }, rink: { cx: 210, cy: 330, rx: 194, ry: 132 },
        crowd: { x: 30, y: 124, w: 360, rows: 3, k: 1 }, lights: [[12, 14, 408, 14, 9, 14]],
        pts: { S: [176, 436], M1: [104, 332], M2: [214, 286], M3: [322, 356], HD: [210, 342] },
        heart: { cx: 210, cy: 334, w: 196, h: 114 },
        deco: [[40, 100, 'star', 15], [384, 94, 'flake', 17], [396, 476, 'star', 13], [24, 478, 'flake', 15]] },
      wide: { vb: '0 0 900 520', W: 900, H: 520, catH: 76, gap: 40,
        env: { cx: 450, cy: 66, w: 112, h: 74 }, rink: { cx: 450, cy: 330, rx: 310, ry: 150 },
        crowd: { x: 120, y: 112, w: 660, rows: 3, k: 1.1 }, lights: [[20, 14, 880, 14, 15, 18]],
        pts: { S: [322, 452], M1: [210, 318], M2: [450, 272], M3: [688, 350], HD: [450, 338] },
        heart: { cx: 450, cy: 334, w: 230, h: 132 },
        deco: [[70, 110, 'star', 18], [830, 96, 'flake', 20], [850, 490, 'star', 15], [60, 480, 'flake', 17]] },
    };
    const state = { beat: 0, phase: 'idle', done: false };
    let svg, layout, container, L, blue, pink, life = null, pendingLayout = null, segs = {}, spotRaf = null;

    function segmentD(name) {
      const P = L.pts; const [sx, sy] = P.S, [ax, ay] = P.M1, [bx, by] = P.M2, [cx, cy] = P.M3, [hx, hy] = P.HD;
      if (name === 's1') return `M${sx} ${sy} C ${sx - 60} ${sy - 10}, ${ax - 30} ${ay + 50}, ${ax} ${ay}`;
      if (name === 's2') return `M${ax} ${ay} C ${ax + 10} ${ay - 70}, ${bx - 70} ${by - 10}, ${bx} ${by}`;
      if (name === 's3') return `M${bx} ${by} C ${bx + 70} ${by - 10}, ${cx - 10} ${cy - 70}, ${cx} ${cy}`;
      if (name === 's4') return `M${cx} ${cy} C ${cx - 20} ${cy - 40}, ${hx + 50} ${hy - 20}, ${hx} ${hy}`;
      return '';
    }
    function heartD() {
      const { cx, cy, w, h } = L.heart; const a = w / 2, b = h;
      return `M${cx} ${cy} C ${cx - a * 0.35} ${cy - b * 0.32}, ${cx - a} ${cy - b * 0.1}, ${cx - a} ${cy + b * 0.22} C ${cx - a} ${cy + b * 0.58}, ${cx - a * 0.45} ${cy + b * 0.8}, ${cx} ${cy + b} C ${cx + a * 0.45} ${cy + b * 0.8}, ${cx + a} ${cy + b * 0.58}, ${cx + a} ${cy + b * 0.22} C ${cx + a} ${cy - b * 0.1}, ${cx + a * 0.35} ${cy - b * 0.32}, ${cx} ${cy}`;
    }
    const markerPts = () => [L.pts.M1, L.pts.M2, L.pts.M3, L.pts.HD];
    // a plump five-point star with the tips rounded by its own stroke
    function softStar(R) {
      const r = R * 0.56; let d = '';
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (rr * Math.cos(a)).toFixed(2) + ' ' + (rr * Math.sin(a)).toFixed(2) + ' '; }
      return d + 'Z';
    }

    function render() {
      const R = L.rink; const E = L.env; const wide = layout === 'wide';
      const deco = L.deco.map(([x, y, kind, s]) => kind === 'star'
        ? `<g transform="translate(${x} ${y})"><g class="bulb" style="--d:${(x % 7) / 5}s">${Doodle.star(0, 0, s)}</g></g>`
        : `<g transform="translate(${x} ${y})"><g class="bulb" style="--d:${(y % 9) / 4}s"><path d="M0 -${s / 2} v${s} M-${s / 2} 0 h${s} M-${s * 0.36} -${s * 0.36} l${s * 0.72} ${s * 0.72} M${s * 0.36} -${s * 0.36} l-${s * 0.72} ${s * 0.72}" stroke="var(--blue-deep)" stroke-width="2.2" stroke-linecap="round" fill="none"/></g></g>`).join('');
      const skateLines = `<g fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85">
          <path d="M${R.cx - R.rx * 0.6} ${R.cy + R.ry * 0.42} q ${R.rx * 0.3} -${R.ry * 0.28} ${R.rx * 0.72} -${R.ry * 0.06}"/>
          <path d="M${R.cx + R.rx * 0.18} ${R.cy - R.ry * 0.5} q ${R.rx * 0.22} ${R.ry * 0.14} ${R.rx * 0.48} -${R.ry * 0.04}"/>
          <path d="M${R.cx - R.rx * 0.74} ${R.cy - R.ry * 0.08} q ${R.rx * 0.14} ${R.ry * 0.22} ${R.rx * 0.34} ${R.ry * 0.1}"/>
          <path d="M${R.cx + R.rx * 0.4} ${R.cy + R.ry * 0.6} q ${R.rx * 0.16} -${R.ry * 0.16} ${R.rx * 0.36} -${R.ry * 0.02}"/>
        </g>`;
      const inner = `
        <defs>${Doodle.defs('r')}
          <radialGradient id="r-heartglow"><stop offset="0" stop-color="#f49fbb" stop-opacity=".55"/><stop offset="1" stop-color="#f49fbb" stop-opacity="0"/></radialGradient>
          <linearGradient id="r-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></linearGradient>
        </defs>
        ${Doodle.sky(L.W, L.H, 'r', 24, 'dusk')}
        <path d="M${L.W * 0.1} 0 L${R.cx - R.rx * 0.2} ${R.cy} L${R.cx + R.rx * 0.2} ${R.cy} L${L.W * 0.26} 0 Z" fill="url(#r-beam)" class="beam"/>
        <path d="M${L.W * 0.9} 0 L${R.cx + R.rx * 0.2} ${R.cy} L${R.cx - R.rx * 0.2} ${R.cy} L${L.W * 0.74} 0 Z" fill="url(#r-beam)" class="beam beam-2"/>
        ${deco}
        ${Doodle.audience(L.crowd.x, L.crowd.y, L.crowd.w, L.crowd.rows, 9, L.crowd.k)}
        ${Doodle.boards(R.cx, R.cy, R.rx, R.ry, 194, 346, wide ? 14 : 12)}
        <text x="${R.cx}" y="${R.cy - R.ry - (wide ? 3 : 2)}" text-anchor="middle" font-size="${wide ? 13 : 11}" fill="#c8688a" opacity=".9">♡ art on ice ♡</text>
        <ellipse cx="${R.cx}" cy="${R.cy + 9}" rx="${R.rx}" ry="${R.ry}" fill="#c9dcf2"/>
        <ellipse cx="${R.cx}" cy="${R.cy}" rx="${R.rx}" ry="${R.ry}" fill="url(#r-ice)" stroke="var(--ink)" stroke-width="3.2"/>
        <ellipse cx="${R.cx}" cy="${R.cy}" rx="${R.rx * 0.9}" ry="${R.ry * 0.86}" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>
        <ellipse class="ice-shimmer" cx="${R.cx - R.rx * 0.22}" cy="${R.cy - R.ry * 0.28}" rx="${R.rx * 0.5}" ry="${R.ry * 0.36}" fill="#fff" opacity=".35"/>
        ${skateLines}
        ${Doodle.spotlight(R.cx, R.cy + R.ry * 0.2, R.rx * 0.62, R.ry * 0.5, 'r', 'spot')}
        <ellipse class="spot-follow" cx="${L.pts.S[0]}" cy="${L.pts.S[1] - 6}" rx="${L.catH * 1.25}" ry="${L.catH * 0.38}" fill="url(#r-spot)"/>
        <g class="route-dots" fill="none" stroke="var(--blue-deep)" stroke-width="2.4" stroke-dasharray="1 9" stroke-linecap="round" opacity=".45">${['s1', 's2', 's3', 's4'].map((n) => `<path d="${segmentD(n)}"/>`).join('')}</g>
        <g class="trails">${['s1', 's2', 's3', 's4'].map((n) => `<path class="trail" data-seg="${n}" d="${segmentD(n)}" fill="none" stroke="var(--heart)" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 100000" opacity=".9"/>`).join('')}
          <circle class="heart-glow" cx="${L.heart.cx}" cy="${L.heart.cy + L.heart.h * 0.45}" r="${L.heart.w * 0.7}" fill="url(#r-heartglow)" opacity="0"/>
          <path class="trail heart-trail" data-seg="heart" d="${heartD()}" fill="none" stroke="var(--heart)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0 100000" opacity=".95"/>
        </g>
        <g class="swirl"></g>
        <g class="markers"></g>
        <g class="cats"></g>
        <g class="fx"></g>
        ${L.lights.map((a) => Doodle.lights(...a)).join('')}
        <g class="env-wrap" transform="translate(${E.cx} ${E.cy})"><g class="env-hover hover">
          <ellipse class="env-halo glow" rx="${E.w * 0.95}" ry="${E.h * 0.95}" fill="url(#r-glow)"/>
          <g class="lock-envelope">
            <rect x="${-E.w / 2 + 3}" y="${-E.h / 2 + 4}" width="${E.w}" height="${E.h}" rx="${E.h * 0.12}" fill="var(--ink)" opacity=".08"/>
            <rect x="${-E.w / 2}" y="${-E.h / 2}" width="${E.w}" height="${E.h}" rx="${E.h * 0.12}" fill="url(#r-paper)" stroke="var(--ink)" stroke-width="3"/>
            <g class="env-flap-c" style="transform-origin: 0px ${-E.h / 2}px; transform-box: view-box"><path d="M${-E.w / 2 + 1} ${-E.h / 2 + 1} L0 ${E.h * 0.12} L${E.w / 2 - 1} ${-E.h / 2 + 1} Z" fill="var(--pink)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/></g>
            <g class="ice-lock has-fxi" transform="translate(0 ${E.h * 0.1})"><g class="fxi">
              <g class="lock-shackle"><path d="M-8 2 v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round"/><path d="M-8 2 v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke="#dcebfb" stroke-width="1.2" stroke-linecap="round"/></g>
              <rect x="-13" y="1" width="26" height="22" rx="5" fill="var(--rink)" stroke="var(--ink)" stroke-width="2.6"/>
              <rect x="-10" y="4" width="8" height="5" rx="2.5" fill="#fff" opacity=".7"/>
              <path d="M0 17.5 C -3.6 15, -6.2 12.6, -5.8 10 C -5.5 8, -3.6 7.2, -2.3 8.1 C -1.4 8.7, -0.6 9.5, 0 10.3 C 0.6 9.5, 1.4 8.7, 2.3 8.1 C 3.6 7.2, 5.5 8, 5.8 10 C 6.2 12.6, 3.6 15, 0 17.5 Z" fill="var(--heart)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/>
            </g></g>
          </g>
          <g class="env-sparkle" opacity="0"><path d="M${E.w * 0.62} ${-E.h * 0.55} v10 M${E.w * 0.62 - 5} ${-E.h * 0.55 + 5} h10" stroke="var(--heart)" stroke-width="2.4" stroke-linecap="round"/></g>
        </g></g>`;
      container.innerHTML = '';
      svg = svgEl('svg', { viewBox: L.vb, role: 'group', 'aria-label': 'a little ice show: string lights, a soft crowd behind the boards, the two cats on the ice with four glowing beats along the skating route; a sealed envelope with a little padlock floats above' });
      svg.innerHTML = inner; container.appendChild(svg);
      if (life) life();
      const host = svg.querySelector('.cats'); host.innerHTML = Cat.markup('blue', 'blue') + Cat.markup('pink', 'pink');
      blue = Cat.attach(svg, 'blue', 'blue', L.catH); pink = Cat.attach(svg, 'pink', 'pink', L.catH);
      blue.setExpression('shy'); pink.setExpression('calm'); blue.set({ skates: 1 }); pink.set({ skates: 1 }); life = Cat.life([blue, pink]);
      segs = {}; svg.querySelectorAll('.trail').forEach((t) => { segs[t.dataset.seg] = { el: t, len: t.getTotalLength() }; });
      const mk = svg.querySelector('.markers'); const s = layout === 'wide' ? 54 : 50;
      markerPts().forEach(([x, y], i) => {
        const g = svgEl('g', { class: 'beat has-fxi', 'data-i': i, role: 'button', tabindex: '0', 'aria-label': `beat ${i + 1}` });
        g.setAttribute('transform', `translate(${x} ${y - 4})`);
        g.innerHTML = `<g class="fxi"><circle class="hit" r="${s * 0.86}" fill="transparent"/><circle class="beat-halo" r="${s * 0.72}" fill="url(#r-glow)" opacity="0"/>
          <circle class="beat-ripple" r="${s * 0.42}" fill="none" stroke="var(--heart)" stroke-width="2.4" opacity="0"/>
          <ellipse class="beat-shadow" cx="2" cy="${s * 0.46}" rx="${s * 0.34}" ry="${s * 0.08}" fill="var(--ink)" opacity=".08"/>
          <g class="beat-star"><path class="beat-shape" d="${softStar(s * 0.46)}" fill="var(--butter)" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round"/><text class="beat-num ui-text" x="0" y="${s * 0.11}" text-anchor="middle" font-size="${s * 0.3}" fill="var(--ink)">${i + 1}</text></g>
          <g class="beat-done" opacity="0">${Doodle.heart(0, 0, s * 0.52, 'class="glow"')}</g>
          <circle class="focus-ring" r="${s * 0.72}"/></g>`;
        mk.appendChild(g);
        g.addEventListener('click', (e) => { e.preventDefault(); tapBeat(i); });
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapBeat(i); } });
      });
      applyState();
      // the spotlight pool follows the pair
      const spot = svg.querySelector('.spot-follow');
      if (spotRaf) cancelAnimationFrame(spotRaf);
      const follow = () => { if (!svg.isConnected) return; const c = pairCenter(); spot.setAttribute('cx', c.x.toFixed(1)); spot.setAttribute('cy', (c.y - 6).toFixed(1)); spotRaf = requestAnimationFrame(follow); };
      if (!REDUCED) spotRaf = requestAnimationFrame(follow); else { const c = pairCenter(); spot.setAttribute('cx', c.x); spot.setAttribute('cy', c.y - 6); }
    }
    function applyState() {
      const anchors = [L.pts.S, L.pts.M1, L.pts.M2, L.pts.M3, L.pts.HD];
      const [px, py] = state.done ? [L.heart.cx, L.heart.cy + L.heart.h * 0.45] : anchors[state.beat];
      placePair(px, py);
      ['s1', 's2', 's3', 's4'].forEach((n, i) => { segs[n].el.setAttribute('stroke-dasharray', `${i < state.beat ? segs[n].len : 0} 100000`); });
      segs.heart.el.setAttribute('stroke-dasharray', `${state.done ? segs.heart.len : 0} 100000`);
      if (state.done) {
        svg.querySelector('.heart-glow').setAttribute('opacity', '1');
        const env = svg.querySelector('.env-wrap'); env.querySelector('.env-hover').classList.remove('hover');
        env.setAttribute('transform', `translate(${px} ${py - L.catH - L.env.h * 0.75})`);
        svg.querySelector('.ice-lock').setAttribute('opacity', '0'); svg.querySelector('.env-flap-c').style.transform = 'scaleY(0.88)'; svg.querySelector('.env-halo').setAttribute('opacity', '1');
        blue.setExpression('affectionate'); pink.setExpression('affectionate'); blue.set({ lean: 5 }); pink.set({ lean: -5 });
        svg.querySelector('.audience').classList.add('cheer');
      }
      updateBeats();
    }
    function placePair(cx, cy) { blue.place(cx - L.gap, cy); pink.place(cx + L.gap, cy); blue.faceDir(1); pink.faceDir(-1); }
    const pairCenter = () => ({ x: (blue.s.x + pink.s.x) / 2, y: Math.max(blue.s.y + blue.s.air, pink.s.y + pink.s.air) });
    function updateBeats() {
      svg.querySelectorAll('.beat').forEach((b, i) => {
        const done = i < state.beat || state.done, next = i === state.beat && !state.done;
        b.classList.toggle('done', done); b.classList.toggle('next', next); b.classList.toggle('future', !done && !next);
        b.setAttribute('aria-disabled', String(!next));
        b.querySelector('.beat-done').setAttribute('opacity', done ? '1' : '0'); b.querySelector('.beat-star').setAttribute('opacity', done ? '0' : '1'); b.querySelector('.beat-halo').setAttribute('opacity', next ? '1' : '0');
      });
      ctx.progress(`${Math.min(state.beat, 4)} / 4 beats`);
    }
    // both cats skate a segment side by side; the trail draws under them; a tiny push-off first, a settle after
    async function glide(segName, dur) {
      const seg = segs[segName];
      await Promise.all([blue.crouch(0.07, 200), pink.crouch(0.07, 200)]);
      TA.Sound.play('glide');
      await Promise.all([
        blue.glideAlong(seg.el, 0, 1, dur, { offsetX: -L.gap, face: 1, onFrame: (d) => seg.el.setAttribute('stroke-dasharray', `${d} 100000`) }),
        pink.glideAlong(seg.el, 0, 1, dur, { offsetX: L.gap, face: 1 }),
      ]);
      blue.faceDir(1); pink.faceDir(-1);
    }
    function sparkles(x, y, n = 5, spread = 40) {
      const fx = svg.querySelector('.fx');
      for (let i = 0; i < n; i++) {
        const sx = x + (Math.random() - 0.5) * spread, sy = y + (Math.random() - 0.5) * spread * 0.5;
        const g = svgEl('g', { transform: `translate(${sx.toFixed(1)} ${sy.toFixed(1)})` });
        g.innerHTML = `<g class="fx-star" style="animation-delay:${i * 60}ms"><path d="M0 -7 v14 M-7 0 h14" stroke="${i % 2 ? '#f49fbb' : '#8fbdf0'}" stroke-width="2.4" stroke-linecap="round"/></g>`;
        fx.appendChild(g); setTimeout(() => g.remove(), 1100);
      }
    }
    // a ring of little dots left on the ice by a pirouette
    function swirl(x, y, r) {
      const host = svg.querySelector('.swirl'); const g = svgEl('g', { class: 'swirl-ring' });
      let d = ''; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; d += `M${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r * 0.42).toFixed(1)} h0.1 `; }
      g.innerHTML = `<path d="${d}" stroke="var(--heart)" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>`;
      host.appendChild(g); setTimeout(() => { g.style.transition = 'opacity 900ms ease'; g.style.opacity = '0'; setTimeout(() => g.remove(), 950); }, 2600);
    }
    function cheer(ms = 2600) { const a = svg.querySelector('.audience'); a.classList.add('cheer'); setTimeout(() => { if (!state.done) a.classList.remove('cheer'); }, ms); }

    // ---------------------------------------------------------- the four beats
    async function beat1() {
      // look, blink, lean in, paws meet, crouch, glide
      await blue.lookAt(1, 260); await wait(160);
      pink.setExpression('pleased'); await pink.blinkOnce(); await wait(100);
      const bx0 = blue.s.x, px0 = pink.s.x;
      await Promise.all([blue.leanTo(5), pink.leanTo(-5), tween(320, (t) => { const e = ease.out(t); blue.set({ x: bx0 + 6 * e }); pink.set({ x: px0 - 6 * e }); })]);
      blue.set({ raiseR: 1 }); pink.set({ raiseR: 1 }); Sound.play('meow');
      spawnHearts(svg.querySelector('.fx'), pairCenter().x, blue.s.y - L.catH * 0.95, 1, 10);
      await wait(380);
      blue.set({ raiseR: 0 }); pink.set({ raiseR: 0 }); await blue.lookAt(0, 200);
      await Promise.all([blue.leanTo(0, 240), pink.leanTo(0, 240)]);
      blue.setExpression('excited');
      await glide('s1', 1500);
      blue.setExpression('shy');
    }
    async function beat2() {
      // pink's pirouette: a wind-up lean, two turns with paws up, a ring on the ice; blue claps; sparkles; glide
      await pink.leanTo(-9, 260); await wait(80); await pink.leanTo(0, 200);
      Sound.play('chime');
      swirl(pink.s.x, pink.s.y - 2, L.catH * 0.38);
      const spin = pink.pirouette(1250, 2);
      await wait(260);
      blue.setExpression('joy'); cheer(2200);
      await blue.clap(3); sparkles(pink.s.x, pink.s.y - L.catH * 0.7, 6, 70);
      await spin; await wait(160);
      pink.setExpression('delighted'); await pink.blinkOnce(); await pink.bounce(8, 320);
      await glide('s2', 1400);
      blue.setExpression('shy'); pink.setExpression('calm');
    }
    async function beat3() {
      // the synchronised hop: a deep crouch, a spring with a midair turn, a heart at the top, a soft landing, glide
      await Promise.all([blue.crouch(0.14, 320), pink.crouch(0.14, 320)]); await wait(110);
      const bx = blue.s.x, px = pink.s.x, y = blue.s.y;
      setTimeout(() => spawnHearts(svg.querySelector('.fx'), pairCenter().x, y - L.catH * 1.7, 1, 8), 330);
      await Promise.all([blue.hopTo(bx, y, { height: L.catH * 0.8, dur: 820, turn: true }), pink.hopTo(px, y, { height: L.catH * 0.8, dur: 820, turn: true })]);
      blue.faceDir(1); pink.faceDir(-1);
      sparkles(pairCenter().x, y - 6, 7, 110); cheer(2000);
      blue.setExpression('delighted'); pink.setExpression('delighted');
      spawnHearts(svg.querySelector('.fx'), pairCenter().x, y - L.catH, 2, 30); Sound.play('chime');
      await Promise.all([blue.nod(), pink.nod()]); await wait(260);
      await glide('s3', 1300);
      blue.setExpression('shy'); pink.setExpression('calm');
    }
    async function beat4() {
      // the finale: a glance, glide to the centre, the heart drawn together, a nuzzle, hearts, the envelope floats down and opens
      await Promise.all([blue.lookAt(1, 240), pink.lookAt(-1, 240)]); await wait(260);
      await Promise.all([blue.lookAt(0, 200), pink.lookAt(0, 200)]);
      await glide('s4', 1100);
      state.beat = 4; updateBeats();
      blue.setExpression('excited'); pink.setExpression('pleased');
      const seg = segs.heart; Sound.play('glide');
      const fx = svg.querySelector('.fx'); let lastHeart = 0;
      await Promise.all([
        blue.glideAlong(seg.el, 0, 1, 3800, { offsetX: -L.gap * 0.7, onFrame: (d, p, t) => { seg.el.setAttribute('stroke-dasharray', `${d} 100000`); if (t - lastHeart > 0.24) { lastHeart = t; spawnHearts(fx, p.x, p.y - L.catH * 0.9, 1, 20); } } }),
        pink.glideAlong(seg.el, 0, 1, 3800, { offsetX: L.gap * 0.7 }),
      ]);
      const glow = svg.querySelector('.heart-glow');
      await tween(500, (t) => { glow.setAttribute('opacity', String(ease.out(t))); }); Sound.play('chime');
      svg.querySelector('.audience').classList.add('cheer');
      const hc = { x: L.heart.cx, y: L.heart.cy + L.heart.h * 0.45 };
      const b0 = { x: blue.s.x, y: blue.s.y }, p0 = { x: pink.s.x, y: pink.s.y };
      await tween(700, (t) => { const e = ease.inOut(t); blue.set({ x: b0.x + (hc.x - L.gap - b0.x) * e, y: b0.y + (hc.y - b0.y) * e }); pink.set({ x: p0.x + (hc.x + L.gap - p0.x) * e, y: p0.y + (hc.y - p0.y) * e }); });
      blue.faceDir(1); pink.faceDir(-1);
      blue.setExpression('affectionate'); pink.setExpression('affectionate');
      await Promise.all([blue.nuzzle(1, 420), pink.nuzzle(-1, 420)]);
      Sound.play('meow'); spawnHearts(fx, hc.x, hc.y - L.catH, 4, 50);
      await wait(700);
      await Promise.all([blue.leanTo(3, 400), pink.leanTo(-3, 400)]);
      const env = svg.querySelector('.env-wrap'); env.querySelector('.env-hover').classList.remove('hover');
      const halo0 = env.querySelector('.env-halo');
      await tween(500, (t) => { halo0.setAttribute('opacity', String(0.6 + 0.4 * Math.sin(Math.PI * t))); });
      const e0 = { x: L.env.cx, y: L.env.cy }, e1 = { x: hc.x, y: hc.y - L.catH - L.env.h * 0.75 };
      Sound.play('descend');
      await Promise.all([blue.lookAt(0.6, 300), pink.lookAt(-0.6, 300), tween(1500, (t) => { const e = ease.inOut(t); env.setAttribute('transform', `translate(${(e0.x + (e1.x - e0.x) * e).toFixed(1)} ${(e0.y + (e1.y - e0.y) * e + 6 * Math.sin(Math.PI * t)).toFixed(1)}) rotate(${(4 * Math.sin(2 * Math.PI * t)).toFixed(2)})`); })]);
      blue.setExpression('surprised'); pink.setExpression('surprised'); await wait(240);
      const lock = svg.querySelector('.ice-lock'); flash(lock, 'shake', 380); await wait(420);
      // click: the shackle springs up, then the little lock drops off the flap and melts away
      Sound.play('unlock'); const shackle = lock.querySelector('.lock-shackle');
      await tween(220, (t) => { shackle.setAttribute('transform', `translate(0 ${(-6 * ease.out(t)).toFixed(2)}) rotate(${(-18 * ease.out(t)).toFixed(2)} 8 2)`); });
      await wait(160);
      await tween(620, (t) => { const e = ease.in(t); lock.setAttribute('transform', `translate(${(10 * t).toFixed(1)} ${(L.env.h * 0.1 + 42 * e).toFixed(1)}) rotate(${(28 * t).toFixed(1)})`); lock.setAttribute('opacity', String(1 - Math.max(0, (t - 0.5) * 2))); });
      lock.setAttribute('opacity', '0');
      // the envelope stays sealed: the flap lifts a crack with light behind it; she opens it in the next chapter
      const flap = svg.querySelector('.env-flap-c'); flap.style.transition = 'transform 520ms ease-out'; flap.style.transform = 'scaleY(0.88)';
      const halo = env.querySelector('.env-halo'); halo.classList.add('glow'); halo.setAttribute('opacity', '1');
      sparkles(e1.x, e1.y, 9, 130); Sound.play('flourish');
      blue.setExpression('joy'); pink.setExpression('joy');
      await Promise.all([blue.bounce(14, 480), (async () => { await wait(90); await pink.bounce(14, 480); })()]);
      await Promise.all([blue.lookAt(0, 200), pink.lookAt(0, 200)]);
      blue.setExpression('affectionate'); pink.setExpression('affectionate');
      spawnHearts(fx, hc.x, hc.y - L.catH * 1.1, 3, 60);
      await wait(600);
    }

    async function tapBeat(i) {
      if (state.done || state.phase !== 'idle') return;
      if (i !== state.beat) { flash(svg.querySelector(`.beat[data-i="${i}"]`), 'shake', 400); Sound.play('nope'); ctx.announce(`beat ${state.beat + 1} first`); return; }
      state.phase = 'busy';
      const b = svg.querySelector(`.beat[data-i="${i}"]`); flash(b, 'pop-in', 420); Sound.play('tap'); ctx.announce(`beat ${i + 1}`);
      try {
        if (REDUCED) await reducedBeat(i);
        else if (i === 0) await beat1(); else if (i === 1) await beat2(); else if (i === 2) await beat3(); else await beat4();
      } finally {
        state.beat = i + 1; if (state.beat === 4) state.done = true;
        state.phase = 'idle'; updateBeats();
        if (pendingLayout) { const l = pendingLayout; pendingLayout = null; mount(container, l); }
      }
      if (state.done) ctx.complete();
    }
    async function reducedBeat(i) {
      const seg = ['s1', 's2', 's3', 's4'][i]; segs[seg].el.setAttribute('stroke-dasharray', `${segs[seg].len} 100000`);
      const end = segs[seg].el.getPointAtLength(segs[seg].len); placePair(end.x, end.y);
      if (i === 3) { segs.heart.el.setAttribute('stroke-dasharray', `${segs.heart.len} 100000`); state.beat = 4; state.done = true; applyState(); }
      await wait(200);
    }
    function mount(c, l) { container = c; layout = l; L = LAY[l]; if (state.phase !== 'idle') { pendingLayout = l; return; } render(); }
    return {
      mount,
      unmount() { if (life) life(); life = null; if (spotRaf) cancelAnimationFrame(spotRaf); spotRaf = null; },
      hint() { const b = svg && svg.querySelector('.beat.next'); if (!b) return; flash(b, 'wiggle', 600); Sound.play('tap'); ctx.announce(`tap beat ${state.beat + 1}`); },
      async skip() { if (state.done || state.phase !== 'idle') return; state.phase = 'busy'; state.beat = 4; state.done = true; applyState(); state.phase = 'idle'; ctx.complete(); },
    };
  });
  TA.boot();
})();
