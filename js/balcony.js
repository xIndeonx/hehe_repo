/* ------------------------------------------------------------
   Interlude — operation: totally normal entrance
   A twenty-second flashback between the lane and the staircase:
   he forgets the door code in Geneva and settles on the balcony.
   One cancellable timeline (a generation counter; every step
   checks it), a camera that is just the viewBox, captions through
   ctx.caption, and a skip that lands on the same end state.
   ------------------------------------------------------------ */
(() => {
  'use strict';
  const TA = window.TA;
  const C = window.TA_CONTENT;
  const { svgEl, tween, wait, ease, spawnHearts, Doodle, flash, REDUCED } = TA.helpers;
  const Sound = TA.Sound; const Cat = TA.cat;

  TA.registerScene('balcony', (ctx) => {
    const CAP = C.balcony.captions;
    // one composition for both layouts; the wide one just shows more sky to the sides (same aspect kept for zooms)
    const LAY = {
      tall: { vb: [0, 0, 420, 470], W: 420, H: 470, catH: 84, ground: 440,
        bld: { x: 150, y: 70, w: 270 }, door: { x: 266, w: 76, h: 122 }, pad: { x: 228, y: 356, w: 26, h: 36 }, balc: { x: 236, y: 232, w: 150, h: 10, rail: 44 },
        startX: -60, standX: 170, pinkX: 318 },
      wide: { vb: [0, 0, 900, 470], W: 900, H: 470, catH: 84, ground: 440,
        bld: { x: 390, y: 70, w: 270 }, door: { x: 506, w: 76, h: 122 }, pad: { x: 468, y: 356, w: 26, h: 36 }, balc: { x: 476, y: 232, w: 150, h: 10, rail: 44 },
        startX: 120, standX: 410, pinkX: 558 },
    };
    const state = { done: false, running: false };
    let svg, layout, container, L, blue, pink, life = null, gen = 0, camRaf = null;

    const facade = () => {
      const B = L.bld, D = L.door, P = L.pad, K = L.balc; const g = L.ground; const doorY = g - D.h;
      return `
        ${Doodle.hills(L.W, g - 150, L.H)}
        ${Doodle.pine(B.x - 70, g, 110)}${Doodle.pine(B.x - 118, g - 60, 70, { ink: false, fill: '#dbe8f8' })}
        ${Doodle.lamp(B.x - 24, g, 118, 'b')}
        ${Doodle.house(B.x, g, 1, 'b')}
        <path d="M0 ${g} H${L.W}" stroke="#fff" stroke-width="10" opacity=".6"/>
        <path d="M${B.x - 150} ${g} q${(B.w + 160) / 2} 4 ${B.w + 160} 0" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round"/>
        ${Doodle.snowBush(B.x - 40, g, 0.7)}`;
    };

    function render() {
      const B = L.bld;
      const inner = `
        <defs>${Doodle.defs('b')}
          <radialGradient id="b-iris"><stop offset=".55" stop-color="#191717" stop-opacity="0"/><stop offset="1" stop-color="#191717" stop-opacity=".75"/></radialGradient>
        </defs>
        ${Doodle.sky(L.W, L.H, 'b', 24, 'dusk')}
        ${Doodle.snowfall(L.W, L.H, layout === 'wide' ? 14 : 10, 77)}
        ${facade()}
        <g class="cats"></g>
        <g class="fx"></g>
        <g class="tumbleweed" opacity="0"><circle r="12" fill="#f3e6cc" opacity=".8"/><circle r="12" fill="none" stroke="#b8935c" stroke-width="2.2" stroke-dasharray="4 3"/><circle r="7" fill="none" stroke="#b8935c" stroke-width="2" stroke-dasharray="3 3" transform="rotate(40)"/><path d="M-4 -2 l8 4 M-3 4 l6 -7" stroke="#b8935c" stroke-width="1.6" stroke-linecap="round"/></g>
        <rect class="memory-tint" x="0" y="0" width="${L.W}" height="${L.H}" rx="24" fill="#d9c3ea" opacity="0" pointer-events="none"/>
        <rect class="iris" x="-${L.W}" y="-${L.H}" width="${L.W * 3}" height="${L.H * 3}" fill="url(#b-iris)" opacity="0" pointer-events="none"/>`;
      container.innerHTML = ''; container.classList.add('caption-top');
      svg = svgEl('svg', { viewBox: L.vb.join(' '), role: 'group', 'aria-label': 'a flashback: a small Geneva building with a keypad by the door and a balcony above; the blue cat at the door, the pink cat on the balcony' });
      svg.innerHTML = inner; container.appendChild(svg);
      if (life) life();
      const host = svg.querySelector('.cats'); host.innerHTML = Cat.markup('blue', 'blue');
      svg.querySelector('.balcony-cats').innerHTML = Cat.markup('pink', 'pink');
      blue = Cat.attach(svg, 'blue', 'blue', L.catH); pink = Cat.attach(svg, 'pink', 'pink', L.catH * 0.92);
      blue.setExpression('proud'); pink.setExpression('calm'); life = Cat.life([blue, pink]);
      blue.faceDir(1); pink.faceDir(-1);
      pink.place(L.pinkX, L.balc.y - 2); pink.el.setAttribute('opacity', '0');
      if (state.done || REDUCED) endState(); else { blue.place(L.startX, L.ground); play(); }
    }
    // ---- camera: the viewBox, same aspect as the stage so nothing reflows
    function cam(x, y, w, dur) {
      const h = w * (L.vb[3] / L.vb[2]); const from = svg.getAttribute('viewBox').split(' ').map(Number);
      x = Math.max(0, Math.min(L.W - w, x)); y = Math.max(0, Math.min(L.H - h, y));   // never look past the edge of the stage
      if (dur === 0) { svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`); return Promise.resolve(); }
      return tween(dur, (t) => { const e = ease.inOut(t); svg.setAttribute('viewBox', `${(from[0] + (x - from[0]) * e).toFixed(1)} ${(from[1] + (y - from[1]) * e).toFixed(1)} ${(from[2] + (w - from[2]) * e).toFixed(1)} ${(from[3] + (h - from[3]) * e).toFixed(1)}`); });
    }
    const camHome = (dur) => cam(L.vb[0], L.vb[1], L.vb[2], dur);
    const lit = (color) => { const l = svg.querySelector('.pad-light'); l.setAttribute('fill', color); };
    async function pressKeys(n, gap) {
      const keys = [...svg.querySelectorAll('.key')];
      for (let i = 0; i < n; i++) {
        const k = keys[Math.floor(Math.random() * keys.length)]; k.setAttribute('fill', '#ffe08a'); Sound.play('key');
        await tween(110, (t) => { const b = Math.sin(Math.PI * t); blue.set({ raiseR: 1, bob: -1.5 * b, tilt: -2 * b }); });
        k.setAttribute('fill', '#fff'); await wait(gap);
      }
    }
    async function errorBeep() { lit('#ff8a8a'); Sound.play('buzz'); flash(svg.querySelector('.keypad'), 'shake', 380); await wait(520); lit('#cfd8e3'); }

    // ---- the timeline. `g` is this run's generation; any step after a skip returns early.
    async function play() {
      const g = ++gen; const alive = () => g === gen && svg.isConnected;
      const step = async (p) => { await p; if (!alive()) throw new Error('skipped'); };
      state.running = true;
      const fx = svg.querySelector('.fx'); const tint = svg.querySelector('.memory-tint'); const iris = svg.querySelector('.iris');
      try {
        // a memory: the picture goes a touch lavender and irises in
        tint.setAttribute('opacity', '0.18'); iris.setAttribute('opacity', '1');
        await step(tween(700, (t) => { iris.setAttribute('opacity', String(1 - ease.out(t))); }));
        // A. the confident arrival
        ctx.caption(CAP.arrive);
        const path = svgEl('path', { d: `M${L.startX} ${L.ground} L${L.standX} ${L.ground}`, fill: 'none', stroke: 'none' }); svg.appendChild(path);
        blue.setExpression('proud');
        await step(blue.walkAlong(path, 0, 1, 2300, { stepHz: 1.5 })); path.remove();
        await step(wait(200));
        await step(blue.lookAt(1, 220)); await step(blue.nod()); Sound.play('hmm');
        await step(wait(300));
        // he presses a few buttons, very sure of himself
        blue.setExpression('determined'); await step(pressKeys(4, 140));
        Sound.play('beepOk'); lit('#9fe3b0'); await step(wait(380));
        await step(errorBeep());
        blue.set({ raiseR: 0 }); blue.setExpression('calm'); await step(blue.blinkOnce()); await step(wait(500));
        // B. again, a little faster
        await step(pressKeys(5, 90)); await step(errorBeep()); blue.set({ raiseR: 0 });
        ctx.caption(CAP.problem);
        // the camera creeps in; he looks at the keypad, at us, at the keypad
        const zx = L.standX - 80, zy = L.ground + 22 - 260 * (L.vb[3] / L.vb[2]);
        const creep = cam(zx, zy, 260, 2400);
        await step(wait(500)); await step(blue.lookAt(1, 240)); await step(wait(500));
        blue.setExpression('surprised'); await step(blue.lookAtViewer(260)); await step(wait(700));
        await step(blue.lookAt(1, 240)); blue.setExpression('sheepish'); Sound.play('plink');
        const drop = blue.sweatDrop(2600);
        await step(creep);
        ctx.caption(CAP.forgot);
        // the awkward pause, with a tumbleweed
        const tw = svg.querySelector('.tumbleweed'); tw.setAttribute('opacity', '1'); Sound.play('tumble');
        await step(tween(1500, (t) => { const x = zx - 20 + 300 * t; tw.setAttribute('transform', `translate(${x.toFixed(1)} ${(L.ground - 11 - Math.abs(Math.sin(t * 9)) * 6).toFixed(1)}) rotate(${(t * 720).toFixed(0)})`); }));
        tw.setAttribute('opacity', '0');
        await step(drop);
        // C. the idea: he looks up, spots the balcony
        await step(camHome(900));
        blue.setExpression('surprised'); await step(Promise.all([blue.lookUp(1, 300), blue.tiltTo(-10, 300)])); Sound.play('plink');
        await step(wait(350)); await step(blue.perk());
        ctx.caption(CAP.plan);
        await step(wait(600));
        // dramatic: the music stings, the camera dives onto his face, the hard hat lands, a sparkle crosses his eyes
        Sound.play('sting');
        const fh = 170, fw = fh / (L.vb[3] / L.vb[2]);   // sized by height so the hat clears the caption on both layouts
        const fz = { x: L.standX + 16 - fw / 2, w: fw, y: L.ground + 10 - fh };
        await step(cam(fz.x, fz.y, fz.w, 700));
        blue.setExpression('determined'); await step(Promise.all([blue.gazeReset(200), blue.tiltTo(-6, 200)]));
        await step(blue.helmetOn());
        await step(wait(200));
        Sound.play('sparkle'); const eye = blue.pawPoint('r'); const star = svgEl('g', { transform: `translate(${(blue.s.x + 24 * blue.scale).toFixed(1)} ${(blue.s.y - 66 * blue.scale).toFixed(1)})` });
        star.innerHTML = `<g class="fx-star"><path d="M0 -10 v20 M-10 0 h20 M-6 -6 l12 12 M6 -6 l-12 12" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M0 -10 v20 M-10 0 h20" stroke="var(--heart)" stroke-width="1.6" stroke-linecap="round"/></g>`; fx.appendChild(star); setTimeout(() => star.remove(), 1000);
        iris.setAttribute('opacity', '0.6'); await step(wait(900)); iris.setAttribute('opacity', '0');
        // D. she appears on the balcony
        await step(camHome(800));
        pink.el.setAttribute('opacity', '1'); pink.setExpression('calm');
        const py = L.balc.y - 2; pink.place(L.pinkX, py + 60);
        await step(tween(520, (t) => { const e = ease.out(t); pink.set({ y: py + 60 * (1 - e) }); })); Sound.play('pop');
        await step(wait(300)); await step(pink.blinkOnce()); await step(wait(260));
        await step(pink.lookAtViewer(240)); ctx.caption(CAP.her); await step(wait(1100));
        await step(Promise.all([pink.lookAt(-1, 240), pink.lookDown(0.8, 240), pink.tiltTo(10, 240)]));
        await step(wait(700));
        pink.setExpression('pleased'); await step(pink.blinkOnce()); Sound.play('hmm');
        // he proudly presents his plan: arm up at the balcony, chin up
        blue.setExpression('proud'); blue.set({ raiseR: 1 }); await step(Promise.all([blue.lookUp(0.8, 240), blue.tiltTo(-8, 240)]));
        spawnHearts(fx, blue.s.x + 10, blue.s.y - L.catH - 6, 1, 10); Sound.play('meow');
        await step(wait(900));
        pink.setExpression('joy'); await step(pink.tiltTo(4, 220)); await step(wait(600));
        ctx.caption('');
        finish();
      } catch (e) { if (e && e.message !== 'skipped') throw e; }
    }
    // the end state everything lands on: he is below in his hat, arm up; she is on the balcony, amused
    function endState() {
      gen++;
      svg.setAttribute('viewBox', L.vb.join(' '));
      svg.querySelector('.memory-tint').setAttribute('opacity', '0.18'); svg.querySelector('.iris').setAttribute('opacity', '0'); svg.querySelector('.tumbleweed').setAttribute('opacity', '0');
      blue.swaying = false; blue.place(L.standX, L.ground); blue.setExpression('proud'); blue.set({ raiseR: 1, raiseL: 0, helmet: 1, helmetDrop: 0, sweat: 0, gazeY: -0.8, tilt: -8, lean: 0, sx: 1, sy: 1, bob: 0, earL: 0, earR: 0 }); blue.faceDir(1);
      pink.el.setAttribute('opacity', '1'); pink.place(L.pinkX, L.balc.y - 2); pink.setExpression('joy'); pink.set({ gazeY: 0.8, tilt: 6, lean: 0 }); pink.faceDir(-1); pink.lookAt(-1, 1);
      ctx.caption('');
      finish();
    }
    function finish() {
      if (state.done) return;
      state.done = true; state.running = false;
      Sound.play('chime');
      ctx.complete();
    }
    return {
      mount(c, l) { container = c; layout = l; L = LAY[l]; render(); },
      unmount() { gen++; if (life) life(); life = null; if (blue) blue.swaying = false; },
      skip() { if (state.done) return; endState(); },
    };
  });
})();
