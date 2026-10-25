/* ------------------------------------------------------------
   a tiny adventure — the paperwork (the last view)
   The counter of the Department of Extremely Important Romantic
   Affairs: the blue cat is the clerk, a carrier pigeon waits at
   the end of the counter. The form below the drawing is her reply
   (app.js builds it); this scene reacts to her decision, drops the
   clerk onto a "no" button (the bouncer), and sends the pigeon
   off with the letter once the stamp has come down.
   ------------------------------------------------------------ */
(() => {
  'use strict';
  const TA = window.TA; const C = window.TA_CONTENT;
  const { svgEl, tween, wait, ease, spawnHearts, Doodle, flash, REDUCED } = TA.helpers;
  const Sound = TA.Sound; const Cat = TA.cat;

  TA.registerScene('office', (ctx) => {
    const LAY = {
      tall: { vb: [0, 0, 420, 300], W: 420, H: 300, catH: 112, counter: { y: 204, h: 80 }, clerkX: 150, pigeonX: 356, sign: { x: 190, y: 46, w: 224, fs: 8.6 }, crest: { x: 56, y: 70 }, window: { x: 18, y: 100, w: 64, h: 70 } },
      wide: { vb: [0, 0, 900, 300], W: 900, H: 300, catH: 126, counter: { y: 204, h: 80 }, clerkX: 400, pigeonX: 650, sign: { x: 470, y: 40, w: 330, fs: 12.5 }, crest: { x: 300, y: 72 }, window: { x: 130, y: 86, w: 96, h: 92 } },
    };
    let svg, layout, container, L, blue, life = null, overlay = null, gagCount = 0, gagGen = 0, gagBusy = false, pigeonBusy = false;
    let blueHome = { x: 0, y: 0 };

    const pigeonMarkup = () => `
      <g class="pigeon">
        ${Doodle.softShadow(0, 2, 18, 4, 0.1)}
        <g class="pigeon-body">
          <path class="pigeon-legs" d="M-5 -3 v5 M5 -3 v5" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>
          <ellipse cx="2" cy="-15" rx="17" ry="12.5" fill="#dfe4ec" stroke="var(--ink)" stroke-width="2.6"/>
          <path d="M-6 -4 q-8 -2 -14 -8" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/>
          <g class="pigeon-wing"><path d="M4 -20 q14 -4 18 6 q-10 6 -20 0 z" fill="#c7cfdb" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/></g>
          <circle cx="-12" cy="-27" r="8.5" fill="#dfe4ec" stroke="var(--ink)" stroke-width="2.6"/>
          <path d="M-20 -28 l-7 2.5 l7 2.5 z" fill="#f5b25c" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/>
          <circle cx="-14" cy="-29" r="1.7" fill="var(--ink)"/>
          <path d="M-9 -34 q3 -3 5 0" fill="none" stroke="#a9b3c2" stroke-width="2" stroke-linecap="round"/>
          <g class="pigeon-letter" opacity="0">${Doodle.envelope(-36, -32, 22, 15, 1.8)}</g>
        </g>
      </g>`;

    function render() {
      const W = L.W, H = L.H, Kt = L.counter.y, wide = layout === 'wide';
      const S = L.sign, Cr = L.crest, Wn = L.window;
      const inner = `
        <defs>${Doodle.defs('o')}</defs>
        <rect x="0" y="0" width="${W}" height="${H}" rx="24" fill="#fbf4ea"/>
        <rect x="0" y="${Kt + 34}" width="${W}" height="${H - Kt - 34}" rx="24" fill="#efe2cf"/>
        <path d="M0 ${Kt + 34} h${W}" stroke="#d9c5a6" stroke-width="2.4"/>
        <g stroke="#f1e6d6" stroke-width="2">${[0.22, 0.44, 0.66].map((t) => `<path d="M12 ${(Kt + 34) * t} h${W - 24}"/>`).join('')}</g>
        <!-- a window with the snowy street -->
        <g class="office-window">
          <rect x="${Wn.x}" y="${Wn.y}" width="${Wn.w}" height="${Wn.h}" rx="6" fill="url(#o-ice)" stroke="var(--ink)" stroke-width="2.8"/>
          <path d="M${Wn.x + 4} ${Wn.y + Wn.h * 0.62} q${Wn.w * 0.25} -10 ${Wn.w * 0.5} 0 t${Wn.w * 0.5 - 8} 0 v${Wn.h * 0.38 - 4} h-${Wn.w - 8} z" fill="#fff" opacity=".9"/>
          <path d="M${Wn.x + Wn.w / 2} ${Wn.y + 2} v${Wn.h - 4} M${Wn.x + 2} ${Wn.y + Wn.h / 2} h${Wn.w - 4}" stroke="var(--ink)" stroke-width="1.8" opacity=".35"/>
          <g transform="translate(${Wn.x} ${Wn.y})"><clipPath id="o-win"><rect x="0" y="0" width="${Wn.w}" height="${Wn.h}" rx="6"/></clipPath><g clip-path="url(#o-win)">${Doodle.snowfall(Wn.w, Wn.h, 4, 9)}</g></g>
          <rect x="${Wn.x - 5}" y="${Wn.y + Wn.h - 1}" width="${Wn.w + 10}" height="6" rx="2" fill="#fff" stroke="var(--ink)" stroke-width="2"/>
        </g>
        <!-- the department's plaque and its crest -->
        <g class="office-sign">
          <rect x="${S.x}" y="${S.y}" width="${S.w}" height="54" rx="8" fill="#fff" stroke="var(--ink)" stroke-width="2.8"/>
          <rect x="${S.x + 6}" y="${S.y + 6}" width="${S.w - 12}" height="42" rx="5" fill="none" stroke="var(--heart)" stroke-width="1.6" stroke-dasharray="3 3" opacity=".8"/>
          <text class="ui-text" x="${S.x + S.w / 2}" y="${S.y + 24}" text-anchor="middle" font-size="${S.fs}" letter-spacing="1.2" fill="var(--ink-soft)">DEPARTMENT OF</text>
          <text class="ui-text" x="${S.x + S.w / 2}" y="${S.y + 42}" text-anchor="middle" font-size="${S.fs}" letter-spacing="1" fill="var(--ink)">EXTREMELY IMPORTANT ROMANTIC AFFAIRS</text>
          <path d="M${S.x + S.w / 2 - 30} ${S.y} v-12 M${S.x + S.w / 2 + 30} ${S.y} v-12" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g class="office-crest" transform="translate(${Cr.x} ${Cr.y})">
          <circle r="26" fill="#fff" stroke="var(--ink)" stroke-width="2.6"/><circle r="20" fill="none" stroke="var(--heart)" stroke-width="1.6" stroke-dasharray="3 3"/>
          ${Doodle.heart(0, 2, 24)}
        </g>
        <g class="office-ticket" transform="translate(${W - 66} ${Kt - 64})">
          <rect x="-34" y="-16" width="68" height="34" rx="6" fill="var(--butter)" stroke="var(--ink)" stroke-width="2.4"/>
          <text class="ui-text" x="0" y="-3" text-anchor="middle" font-size="9" fill="var(--ink-soft)">NOW SERVING</text>
          <text class="ui-text" x="0" y="12" text-anchor="middle" font-size="12" fill="var(--ink)">♡ 1</text>
        </g>
        <!-- the clerk stands behind the counter -->
        <g class="cats"></g>
        <g class="counter">
          <rect x="-4" y="${Kt + 10}" width="${W + 8}" height="${L.counter.h}" fill="#f6e7c6" stroke="var(--ink)" stroke-width="3"/>
          <path d="M8 ${Kt + 30} h${W - 16} M8 ${Kt + 58} h${W - 16}" stroke="#e3cfa6" stroke-width="2.2" stroke-linecap="round"/>
          <rect x="-6" y="${Kt}" width="${W + 12}" height="14" rx="4" fill="#fff" stroke="var(--ink)" stroke-width="3"/>
          <!-- papers, a bell, the stamp -->
          <g class="papers" transform="translate(${L.clerkX - 84} ${Kt})">
            <rect x="-22" y="-16" width="44" height="16" rx="2" fill="#fff" stroke="var(--ink)" stroke-width="2.2"/><rect x="-24" y="-11" width="44" height="11" rx="2" fill="#fffdf7" stroke="var(--ink)" stroke-width="2.2"/>
            <path d="M-14 -5 h20 M-14 -1 h14" stroke="#d9c9a8" stroke-width="1.6" stroke-linecap="round"/>
          </g>
          <g class="bell" transform="translate(${L.clerkX + 76} ${Kt})">
            <path d="M-11 0 q0 -14 11 -14 q11 0 11 14 z" fill="#ffd76a" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/><circle cx="0" cy="-15" r="2.4" fill="var(--ink)"/><rect x="-14" y="-2" width="28" height="4" rx="2" fill="var(--ink)"/>
          </g>
          <g class="stamp-tool" transform="translate(${L.clerkX + 120} ${Kt})">
            <rect x="-13" y="-7" width="26" height="7" rx="2" fill="var(--ink)"/><rect x="-5" y="-26" width="10" height="20" rx="4" fill="#e0607f" stroke="var(--ink)" stroke-width="2.2"/><circle cx="0" cy="-28" r="4" fill="#e0607f" stroke="var(--ink)" stroke-width="2.2"/>
          </g>
          <g class="pigeon-slot" transform="translate(${L.pigeonX} ${Kt})">${pigeonMarkup()}</g>
        </g>
        <g class="fx"></g>`;
      container.innerHTML = ''; container.classList.add('caption-top');
      svg = svgEl('svg', { viewBox: L.vb.join(' '), role: 'group', 'aria-label': 'the counter of the department of extremely important romantic affairs: the blue cat is the clerk, a carrier pigeon waits at the end of the counter' });
      svg.innerHTML = inner; container.appendChild(svg);
      if (life) life();
      svg.querySelector('.cats').innerHTML = Cat.markup('blue', 'blue');
      blue = Cat.attach(svg, 'blue', 'blue', L.catH); life = Cat.life([blue]);
      blueHome = { x: L.clerkX, y: L.counter.y + 22 };   // on a stool behind the counter: his paws rest on its edge, the counter hides his feet
      blue.place(blueHome.x, blueHome.y); blue.faceDir(1); blue.setExpression('curious'); blue.lookAt(0, 1);
      // a tap on the clerk: a little professional mew
      blue.el.classList.add('pettable'); blue.el.setAttribute('role', 'img'); blue.el.setAttribute('aria-label', 'the blue cat, on duty');
      blue.el.addEventListener('click', async (e) => { e.stopPropagation(); if (gagBusy || blue.busy) return; blue.busy = true; try { Sound.play('mew'); const ex = blue.expr; blue.setExpression('pleased'); await blue.tiltTo(-7, 200); await blue.blinkOnce(); await wait(360); await blue.tiltTo(0, 200); blue.setExpression(ex); } finally { blue.busy = false; } });
      // the hooks app.js calls from the form
      TA.decisionGag = gag; TA.officeDecision = onDecision; TA.officeStamped = onStamped;
    }

    // ---- reactions to the form
    async function onDecision(kind) {
      if (gagBusy || !blue) return;
      if (kind === 'yes') { blue.setExpression('delighted'); Sound.play('meow'); spawnHearts(svg.querySelector('.fx'), blue.s.x, blue.s.y - L.catH * 1.05, 3, 26); await blue.bounce(10, 420); blue.setExpression('affectionate'); }
      else if (kind === 'check') { blue.setExpression('curious'); await blue.tiltTo(9, 240); await blue.lookAtViewer(200); }
      else { blue.setExpression('skeptical'); blue.sweatDrop(2200); await blue.tiltTo(8, 240); }
    }
    async function onStamped(kind, first) {
      if (!blue) return;
      // the slam: he jumps, then the news sinks in
      const ex = { yes: 'delighted', check: 'pleased', no: 'sheepish' }[kind] || 'pleased';
      blue.setExpression('surprised'); await blue.bounce(12, 360);
      blue.setExpression(ex);
      if (kind === 'yes') { spawnHearts(svg.querySelector('.fx'), blue.s.x, blue.s.y - L.catH * 1.05, 5, 36); Sound.play('tada'); }
      if (kind === 'no') blue.sweatDrop(2400);
      await dispatch(kind);
    }
    // the pigeon takes the letter, flies off over the counter and out; comes back for the next one
    async function dispatch(kind) {
      if (pigeonBusy || !svg) return; pigeonBusy = true;
      const p = svg.querySelector('.pigeon'), letter = svg.querySelector('.pigeon-letter'), wing = svg.querySelector('.pigeon-wing');
      try {
        letter.setAttribute('opacity', '1'); Sound.play('pop');
        await tween(300, (t) => { const b = Math.sin(Math.PI * t); p.setAttribute('transform', `translate(0 ${(-10 * b).toFixed(1)})`); });
        ctx.caption(C.office.dispatched[kind], 3200);
        Sound.play('whirr');
        const dx = -(L.pigeonX + 80), dy = -(L.counter.y + 60);
        await tween(1500, (t) => { const e = ease.inOut(t); const flap = Math.sin(t * 40) * 0.5; p.setAttribute('transform', `translate(${(dx * e).toFixed(1)} ${(dy * Math.sin(Math.PI * 0.5 * Math.min(1, t * 1.2)) - 30 * Math.sin(Math.PI * t)).toFixed(1)}) rotate(${(-12 * Math.sin(Math.PI * t)).toFixed(1)})`); wing.setAttribute('transform', `scale(1 ${(1 + flap).toFixed(2)})`); });
        letter.setAttribute('opacity', '0'); wing.removeAttribute('transform');
        await wait(2200);
        // back on the counter
        await tween(1200, (t) => { const e = ease.inOut(t); const flap = Math.sin(t * 40) * 0.5; p.setAttribute('transform', `translate(${(dx * (1 - e)).toFixed(1)} ${(dy * (1 - e) - 24 * Math.sin(Math.PI * t)).toFixed(1)}) rotate(${(8 * Math.sin(Math.PI * t)).toFixed(1)})`); wing.setAttribute('transform', `scale(1 ${(1 + flap).toFixed(2)})`); });
        p.setAttribute('transform', 'translate(0 0)'); wing.removeAttribute('transform'); Sound.play('land');
      } finally { pigeonBusy = false; }
    }

    // ---- the bouncer. A "no" decision makes the clerk leave the counter, drop out of the sky onto the button she
    // tapped, plant himself on it with both paws up, stare, and shake his head; then he hops back up and returns.
    // He never gives in (the answer stays on "yes"); the bubbles rotate so a fourth try still gets a new line.
    async function gag(chip) {
      if (gagBusy || !blue || !chip) return false;
      gagBusy = true; gagCount++; const nth = gagCount; const g = ++gagGen; const alive = () => g === gagGen && !!blue;
      const T = C.office.gag; const home = blueHome; const pigeon = svg.querySelector('.pigeon');
      try {
        // 1. up and out of the picture (the pigeon watches him go)
        if (REDUCED) blue.el.setAttribute('opacity', '0');
        else await tween(240, (t) => { const e = ease.in(t); blue.set({ y: home.y - 90 * e, air: 90 * e, sy: 1 + 0.1 * e }); blue.el.setAttribute('opacity', String(1 - e)); });
        blue.el.setAttribute('opacity', '0');
        if (pigeon && !REDUCED) tween(400, (t) => { const b = Math.sin(Math.PI * t); pigeon.setAttribute('transform', `translate(0 ${(-6 * b).toFixed(1)})`); });
        if (!alive()) return false;
        // 2. the drop onto the button
        const relent = await bouncer(chip, nth, T[(nth - 1) % T.length], alive);   // always false: he never gives in
        if (!alive()) return relent;
        // 3. back behind the counter (sulking the third time); the form takes taps again once he has landed
        (async () => {
          try {
            blue.set({ x: home.x, y: home.y - 90, air: 90, sy: 1, lean: 0, raiseL: 0, raiseR: 0, sx: 1 }); blue.setExpression(relent ? 'skeptical' : 'shy'); blue.faceDir(1);
            if (REDUCED) { blue.set({ y: home.y, air: 0 }); blue.el.setAttribute('opacity', '1'); }
            else {
              await tween(300, (t) => { const e = ease.in(t); blue.set({ y: home.y - 90 * (1 - e), air: 90 * (1 - e) }); blue.el.setAttribute('opacity', String(Math.min(1, e * 2))); });
              blue.el.setAttribute('opacity', '1'); Sound.play('land'); await blue.settle(220);
            }
            if (alive()) gagBusy = false;
            if (relent) { await wait(1600); if (alive()) blue.setExpression('shy'); } else { await wait(400); if (alive()) blue.setExpression('curious'); }
          } finally { if (alive()) gagBusy = false; }
        })();
        return relent;
      } catch (e) { gagBusy = false; throw e; }
    }
    // the overlay cat: an SVG in page coordinates, pinned to the button, never catching taps
    async function bouncer(chip, nth, text, alive) {
      const r = chip.getBoundingClientRect(); const sx = window.scrollX, sy = window.scrollY;
      const W = 340, H = 280, GROUND = H - 30, CATH = 58;                        // px; a paperweight-sized cat, feet on the button's bottom edge
      const cx = r.left + sx + r.width / 2, ground = r.top + sy + r.height + 1; const top = ground - GROUND;
      const ov = svgEl('svg', { class: 'bouncer', viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true' });
      ov.style.left = `${cx - W / 2}px`; ov.style.top = `${top}px`;
      ov.innerHTML = `<g class="cats">${Cat.markup('bouncer', 'blue')}</g><g class="bubble" opacity="0"></g>`;
      if (overlay) overlay.remove(); overlay = ov; document.body.appendChild(ov);
      let stop = null, cat = null;
      try { cat = Cat.attach(ov, 'bouncer', 'blue', CATH); stop = Cat.life([cat]); } catch (e) { ov.remove(); overlay = null; throw e; }
      const y0 = Math.min(GROUND - 150, (sy - 120) - top);                       // from above the visible top (or well above the button)
      const say = (txt) => {
        // beside his head, to the right, with the tail pointing at him
        const b = ov.querySelector('.bubble'); const w = Math.max(54, txt.length * 11 + 26), h = 34; const bx = W / 2 + CATH * 0.72, by = GROUND - CATH * 0.78 - h / 2;
        b.innerHTML = `<path d="M${bx + 2} ${by + h * 0.42} l-12 6 l12 8 z" fill="#fffdfc" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/><rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="${h / 2}" fill="#fffdfc" stroke="var(--ink)" stroke-width="2.2"/><rect x="${bx + 1}" y="${by + h * 0.42 + 1}" width="5" height="12" fill="#fffdfc"/><text x="${bx + w / 2}" y="${by + h * 0.68}" text-anchor="middle" font-size="17">${txt}</text>`;
        b.setAttribute('opacity', '1'); flash(b, 'pop-in', 300);
      };
      const relent = false; const hold = (ms) => new Promise((res) => setTimeout(res, ms));   // a real pause even under reduced motion (the bubble must be readable)
      try {
        cat.setExpression('determined'); cat.faceDir(1); cat.place(W / 2, y0); cat.set({ air: GROUND - y0 });
        if (REDUCED) cat.set({ y: GROUND, air: 0 });
        else await tween(440, (t) => { const e = t * t; cat.set({ y: y0 + (GROUND - y0) * e, air: (GROUND - y0) * (1 - e), sy: 1 + 0.1 * (1 - e), sx: 1 - 0.06 * (1 - e) }); });
        if (!alive()) return relent;
        Sound.play('land'); flash(chip, 'shake', 380);
        if (!REDUCED) await tween(220, (t) => { const e = ease.out(t); cat.set({ sy: 0.8 + 0.2 * e, sx: 1.18 - 0.08 * e }); });
        // the guard: planted on the button, both paws up, stern, eyes on you
        cat.setExpression('stern'); cat.guard(true); await cat.lookAtViewer(180); say(text);
        if (!relent) {
          await wait(260);
          if (REDUCED) { await hold(1500); }
          else {
            await cat.shakeHead(3, 960, (i) => { if (i === 0 || i === 2 || i === 4) Sound.play('nope'); });
            if (nth % 2 === 0) { await wait(160); await cat.tiltTo(-9, 200); await wait(420); await cat.tiltTo(0, 200); }   // ...and, every other time, a long look
            await wait(520);
          }
          if (!alive()) return relent;
          // up and away
          ov.querySelector('.bubble').setAttribute('opacity', '0'); cat.guard(false); cat.setExpression('determined');
          if (!REDUCED) { await cat.crouch(0.12, 150); Sound.play('hop'); await tween(380, (t) => { const e = t * t; cat.set({ y: GROUND - (GROUND - y0) * e, air: (GROUND - y0) * e, sy: 1 + 0.12 * e, sx: 1 - 0.06 * e }); }); }
        } else {
          // the third time: a long blink, a sigh, and he slides off the button
          await (REDUCED ? hold(600) : wait(500)); cat.setExpression('skeptical'); await cat.blinkOnce(); await wait(420); Sound.play('hmm');
          if (!REDUCED) await tween(360, (t) => { const e = ease.inOut(t); cat.set({ sy: 1 - 0.06 * Math.sin(Math.PI * e), tilt: 9 * e }); });
          await (REDUCED ? hold(900) : wait(600));
          ov.querySelector('.bubble').setAttribute('opacity', '0'); cat.guard(false);
          if (!REDUCED) { const xo = W / 2 + r.width / 2 + 54; await cat.hopTo(xo, GROUND + 14, { height: 26, dur: 440 }); await wait(140); Sound.play('hop'); await tween(360, (t) => { const e = t * t; cat.set({ y: GROUND + 14 - (GROUND + 14 - y0) * e, air: (GROUND + 14 - y0) * e }); }); }
        }
        return relent;
      } finally { if (stop) stop(); ov.remove(); if (overlay === ov) overlay = null; }
    }

    return {
      mount(c, l) { container = c; layout = l; L = LAY[l]; render(); },
      unmount() { gagGen++; if (overlay) { overlay.remove(); overlay = null; } gagBusy = false; pigeonBusy = false; if (life) life(); life = null; blue = null; TA.decisionGag = null; TA.officeDecision = null; TA.officeStamped = null; },
    };
  });
})();
