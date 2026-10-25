/* ------------------------------------------------------------
   Interlude — operation: totally normal entrance
   A flashback between the lane and the staircase (a true story
   from Geneva, mostly): he walks her to the bus (she has work),
   goes back to wait at her place, has forgotten the door code,
   and tries the balcony instead, with a grappling hook. The pot
   goes first, then the rope. A few hours later she comes back
   from work: oh. my. gosh. Then she helps him up, with a nuzzle.
   One cancellable timeline (a generation counter: every step
   checks it, and every tween here stops writing once it moves
   on), a camera that is just the viewBox, captions through
   ctx.caption, and a skip that redraws the scene in its end state.
   ------------------------------------------------------------ */
(() => {
  'use strict';
  const TA = window.TA;
  const C = window.TA_CONTENT;
  const { svgEl, tween: rawTween, wait, ease, spawnHearts, Doodle, flash, REDUCED } = TA.helpers;
  const Sound = TA.Sound; const Cat = TA.cat;

  TA.registerScene('balcony', (ctx) => {
    const CAP = C.balcony.captions;
    // one composition for both layouts. On a phone the street runs on to the left of the picture (x0 < 0): the
    // camera starts down there at the bus stop and walks back to the house with him. The wide stage shows it all.
    const LAY = {
      tall: { vb: [0, 0, 420, 470], x0: -290, W: 420, H: 470, catH: 84, ground: 440, bld: { x: 150 }, standX: 170, stop: -110, busW: 280, busH: 122 },
      wide: { vb: [0, 0, 900, 470], x0: 0, W: 900, H: 470, catH: 84, ground: 440, bld: { x: 390 }, standX: 410, stop: 200, busW: 280, busH: 122 },
    };
    const ROPE = '#c49a63', ROPE_DARK = '#94703f', POT = '#e9b48f';
    const state = { done: false, running: false };
    let svg, layout, container, L, blue, pink, life = null, gen = 0, star = null, skipping = false;
    let busX = -9999;
    // a tween that stops writing as soon as this run is skipped or unmounted (the shared tween cannot be cancelled)
    const tween = (dur, fn) => { const g0 = gen; return rawTween(dur, (t) => { if (g0 === gen) fn(t); }); };

    // ---- the places things happen (scene coordinates; the house is drawn at scale 1 here)
    const G = () => {
      const B = L.bld.x, g = L.ground, k = L.catH / 100;
      return {
        k, g,
        railHook: { x: B + 100, y: g - 252 },          // a point on the balcony railing's top bar
        potBase: { x: B + 214, y: g - 209 },           // the flower pot's bottom centre, on the balcony
        potLand: { x: L.standX + 130, y: g - 1 },      // where it lands: in front of the door, clear of him
        busDoor: L.busW * 0.45,                        // the bus door's centre, from the bus's rear
        blueStop: L.stop - 0.8 * L.catH,               // where he waits with her at the stop
        sitX: L.standX + 31,                           // where he ends up after the rope gives way
      };
    };

    // ---- the street. Back: hills, pines, the house, the pavement. The bus drives in front of that, and the
    // street furniture (her lamp, the bus stop) stands in front of the bus.
    const back = () => {
      const B = L.bld.x, g = L.ground, x0 = L.x0, WW = L.W - x0;
      return `
        <g transform="translate(${x0} 0)">${Doodle.hills(WW, g - 150, L.H)}</g>
        ${x0 < 0 ? `${Doodle.pine(x0 + 60, g - 52, 74, { ink: false, fill: '#dbe8f8' })}${Doodle.pine(-26, g, 98)}${Doodle.snowBush(-200, g, 0.7)}` : ''}
        ${Doodle.pine(B - 70, g, 110)}${Doodle.pine(B - 118, g - 60, 70, { ink: false, fill: '#dbe8f8' })}
        ${Doodle.house(B, g, 1, 'b')}
        <path d="M${x0} ${g} H${L.W}" stroke="#fff" stroke-width="10" opacity=".6"/>
        <path d="M${x0} ${g} H${L.W}" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round"/>
        ${Doodle.snowBush(B - 40, g, 0.7)}`;
    };
    const street = () => {
      const B = L.bld.x, g = L.ground, sx = L.stop - 118;
      return `${Doodle.lamp(B - 24, g, 118, 'b')}
        <g class="bus-stop">
          <path d="M${sx} ${g} V${g - 98}" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
          <path d="M${sx - 10} ${g} h20" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
          <rect x="${sx - 17}" y="${g - 124}" width="34" height="27" rx="7" fill="#ffe7a3" stroke="var(--ink)" stroke-width="2.6"/>
          <rect x="${sx - 11}" y="${g - 118.5}" width="22" height="12" rx="3.5" fill="#fff" stroke="var(--ink)" stroke-width="1.8"/>
          <path d="M${sx - 11} ${g - 113} h22 M${sx + 1} ${g - 118.5} v5.5" stroke="var(--ink)" stroke-width="1.4"/>
          <circle cx="${sx - 6}" cy="${g - 105.5}" r="2.4" fill="var(--ink)"/><circle cx="${sx + 6}" cy="${g - 105.5}" r="2.4" fill="var(--ink)"/>
        </g>`;
    };

    // ---- the bus (local coordinates: origin at its rear, on the road; up is negative). A soft butter-yellow city
    // bus with a pink stripe; its windows are holes in the body, so whoever rides in it shows through them.
    const rr = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
    const BUS = (w, h) => {
      const top = -h, bot = -h * 0.13, wy = top + h * 0.19, wh = h * 0.39;
      return { top, bot, wy, wh, wins: [{ x: w * 0.04, w: w * 0.14 }, { x: w * 0.2, w: w * 0.14 }, { x: w * 0.56, w: w * 0.19 }], door: { x: w * 0.38, w: w * 0.14 }, shield: { x: w * 0.8, w: w * 0.165 }, wr: h * 0.12 };
    };
    function busMarkup(w, h) {
      const b = BUS(w, h); const { top, bot, wy, wh, wins, door, shield, wr } = b; const r = 16;
      const glass = [...wins.map((o) => rr(o.x, wy, o.w, wh, 5)), rr(door.x + 4, wy + 1, door.w - 8, wh, 3), rr(shield.x, wy, shield.w, wh, 7)];
      const sy = wy + wh + h * 0.1, sh = h * 0.07;
      return `
        <ellipse cx="${w / 2}" cy="2" rx="${w * 0.5}" ry="6" fill="var(--ink)" opacity=".1"/>
        <rect x="3" y="${top + 4}" width="${w - 6}" height="${bot - top - 6}" rx="${r}" fill="#f3e9d8"/>
        <g class="bus-riders"></g>
        <rect x="${w * 0.24}" y="${top - 10}" width="${w * 0.26}" height="14" rx="5" fill="#fff0bf" stroke="var(--ink)" stroke-width="2.6"/>
        <path d="${rr(0, top, w, bot - top, r)} ${glass.join(' ')}" fill-rule="evenodd" fill="#fff0bf" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
        <g fill="#cfe2f6" opacity=".3">${glass.map((d) => `<path d="${d}"/>`).join('')}</g>
        <path d="M${shield.x + 6} ${wy + 6} l10 -4 M${wins[2].x + 6} ${wy + 6} l10 -4" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
        <rect x="2" y="${sy}" width="${door.x - 4}" height="${sh}" fill="var(--heart)" opacity=".8"/><rect x="${door.x + door.w + 2}" y="${sy}" width="${w - door.x - door.w - 4}" height="${sh}" fill="var(--heart)" opacity=".8"/>
        <rect x="${door.x}" y="${wy - 4}" width="${door.w}" height="${bot - wy + 2}" rx="3" fill="none" stroke="var(--ink)" stroke-width="2.6"/>
        <path d="M${door.x + door.w / 2} ${wy - 2} V${bot - 3}" stroke="var(--ink)" stroke-width="2"/>
        <rect x="${shield.x - 2}" y="${top + 5}" width="${shield.w + 2}" height="${h * 0.12}" rx="3" fill="var(--ink)"/>
        <text class="ui-text" x="${shield.x + shield.w / 2}" y="${top + 5 + h * 0.092}" text-anchor="middle" font-size="${(h * 0.088).toFixed(1)}" letter-spacing="1.2" fill="#fff0bf">${C.balcony.busSign}</text>
        <circle cx="${w - 9}" cy="${bot - h * 0.12}" r="${h * 0.045}" fill="#fff5d6" stroke="var(--ink)" stroke-width="1.8"/>
        <rect x="${w - 7}" y="${bot - h * 0.055}" width="9" height="${h * 0.05}" rx="2" fill="#c9d0db" stroke="var(--ink)" stroke-width="1.6"/>
        <path d="M${w - 2} ${wy + 4} h7 v14" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        ${[w * 0.2, w * 0.82].map((x) => `<g class="bus-wheel" data-x="${x}"><circle r="${wr}" fill="var(--ink)"/><circle r="${wr * 0.42}" fill="#c9d0db"/><path d="M0 ${-wr * 0.42} v${wr * 0.84} M${-wr * 0.42} 0 h${wr * 0.84}" stroke="var(--ink)" stroke-width="1.6"/></g>`).join('')}`;
    }
    const potArt = () => `<path d="M-12 0 l3 -16 h18 l3 16 z" fill="${POT}" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/>${Doodle.heart(0, -23, 11)}${Doodle.heart(-8, -19, 8)}${Doodle.heart(9, -19, 8)}`;
    const ropeLoop = (cx, cy, rx, ry, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="var(--ink)" stroke-width="4.6"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="${ROPE}" stroke-width="2.6"/>`;
    // the front half of a loop of rope around him (the back half is behind him)
    const ropeArc = (cx, cy, rx, ry, rot) => { const d = `M${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`; return `<path d="${d}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="var(--ink)" stroke-width="4.8" stroke-linecap="round"/><path d="${d}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="${ROPE}" stroke-width="2.8" stroke-linecap="round"/>`; };
    const ropeLine = (d) => `<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="4.8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${ROPE}" stroke-width="2.8" stroke-linecap="round"/>`;

    function render() {
      const g = L.ground, k = L.catH / 100, x0 = L.x0, WW = L.W - x0;
      const inner = `
        <defs>${Doodle.defs('b')}
          <radialGradient id="b-iris"><stop offset=".55" stop-color="#191717" stop-opacity="0"/><stop offset="1" stop-color="#191717" stop-opacity=".75"/></radialGradient>
        </defs>
        <g transform="translate(${x0} 0)">${Doodle.sky(WW, L.H, 'b', 24, 'dusk')}${Doodle.snowfall(WW, L.H, layout === 'wide' ? 14 : 16, 77)}</g>
        ${back()}
        <g class="bus-layer"><g class="bus" transform="translate(-9999 ${g})">${busMarkup(L.busW, L.busH)}</g></g>
        ${street()}
        <g class="rigging">
          <path class="rope" fill="none" stroke="var(--ink)" stroke-width="4.6" stroke-linecap="round" opacity="0"/>
          <path class="rope-in" fill="none" stroke="${ROPE}" stroke-width="2.6" stroke-linecap="round" opacity="0"/>
          <path class="rope-tex" fill="none" stroke="${ROPE_DARK}" stroke-width="1" stroke-dasharray="2 3.5" stroke-linecap="round" opacity="0"/>
          <path class="rope2" fill="none" stroke="var(--ink)" stroke-width="4.6" stroke-linecap="round" opacity="0"/>
          <path class="rope2-in" fill="none" stroke="${ROPE}" stroke-width="2.6" stroke-linecap="round" opacity="0"/>
          <g class="hook" opacity="0"><g transform="scale(${(0.95 * (k + 0.2)).toFixed(2)})">
            <path d="M0 2.6 v14 M-9 10.5 q0 9 9 9 q9 0 9 -9 M0 19.5 v4" fill="none" stroke="var(--ink)" stroke-width="4.8" stroke-linecap="round"/>
            <path d="M0 2.6 v14 M-9 10.5 q0 9 9 9 q9 0 9 -9 M0 19.5 v4" fill="none" stroke="#c9d0db" stroke-width="2.3" stroke-linecap="round"/>
            <path d="M-9 10.5 l-2.8 -3.8 M9 10.5 l2.8 -3.8" stroke="var(--ink)" stroke-width="3.4" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="3.3" fill="#fff" stroke="var(--ink)" stroke-width="2.4"/>
          </g></g>
        </g>
        <g class="cats"></g>
        <g class="front">
          <g class="shards" opacity="0">
            <ellipse cx="0" cy="-1.5" rx="15" ry="4.2" fill="#8f6b4e" stroke="var(--ink)" stroke-width="1.6"/>
            <g class="shard-l"><path d="M-12 0 L-9 -16 L-1 -16 L-3 -9 L0 -5 L-2 0 Z" fill="${POT}" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/></g>
            <g class="shard-r"><path d="M-2 0 L0 -5 L-3 -9 L-1 -16 L9 -16 L12 0 Z" fill="${POT}" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/></g>
            <g class="petals"><g transform="translate(-26 -4) rotate(-50)">${Doodle.heart(0, 0, 9)}</g><g transform="translate(22 -3) rotate(35)">${Doodle.heart(0, 0, 8)}</g><g transform="translate(5 -8) rotate(80)">${Doodle.heart(0, 0, 10)}</g></g>
          </g>
          <g class="pot-fall" opacity="0">${potArt()}</g>
          <g class="tangle" opacity="0">${ropeArc(0, -15, 47, 10, -7)}${ropeArc(2, -31, 41, 9, 8)}${ropeLine('M44 -20 q15 6 18 20 q3 3 22 1')}</g>
          <g class="rope-coil" opacity="0">${ropeLoop(0, -3, 16, 4.5, 0)}${ropeLoop(2, -6, 12, 3.5, -6)}</g>
        </g>
        <g class="fx"></g>
        <g class="tumbleweed" opacity="0"><circle r="12" fill="#f3e6cc" opacity=".8"/><circle r="12" fill="none" stroke="#b8935c" stroke-width="2.2" stroke-dasharray="4 3"/><circle r="7" fill="none" stroke="#b8935c" stroke-width="2" stroke-dasharray="3 3" transform="rotate(40)"/><path d="M-4 -2 l8 4 M-3 4 l6 -7" stroke="#b8935c" stroke-width="1.6" stroke-linecap="round"/></g>
        <rect class="memory-tint" x="${x0}" y="0" width="${WW}" height="${L.H}" rx="24" fill="#d9c3ea" opacity="0" pointer-events="none"/>
        <rect class="evening" x="${x0}" y="0" width="${WW}" height="${L.H}" rx="24" fill="#2b2a5e" opacity="0" pointer-events="none"/>
        <rect class="iris" x="${x0 - L.W}" y="-${L.H}" width="${WW + L.W * 2}" height="${L.H * 3}" fill="url(#b-iris)" opacity="0" pointer-events="none"/>`;
      container.innerHTML = ''; container.classList.add('caption-top');
      svg = svgEl('svg', { viewBox: L.vb.join(' '), role: 'group', 'aria-label': 'a flashback in Geneva: the blue cat walks the pink cat to her bus, forgets the code of her front door and tries to climb up to her balcony with a grappling hook; she comes back from work and helps him up' });
      svg.innerHTML = inner; container.appendChild(svg);
      if (life) life();
      svg.querySelector('.cats').innerHTML = Cat.markup('blue', 'blue') + Cat.markup('pink', 'pink');
      blue = Cat.attach(svg, 'blue', 'blue', L.catH); pink = Cat.attach(svg, 'pink', 'pink', L.catH * 0.92);
      blue.setExpression('shy'); pink.setExpression('affectionate'); life = Cat.life([blue, pink]);
      const P = G();
      blue.place(P.blueStop - 100, L.ground); pink.place(L.stop - 100, L.ground); blue.faceDir(1); pink.faceDir(1);
      if (state.done || REDUCED || skipping) endState(); else play();
    }

    // ---- camera: the viewBox, same aspect as the stage so nothing reflows
    function cam(x, y, w, dur) {
      const h = w * (L.vb[3] / L.vb[2]); const from = svg.getAttribute('viewBox').split(' ').map(Number);
      x = Math.max(L.x0, Math.min(L.W - w, x)); y = Math.max(0, Math.min(L.H - h, y));   // never look past the edge of the street
      if (dur === 0) { svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`); return Promise.resolve(); }
      return tween(dur, (t) => { const e = ease.inOut(t); svg.setAttribute('viewBox', `${(from[0] + (x - from[0]) * e).toFixed(1)} ${(from[1] + (y - from[1]) * e).toFixed(1)} ${(from[2] + (w - from[2]) * e).toFixed(1)} ${(from[3] + (h - from[3]) * e).toFixed(1)}`); });
    }
    const camHome = (dur) => cam(L.vb[0], L.vb[1], L.vb[2], dur);
    const q = (sel) => svg.querySelector(sel);
    const lit = (color) => { const l = q('.pad-light'); l.setAttribute('fill', color); };
    async function pressKeys(n, gap) {
      const g0 = gen; const keys = [...svg.querySelectorAll('.key')];
      for (let i = 0; i < n && g0 === gen; i++) {
        const k = keys[Math.floor(Math.random() * keys.length)]; k.setAttribute('fill', '#ffe08a'); Sound.play('key');
        await tween(110, (t) => { const b = Math.sin(Math.PI * t); blue.set({ raiseR: 1, bob: -1.5 * b, tilt: -2 * b }); });
        k.setAttribute('fill', '#fff'); await wait(gap);
      }
    }
    async function errorBeep() { lit('#ff8a8a'); Sound.play('buzz'); flash(q('.keypad'), 'shake', 380); await wait(520); lit('#cfd8e3'); }
    const walkDur = (cat, x, speed) => Math.max(500, (Math.abs(x - cat.s.x) / (L.catH * speed)) * 1000);
    async function walkTo(cat, x, speed = 1.45, dur = walkDur(cat, x, speed)) {
      const path = svgEl('path', { d: `M${cat.s.x.toFixed(1)} ${L.ground} L${x.toFixed(1)} ${L.ground}`, fill: 'none', stroke: 'none' }); svg.appendChild(path);
      try { await cat.walkAlong(path, 0, 1, dur, { stepHz: 1.6 }); } finally { path.remove(); }
    }

    // ---- the bus
    function busAt(x, bob = 0) {
      busX = x; q('.bus').setAttribute('transform', `translate(${x.toFixed(1)} ${(L.ground + bob).toFixed(2)})`);
      const wr = BUS(L.busW, L.busH).wr, spin = (x / (2 * Math.PI * wr)) * 360;
      svg.querySelectorAll('.bus-wheel').forEach((w) => w.setAttribute('transform', `translate(${w.dataset.x} ${(-wr + 1.5).toFixed(1)}) rotate(${spin.toFixed(0)})`));
    }
    const busDrive = (x0, x1, dur, mode) => tween(dur, (t) => { const e = mode === 'in' ? ease.out(t) : ease.in(t); busAt(x0 + (x1 - x0) * e, Math.sin(t * dur * 0.04) * 0.6 * (mode === 'in' ? 1 - t : 1)); });
    const busStopX = () => L.stop - G().busDoor;
    // her seat: by the window just ahead of the door, a little smaller (she is inside)
    function pinkIntoBus() { svg.querySelector('.bus-riders').appendChild(pink.el); pink.place(L.busW * 0.655, -L.busH * 0.3); pink.set({ sx: 0.8, sy: 0.8, lean: 0, tilt: 0 }); pink.faceDir(1); }
    function pinkOutOfBus() { const cats = q('.cats'); if (pink.el.parentNode !== cats) cats.appendChild(pink.el); }

    // ---- the grappling hook and its rope
    function drawRope(cls, a, b, sag = 0) {
      const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${((a.x + b.x) / 2).toFixed(1)} ${((a.y + b.y) / 2 + sag).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      const ids = cls === 'rope' ? ['.rope', '.rope-in', '.rope-tex'] : ['.rope2', '.rope2-in'];
      ids.forEach((s) => { const el = q(s); el.setAttribute('d', d); el.setAttribute('opacity', '1'); });
    }
    function hideRope(cls) { (cls === 'rope' ? ['.rope', '.rope-in', '.rope-tex'] : ['.rope2', '.rope2-in']).forEach((s) => q(s).setAttribute('opacity', '0')); }
    function hookAt(p, rot) { const h = q('.hook'); h.setAttribute('opacity', '1'); h.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${rot.toFixed(1)})`); }
    // a caught hook: ring towards whoever holds the rope, prongs pointing away (over the rim, over the rail)
    const awayFrom = (h, p) => (Math.atan2(p.y - h.y, p.x - h.x) * 180) / Math.PI + 90;
    const frontPaw = () => blue.pawPoint('r');                                  // his raised front paw (he faces right)
    const restPaw = () => { const k = L.catH / 100; return { x: blue.s.x + 22 * k * blue.s.flip, y: blue.s.y - 28 * k * blue.s.sy }; };
    const holdPoint = () => { const k = L.catH / 100; return { x: blue.s.x + 10 * k, y: blue.s.y - 70 * k * blue.s.sy }; };   // between both raised paws
    const headTop = () => { const k = L.catH / 100; return { x: blue.s.x + 4 * k * blue.s.flip, y: blue.s.y - 100 * k * blue.s.sy }; };
    const qpt = (S, Cc, T, t) => ({ x: (1 - t) * (1 - t) * S.x + 2 * t * (1 - t) * Cc.x + t * t * T.x, y: (1 - t) * (1 - t) * S.y + 2 * t * (1 - t) * Cc.y + t * t * T.y });
    async function swing(turns, dur) {
      const k = L.catH / 100; const R = 20 * k; let last = frontPaw();
      await tween(dur, (t) => { const c = frontPaw(); const th = -Math.PI / 2 + turns * 2 * Math.PI * t; const p = { x: c.x + R * Math.cos(th), y: c.y - 12 * k + R * 0.5 * Math.sin(th) }; hookAt(p, (th * 180) / Math.PI); drawRope('rope', c, p); last = p; });
      return last;
    }
    async function throwHook(from, to, dur, spin = 540) {
      const Cc = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 70 };
      await tween(dur, (t) => { const p = qpt(from, Cc, to, t); hookAt(p, spin * t); drawRope('rope', frontPaw(), p, 6 * (1 - t)); });
    }
    function orbit(ms) {
      const fx = q('.fx'); const g0 = svgEl('g', { class: 'orbit' }); g0.innerHTML = Doodle.star(0, 0, 13); fx.appendChild(g0);
      const t0 = performance.now(); let raf = null;
      const stepf = (now) => { const t = (now - t0) / 1000; const h = headTop(); const r = L.catH * 0.42; g0.setAttribute('transform', `translate(${(h.x + Math.cos(t * 5) * r).toFixed(1)} ${(h.y - 18 + Math.sin(t * 5) * r * 0.3).toFixed(1)}) rotate(${(t * 240).toFixed(0)})`); if (now - t0 < ms) raf = requestAnimationFrame(stepf); else g0.remove(); };
      raf = requestAnimationFrame(stepf);
      return () => { cancelAnimationFrame(raf); g0.remove(); };
    }
    function puff(x, y, n = 8, col = '#fff') {
      const fx = q('.fx'); const g0 = svgEl('g'); fx.appendChild(g0);
      const bits = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + Math.random() * 0.4; const c = svgEl('circle', { r: 1.8 + Math.random() * 2.4, fill: col, stroke: col === '#fff' ? '#cfe2f6' : 'var(--ink)', 'stroke-width': 1.1 }); g0.appendChild(c); return { c, vx: Math.cos(a) * (22 + Math.random() * 20), vy: Math.sin(a) * (12 + Math.random() * 12) - 16 }; });
      tween(460, (t) => bits.forEach((b) => { b.c.setAttribute('cx', (x + b.vx * t).toFixed(1)); b.c.setAttribute('cy', (y + b.vy * t + 46 * t * t).toFixed(1)); b.c.setAttribute('opacity', String(1 - t)); })).then(() => g0.remove());
    }
    const setT = (sel, tr) => q(sel).setAttribute('transform', tr);
    // an exasperated sigh: a little cloud that drifts up and away from her mouth
    function sighPuff(cat) {
      const k = L.catH / 100, dir = cat.kind === 'pink' ? -cat.s.flip : cat.s.flip;
      const x = cat.s.x + 30 * k * dir, y = cat.s.y - 46 * k; const g0 = svgEl('g'); q('.fx').appendChild(g0);
      g0.innerHTML = `<path d="M0 0 c-7 0 -9 -7 -4 -10 c1 -7 11 -8 14 -3 c6 -3 11 3 8 8 c4 1 3 5 -1 5 z" fill="#fff" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/>`;
      tween(1300, (t) => { const e = ease.out(t); g0.setAttribute('transform', `translate(${(x + 26 * e * dir).toFixed(1)} ${(y - 22 * e).toFixed(1)}) scale(${(0.6 + 0.6 * e).toFixed(2)})`); g0.setAttribute('opacity', String(t < 0.7 ? 1 : (1 - t) / 0.3)); }).then(() => g0.remove());
    }

    // ---- the timeline. `g` is this run's generation; any step after a skip returns early.
    async function play() {
      const g = ++gen; const alive = () => g === gen && svg.isConnected;
      const step = async (p) => { await p; if (!alive()) throw new Error('skipped'); };
      state.running = true;
      const P = G(); const k = P.k; const fx = q('.fx'); const tint = q('.memory-tint'); const iris = q('.iris');
      try {
        // a memory: the picture goes a touch lavender and irises in, down the street at the bus stop
        cam(L.x0, 0, L.vb[2], 0);
        tint.setAttribute('opacity', '0.18'); iris.setAttribute('opacity', '1');
        ctx.caption(CAP.arrive);
        // A. he walks her to the bus (she has work)
        await step(Promise.all([tween(700, (t) => iris.setAttribute('opacity', String(1 - ease.out(t)))), walkTo(pink, L.stop, 1.2), walkTo(blue, P.blueStop, 1.2)]));
        pink.faceDir(-1);
        await step(Promise.all([blue.lookAt(1, 220), pink.lookAt(1, 220)])); await step(wait(260));
        Sound.play('engine'); busAt(L.x0 - L.busW - 40);
        await step(busDrive(busX, busStopX(), 1400, 'in')); Sound.play('brake');
        ctx.caption(CAP.bus);
        await step(Promise.all([blue.nuzzle(1, 260), pink.nuzzle(-1, 260)])); Sound.play('mew'); spawnHearts(fx, (blue.s.x + pink.s.x) / 2, L.ground - L.catH - 4, 1, 8);
        await step(wait(380)); await step(Promise.all([blue.leanTo(0, 180), pink.leanTo(0, 180), blue.tiltTo(0, 180), pink.tiltTo(0, 180)]));
        // she hops on (a little hop through the door) and turns up at the window seat
        Sound.play('hop'); pink.faceDir(1); const py0 = pink.s.y;
        await step(tween(340, (t) => { const e = ease.inOut(t); pink.set({ y: py0 - 14 * Math.sin(Math.PI * t), sx: 1 - 0.2 * e, sy: 1 - 0.2 * e }); pink.el.setAttribute('opacity', String(1 - e)); }));
        pinkIntoBus(); pink.setExpression('delighted'); pink.el.setAttribute('opacity', '0');
        await step(tween(220, (t) => pink.el.setAttribute('opacity', String(t))));
        await step(pink.lookAtViewer(160));
        // she waves from the window; he waves back
        await step(Promise.all([pink.wave('l', 2), (async () => { await wait(160); blue.setExpression('affectionate'); await blue.wave('r', 2); })()]));
        Sound.play('ding'); await step(wait(260));
        Sound.play('engine');
        await step(busDrive(busX, L.W + 60, 1600, 'out'));
        // B. back to her place (on a phone the camera walks along with him)
        ctx.caption(CAP.back);
        blue.setExpression('proud');
        const wd = walkDur(blue, L.standX, 1.45);
        await step(Promise.all([walkTo(blue, L.standX, 1.45, wd), L.x0 < 0 ? cam(L.vb[0], 0, L.vb[2], wd) : null]));
        await step(blue.lookAt(1, 220)); await step(blue.nod()); Sound.play('hmm');
        await step(wait(200));
        // he presses a few buttons, very sure of himself
        blue.setExpression('determined'); await step(pressKeys(4, 140));
        Sound.play('beepOk'); lit('#9fe3b0'); await step(wait(380));
        await step(errorBeep());
        blue.set({ raiseR: 0 }); blue.setExpression('calm'); await step(blue.blinkOnce()); await step(wait(420));
        // again, a little faster
        await step(pressKeys(5, 90)); await step(errorBeep()); blue.set({ raiseR: 0 });
        ctx.caption(CAP.problem);
        // the camera creeps in; he looks at the keypad, at us, at the keypad
        const zx = L.standX - 80, zy = L.ground + 22 - 260 * (L.vb[3] / L.vb[2]);
        const creep = cam(zx, zy, 260, 2200);
        await step(wait(420)); await step(blue.lookAt(1, 240)); await step(wait(420));
        blue.setExpression('surprised'); await step(blue.lookAtViewer(260)); await step(wait(640));
        await step(blue.lookAt(1, 240)); blue.setExpression('sheepish'); Sound.play('plink');
        const drop = blue.sweatDrop(2400);
        await step(creep);
        ctx.caption(CAP.forgot);
        // the awkward pause, with a tumbleweed
        const tw = q('.tumbleweed'); tw.setAttribute('opacity', '1'); Sound.play('tumble');
        await step(tween(1400, (t) => { const x = zx - 20 + 300 * t; tw.setAttribute('transform', `translate(${x.toFixed(1)} ${(L.ground - 11 - Math.abs(Math.sin(t * 9)) * 6).toFixed(1)}) rotate(${(t * 720).toFixed(0)})`); }));
        tw.setAttribute('opacity', '0');
        await step(drop);
        // C. the idea: he looks up, spots the balcony. A perfectly reasonable backup plan.
        await step(camHome(800));
        blue.setExpression('surprised'); await step(Promise.all([blue.lookUp(1, 300), blue.tiltTo(-10, 300)])); Sound.play('plink');
        await step(wait(300)); await step(blue.perk());
        ctx.caption(CAP.plan);
        await step(wait(500));
        // dramatic: the music stings, the camera dives onto his face, the hard hat lands, a sparkle crosses his eyes
        Sound.play('sting');
        const fh = 170, fw = fh / (L.vb[3] / L.vb[2]);   // sized by height so the hat clears the caption on both layouts
        await step(cam(L.standX + 16 - fw / 2, L.ground + 10 - fh, fw, 650));
        blue.setExpression('determined'); await step(Promise.all([blue.gazeReset(200), blue.tiltTo(-6, 200)]));
        await step(blue.helmetOn());
        await step(wait(160));
        Sound.play('sparkle'); const st = svgEl('g', { transform: `translate(${(blue.s.x + 24 * blue.scale).toFixed(1)} ${(blue.s.y - 66 * blue.scale).toFixed(1)})` });
        st.innerHTML = `<g class="fx-star"><path d="M0 -10 v20 M-10 0 h20 M-6 -6 l12 12 M6 -6 l-12 12" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M0 -10 v20 M-10 0 h20" stroke="var(--heart)" stroke-width="1.6" stroke-linecap="round"/></g>`; fx.appendChild(st); setTimeout(() => st.remove(), 1000);
        iris.setAttribute('opacity', '0.6'); await step(wait(760)); iris.setAttribute('opacity', '0');
        await step(camHome(700));
        // D. the grappling hook (of course he brought one). He swings it, throws it up...
        blue.setExpression('proud'); blue.set({ raiseR: 1, tilt: 0 }); Sound.play('pop');
        hookAt(frontPaw(), 0); drawRope('rope', frontPaw(), frontPaw());
        await step(wait(200));
        Sound.play('swish'); let rel = await swing(2, 760); if (!alive()) throw new Error('skipped');
        // ...and it catches the rim of the flower pot
        const rim = { x: P.potBase.x - 8, y: P.potBase.y - 19 };
        Sound.play('toss'); await step(throwHook(rel, rim, 560)); Sound.play('plink');
        hookAt(rim, awayFrom(rim, frontPaw()));
        await step(wait(260));
        // he tugs; the pot tips over the edge and falls; crash
        blue.setExpression('determined');
        await step(tween(220, (t) => { blue.set({ lean: -10 * ease.out(t) }); drawRope('rope', frontPaw(), rim); }));
        q('.house .flowerpot').setAttribute('opacity', '0'); const pot = q('.pot-fall'); pot.setAttribute('opacity', '1');
        const rot = (px, py, a) => { const r = (a * Math.PI) / 180; return { x: px * Math.cos(r) - py * Math.sin(r), y: px * Math.sin(r) + py * Math.cos(r) }; };
        // the pot turns about its front corner; the hook stays on its rim
        const potPose = (x, y, a) => { pot.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)} -12 0)`); const o = rot(4, -19, a); const hp = { x: x - 12 + o.x, y: y + o.y }; hookAt(hp, awayFrom(hp, frontPaw())); drawRope('rope', frontPaw(), hp); return hp; };
        await step(tween(260, (t) => potPose(P.potBase.x, P.potBase.y, -38 * ease.in(t))));
        Sound.play('whoosh'); let hp = potPose(P.potBase.x, P.potBase.y, -38);
        await step(tween(620, (t) => { const x = P.potBase.x + (P.potLand.x - P.potBase.x) * t, y = P.potBase.y + (P.potLand.y - P.potBase.y) * t * t; hp = potPose(x, y, -38 - 250 * t); }));
        pot.setAttribute('opacity', '0'); Sound.play('crash'); puff(P.potLand.x, P.potLand.y - 6, 9, '#8f6b4e');
        const sh = q('.shards'); sh.setAttribute('opacity', '1'); setT('.shards', `translate(${P.potLand.x} ${P.potLand.y})`);
        const hookRest = { x: P.potLand.x - 30, y: L.ground - 10 }, hr0 = awayFrom(hp, frontPaw()), hr1 = hr0 + ((((-90 - hr0) % 360) + 540) % 360 - 180);
        await step(tween(260, (t) => { const e = ease.out(t); setT('.shard-l', `translate(${(-10 * e).toFixed(1)} 0) rotate(${(-26 * e).toFixed(1)} -12 0)`); setT('.shard-r', `translate(${(11 * e).toFixed(1)} 0) rotate(${(22 * e).toFixed(1)} 12 0)`); const p = { x: hp.x + (hookRest.x - hp.x) * e, y: hp.y + (hookRest.y - hp.y) * e }; hookAt(p, hr0 + (hr1 - hr0) * e); drawRope('rope', frontPaw(), p, 24 * e); }));
        blue.set({ lean: 0 }); blue.setExpression('surprised'); await step(Promise.all([blue.lookDown(0.6, 220), blue.lookAt(1, 220)]));
        await step(wait(520));
        blue.setExpression('sheepish'); await step(Promise.all([blue.gazeReset(200), blue.lookAtViewer(220)])); Sound.play('plink'); const drop2 = blue.sweatDrop(1500);
        ctx.caption(CAP.setback);
        blue.set({ raiseR: 0 }); drawRope('rope', restPaw(), hookRest, 8);
        await step(wait(900));
        // E. again: he reels the hook in, swings, throws... and it catches the railing. Clank.
        blue.setExpression('determined'); await step(blue.lookAt(1, 160)); Sound.play('rustle');
        const near = { x: restPaw().x + 16 * k, y: L.ground - 10 };
        await step(tween(460, (t) => { const e = ease.inOut(t); const p = { x: hookRest.x + (near.x - hookRest.x) * e, y: hookRest.y + (near.y - hookRest.y) * e - 3 * Math.sin(Math.PI * t * 3) }; hookAt(p, hr1 + 10 * Math.sin(Math.PI * t * 3)); drawRope('rope', restPaw(), p, 6); }));
        await step(drop2);
        blue.set({ raiseR: 1 }); hookAt(frontPaw(), 0); drawRope('rope', frontPaw(), frontPaw()); Sound.play('pop');
        Sound.play('swish'); rel = await swing(1, 520); if (!alive()) throw new Error('skipped');
        Sound.play('toss'); await step(throwHook(rel, P.railHook, 540, 380)); Sound.play('clank');
        hookAt(P.railHook, awayFrom(P.railHook, frontPaw())); drawRope('rope', frontPaw(), P.railHook);
        // two tugs: it holds. He is very pleased with himself.
        for (let i = 0; i < 2; i++) { await step(tween(170, (t) => { blue.set({ lean: -9 * Math.sin(Math.PI * t) }); drawRope('rope', frontPaw(), P.railHook); })); await step(wait(90)); }
        blue.setExpression('proud'); await step(blue.nod()); await step(wait(120));
        // the climb: paw over paw, up the rope
        blue.setExpression('determined'); blue.set({ raiseL: 1, raiseR: 1 });
        const A0 = holdPoint(), foot0 = { x: blue.s.x, y: blue.s.y };
        const climbTo = (f) => { const A = { x: A0.x + (P.railHook.x - A0.x) * f, y: A0.y + (P.railHook.y - A0.y) * f }; blue.set({ x: A.x - 10 * k, y: A.y + 70 * k, air: L.ground - (A.y + 70 * k) }); hookAt(P.railHook, awayFrom(P.railHook, holdPoint())); drawRope('rope', holdPoint(), P.railHook); drawRope('rope2', holdPoint(), { x: foot0.x - 6, y: L.ground - 2 }, 18); };
        let f = 0;
        for (let i = 0; i < 6; i++) {
          const f0 = f; f += 0.072; Sound.play('rustle');
          await step(tween(230, (t) => { const e = ease.out(t); climbTo(f0 + (f - f0) * e); blue.set({ lean: (i % 2 ? 4 : -4) * Math.sin(Math.PI * t), sy: 1.04, sx: 0.96 }); }));
        }
        await step(wait(160)); blue.setExpression('proud'); await step(blue.lookAtViewer(200)); await step(wait(360));   // look at me go
        // the hook slips: a creak, a wobble, and it pops off the railing
        Sound.play('creak'); blue.setExpression('surprised');
        const hr = awayFrom(P.railHook, holdPoint());
        await step(tween(420, (t) => hookAt(P.railHook, hr + 12 * Math.sin(t * Math.PI * 6))));
        Sound.play('pop'); const popAt = { x: P.railHook.x + 4, y: P.railHook.y - 14 };
        await step(tween(160, (t) => { const p = { x: P.railHook.x + (popAt.x - P.railHook.x) * t, y: P.railHook.y + (popAt.y - P.railHook.y) * t }; hookAt(p, hr + 40 * t); drawRope('rope', holdPoint(), p, 10 * t); }));
        await step(wait(220));   // a cartoon moment in mid-air
        // down he goes; the rope and the hook come after him
        const y0 = blue.s.y;
        hideRope('rope2'); Sound.play('whoosh');
        const fallHook = (t) => { const tt = Math.max(0, (t - 0.1) / 0.9); const ht = headTop(); const p = { x: popAt.x + (ht.x - popAt.x) * tt, y: popAt.y + (ht.y - 6 - popAt.y) * tt * tt }; hookAt(p, hr + 40 + 400 * tt); drawRope('rope', holdPoint(), p, 30 * (1 - tt)); };
        await step(tween(360, (t) => { const e = t * t; blue.set({ y: y0 + (L.ground - y0) * e, air: (L.ground - y0) * (1 - e), sy: 1.04, sx: 0.96 }); fallHook(t * 0.5); }));
        Sound.play('thunk'); blue.set({ y: L.ground, raiseL: 0, raiseR: 0, air: 0, lean: 0 });
        tween(240, (t) => { const e = ease.out(t); blue.set({ sy: 0.58 + 0.1 * e, sx: 1.22 - 0.08 * e }); });
        await step(tween(260, (t) => fallHook(0.5 + 0.5 * t)));
        // bonk: the hook lands on his hat and the rope drops around him in loops
        Sound.play('clank'); hideRope('rope');
        const tg = q('.tangle'); tg.setAttribute('opacity', '1'); tg.setAttribute('transform', `translate(${blue.s.x.toFixed(1)} ${L.ground})`);
        const ht = headTop(); hookAt({ x: ht.x + 8 * k, y: ht.y - 7 }, 166);
        puff(ht.x, ht.y - 8, 6);
        blue.setExpression('dizzy'); star = orbit(2200);
        ctx.caption(CAP.setback2);
        await step(wait(1900));
        // F. a few hours later. Evening. He is still sitting there.
        ctx.caption(CAP.later); if (star) { star(); star = null; }
        blue.setExpression('sheepish'); await step(tween(900, (t) => q('.evening').setAttribute('opacity', (0.16 * ease.inOut(t)).toFixed(3))));
        await step(wait(300));
        // she comes back from work: the bus pulls in at the stop (on a phone, just out of the picture), she gets
        // off, and the bus drives on past the house while she walks up
        pink.setExpression('calm'); pink.faceDir(1); pink.lookAtViewer(1);
        Sound.play('engine'); busAt(L.x0 - L.busW - 40);
        await step(busDrive(busX, busStopX(), 1300, 'in')); Sound.play('brake');
        await step(wait(200));
        pinkOutOfBus(); pink.el.setAttribute('opacity', '0'); pink.faceDir(1); pink.place(L.stop, L.ground); pink.set({ sx: 0.85, sy: 0.85 }); Sound.play('hop');
        await step(tween(300, (t) => { const e = ease.out(t); pink.el.setAttribute('opacity', String(e)); pink.set({ sx: 0.85 + 0.15 * e, sy: 0.85 + 0.15 * e, y: L.ground - 10 * Math.sin(Math.PI * t) }); }));
        pink.set({ y: L.ground, sx: 1, sy: 1 });
        Sound.play('ding');
        const away = (async () => { await wait(300); if (!alive()) return; Sound.play('engine'); await busDrive(busX, L.W + 60, 1700, 'out'); })();
        await step(walkTo(pink, blue.s.x - 0.95 * L.catH, 1.35));
        // she sees it all: the pot, the rope, him
        pink.setExpression('surprised'); await step(Promise.all([pink.lookAt(1, 260), pink.lookDown(0.5, 260)])); await step(wait(520));
        await step(pink.gazeReset(200)); await step(wait(240));
        blue.setExpression('sheepish'); await step(blue.lookAt(-1, 200));
        await step(pink.lookAtViewer(220));
        // oh. my. gosh.
        ctx.caption(CAP.her); pink.setExpression('stern'); pink.coverFace(1); Sound.play('sigh'); pink.sweatDrop(1300); sighPuff(pink);
        await step(pink.shakeHead(3, 1250));
        await step(wait(300));
        pink.coverFace(0); pink.setExpression('pleased'); await step(pink.blinkOnce()); await step(pink.lookAt(1, 200));
        // she steps in, lifts the rope off him (over his head) and sets it down beside him...
        const px1 = pink.s.x, px2 = blue.s.x - 0.8 * L.catH;
        await step(tween(260, (t) => pink.set({ x: px1 + (px2 - px1) * ease.inOut(t) })));
        await step(pink.leanTo(8, 200)); pink.set({ raiseR: 1 }); Sound.play('rustle');
        const bx = blue.s.x, dest = { x: bx + 0.62 * L.catH, y: L.ground }, hk0 = { x: ht.x + 8 * k, y: ht.y - 7 };
        await step(tween(320, (t) => { const e = ease.inOut(t); tg.setAttribute('transform', `translate(${bx.toFixed(1)} ${(L.ground - 44 * e).toFixed(1)})`); hookAt({ x: hk0.x, y: hk0.y - 44 * e }, 166); }));
        await step(tween(320, (t) => { const e = ease.inOut(t); const x = bx + (dest.x - bx) * e, y = L.ground - 44 * (1 - e) - 14 * Math.sin(Math.PI * t); tg.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(1 - 0.55 * e).toFixed(2)})`); tg.setAttribute('opacity', String(1 - e * e)); hookAt({ x: hk0.x + (dest.x + 6 - hk0.x) * e, y: hk0.y - 44 + (L.ground - 13 - hk0.y + 44) * e }, 166 - 70 * e); }));
        tg.setAttribute('opacity', '0'); const coil = q('.rope-coil'); coil.setAttribute('opacity', '1'); coil.setAttribute('transform', `translate(${dest.x.toFixed(1)} ${dest.y.toFixed(1)})`);
        hookAt({ x: dest.x + 6, y: L.ground - 13 }, 96);
        // ...and helps him up
        blue.setExpression('shy'); await step(blue.lookUp(0.6, 200));
        blue.faceDir(-1); Sound.play('hop');
        await step(tween(320, (t) => { const e = ease.out(t); blue.set({ sy: 0.68 + 0.32 * e + 0.05 * Math.sin(Math.PI * t), sx: 1.14 - 0.14 * e, y: L.ground - 8 * Math.sin(Math.PI * t) }); }));
        blue.set({ y: L.ground, sx: 1, sy: 1 }); pink.set({ raiseR: 0 }); await step(Promise.all([blue.gazeReset(160), pink.leanTo(0, 160)]));
        blue.setExpression('affectionate'); pink.setExpression('affectionate');
        await step(Promise.all([blue.nuzzle(-1, 380), pink.nuzzle(1, 380)])); Sound.play('purr');
        spawnHearts(fx, (blue.s.x + pink.s.x) / 2, L.ground - L.catH - 6, 3, 18);
        await step(away);
        await step(wait(900));
        ctx.caption('');
        finish();
      } catch (e) { if (e && e.message !== 'skipped') throw e; }
    }
    // the end state everything lands on: evening; the pot in pieces by the door, the rope coiled on the ground;
    // he stands (hat on) and she nuzzles him; the bus is gone
    function endState() {
      gen++; if (star) { star(); star = null; }
      const P = G();
      svg.setAttribute('viewBox', L.vb.join(' '));
      q('.memory-tint').setAttribute('opacity', '0.18'); q('.iris').setAttribute('opacity', '0'); q('.tumbleweed').setAttribute('opacity', '0'); q('.evening').setAttribute('opacity', '0.16');
      busAt(L.W + 400); hideRope('rope'); hideRope('rope2'); q('.pot-fall').setAttribute('opacity', '0'); q('.tangle').setAttribute('opacity', '0');
      q('.house .flowerpot').setAttribute('opacity', '0');
      q('.shards').setAttribute('opacity', '1'); setT('.shards', `translate(${P.potLand.x} ${P.potLand.y})`); setT('.shard-l', 'translate(-10 0) rotate(-26 -12 0)'); setT('.shard-r', 'translate(11 0) rotate(22 12 0)');
      blue.place(P.sitX, L.ground); blue.faceDir(-1); blue.setExpression('affectionate');
      blue.set({ raiseR: 0, raiseL: 0, helmet: 1, helmetDrop: 0, sweat: 0, gaze: 0, gazeY: 0, tilt: 0, lean: 0, sx: 1, sy: 1, bob: 0, earL: 0, earR: 0, air: 0, cover: 0 });
      const cx = P.sitX + 0.62 * L.catH; const coil = q('.rope-coil'); coil.setAttribute('opacity', '1'); coil.setAttribute('transform', `translate(${cx.toFixed(1)} ${L.ground})`);
      hookAt({ x: cx + 6, y: L.ground - 13 }, 96);
      pinkOutOfBus(); pink.el.setAttribute('opacity', '1'); pink.place(P.sitX - 0.8 * L.catH, L.ground); pink.faceDir(1); pink.setExpression('affectionate');
      pink.set({ sx: 1, sy: 1, gaze: 0, gazeY: 0, tilt: 0, lean: 0, raiseL: 0, raiseR: 0, cover: 0 });
      blue.set({ lean: -7 }); blue.tiltTo(-6, 1); pink.set({ lean: 7 }); pink.tiltTo(6, 1);
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
      unmount() { gen++; if (star) { star(); star = null; } if (life) life(); life = null; },
      // a skip draws the scene afresh in its end state, so nothing still in flight can touch it
      skip() { if (state.done) return; gen++; skipping = true; if (star) { star(); star = null; } render(); if (TA.fitScene) TA.fitScene(); },
    };
  });
})();
