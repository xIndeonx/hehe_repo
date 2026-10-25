/* ------------------------------------------------------------
   a tiny adventure — the paperwork (the last view)
   The counter of the Department of Extremely Important Romantic
   Affairs: the blue cat is the clerk, a carrier pigeon waits at
   the end of the counter. The form below the drawing is her reply
   (app.js builds it); this scene reacts to her decision, drops the
   clerk onto a "no" button (the bouncer), rides the big stamp down
   onto the form, and sends the pigeon off with the reply.
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
    let svg, layout, container, L, blue, life = null, overlay = null, gagCount = 0, gagGen = 0, gagBusy = false, stampBusy = false;
    const overlays = new Set();   // every overlay on the page (the stamp, the pigeon): an unmount removes them
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
      blue.el.addEventListener('click', async (e) => { e.stopPropagation(); if (gagBusy || blue.busy) return; blue.busy = true; TA.note('pet.clerk'); try { Sound.play('mew'); const ex = blue.expr; blue.setExpression('pleased'); await blue.tiltTo(-7, 200); await blue.blinkOnce(); await wait(360); await blue.tiltTo(0, 200); blue.setExpression(ex); } finally { blue.busy = false; } });
      // the hooks app.js calls from the form
      TA.decisionGag = gag; TA.officeDecision = onDecision; TA.officeStampAnim = stampAnim; TA.officeDeliver = deliver;
    }

    // ---- reactions to the form
    async function onDecision(kind) {
      if (gagBusy || !blue) return;
      if (kind === 'yes') { blue.setExpression('delighted'); Sound.play('meow'); spawnHearts(svg.querySelector('.fx'), blue.s.x, blue.s.y - L.catH * 1.05, 3, 26); await blue.bounce(10, 420); blue.setExpression('affectionate'); }
      else if (kind === 'check') { blue.setExpression('curious'); await blue.tiltTo(9, 240); await blue.lookAtViewer(200); }
      else { blue.setExpression('skeptical'); blue.sweatDrop(2200); await blue.tiltTo(8, 240); }
    }
    // ---- the clerk takes the department's stamp from the counter (and brings it back), seen if the counter is on screen
    async function sceneLeave() {
      if (!blue) return; const tool = svg.querySelector('.stamp-tool'); if (tool) tool.setAttribute('opacity', '0');
      if (REDUCED) { blue.el.setAttribute('opacity', '0'); return; }
      const home = blueHome; blue.setExpression('determined');
      await tween(240, (t) => { const e = ease.in(t); blue.set({ y: home.y - 90 * e, air: 90 * e, sy: 1 + 0.1 * e }); blue.el.setAttribute('opacity', String(1 - e)); });
      blue.el.setAttribute('opacity', '0');
    }
    async function sceneReturn() {
      if (!blue || !svg) return; const tool = svg.querySelector('.stamp-tool'); const home = blueHome;
      blue.set({ x: home.x, y: home.y - 90, air: 90, sx: 1, sy: 1, lean: 0, raiseL: 0, raiseR: 0 }); blue.setExpression('delighted'); blue.faceDir(1);
      if (!REDUCED) await tween(300, (t) => { const e = ease.in(t); blue.set({ y: home.y - 90 * (1 - e), air: 90 * (1 - e) }); blue.el.setAttribute('opacity', String(Math.min(1, e * 2))); });
      blue.set({ y: home.y, air: 0 }); blue.el.setAttribute('opacity', '1'); if (tool) tool.setAttribute('opacity', '1');
      if (!REDUCED) { Sound.play('land'); spawnHearts(svg.querySelector('.fx'), blue.s.x, blue.s.y - L.catH * 1.05, 4, 30); await blue.settle(220); }
      blue.setExpression('affectionate');
    }
    // an overlay in page coordinates: exactly the page's width (anything wider makes a phone zoom out and jump), from
    // `top` for `h` px but never past the end of the document; it clips what it draws. Returns local-coordinate helpers.
    function pageOverlay(top, h, cls = 'stamp-overlay') {
      const W = document.documentElement.clientWidth; const docH = document.documentElement.scrollHeight;
      h = Math.max(60, Math.min(h, docH - top));
      const ov = svgEl('svg', { class: cls, viewBox: `0 0 ${W} ${h.toFixed(0)}`, width: W, height: h.toFixed(0), 'aria-hidden': 'true' });
      ov.style.left = '0px'; ov.style.top = `${top.toFixed(0)}px`;
      document.body.appendChild(ov); overlays.add(ov);
      return { ov, W, H: h, y: (pageY) => pageY - top };
    }
    const easeBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
    const INKS = { yes: '#d9678d', check: '#6c7fa6', no: '#575354' };

    // ---- the stamp, on the form itself (an overlay in page coordinates, like the bouncer). A big rubber stamp drops in
    // above the "for official use only" box, the clerk lands on top of it, takes aim, and rides it down: ka-chunk.
    // The imprint appears at the impact (onImpact), ink flies, the form jolts; the stamp lifts away to reveal it.
    async function stampAnim(seal, imprint, kind, onImpact) {
      if (stampBusy || gagBusy) return; stampBusy = true;
      const g = gagGen; const alive = () => g === gagGen;
      const step = async (pr) => { await pr; if (!alive()) throw new Error('gone'); };
      let ov = null, stop = null, impacted = false;
      const hit = () => { if (!impacted) { impacted = true; onImpact(); } };
      try {
        // measure the imprint (it stays hidden until the impact) so the stamp's face covers it exactly
        imprint.querySelector('span').textContent = C.office.stamps[kind]; imprint.className = `doc-stamp stamp-${kind}`;
        imprint.style.visibility = 'hidden'; imprint.hidden = false;
        const iw = imprint.offsetWidth, ih = imprint.offsetHeight; const ir = imprint.getBoundingClientRect();
        imprint.hidden = true; imprint.style.visibility = '';
        if (REDUCED) { hit(); Sound.play('stamp'); return; }
        const cxPage = ir.left + ir.width / 2, cy = ir.top + ir.height / 2 + window.scrollY;
        const ANG = -12, CATH = 54, inkCol = INKS[kind] || INKS.yes;
        const bw = iw + 16, bh = ih + 12, top = -bh / 2, neckH = 30, knobRx = 25, knobRy = 14;
        const knobCy = top - neckH - knobRy + 3, knobTop = knobCy - knobRy;
        const plateH = Math.min(16, bh * 0.36), plateY = top + (bh - 8 - plateH) / 2;
        const oTop = Math.min(window.scrollY - 20, cy - 430);
        const pg = pageOverlay(oTop, cy + 190 - oTop); ov = pg.ov; const W = pg.W, FACE = pg.y(cy), X0 = cxPage;
        ov.innerHTML = `
          <g class="paper" transform="translate(${X0} ${FACE}) rotate(${ANG})"><ellipse class="stamp-shadow" cx="0" cy="${bh / 2 - 2}" rx="${bw * 0.55}" ry="8" fill="var(--ink)" opacity="0"/><g class="ink-fx"></g></g>
          <g class="rig">
            <g class="stamp-body">
              <rect x="${-bw / 2 + 3}" y="${bh / 2 - 9}" width="${bw - 6}" height="9" rx="2" fill="${inkCol}" stroke="var(--ink)" stroke-width="2.2"/>
              <rect x="${-bw / 2}" y="${top}" width="${bw}" height="${bh - 8}" rx="7" fill="#f3d7a7" stroke="var(--ink)" stroke-width="2.8"/>
              <path d="M${-bw / 2 + 9} ${top + 6} h${bw - 18}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>
              <rect x="${-bw * 0.32}" y="${plateY}" width="${bw * 0.64}" height="${plateH}" rx="3" fill="#fffdf7" stroke="var(--ink)" stroke-width="1.8"/>
              <text class="ui-text" x="0" y="${plateY + plateH * 0.74}" text-anchor="middle" font-size="${Math.min(10, plateH * 0.62)}" letter-spacing="1.6" fill="${inkCol}">${C.office.stamps[kind].toUpperCase()}</text>
              <rect x="-15" y="${top - 6}" width="30" height="7" rx="2.5" fill="#e9c08a" stroke="var(--ink)" stroke-width="2.2"/>
              <rect x="-8" y="${top - neckH}" width="16" height="${neckH - 5}" rx="4" fill="#f6e7c6" stroke="var(--ink)" stroke-width="2.4"/>
              <ellipse cx="0" cy="${knobCy}" rx="${knobRx}" ry="${knobRy}" fill="#f49fbb" stroke="var(--ink)" stroke-width="2.8"/>
              <path d="M${-knobRx * 0.55} ${knobCy - knobRy * 0.3} q${knobRx * 0.4} ${-knobRy * 0.55} ${knobRx * 0.85} ${-knobRy * 0.2}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
            </g>
            <g class="rider">${Cat.markup('stamper', 'blue')}</g>
          </g>
          <g class="pow"></g>`;
        const rig = ov.querySelector('.rig'), body = ov.querySelector('.stamp-body'), shadow = ov.querySelector('.stamp-shadow');
        const cat = Cat.attach(ov, 'stamper', 'blue', CATH); stop = Cat.life([cat]);
        let lift = 0, wob = 0, sqx = 1, sqy = 1, catDY = 0;
        const draw = () => {
          rig.setAttribute('transform', `translate(${X0} ${FACE}) rotate(${(ANG + wob).toFixed(2)}) translate(0 ${(-lift).toFixed(1)})`);
          body.setAttribute('transform', `translate(0 ${bh / 2}) scale(${sqx.toFixed(3)} ${sqy.toFixed(3)}) translate(0 ${-bh / 2})`);
          const near = Math.max(0, 1 - lift / 180); shadow.setAttribute('opacity', (0.16 * near).toFixed(3)); shadow.setAttribute('rx', (bw * (0.35 + 0.2 * near)).toFixed(1));
          cat.place(0, bh / 2 + (knobTop - bh / 2) * sqy + 1 + catDY);
        };
        const L0 = FACE + (bh / 2 - knobTop) + CATH * 1.3 + 30;   // starts above the overlay's top edge, i.e. above the screen
        const HOVER = 94;   // hangs right over the box
        lift = L0; cat.el.setAttribute('opacity', '0'); draw();
        sceneLeave();
        // 1. the stamp drops in and hangs above the box
        Sound.play('whoosh');
        await step(tween(480, (t) => { lift = L0 + (HOVER - L0) * easeBack(t); draw(); }));
        // 2. he lands on top of it (the stamp dips under him)
        cat.setExpression('determined'); cat.faceDir(1); cat.lookAt(0, 1);
        const C0 = -(FACE - HOVER + CATH * 1.4 + 40); catDY = C0; cat.el.setAttribute('opacity', '1');   // he drops in from above the screen too
        await step(tween(320, (t) => { const e = t * t; catDY = C0 * (1 - e); cat.set({ air: -catDY, sy: 1 + 0.08 * (1 - e) }); draw(); }));
        catDY = 0; cat.set({ air: 0 }); Sound.play('land');
        await step(tween(220, (t) => { const b = Math.sin(Math.PI * t); lift = HOVER - 12 * b; cat.set({ sy: 1 - 0.16 * b, sx: 1 + 0.08 * b }); draw(); }));
        // 3. he takes aim: a little wiggle, up a touch (the wind-up), eyes on the box
        cat.lookDown(0.8, 200);
        await step(tween(460, (t) => { wob = 3.4 * Math.sin(t * Math.PI * 4) * (1 - t); lift = HOVER + 30 * ease.out(t); cat.set({ sy: 1 - 0.12 * ease.out(t), sx: 1 + 0.06 * ease.out(t) }); draw(); }));
        wob = 0; await step(wait(90));
        // 4. ka-CHUNK
        const L1 = lift;
        await step(tween(120, (t) => { lift = L1 * (1 - t * t); draw(); }));
        lift = 0; draw(); hit(); Sound.play('thunk'); Sound.play('stamp');
        burst(ov, W, X0, FACE, ANG, bw, bh, inkCol);
        await step(tween(120, (t) => { const b = Math.sin(Math.PI * t); sqy = 1 - 0.1 * b; sqx = 1 + 0.05 * b; cat.set({ sy: 0.76 + 0.24 * t, sx: 1.18 - 0.18 * t }); draw(); }));
        sqx = sqy = 1; cat.set({ sx: 1, sy: 1 }); draw();
        // 5. he is delighted with himself
        cat.gazeReset(160); cat.setExpression('delighted'); cat.guard(true); Sound.play('meow');
        await step(tween(340, (t) => { const b = Math.sin(Math.PI * t); catDY = -16 * b; cat.set({ air: 16 * b, sy: 1 + 0.06 * b }); draw(); }));
        catDY = 0; cat.set({ air: 0, sy: 1 }); hearts(ov, X0, FACE + knobTop - CATH * 0.9); await step(wait(280));
        // 6. the stamp lifts away: there it is. Then off, back to the counter
        cat.guard(false); cat.setExpression('affectionate');
        await step(tween(360, (t) => { lift = 74 * ease.out(t); draw(); }));
        await step(wait(160));
        await step(tween(400, (t) => { lift = 74 + (L0 - 74) * t * t; draw(); ov.setAttribute('opacity', String(1 - Math.max(0, (t - 0.65) / 0.35))); }));
      } catch (e) { if (!e || e.message !== 'gone') throw e; }
      finally {
        if (alive()) hit();   // the imprint always lands, whatever happened to the animation
        if (stop) stop(); if (ov) { ov.remove(); overlays.delete(ov); } stampBusy = false;
        if (alive() && !REDUCED) sceneReturn(); else if (alive()) { const tool = svg && svg.querySelector('.stamp-tool'); if (tool) tool.setAttribute('opacity', '1'); if (blue) blue.el.setAttribute('opacity', '1'); }
      }
    }
    // ink flies off the edges of the stamp's face, impact lines, and a little "ka-chunk!"
    function burst(ov, W, X0, FACE, ANG, bw, bh, inkCol) {
      const fx = ov.querySelector('.ink-fx'), pow = ov.querySelector('.pow'); const y0 = bh / 2 - 2;
      const drops = Array.from({ length: 12 }, (_, i) => { const side = i % 2 ? 1 : -1; return { x: side * (bw / 2 - 4 + Math.random() * 6), y: y0 - Math.random() * 6, vx: side * (50 + Math.random() * 70), vy: -(30 + Math.random() * 70), r: 1.6 + Math.random() * 2.2 }; });
      fx.innerHTML = drops.map((d) => `<circle cx="0" cy="0" r="${d.r.toFixed(1)}" fill="${inkCol}"/>`).join('') +
        [-1, 1].map((side) => [12, 38, 64].map((a) => { const rad = (a * Math.PI) / 180; const ux = side * Math.cos(rad), uy = -Math.sin(rad); const x1 = side * (bw / 2 + 6), y1 = y0 - 2; return `<path class="pow-line" d="M${(x1 + ux * 5).toFixed(1)} ${(y1 + uy * 5).toFixed(1)} L${(x1 + ux * 18).toFixed(1)} ${(y1 + uy * 18).toFixed(1)}" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/>`; }).join('')).join('');
      const dots = [...fx.querySelectorAll('circle')], lines = [...fx.querySelectorAll('.pow-line')];
      const left = X0 - bw / 2 - 10 > 96; const tx = left ? X0 - bw / 2 - 12 : X0 + bw / 2 + 12, ty = FACE - bh / 2 - 8;
      pow.innerHTML = `<text class="kachunk" x="${tx}" y="${ty}" text-anchor="${left ? 'end' : 'start'}" font-size="21" transform="rotate(-8 ${tx} ${ty})">${C.office.kachunk}</text>`;
      const word = pow.firstElementChild;
      tween(560, (t) => {
        dots.forEach((el, i) => { const d = drops[i]; const tt = t * 0.56; el.setAttribute('cx', (d.x + d.vx * tt).toFixed(1)); el.setAttribute('cy', (d.y + d.vy * tt + 260 * tt * tt).toFixed(1)); el.setAttribute('opacity', String(1 - Math.max(0, (t - 0.45) / 0.55))); });
        lines.forEach((el) => el.setAttribute('opacity', String(t < 0.4 ? 1 : 1 - (t - 0.4) / 0.6)));
        const s = t < 0.25 ? 0.6 + 1.9 * t : 1.08 - 0.08 * Math.min(1, (t - 0.25) / 0.2);
        word.setAttribute('transform', `rotate(-8 ${tx} ${ty}) translate(${tx} ${ty}) scale(${s.toFixed(3)}) translate(${-tx} ${-ty})`);
      }).then(() => { tween(420, (t) => word.setAttribute('opacity', String(1 - t))).then(() => { fx.innerHTML = ''; pow.innerHTML = ''; }); });
    }
    function hearts(ov, x, y) {
      const fx = ov.querySelector('.pow'); const hs = [-16, 6, 22].map((dx, i) => { const u = svgEl('use', { href: '#sym-heart', x: x + dx - 7, y: y - 6, width: 14, height: 13 }); fx.appendChild(u); return { u, dx, d: i * 90 }; });
      const t0 = performance.now();
      tween(900, (t) => hs.forEach((h) => { const tt = Math.max(0, Math.min(1, (t * 900 - h.d) / 700)); h.u.setAttribute('transform', `translate(${(Math.sin(tt * 6 + h.dx) * 3).toFixed(1)} ${(-34 * tt).toFixed(1)})`); h.u.setAttribute('opacity', String(tt < 0.7 ? 1 : 1 - (tt - 0.7) / 0.3)); })).then(() => hs.forEach((h) => h.u.remove()));
    }

    // ---- the delivery: the pigeon flies in to the box, the stamped reply pops out of it as an envelope and into its
    // beak, a polite coo, and it is off with it (the counter's pigeon is out on delivery for a while)
    async function deliver(seal, kind) {
      ctx.caption(C.office.dispatched[kind], 3400);
      if (REDUCED || !alivePage()) return;
      const g = gagGen; const alive = () => g === gagGen;
      const r = seal.getBoundingClientRect(); const sealY = r.top + r.height / 2 + window.scrollY; const S = 1.5;
      const oTop = Math.min(window.scrollY - 20, sealY - 470);
      const pg = pageOverlay(oTop, sealY + 70 - oTop); const ov = pg.ov, W = pg.W;
      const P = { x: r.left + r.width / 2, y: pg.y(sealY) };
      ov.innerHTML = `<g class="env-pop" opacity="0">${Doodle.envelope(-14, -10, 28, 20, 2.2)}</g><g class="bird">${pigeonMarkup()}</g>`;
      const bird = ov.querySelector('.bird'), wing = bird.querySelector('.pigeon-wing'), letter = bird.querySelector('.pigeon-letter'), env = ov.querySelector('.env-pop');
      const sh = bird.querySelector('.pigeon > ellipse'); if (sh) sh.setAttribute('opacity', '0');
      const home = svg ? svg.querySelector('.pigeon') : null; if (home) home.setAttribute('opacity', '0');
      const at = (x, y, tilt, flap) => { bird.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${tilt.toFixed(1)}) scale(${S})`); wing.setAttribute('transform', `rotate(${(flap * 38).toFixed(1)} 6 -18)`); };
      try {
        const hover = { x: Math.min(W - 40, P.x + 40), y: P.y - 40 }, start = { x: W + 70, y: P.y - 190 };
        Sound.play('flap');
        await tween(720, (t) => { const e = ease.out(t); at(start.x + (hover.x - start.x) * e, start.y + (hover.y - start.y) * e - 14 * Math.sin(Math.PI * e), -10 * (1 - e), Math.sin(t * 46)); });
        if (!alive()) return;
        // the reply pops out of the box and flies up into its beak
        env.setAttribute('opacity', '1'); Sound.play('pop');
        const beak = { x: hover.x - 25 * S, y: hover.y - 24.5 * S };
        await tween(400, (t) => { const e = ease.inOut(t); const x = P.x + (beak.x - P.x) * e, y = P.y + (beak.y - P.y) * e - 22 * Math.sin(Math.PI * t); const sc = Math.min(1, t * 3.2) * (1 - 0.22 * e); env.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(-10 * e).toFixed(1)}) scale(${sc.toFixed(3)})`); at(hover.x, hover.y + 2 * Math.sin(t * 20), 0, Math.sin(t * 46)); });
        env.setAttribute('opacity', '0'); letter.setAttribute('opacity', '1'); Sound.play('coo');
        await tween(260, (t) => at(hover.x, hover.y + 3 * Math.sin(Math.PI * t), 10 * Math.sin(Math.PI * t), 0.3 * Math.sin(t * 30)));   // a polite nod
        if (!alive()) return;
        Sound.play('flap');
        const end = { x: -90, y: -200 };
        await tween(920, (t) => { const e = t * t; at(hover.x + (end.x - hover.x) * e, hover.y + (end.y - hover.y) * e, -16 * Math.min(1, t * 2), Math.sin(t * 60)); });
      } finally {
        ov.remove(); overlays.delete(ov);
        // back on the counter in a while
        if (home) setTimeout(() => { if (!home.isConnected) return; home.setAttribute('opacity', '1'); if (!REDUCED) tween(420, (t) => { const e = ease.out(t); home.setAttribute('transform', `translate(0 ${(-40 * (1 - e)).toFixed(1)})`); }).then(() => { home.setAttribute('transform', 'translate(0 0)'); Sound.play('land'); }); }, 2600);
      }
    }
    const alivePage = () => !!(svg && svg.isConnected);

    // ---- the bouncer. A "no" decision makes the clerk leave the counter, drop out of the sky onto the button she
    // tapped, plant himself on it with both paws up, stare, and shake his head; then he hops back up and returns.
    // He never gives in (the answer stays on "yes"); the bubbles rotate so a fourth try still gets a new line.
    async function gag(chip) {
      if (gagBusy || stampBusy || !blue || !chip) return false;
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
      const r = chip.getBoundingClientRect(); const sy = window.scrollY; const CATH = 58;   // a paperweight-sized cat, feet on the button's bottom edge
      const ground = r.top + sy + r.height + 1; const oTop = Math.min(sy - 20, ground - 260);
      const pg = pageOverlay(oTop, ground + 34 - oTop, 'bouncer'); const ov = pg.ov, W = pg.W; overlays.delete(ov);
      const CX = r.left + r.width / 2, GROUND = pg.y(ground);
      ov.innerHTML = `<g class="cats">${Cat.markup('bouncer', 'blue')}</g><g class="bubble" opacity="0"></g>`;
      if (overlay) overlay.remove(); overlay = ov;
      let stop = null, cat = null;
      try { cat = Cat.attach(ov, 'bouncer', 'blue', CATH); stop = Cat.life([cat]); } catch (e) { ov.remove(); overlay = null; throw e; }
      const y0 = -CATH * 1.4;                                                    // from above the overlay's top edge, i.e. above the screen
      const say = (txt) => {
        // beside his head, with the tail pointing at him: to the right if there is room, else to the left
        const b = ov.querySelector('.bubble'); const w = Math.max(54, txt.length * 11 + 26), h = 34; const by = GROUND - CATH * 0.78 - h / 2;
        const right = CX + CATH * 0.72 + w <= W - 6; const bx = right ? CX + CATH * 0.72 : CX - CATH * 0.72 - w;
        const tail = right ? `M${bx + 2} ${by + h * 0.42} l-12 6 l12 8 z` : `M${bx + w - 2} ${by + h * 0.42} l12 6 l-12 8 z`;
        const patch = right ? `<rect x="${bx + 1}" y="${by + h * 0.42 + 1}" width="5" height="12" fill="#fffdfc"/>` : `<rect x="${bx + w - 6}" y="${by + h * 0.42 + 1}" width="5" height="12" fill="#fffdfc"/>`;
        b.innerHTML = `<path d="${tail}" fill="#fffdfc" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/><rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="${h / 2}" fill="#fffdfc" stroke="var(--ink)" stroke-width="2.2"/>${patch}<text x="${bx + w / 2}" y="${by + h * 0.68}" text-anchor="middle" font-size="17">${txt}</text>`;
        b.setAttribute('opacity', '1'); flash(b, 'pop-in', 300);
      };
      const relent = false; const hold = (ms) => new Promise((res) => setTimeout(res, ms));   // a real pause even under reduced motion (the bubble must be readable)
      try {
        cat.setExpression('determined'); cat.faceDir(1); cat.place(CX, y0); cat.set({ air: GROUND - y0 });
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
          if (!REDUCED) { const xo = Math.min(W - 30, CX + r.width / 2 + 54); await cat.hopTo(xo, GROUND + 14, { height: 26, dur: 440 }); await wait(140); Sound.play('hop'); await tween(360, (t) => { const e = t * t; cat.set({ y: GROUND + 14 - (GROUND + 14 - y0) * e, air: (GROUND + 14 - y0) * e }); }); }
        }
        return relent;
      } finally { if (stop) stop(); ov.remove(); if (overlay === ov) overlay = null; }
    }

    return {
      mount(c, l) { container = c; layout = l; L = LAY[l]; render(); },
      unmount() { gagGen++; if (overlay) { overlay.remove(); overlay = null; } overlays.forEach((o) => o.remove()); overlays.clear(); gagBusy = false; stampBusy = false; if (life) life(); life = null; blue = null; TA.decisionGag = null; TA.officeDecision = null; TA.officeStampAnim = null; TA.officeDeliver = null; },
    };
  });
})();
