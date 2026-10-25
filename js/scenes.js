/* ------------------------------------------------------------
   a tiny adventure — the scenes
   prologue · map · lane · stairs · epilogue   (rink lives in rink.js)
   Every scene is one SVG viewBox; cats, props, targets, effects and
   hit areas share that coordinate space. A scene renders from its
   own small state for the current composition ('wide' / 'tall'),
   so a resize re-renders without losing progress.
   ------------------------------------------------------------ */
(() => {
  'use strict';
  const TA = window.TA;
  const C = window.TA_CONTENT;
  const { svgEl, tween, wait, ease, spawnHearts, spawnStar, Doodle, flash, REDUCED } = TA.helpers;
  const Sound = TA.Sound;
  const Cat = TA.cat;

  const focusRing = (x, y, w, h, r = 12) => `<rect class="focus-ring" x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="${r}"/>`;
  function onActivate(el, fn) {
    el.addEventListener('click', (e) => { e.preventDefault(); fn(); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  }
  function makeSvg(container, viewBox, inner, label) {
    container.innerHTML = '';
    const svg = svgEl('svg', { viewBox, 'aria-label': label || '', role: 'group' });
    svg.innerHTML = inner;
    container.appendChild(svg);
    return svg;
  }
  function setT(el, x, y, extra = '') { el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) ${extra}`); }
  // mount two cats into the <g class="cats"> of a scene
  function mountCats(svg, h, blueExpr = 'shy', pinkExpr = 'calm') {
    const host = svg.querySelector('.cats');
    host.innerHTML = Cat.markup('blue', 'blue') + Cat.markup('pink', 'pink');
    const blue = Cat.attach(svg, 'blue', 'blue', h), pink = Cat.attach(svg, 'pink', 'pink', h);
    blue.setExpression(blueExpr); pink.setExpression(pinkExpr);
    return { blue, pink, stop: Cat.life([blue, pink]) };
  }
  function sparkles(svg, x, y, n = 5, spread = 40) {
    const fx = svg.querySelector('.fx');
    for (let i = 0; i < n; i++) {
      const sx = x + (Math.random() - 0.5) * spread, sy = y + (Math.random() - 0.5) * spread * 0.5;
      const g = svgEl('g', { transform: `translate(${sx.toFixed(1)} ${sy.toFixed(1)})` });
      g.innerHTML = `<g class="fx-star" style="animation-delay:${i * 60}ms"><path d="M0 -6 v12 M-6 0 h12" stroke="${i % 2 ? '#f49fbb' : '#8fbdf0'}" stroke-width="2.4" stroke-linecap="round"/></g>`;
      fx.appendChild(g); setTimeout(() => g.remove(), 1100);
    }
  }
  // the invitation card and envelope as drawn in the booklet, with live text
  function invitationMarkup(x, y, w, tilt = -2, p = 'd') {
    const h = w * 1.18, ex = x - w * 0.12, ew = w * 1.24, eh = w * 0.62, ey = y + h * 0.56;
    const fs = w * 0.085;
    return `<g transform="rotate(${tilt} ${x + w / 2} ${y + h / 2})">
      <path d="M${x + 7} ${y + 5} h${w - 8} q${w * 0.04} 0 ${w * 0.04} ${w * 0.04} v${h - 10} q0 ${w * 0.04} -${w * 0.04} ${w * 0.04} h-${w - 8} q-${w * 0.04} 0 -${w * 0.04} -${w * 0.04} v-${h - 10} q0 -${w * 0.04} ${w * 0.04} -${w * 0.04} z" fill="var(--ink)" opacity=".08"/>
      <path d="M${x + 4} ${y} h${w - 8} q${w * 0.04} 0 ${w * 0.04} ${w * 0.04} v${h - 10} q0 ${w * 0.04} -${w * 0.04} ${w * 0.04} h-${w - 8} q-${w * 0.04} 0 -${w * 0.04} -${w * 0.04} v-${h - 10} q0 -${w * 0.04} ${w * 0.04} -${w * 0.04} z" fill="url(#${p}-paper)" class="ink" stroke="var(--ink)" stroke-width="3.2"/>
      <g text-anchor="middle" fill="var(--ink)">
        <text x="${x + w / 2}" y="${y + h * 0.2}" font-size="${fs}">will you go to</text>
        <text x="${x + w / 2}" y="${y + h * 0.31}" font-size="${fs * 1.18}">art on ice</text>
        <text x="${x + w / 2}" y="${y + h * 0.42}" font-size="${fs}">with me?</text>
        ${Doodle.heart(x + w / 2, y + h * 0.5, fs * 1.1)}
        <text x="${x + w / 2}" y="${y + h * 0.62}" font-size="${fs * 0.72}">friday the 5th or</text>
        <text x="${x + w / 2}" y="${y + h * 0.7}" font-size="${fs * 0.72}">saturday the 6th</text>
        <text x="${x + w / 2}" y="${y + h * 0.79}" font-size="${fs * 0.8}">zurich</text>
      </g>
      ${Doodle.envelopeOpen(ex, ey, ew, eh, 3.2).replace('class="envelope-open"', 'class="envelope-open" opacity="0"')}
      <path d="M${ex} ${ey} h${ew} v${eh - 6} q0 6 -6 6 h-${ew - 12} q-6 0 -6 -6 z" fill="url(#${p}-paper)" class="ink" stroke="var(--ink)" stroke-width="3.2"/>
      <path d="M${ex + 3} ${ey + 3} L${ex + ew / 2} ${ey + eh * 0.58} L${ex + ew - 3} ${ey + 3}" fill="none" class="ink" stroke="var(--ink)" stroke-width="3.2"/>
      <path d="M${ex + 3} ${ey + eh - 3} L${ex + ew * 0.4} ${ey + eh * 0.5} M${ex + ew - 3} ${ey + eh - 3} L${ex + ew * 0.6} ${ey + eh * 0.5}" fill="none" class="ink" stroke="var(--ink)" stroke-width="2.8" opacity=".75"/>
      ${Doodle.heart(ex + ew / 2, ey + eh * 0.6, eh * 0.36)}
    </g>`;
  }

  /* ============================================================
     PROLOGUE — the secret pocket
     ============================================================ */
  TA.registerScene('prologue', () => {
    let life = null, svg, cats, timer = null;
    return {
      mount(container, layout) {
        const wide = layout === 'wide';
        const W = wide ? 600 : 420;
        const cw = wide ? 240 : 196; const cx = W / 2 - cw / 2, cy = wide ? 44 : 48;
        const catH = wide ? 112 : 96;
        const ex = cx - cw * 0.12, ew = cw * 1.24, ey = cy + cw * 1.18 * 0.56, eh = cw * 0.62; const ground = ey + eh + 6;
        const Hh = ground + 22;
        const pocket = { x: ex + ew * 0.78, y: ey + eh * 0.78 };
        const inner = `
          <defs>${Doodle.defs('p')}</defs>
          ${Doodle.sky(W, Hh, 'p', 26, 'dusk')}
          ${Doodle.hills(W, ground - 26, Hh, { tone: '#e9f0fb', tone2: '#f6f9fe' })}
          <ellipse cx="${W / 2}" cy="${cy + cw * 0.7}" rx="${cw * 1.1}" ry="${cw * 0.95}" fill="url(#p-spot)"/>
          ${Doodle.lights(14, 16, W - 14, 16, wide ? 11 : 8, 16)}
          ${Doodle.snowfall(W, Hh, wide ? 14 : 10, 11)}
          <g class="drift" style="--d:0s">${Doodle.heart(W * 0.12, Hh * 0.24, 20)}</g>
          <g class="drift" style="--d:-1.7s">${Doodle.heart(W * 0.9, Hh * 0.2, 16)}</g>
          <g class="drift" style="--d:-3.1s">${Doodle.star(W * 0.86, Hh * 0.4, 18)}</g>
          <g class="drift" style="--d:-2.3s">${Doodle.heart(W * 0.14, Hh * 0.5, 13)}</g>
          <g class="float">${invitationMarkup(cx, cy, cw, -2, 'p')}</g>
          <g class="cats"></g>
          <g class="float"><g transform="translate(${pocket.x} ${pocket.y}) rotate(8)"><g class="pocket pulse">
            <path d="M-26 -12 h52 v24 q0 6 -6 6 h-40 q-6 0 -6 -6 z" fill="var(--cream)" class="ink" stroke="var(--ink)" stroke-width="2.8"/>
            <path d="M-26 -12 L0 2 L26 -12" fill="none" class="ink" stroke="var(--ink)" stroke-width="2.4"/>
            ${Doodle.heart(0, 5, 13)}
            <path d="M-36 -20 l-5 -5 M36 -20 l5 -5 M-40 0 l-7 0 M40 0 l7 0" class="ink" stroke="var(--ink)" stroke-width="2.2" fill="none"/>
          </g></g></g>
          <g class="fx"></g>`;
        svg = makeSvg(container, `0 0 ${W} ${Hh}`, inner, 'the two cats hold their invitation; a tiny sealed pocket is tucked into the envelope');
        if (life) life();
        cats = mountCats(svg, catH, 'shy', 'delighted');
        life = cats.stop;
        // blue at the left holding the envelope, pink at the right
        cats.blue.place(ex - catH * 0.2, ground).set({ raiseR: 1 });
        cats.pink.place(ex + ew + catH * 0.2, ground).set({ raiseR: 1 });
        cats.blue.faceDir(1); cats.pink.faceDir(-1);
        // a little life: blue glances at pink now and then and blushes, pink sways
        clearTimeout(timer);
        const beat = async () => {
          if (!svg.isConnected) return;
          await cats.blue.lookAt(1, 300); await wait(700); await cats.blue.blinkOnce(); await wait(400); await cats.blue.lookAt(0, 300);
          await wait(900); await cats.pink.perk(); spawnHearts(svg.querySelector('.fx'), W / 2, cy + cw * 0.5, 1, 10);
          timer = setTimeout(beat, 3800);
        };
        if (!REDUCED) timer = setTimeout(beat, 1200);
      },
      unmount() { clearTimeout(timer); if (life) life(); life = null; },
    };
  });

  /* ============================================================
     CHAPTER 1 — open the little map
     A real tri-fold: the corner, the right third and the bottom-left
     strip are folded in over the map and lie on it (showing their paper
     backs). Each flap swings open around its crease: the group mirrors
     through the hinge line (scale along the hinge normal from -1 to 1),
     the back face gives way to the map art at the edge-on moment, the
     paper darkens as it stands up, and the flap settles with a tiny
     overshoot. The landing zones never overlap, so any order works.
     ============================================================ */
  TA.registerScene('map', (ctx) => {
    const state = { open: [false, false, false], done: false, busy: 0 };
    let svg, layout, container, cats, life = null;
    const LAY = {
      wide: { vb: '0 0 900 470', env: { x: 250, y: 190, w: 400, h: 215 }, map: { x: 330, y: 95, w: 290, h: 250 }, pink: { cx: 228, y: 462 }, blue: { cx: 672, y: 458 }, catH: 104 },
      tall: { vb: '0 0 420 440', env: { x: 55, y: 170, w: 310, h: 180 }, map: { x: 110, y: 70, w: 235, h: 230 }, pink: { cx: 70, y: 436 }, blue: { cx: 350, y: 432 }, catH: 88 },
    };
    // the three flaps, in map-local coordinates (0..w, 0..h)
    function flaps(m) {
      const w = m.w, h = m.h; const a = w / 2, b = h / 2;
      // where the corner lands when folded: the origin mirrored across the crease x/a + y/b = 1
      const nn = 1 / (a * a) + 1 / (b * b); const rx = 2 / (a * nn), ry = 2 / (b * nn);
      return [
        { // the corner: folds along the diagonal crease from (w/2, 0) to (0, h/2)
          shape: `M0 0 L${a} 0 L0 ${b} Z`, land: `M${a} 0 L0 ${b} L${rx.toFixed(1)} ${ry.toFixed(1)} Z`, edge: `M${a} 0 H0 V${b}`, crease: `M0 ${b} L${a} 0`,
          hinge: [a / 2, b / 2], normal: Math.atan2(a, b) * 180 / Math.PI, badge: [(a + rx) / 3, (b + ry) / 3], arrow: [w * 0.25, h * 0.25, w * 0.1, h * 0.1] },
        { // the right third: folds over the crease at x = 3w/4
          shape: `M${w * 0.75} 0 H${w} V${h} H${w * 0.75} Z`, land: `M${w * 0.5} 0 H${w * 0.75} V${h} H${w * 0.5} Z`, edge: `M${w * 0.75} 0 H${w} V${h} H${w * 0.75}`, crease: `M${w * 0.75} 0 V${h}`,
          hinge: [w * 0.75, h / 2], normal: 0, badge: [w * 0.625, h * 0.5], arrow: [w * 0.66, h * 0.3, w * 0.9, h * 0.3] },
        { // the bottom-left strip: folds up over the crease at y = 3h/4
          shape: `M0 ${h * 0.75} H${w * 0.5} V${h} H0 Z`, land: `M0 ${h * 0.5} H${w * 0.5} V${h * 0.75} H0 Z`, edge: `M0 ${h * 0.75} V${h} H${w * 0.5}`, crease: `M0 ${h * 0.75} H${w * 0.5} V${h}`,
          hinge: [w / 4, h * 0.75], normal: 90, badge: [w * 0.25, h * 0.625], arrow: [w * 0.4, h * 0.62, w * 0.4, h * 0.9] },
      ];
    }
    const baseShape = (w, h) => `M${w / 2} 0 H${w * 0.75} V${h} H${w / 2} V${h * 0.75} H0 V${h / 2} Z`;
    const baseEdges = (w, h) => `M${w / 2} 0 H${w * 0.75} M${w * 0.75} ${h} H${w / 2} M0 ${h * 0.75} V${h / 2}`;
    // the hinge transform for a flap at openness s (-1 folded flat, 0 edge-on, 1 open), with a hint of perspective
    function hingeT(f, s, lift = 0) {
      const [hx, hy] = f.hinge; const a = f.normal;
      return `translate(${hx} ${hy}) rotate(${a}) scale(${s.toFixed(4)} 1) skewY(${(lift * 7).toFixed(3)}) rotate(${-a}) translate(${-hx} ${-hy})`;
    }
    function render() {
      const L = LAY[layout]; const m = L.map; const w = m.w, h = m.h; const F = flaps(m);
      const house = [w * 0.17, h * 0.27];
      const booth = [w * 0.86, h * 0.7];
      const route = `M${house[0] + 10} ${house[1] + 14} C ${w * 0.36} ${h * 0.44}, ${w * 0.3} ${h * 0.8}, ${w * 0.5} ${h * 0.84} C ${w * 0.66} ${h * 0.88}, ${w * 0.7} ${h * 0.6}, ${booth[0] - 14} ${booth[1]}`;
      // the map artwork, drawn once and clipped into the base and each flap's front face
      const art = `<g id="m-art">
          <rect x="0" y="0" width="${w}" height="${h}" fill="url(#m-cream)"/>
          <g stroke="#e9dcc3" stroke-width="1.5">${[0.25, 0.5, 0.75].map((f) => `<path d="M0 ${h * f} h${w}"/><path d="M${w * f} 0 v${h}"/>`).join('')}</g>
          <g transform="translate(${w * 0.9} ${h * 0.13})"><circle r="9" fill="#fff" stroke="var(--ink)" stroke-width="1.8"/><path d="M0 -7 l2.5 7 l-2.5 7 l-2.5 -7 z" fill="var(--heart)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round"/><text y="-11" text-anchor="middle" font-size="8" fill="var(--ink-soft)">n</text></g>
          <text x="${w * 0.56}" y="${h * 0.2}" text-anchor="middle" font-size="${layout === 'wide' ? 18 : 15}" fill="var(--ink-soft)">a tiny map</text>
          ${Doodle.heart(w * 0.58, h * 0.36, 14)}
          <path d="M${house[0] - 16} ${house[1] + 14} v-14 l16 -14 l16 14 v14 z" fill="#fff" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round"/>
          <path d="M${house[0] - 19} ${house[1] + 1} l19 -17 l19 17" fill="none" stroke="var(--heart)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="${house[0] - 5}" y="${house[1] + 2}" width="10" height="12" rx="3" fill="var(--pink)" stroke="var(--ink)" stroke-width="2"/>
          <text x="${house[0]}" y="${house[1] + 30}" text-anchor="middle" font-size="12" fill="var(--ink-soft)">home</text>
          ${Doodle.pine(w * 0.42, h * 0.72, 30)}${Doodle.pine(w * 0.62, h * 0.66, 24)}${Doodle.snowBush(w * 0.26, h * 0.6, 0.5, 2.4)}
          ${Doodle.booth(booth[0] - 22, booth[1] - 44, 44, 44, { sw: 2.2, sign: false })}<text x="${booth[0]}" y="${booth[1] + 16}" text-anchor="middle" font-size="12" fill="var(--ink-soft)">rink</text>
          <path class="route-full" d="${route}" fill="none" stroke="var(--heart)" stroke-width="3.2" stroke-dasharray="7 7" stroke-linecap="round" opacity="0"/>
        </g>`;
      const flapMarkup = (f, i) => {
        const open = state.open[i]; const s = open ? 1 : -1;
        const [bx, by] = f.badge;
        return `<g class="fold ${open ? 'open' : ''}" data-i="${i}" role="button" tabindex="${open ? -1 : 0}" aria-label="folded corner ${i + 1}">
          <path class="fold-cast" d="${f.land}" fill="var(--ink)" opacity="${open ? 0 : 0.1}"/>
          <g class="fold-hinge" transform="${hingeT(f, s)}">
            <g class="fold-back" opacity="${open ? 0 : 1}"><path d="${f.shape}" fill="#f1e4ca" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/><path d="${f.shape}" fill="url(#m-grain)" opacity=".5"/></g>
            <g class="fold-front" opacity="${open ? 1 : 0}"><g clip-path="url(#m-clip-${i})"><use href="#m-art"/></g><path d="${f.edge}" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></g>
            <path class="fold-shade" d="${f.shape}" fill="var(--ink)" opacity="0"/>
          </g>
          <path class="fold-crease" d="${f.crease}" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" opacity="${open ? 0 : 1}"/>
          <path class="hit" d="${f.land} ${f.shape}" fill="transparent"/>
          <g class="fold-badge" transform="translate(${bx} ${by})" opacity="${open ? 0 : 1}"><g class="fxi"><circle class="badge-halo" r="19" fill="var(--heart)" opacity=".28"/><circle r="13" fill="#fff" stroke="var(--ink)" stroke-width="2.6"/><text y="5.5" text-anchor="middle" font-size="16">${i + 1}</text></g></g>
          <g class="fold-arrow" opacity="${open ? 0 : 1}">${Doodle.arrow(...f.arrow)}</g>
          <path class="focus-ring" d="${f.land}"/>
        </g>`;
      };
      const badgeless = `<clipPath id="m-clip-base"><path d="${baseShape(w, h)}"/></clipPath>` + F.map((f, i) => `<clipPath id="m-clip-${i}"><path d="${f.shape}"/></clipPath>`).join('');
      const W = layout === 'wide' ? 900 : 420, Hh = layout === 'wide' ? 470 : 440;
      const tableY = L.env.y + L.env.h * 0.62;
      const inner = `
        <defs>${Doodle.defs('m')}${art}${badgeless}
          <pattern id="m-grain" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 4 h8" stroke="#e2d2b3" stroke-width="1"/></pattern>
        </defs>
        ${Doodle.sky(W, Hh, 'm', 24, 'sky')}
        <path d="M0 ${tableY} q${W * 0.5} -14 ${W} 0 V ${Hh - 24} q0 24 -24 24 H24 q-24 0 -24 -24 Z" fill="#f6ecd9"/>
        <path d="M0 ${tableY + 12} q${W * 0.5} -12 ${W} 0" fill="none" stroke="#e8d9bd" stroke-width="2"/>
        <g class="drift" style="--d:0s">${Doodle.heart(W * 0.1, Hh * 0.16, 16)}</g>
        <g class="drift" style="--d:-2.4s">${Doodle.heart(W * 0.9, Hh * 0.12, 13)}</g>
        <g class="drift" style="--d:-1.1s">${Doodle.star(W * 0.08, Hh * 0.38, 15)}</g>
        <g class="cats"></g>
        <g transform="rotate(-3 ${L.env.x + L.env.w / 2} ${L.env.y + L.env.h / 2})">
          ${Doodle.softShadow(L.env.x + L.env.w / 2, L.env.y + L.env.h + 4, L.env.w * 0.52, 8, 0.1)}
          ${Doodle.envelopeOpen(L.env.x, L.env.y, L.env.w, L.env.h, 3.2).replace('fill="#fff"', 'fill="url(#m-paper)"')}
          <path d="M${L.env.x + 3} ${L.env.y + L.env.h - 3} L${L.env.x + L.env.w * 0.4} ${L.env.y + L.env.h * 0.5} M${L.env.x + L.env.w - 3} ${L.env.y + L.env.h - 3} L${L.env.x + L.env.w * 0.6} ${L.env.y + L.env.h * 0.5}" fill="none" class="ink" stroke="var(--ink)" stroke-width="2.6" opacity=".7"/>
        </g>
        <g class="map-paper" transform="translate(${m.x} ${m.y}) rotate(3 ${w / 2} ${h / 2})">
          <path d="${baseShape(w, h)}" transform="translate(5 6)" fill="var(--ink)" opacity=".08"/>
          <g clip-path="url(#m-clip-base)"><use href="#m-art"/></g>
          <path class="map-outline" d="${baseEdges(w, h)}" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
          <g class="crease" stroke="var(--ink)" stroke-width="2" opacity=".12" stroke-linecap="round"><path d="M${w / 2} 0 L0 ${h / 2}"/><path d="M${w * 0.75} 0 V${h}"/><path d="M0 ${h * 0.75} H${w / 2}"/></g>
          ${F.map(flapMarkup).join('')}
        </g>
        <g class="fx"></g>`;
      svg = makeSvg(container, L.vb, inner, 'an open envelope with a folded map on top; pink cat at the left, blue cat peeking from the right');
      if (life) life();
      cats = mountCats(svg, L.catH, 'shy', 'curious'); life = cats.stop;
      cats.pink.place(L.pink.cx, L.pink.y); cats.pink.faceDir(1); cats.pink.lookAt(1, 1);
      cats.blue.place(L.blue.cx, L.blue.y); cats.blue.faceDir(-1); cats.blue.lookAt(-1, 1);
      svg.querySelectorAll('.fold').forEach((f) => onActivate(f, () => openFold(Number(f.dataset.i))));
      updateNext();
      if (state.done) finish(true);
    }
    function updateNext() {
      let marked = false;
      svg.querySelectorAll('.fold').forEach((f) => { const i = Number(f.dataset.i); f.classList.toggle('next', !state.open[i] && !marked); if (!state.open[i]) marked = true; });
      ctx.progress(`${state.open.filter(Boolean).length} / 3 folds open`);
    }
    async function openFold(i) {
      if (state.open[i] || state.done) return;
      state.open[i] = true;
      const L = LAY[layout]; const f = flaps(L.map)[i];
      const g = svg.querySelector(`.fold[data-i="${i}"]`); g.classList.add('open'); g.setAttribute('tabindex', '-1');
      const hinge = g.querySelector('.fold-hinge'), back = g.querySelector('.fold-back'), front = g.querySelector('.fold-front'), shade = g.querySelector('.fold-shade'), cast = g.querySelector('.fold-cast');
      const badge = g.querySelector('.fold-badge'), arrow = g.querySelector('.fold-arrow'), crease = g.querySelector('.fold-crease');
      Sound.play('rustle'); ctx.announce(`fold ${i + 1} opened`);
      badge.setAttribute('opacity', '0'); arrow.setAttribute('opacity', '0');
      // the paper swings over its crease: mirrored -> edge-on -> open; it darkens as it stands up
      await tween(560, (t) => {
        const th = Math.PI * ease.inOut(t); const s = -Math.cos(th); const up = Math.sin(th);
        hinge.setAttribute('transform', hingeT(f, s === 0 ? 0.001 : s, up));
        back.setAttribute('opacity', s < 0 ? '1' : '0'); front.setAttribute('opacity', s < 0 ? '0' : '1');
        shade.setAttribute('opacity', (0.28 * up).toFixed(3)); cast.setAttribute('opacity', (0.1 * (1 - t)).toFixed(3)); crease.setAttribute('opacity', s < 0 ? '1' : '0');
      });
      // settle: a tiny overshoot past flat and back
      await tween(200, (t) => { const b = Math.sin(Math.PI * t); hinge.setAttribute('transform', hingeT(f, 1 - 0.05 * b, -0.35 * b)); shade.setAttribute('opacity', (0.06 * b).toFixed(3)); });
      hinge.setAttribute('transform', hingeT(f, 1)); shade.setAttribute('opacity', '0');
      updateNext();
      // the cats react: a perk, a glance at the map
      const who = i % 2 ? cats.blue : cats.pink;
      who.perk(); if (i === 1) { cats.blue.setExpression('curious'); }
      if (state.open.every(Boolean)) { state.done = true; await wait(300); finish(false); }
    }
    async function finish(instant) {
      const route = svg.querySelector('.map-paper .route-full') || svg.querySelector('.route-full');
      svg.querySelectorAll('.route-full').forEach((r) => { r.style.opacity = '1'; });
      if (!instant && !REDUCED) { svg.querySelectorAll('.route-full').forEach((r) => { const len = r.getTotalLength(); r.style.setProperty('--len', len); r.classList.add('draw-path'); }); }
      const L = LAY[layout]; const m = L.map;
      ctx.progress('3 / 3 folds open');
      if (instant) { cats.blue.setExpression('delighted'); cats.pink.setExpression('delighted'); return; }
      await wait(600);
      spawnStar(svg.querySelector('.fx'), m.x + m.w * 0.84, m.y + m.h * 0.55, 40);
      cats.blue.setExpression('delighted'); cats.pink.setExpression('delighted');
      await Promise.all([cats.blue.bounce(12, 460), cats.pink.bounce(12, 460)]);
      spawnHearts(svg.querySelector('.fx'), L.pink.cx + 30, L.pink.y - L.catH - 6, 2, 20);
      ctx.complete();
    }
    return {
      mount(c, l) { container = c; layout = l; render(); },
      unmount() { if (life) life(); life = null; },
      hint() { const next = svg.querySelector('.fold.next'); if (!next) return; flash(next.querySelector('.fold-badge'), 'wiggle', 600); Sound.play('tap'); ctx.announce('tap the glowing numbered corner to open it'); },
      async skip() { for (let i = 0; i < 3; i++) { if (!state.open[i]) { await openFold(i); await wait(160); } } },
    };
  });

  /* ============================================================
     CHAPTER 2 — the snowy little lane (rotate three path pieces)
     ============================================================ */
  TA.registerScene('lane', (ctx) => {
    const state = { rot: [90, 90, 0], deg: [90, 90, 0], types: ['straight', 'bend', 'straight'], done: false, crossing: false };
    let svg, layout, container, cats, life = null;
    const LAY = {
      wide: { vb: '0 0 900 440', tile: 140, gap: 22, tx: 288, ty: 150, start: { x: 128, y: 334 }, booth: { x: 770, y: 180, w: 112, h: 150 }, end: { x: 706, y: 332 }, catH: 96 },
      tall: { vb: '0 0 420 560', tile: 102, gap: 14, tx: 50, ty: 240, start: { x: 118, y: 188 }, booth: { x: 296, y: 385, w: 108, h: 150 }, end: { x: 232, y: 536 }, catH: 80 },
    };
    const solved = (i) => state.rot[i] % 180 === 0;
    const tileCenters = () => { const L = LAY[layout]; return [0, 1, 2].map((i) => ({ x: L.tx + i * (L.tile + L.gap) + L.tile / 2, y: L.ty + L.tile / 2 })); };
    function stubIn() { const L = LAY[layout]; const c = tileCenters(); const s = L.start;
      return layout === 'wide' ? `M${s.x} ${s.y} C ${s.x + 150} ${s.y}, ${c[0].x - 120} ${c[0].y}, ${c[0].x - L.tile / 2} ${c[0].y}` : `M${s.x} ${s.y} C ${s.x - 40} ${s.y + 40}, ${c[0].x - L.tile / 2 - 40} ${c[0].y - 20}, ${c[0].x - L.tile / 2} ${c[0].y}`; }
    function stubOut() { const L = LAY[layout]; const c = tileCenters();
      return layout === 'wide' ? `M${c[2].x + L.tile / 2} ${c[2].y} C ${c[2].x + 90} ${c[2].y}, ${L.end.x + 10} ${c[2].y + 30}, ${L.end.x} ${L.end.y}` : `M${c[2].x + L.tile / 2} ${c[2].y} C ${c[2].x + L.tile / 2 + 16} ${c[2].y + 70}, ${L.end.x + 10} ${c[2].y + 100}, ${L.end.x} ${L.end.y}`; }
    const gapD = () => { const L = LAY[layout]; const c = tileCenters(); return [0, 1].map((i) => `M${c[i].x + L.tile / 2} ${c[i].y} L${c[i + 1].x - L.tile / 2} ${c[i + 1].y}`).join(' '); };
    function laneLocal(i) { const s = LAY[layout].tile, h = s / 2; return state.types[i] === 'bend' ? `M0 ${h} C ${s * 0.3} ${h}, ${s * 0.3} ${h - s * 0.22}, ${h} ${h - s * 0.18} C ${s * 0.7} ${h - s * 0.14}, ${s * 0.7} ${h}, ${s} ${h}` : `M0 ${h} L${s} ${h}`; }
    // the actual route through the solved tiles, in scene coordinates (a 180° tile is point-reflected through its centre)
    function solvedRouteD() {
      const L = LAY[layout]; const s = L.tile; const c = tileCenters(); let d = stubIn();
      for (let i = 0; i < 3; i++) {
        const ref = svg.querySelector(`.tile[data-i="${i}"] .lane-ref`); const len = ref.getTotalLength(); const flip = state.rot[i] % 360 === 180;
        const pts = []; for (let k = 0; k <= 12; k++) { const p = ref.getPointAtLength(len * k / 12); const lx = flip ? s - p.x : p.x, ly = flip ? s - p.y : p.y; pts.push([L.tx + i * (s + L.gap) + lx, L.ty + ly]); }
        d += ' ' + pts.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
        if (i < 2) d += ` L${c[i + 1].x - s / 2} ${c[i + 1].y}`;
      }
      // stub out as sampled points too so the whole thing is one path
      const tmp = svgEl('path', { d: stubOut() }); svg.appendChild(tmp); const len = tmp.getTotalLength();
      for (let k = 1; k <= 12; k++) { const p = tmp.getPointAtLength(len * k / 12); d += ` L${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }
      tmp.remove(); return d;
    }
    // a clean clockwise arrow: a 280° arc with a filled head at its end, open at the top right
    function rotateArrow(r, sw) {
      const a0 = -60 * Math.PI / 180, a1 = 220 * Math.PI / 180;
      const P = (a) => [r * Math.cos(a), r * Math.sin(a)];
      const [x0, y0] = P(a0), [x1, y1] = P(a1);
      const tx = -Math.sin(a1), ty = Math.cos(a1), nx = Math.cos(a1), ny = Math.sin(a1); const hd = sw * 1.9;
      const f = (v) => v.toFixed(2);
      return `<path d="M${f(x0)} ${f(y0)} A${f(r)} ${f(r)} 0 1 1 ${f(x1)} ${f(y1)}" fill="none" stroke="var(--ink)" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M${f(x1 + tx * hd)} ${f(y1 + ty * hd)} L${f(x1 - tx * hd * 0.3 + nx * hd * 0.85)} ${f(y1 - ty * hd * 0.3 + ny * hd * 0.85)} L${f(x1 - tx * hd * 0.3 - nx * hd * 0.85)} ${f(y1 - ty * hd * 0.3 - ny * hd * 0.85)} Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/>`;
    }
    function tileArt(i) {
      const L = LAY[layout]; const s = L.tile; const h = s / 2; const lane = laneLocal(i);
      return `
        <g class="tile has-fxi ${solved(i) ? 'linked' : ''}" data-i="${i}" role="button" tabindex="0" aria-label="path piece ${i + 1}, tap to rotate" transform="translate(${L.tx + i * (s + L.gap)} ${L.ty})"><g class="fxi">
          <rect x="4" y="5" width="${s}" height="${s}" rx="${s * 0.14}" fill="var(--ink)" opacity=".08"/>
          <rect class="tile-paper" x="0" y="0" width="${s}" height="${s}" rx="${s * 0.14}" fill="url(#l-cream)" stroke="var(--ink)" stroke-width="3"/>
          <g fill="#fff" stroke="var(--rink-line)" stroke-width="1.5">${[0.12, 0.3, 0.5, 0.7, 0.88].map((f) => `<circle cx="${s * f}" cy="${s * 0.07}" r="${s * 0.03}"/><circle cx="${s * f}" cy="${s * 0.93}" r="${s * 0.03}"/>`).join('')}</g>
          <g class="tile-rot" transform="rotate(${state.deg[i]} ${h} ${h})">
            <path d="${lane}" fill="none" stroke="var(--blue-deep)" stroke-width="${s * 0.26 + 4}" stroke-dasharray="5 6" opacity=".55" stroke-linecap="butt"/>
            <path d="${lane}" fill="none" stroke="#fff" stroke-width="${s * 0.26}" stroke-linecap="butt"/>
            <path d="${lane}" fill="none" stroke="var(--rink)" stroke-width="${s * 0.26}" stroke-linecap="butt" opacity=".9"/>
            <circle cx="0" cy="${h}" r="${s * 0.045}" fill="var(--heart)" stroke="var(--ink)" stroke-width="2"/><circle cx="${s}" cy="${h}" r="${s * 0.045}" fill="var(--heart)" stroke="var(--ink)" stroke-width="2"/>
            <g class="tile-paws">${[0, 1, 2, 3].map((k) => `<g class="paw-slot" data-k="${k}"></g>`).join('')}</g>
            <path class="lane-ref" d="${lane}" fill="none" stroke="none"/>
          </g>
          <g class="rot-glyph has-fxi" transform="translate(${s - s * 0.12} ${s * 0.12})"><g class="fxi"><circle class="rot-halo" r="${s * 0.21}" fill="var(--heart)" opacity=".3"/><circle cx="1.5" cy="2.5" r="${s * 0.14}" fill="var(--ink)" opacity=".12"/><circle r="${s * 0.14}" fill="#fff" stroke="var(--ink)" stroke-width="2.4"/>${rotateArrow(s * 0.072, 2.6)}</g></g>
          ${focusRing(0, 0, s, s, s * 0.14)}
        </g></g>`;
    }
    function render() {
      const L = LAY[layout]; const wide = layout === 'wide';
      const W = wide ? 900 : 420, Hh = wide ? 440 : 560;
      const scenery = wide
        ? `${Doodle.hills(W, 250, Hh)}${Doodle.pine(150, 300, 70, { ink: false, fill: '#dbe8f8' })}${Doodle.pine(840, 290, 86, { ink: false, fill: '#dbe8f8' })}${Doodle.pine(205, 310, 56, { ink: false, fill: '#e6eefa' })}
           ${Doodle.cloud(120, 90, 0.9)}${Doodle.cloud(560, 70, 0.7)}${Doodle.pine(34, 228, 84)}${Doodle.lamp(252, 428, 100, 'l')}${Doodle.snowman(150, 426, 0.9).replace('url(#d-snow) #fff', 'url(#l-snow) #fff')}${Doodle.snowBush(690, 395, 0.8)}${Doodle.snowBush(40, 420, 0.7)}`
        : `${Doodle.hills(W, 150, Hh)}${Doodle.pine(300, 158, 54, { ink: false, fill: '#dbe8f8' })}${Doodle.pine(345, 150, 74, { ink: false, fill: '#dbe8f8' })}${Doodle.pine(392, 162, 48, { ink: false, fill: '#e6eefa' })}
           ${Doodle.cloud(60, 70, 0.8)}${Doodle.cloud(250, 52, 0.6)}${Doodle.pine(392, 232, 78)}${Doodle.lamp(44, 552, 100, 'l')}${Doodle.snowman(150, 548, 0.8).replace('url(#d-snow) #fff', 'url(#l-snow) #fff')}${Doodle.snowBush(250, 556, 0.8)}${Doodle.snowBush(96, 556, 0.6)}`;
      const inner = `
        <defs>${Doodle.defs('l')}</defs>
        ${Doodle.sky(W, Hh, 'l', 24, 'dusk')}
        ${scenery}
        ${Doodle.snowfall(W, Hh, wide ? 16 : 12, 21)}
        <g class="lane-stubs">
          <path d="${stubIn()} ${stubOut()} ${gapD()}" fill="none" stroke="var(--blue-deep)" stroke-width="${L.tile * 0.26 + 4}" stroke-dasharray="5 6" stroke-linecap="butt" opacity=".35"/>
          <path d="${stubIn()} ${stubOut()} ${gapD()}" fill="none" stroke="#fff" stroke-width="${L.tile * 0.26}" stroke-linecap="round"/>
          <path d="${stubIn()} ${stubOut()} ${gapD()}" fill="none" stroke="var(--rink)" stroke-width="${L.tile * 0.26}" stroke-linecap="round" opacity=".9"/>
        </g>
        ${Doodle.booth2(L.booth.x, L.booth.y, L.booth.w, L.booth.h, 'l')}
        <g class="tiles">${[0, 1, 2].map(tileArt).join('')}</g>
        <g class="trail"></g>
        <g class="cats"></g>
        <g class="fx"></g>`;
      svg = makeSvg(container, L.vb, inner, 'the two cats at the start of a snowy lane made of three path pieces leading to a little ticket booth');
      if (life) life();
      cats = mountCats(svg, L.catH, 'shy', 'curious'); life = cats.stop;
      placePair(L.start.x, L.start.y);
      svg.querySelectorAll('.tile').forEach((t) => onActivate(t, () => rotateTile(Number(t.dataset.i))));
      updateLinks(true);
      if (state.done) { placePair(L.end.x, L.end.y); cats.blue.setExpression('delighted'); cats.pink.setExpression('delighted'); svg.querySelectorAll('.tile').forEach((t) => t.classList.add('solved')); }
    }
    function placePair(x, y) { const g = LAY[layout].catH * 0.5; cats.blue.place(x - g, y); cats.pink.place(x + g, y); cats.blue.faceDir(1); cats.pink.faceDir(-1); }
    function updateLinks(instant) {
      let linked = 0; for (let i = 0; i < 3; i++) { if (solved(i)) linked++; else break; }
      svg.querySelectorAll('.tile').forEach((t, i) => {
        const on = i < linked; t.classList.toggle('linked', on);
        t.querySelectorAll('.paw-slot').forEach((slot, k) => {
          if (on && !slot.firstChild) { const ref = t.querySelector('.lane-ref'); const len = ref.getTotalLength(); const p = ref.getPointAtLength(len * [0.18, 0.4, 0.62, 0.84][k]);
            slot.innerHTML = Doodle.paw(p.x, p.y + (k % 2 ? 6 : -6), LAY[layout].tile * 0.1, `class="paw-fx" style="animation-delay:${instant ? 0 : k * 120}ms"`); }
          else if (!on) slot.innerHTML = '';
        });
      });
      ctx.progress(`${linked} / 3 pieces linked`); return linked;
    }
    const setRot = (i, deg) => { const h = LAY[layout].tile / 2; const el = svg.querySelector(`.tile[data-i="${i}"] .tile-rot`); if (el) el.setAttribute('transform', `rotate(${deg.toFixed(2)} ${h} ${h})`); };
    let turning = false;
    async function rotateTile(i) {
      if (state.done || state.crossing || turning) return;
      turning = true;
      state.rot[i] = (state.rot[i] + 90) % 360; state.deg[i] += 90;
      const from = state.deg[i] - 90, to = state.deg[i];
      Sound.play('pick'); ctx.announce(`piece ${i + 1} rotated`);
      flash(svg.querySelector(`.tile[data-i="${i}"] .rot-glyph`), 'pop-in', 300);
      // a quarter turn with a little overshoot, like a card snapping into place
      await tween(360, (t) => { const c = 1.3; const e = 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); setRot(i, from + (to - from) * e); });
      setRot(i, to); turning = false;
      const linked = updateLinks(false);
      if (linked > 0 && linked < 3) cats.pink.perk();
      if (linked === 3) { state.done = true; await crossing(); }
    }
    async function crossing() {
      state.crossing = true;
      svg.querySelectorAll('.tile').forEach((t) => t.classList.add('solved'));
      const L = LAY[layout]; const g = L.catH * 0.5;
      const path = svgEl('path', { d: solvedRouteD(), fill: 'none', stroke: 'none' }); svg.appendChild(path);
      // anticipation: both look along the lane, blue perks, pink nods
      await Promise.all([cats.blue.lookAt(1, 240), cats.pink.lookAt(1, 240)]);
      cats.blue.setExpression('excited'); await cats.blue.perk(); await cats.pink.nod();
      cats.pink.faceDir(1);
      const trail = svg.querySelector('.trail'); let lastPaw = 0; const len = path.getTotalLength();
      Sound.play('glide');
      const stamp = (d, p) => { if (d - lastPaw > 34) { lastPaw = d; trail.insertAdjacentHTML('beforeend', Doodle.paw(p.x + (Math.random() - 0.5) * 8, p.y + 4, L.tile * 0.09, 'class="paw-fx"')); } };
      const dur = 3200;
      // single file: blue leads, pink follows a body-length behind on the same line, no sideways offset
      await Promise.all([
        cats.blue.walkAlong(path, 0, 1, dur),
        cats.pink.walkAlong(path, 0, 1, dur, { trail: L.catH * 0.95 }),
        tween(dur, (t) => { const e = ease.inOut(t); const d = len * e; stamp(d, path.getPointAtLength(d)); }),
      ]);
      path.remove();
      // arrival: they settle side by side in front of the booth, then a little hop and a heart between them
      const b0 = { x: cats.blue.s.x, y: cats.blue.s.y }, p0 = { x: cats.pink.s.x, y: cats.pink.s.y };
      await tween(360, (t) => { const e = ease.inOut(t); cats.blue.set({ x: b0.x + (L.end.x - g - b0.x) * e, y: b0.y + (L.end.y - b0.y) * e }); cats.pink.set({ x: p0.x + (L.end.x + g - p0.x) * e, y: p0.y + (L.end.y - p0.y) * e }); });
      cats.blue.faceDir(1); cats.pink.faceDir(-1);
      await Promise.all([cats.blue.hopTo(cats.blue.s.x, cats.blue.s.y, { height: 16, dur: 420 }), (async () => { await wait(120); await cats.pink.hopTo(cats.pink.s.x, cats.pink.s.y, { height: 16, dur: 420 }); })()]);
      cats.blue.setExpression('delighted'); cats.pink.setExpression('delighted');
      spawnHearts(svg.querySelector('.fx'), (cats.blue.s.x + cats.pink.s.x) / 2, cats.blue.s.y - L.catH - 6, 1, 10); Sound.play('chime');
      state.crossing = false;
      ctx.complete();
    }
    return {
      mount(c, l) { container = c; layout = l; render(); },
      unmount() { if (life) life(); life = null; },
      hint() { const i = [0, 1, 2].find((k) => !solved(k)); if (i === undefined) return; flash(svg.querySelector(`.tile[data-i="${i}"]`), 'wiggle', 600); Sound.play('tap'); ctx.announce(`piece ${i + 1} needs a turn`); },
      async skip() {
        if (state.done || state.crossing) return;
        for (let i = 0; i < 3; i++) { while (!solved(i)) { state.rot[i] = (state.rot[i] + 90) % 360; state.deg[i] += 90; } }
        const from = svg ? [0, 1, 2].map((i) => Number((/rotate\(([-\d.]+)/.exec(svg.querySelector(`.tile[data-i="${i}"] .tile-rot`).getAttribute('transform')) || [0, 0])[1])) : state.deg;
        await tween(420, (t) => { const e = ease.inOut(t); [0, 1, 2].forEach((i) => setRot(i, from[i] + (state.deg[i] - from[i]) * e)); });
        updateLinks(false); state.done = true; await crossing();
      },
    };
  });

  /* ============================================================
     CHAPTER 3 — a tiny staircase (match the three objects)
     ============================================================ */
  TA.registerScene('stairs', (ctx) => {
    const OBJ = {
      stool: { w: 80, h: 65, name: 'the little stool', n: 1,
        art: `<path d="M18 14 L10 62 M40 16 L40 62 M62 14 L70 62" stroke="var(--ink)" stroke-width="4.4" stroke-linecap="round" fill="none"/>
              <path d="M14 42 L66 42" stroke="var(--ink)" stroke-width="3.6" stroke-linecap="round"/>
              <ellipse cx="40" cy="12" rx="37" ry="9" fill="#d9b98a" stroke="var(--ink)" stroke-width="3.4"/>
              <ellipse cx="40" cy="9" rx="37" ry="9" fill="#f6e3c0" stroke="var(--ink)" stroke-width="3.4"/>
              <ellipse cx="40" cy="8" rx="26" ry="5" fill="var(--pink)" stroke="var(--ink)" stroke-width="2.2"/>
              <path d="M24 7 q16 -3 32 0" fill="none" stroke="#fff" stroke-width="2" opacity=".8" stroke-linecap="round"/>`,
        sil: 'M3 10 a37 9 0 1 1 74 0 q-2 8 -12 11 L72 64 L8 64 L15 21 Q5 18 3 10 Z' },
      crate: { w: 90, h: 120, name: 'the wooden crate', n: 2,
        art: `<rect x="3" y="3" width="84" height="114" rx="8" fill="#f6e7c6" stroke="var(--ink)" stroke-width="3.4"/>
              <rect x="3" y="96" width="84" height="21" rx="6" fill="#e9d3a6" opacity=".7"/>
              <path d="M3 42 h84 M3 80 h84" stroke="var(--ink)" stroke-width="2.8" fill="none"/>
              <path d="M10 10 h70" stroke="#fff" stroke-width="2.4" opacity=".7" stroke-linecap="round"/>
              <g fill="#c9a977"><circle cx="14" cy="18" r="2.4"/><circle cx="76" cy="18" r="2.4"/><circle cx="14" cy="60" r="2.4"/><circle cx="76" cy="60" r="2.4"/><circle cx="14" cy="102" r="2.4"/><circle cx="76" cy="102" r="2.4"/></g>
              ${Doodle.heart(45, 62, 26)}`,
        sil: 'M3 3 h84 q3 0 3 3 v111 q0 3 -3 3 h-84 q-3 0 -3 -3 v-111 q0 -3 3 -3 z' },
      box: { w: 100, h: 168, name: 'the tall box', n: 3,
        art: `<rect x="3" y="3" width="94" height="162" rx="9" fill="#fbf3e4" stroke="var(--ink)" stroke-width="3.4"/>
              <rect x="3" y="140" width="94" height="25" rx="7" fill="#efdfbf" opacity=".7"/>
              <path d="M3 58 h94 M3 112 h94" stroke="var(--ink)" stroke-width="2.8" fill="none"/>
              <path d="M38 3 v55 M62 3 v55" stroke="var(--pink)" stroke-width="7" opacity=".8"/>
              <rect x="22" y="22" width="56" height="22" rx="6" fill="#fff" stroke="var(--ink)" stroke-width="2.4"/>
              <text x="50" y="38" text-anchor="middle" font-size="14">fragile</text>
              ${Doodle.heart(50, 86, 26)}${Doodle.star(50, 140, 24)}`,
        sil: 'M3 3 h94 q3 0 3 3 v159 q0 3 -3 3 h-94 q-3 0 -3 -3 v-159 q0 -3 3 -3 z' },
    };
    const IDS = ['stool', 'crate', 'box'];
    const state = { placed: { stool: false, crate: false, box: false }, selected: null, done: false, demoShown: false, climbing: false };
    let svg, layout, container, cats, life = null, demoTimer = null, drag = null;
    const LAY = {
      // the door sits on a little landing one small hop above the tallest box; the landing reaches back over the box
      wide: { vb: '0 0 900 610', W: 900, H: 610, k: 0.85, ground: 400, groundX: [20, 612], booth: { x: 612, y: 30, w: 256, h: 370 }, door: { x: 696, y: 144, w: 88, h: 96 }, plat: { x: 574, y: 240, w: 140, h: 11, rail: 30, railW: 24 },
        ghosts: { stool: { x: 330 }, crate: { x: 404 }, box: { x: 486 } }, cats: { blue: { cx: 112 }, pink: { cx: 230 } }, catH: 100,
        tray: { x: 20, y: 436, w: 580, h: 162, slots: { stool: 120, crate: 300, box: 480 } }, label: { x: 300, y: 80, ax: [470, 90, 580, 96, 690, 170] } },
      tall: { vb: '0 0 420 590', W: 420, H: 590, k: 0.6, ground: 360, groundX: [8, 300], booth: { x: 300, y: 60, w: 104, h: 300 }, door: { x: 326, y: 168, w: 52, h: 68 }, plat: { x: 276, y: 236, w: 70, h: 9, rail: 24, railW: 18 },
        ghosts: { stool: { x: 132 }, crate: { x: 184 }, box: { x: 240 } }, cats: { blue: { cx: 34 }, pink: { cx: 88 } }, catH: 68,
        tray: { x: 8, y: 400, w: 404, h: 140, slots: { stool: 68, crate: 205, box: 340 } }, label: { x: 150, y: 44, ax: [205, 50, 272, 62, 330, 170] } },
    };
    const objTop = (id) => LAY[layout].ground - OBJ[id].h * LAY[layout].k;
    const ghostPos = (id) => ({ x: LAY[layout].ghosts[id].x, y: objTop(id) });
    const trayPos = (id) => { const L = LAY[layout]; return { x: L.tray.slots[id] - (OBJ[id].w * L.k) / 2, y: L.tray.y + L.tray.h - 12 - OBJ[id].h * L.k }; };
    function objMarkup(id) {
      const L = LAY[layout]; const o = OBJ[id]; const p = state.placed[id] ? ghostPos(id) : trayPos(id); const i = IDS.indexOf(id);
      return `<g class="obj has-fxi ${state.placed[id] ? 'placed' : 'in-tray'}" data-id="${id}" role="button" tabindex="${state.placed[id] ? -1 : 0}" aria-label="${o.name} (step ${o.n})" transform="translate(${p.x} ${p.y})"><g class="fxi">
        <rect class="hit" x="${Math.min(0, (o.w * L.k - 86) / 2)}" y="${Math.min(0, o.h * L.k - 86)}" width="${Math.max(o.w * L.k, 86)}" height="${Math.max(o.h * L.k, 86)}" fill="transparent"/>
        <ellipse class="obj-shadow" cx="${(o.w * L.k) / 2}" cy="${o.h * L.k + 2}" rx="${(o.w * L.k) / 2}" ry="5"/>
        <g class="obj-art" style="animation-delay:${i * 700}ms"><g transform="scale(${L.k})">${o.art}</g></g>
        ${focusRing(0, 0, o.w * L.k, o.h * L.k)}
      </g></g>`;
    }
    function render() {
      const L = LAY[layout]; const k = L.k; const g = L.ground; const wide = layout === 'wide';
      const stepPts = IDS.map((id) => ({ x: L.ghosts[id].x + (OBJ[id].w * k) / 2, y: objTop(id) }));
      const landX = L.plat.x + L.plat.w * 0.36;
      const climb = `M${L.cats.pink.cx} ${g - 10} Q ${stepPts[0].x - 30} ${stepPts[0].y - 30} ${stepPts[0].x} ${stepPts[0].y - 8} Q ${stepPts[1].x - 20} ${stepPts[1].y - 40} ${stepPts[1].x} ${stepPts[1].y - 8} Q ${stepPts[2].x - 20} ${stepPts[2].y - 40} ${stepPts[2].x} ${stepPts[2].y - 8} Q ${(stepPts[2].x + landX) / 2} ${L.plat.y - 34} ${landX} ${L.plat.y - 8}`;
      const scenery = wide
        ? `${Doodle.hills(L.W, g - 120, L.H)}${Doodle.pine(70, g - 96, 90, { ink: false, fill: '#dbe8f8' })}${Doodle.pine(130, g - 104, 70, { ink: false, fill: '#e6eefa' })}${Doodle.pine(560, g - 92, 76, { ink: false, fill: '#dbe8f8' })}${Doodle.cloud(90, 110, 0.8)}${Doodle.cloud(420, 70, 0.6)}${Doodle.pine(40, g, 96)}`
        : `${Doodle.hills(L.W, g - 90, L.H)}${Doodle.pine(26, g - 76, 56, { ink: false, fill: '#dbe8f8' })}${Doodle.pine(62, g - 80, 70, { ink: false, fill: '#e6eefa' })}${Doodle.pine(250, g - 70, 48, { ink: false, fill: '#dbe8f8' })}${Doodle.cloud(40, 110, 0.7)}${Doodle.cloud(240, 90, 0.5)}`;
      const inner = `
        <defs>${Doodle.defs('s')}</defs>
        ${Doodle.sky(L.W, L.H, 's', 24, 'dusk')}
        ${scenery}
        ${Doodle.snowfall(L.W, g + 20, wide ? 14 : 10, 33)}
        <path d="M0 ${g} H${L.W}" stroke="#fff" stroke-width="10" opacity=".6"/>
        <path d="M${L.groundX[0]} ${g} q${(L.groundX[1] - L.groundX[0]) / 2} 4 ${L.groundX[1] - L.groundX[0]} 0" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round"/>
        ${Doodle.snowBush(L.groundX[0] + 40, g, 0.8 * (k + 0.3))}
        <g class="step-glows">${IDS.map((id) => { const p = ghostPos(id); const o = OBJ[id]; return `<rect class="step-glow" data-id="${id}" x="${p.x - 8}" y="${p.y - 8}" width="${o.w * k + 16}" height="${o.h * k + 16}" rx="12" fill="var(--butter)" opacity="0"/>`; }).join('')}<rect class="step-glow" data-id="plat" x="${L.plat.x - 8}" y="${L.plat.y - 10}" width="${L.plat.w + 16}" height="${L.plat.h + 20}" rx="10" fill="var(--butter)" opacity="0"/></g>
        ${Doodle.tower(L.booth.x, L.booth.y, L.booth.w, L.booth.h, L.door, L.plat, 's')}
        <g class="door-envelope">${Doodle.envelope(L.door.x + L.door.w * 0.2, L.door.y + L.door.h * 0.3, L.door.w * 0.6, L.door.w * 0.42, 2.4)}</g>
        <g class="goal-label">
          <text class="ui-text" x="${L.label.x}" y="${L.label.y}" text-anchor="middle" font-size="${wide ? 19 : 15}" fill="var(--ink)">${C.stairs.label}</text>
          ${Doodle.arrowCurve(`M${L.label.ax[0]} ${L.label.ax[1]} Q ${L.label.ax[2]} ${L.label.ax[3]} ${L.label.ax[4]} ${L.label.ax[5]}`, 2.6)}${Doodle.arrowHead(L.label.ax[4], L.label.ax[5], 50, 8)}
        </g>
        <path d="${climb}" fill="none" stroke="var(--heart)" stroke-width="2.2" stroke-dasharray="4 8" stroke-linecap="round" opacity=".55"/>
        <g class="ghosts">${IDS.map((id) => { const p = ghostPos(id); const o = OBJ[id];
          return `<g class="ghost has-fxi ${state.placed[id] ? 'filled' : 'open'}" data-id="${id}" role="button" tabindex="0" aria-label="outline for ${o.name}" transform="translate(${p.x} ${p.y})"><g class="fxi">
            <rect class="hit" x="${Math.min(0, (o.w * k - 86) / 2)}" y="${Math.min(0, o.h * k - 86)}" width="${Math.max(o.w * k, 86)}" height="${Math.max(o.h * k, 86)}" fill="transparent"/>
            <path class="ghost-shape" d="${o.sil}" transform="scale(${k})"/>
            <text class="ghost-label" x="${(o.w * k) / 2}" y="${(o.h * k) / 2 + 8}" text-anchor="middle" font-size="${22 * (k + 0.3)}" fill="var(--blue-deep)">${o.n}</text>
            ${focusRing(0, 0, o.w * k, o.h * k)}
          </g></g>`; }).join('')}</g>
        <g class="tray">
          <rect x="${L.tray.x + 4}" y="${L.tray.y + 6}" width="${L.tray.w}" height="${L.tray.h}" rx="22" fill="var(--ink)" opacity=".07"/>
          <rect x="${L.tray.x}" y="${L.tray.y}" width="${L.tray.w}" height="${L.tray.h}" rx="22" fill="url(#s-cream)" stroke="var(--ink)" stroke-width="2.6"/>
          <rect x="${L.tray.x + 10}" y="${L.tray.y + L.tray.h - 22}" width="${L.tray.w - 20}" height="10" rx="5" fill="#f3dcb4" stroke="var(--ink)" stroke-width="2"/>
          <text class="ui-text" x="${L.tray.x + 18}" y="${L.tray.y + 22}" font-size="${wide ? 15 : 13}" fill="var(--ink-soft)">${C.stairs.tray}</text>
        </g>
        <g class="objects">${IDS.map(objMarkup).join('')}</g>
        <g class="cats"></g>
        <g class="fx"></g>`;
      svg = makeSvg(container, L.vb, inner, 'a little tower with a door high up on a landing; three ascending outlines lead up to it; a tray below holds a stool, a crate and a tall box');
      { const env = svg.querySelector('.door-envelope'); const frame = svg.querySelector('.door-frame'); frame.parentNode.insertBefore(env, frame); }
      if (life) life();
      cats = mountCats(svg, L.catH, 'shy', 'curious'); life = cats.stop;
      cats.blue.place(L.cats.blue.cx, g); cats.pink.place(L.cats.pink.cx, g); cats.blue.faceDir(1); cats.pink.faceDir(1); cats.pink.lookAt(1, 1);
      svg.querySelectorAll('.obj').forEach((o) => {
        const id = o.dataset.id;
        o.addEventListener('pointerdown', (e) => onDown(e, id));
        // a finger on a helper must drag it, never scroll the page (touch-action: none in CSS, and this for browsers that ignore it on SVG)
        o.addEventListener('touchstart', (e) => { if (!state.placed[id] && !state.done) e.preventDefault(); }, { passive: false });
        o.addEventListener('touchmove', (e) => { if (drag) e.preventDefault(); }, { passive: false });
        o.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(id); } });
      });
      svg.querySelectorAll('.ghost').forEach((gh) => onActivate(gh, () => onGhostTap(gh.dataset.id)));
      svg.addEventListener('pointerdown', (e) => { if (!e.target.closest('.obj') && !e.target.closest('.ghost')) select(null); });
      detach(); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
      updateProgress();
      if (state.done) { finishedVisual(); } else scheduleDemo();
    }
    function detach() { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); }
    function updateProgress() { ctx.progress(C.stairs.progress(IDS.filter((id) => state.placed[id]).length)); }
    function select(id) {
      state.selected = id;
      svg.querySelectorAll('.obj').forEach((o) => o.classList.toggle('selected', o.dataset.id === id));
      svg.querySelectorAll('.ghost').forEach((gh) => gh.classList.toggle('armed', gh.dataset.id === id));
      if (id) { Sound.play('pick'); ctx.announce(`${OBJ[id].name} picked up. now tap its outline, step ${OBJ[id].n}.`); cats.pink.lookAt(1); }
    }
    function toggleSelect(id) { if (state.placed[id] || state.done) return; select(state.selected === id ? null : id); clearTimeout(demoTimer); }
    function scheduleDemo() { clearTimeout(demoTimer); if (state.demoShown || REDUCED || state.done) return; demoTimer = setTimeout(runDemo, 2200); }
    async function runDemo() {
      if (state.demoShown || state.selected || drag || state.done || state.placed.stool) return;
      state.demoShown = true;
      const from = trayPos('stool'), to = ghostPos('stool');
      const ghost = svg.querySelector('.obj[data-id="stool"]').cloneNode(true); ghost.classList.add('demo'); ghost.removeAttribute('tabindex'); ghost.removeAttribute('role'); ghost.removeAttribute('aria-label'); ghost.setAttribute('aria-hidden', 'true'); ghost.removeAttribute('data-id'); ghost.style.pointerEvents = 'none';
      svg.querySelector('.fx').appendChild(ghost);
      await tween(1200, (t) => { const e = ease.inOut(t); setT(ghost, from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e - 30 * 4 * t * (1 - t)); });
      await tween(400, (t) => { ghost.style.opacity = String(0.55 * (1 - t)); }); ghost.remove();
    }
    function toScene(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
    function onDown(e, id) {
      if (state.placed[id] || state.done || state.climbing) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault(); clearTimeout(demoTimer);
      const o = svg.querySelector(`.obj[data-id="${id}"]`); const p = toScene(e); const pos = trayPos(id);
      drag = { id, el: o, startX: p.x, startY: p.y, offX: p.x - pos.x, offY: p.y - pos.y, moved: false, pointerId: e.pointerId };
    }
    function nearestGhost(x, y) {
      const L = LAY[layout]; let best = null, bd = Infinity;
      for (const id of IDS) { if (state.placed[id]) continue; const gp = ghostPos(id); const o = OBJ[id];
        const dx = (x + (o.w * L.k) / 2) - (gp.x + (o.w * L.k) / 2), dy = (y + o.h * L.k) - (gp.y + o.h * L.k);
        const d = Math.hypot(dx, dy); if (d < 80 * (L.k + 0.36) && d < bd) { bd = d; best = id; } }
      return best;
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const p = toScene(e);
      if (!drag.moved && Math.hypot(p.x - drag.startX, p.y - drag.startY) > 6) { drag.moved = true; drag.el.classList.add('dragging'); drag.el.classList.remove('in-tray'); select(null); svg.querySelector('.fx').appendChild(drag.el); Sound.play('pick'); }
      if (!drag.moved) return;
      const L = LAY[layout]; const o = OBJ[drag.id];
      const x = Math.max(0, Math.min(L.W - o.w * L.k, p.x - drag.offX)), y = Math.max(0, Math.min(L.H - o.h * L.k, p.y - drag.offY));
      setT(drag.el, x, y);
      const near = nearestGhost(x, y);
      svg.querySelectorAll('.ghost').forEach((gh) => gh.classList.toggle('armed', gh.dataset.id === near && near === drag.id));
    }
    async function onUp(e) {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const d = drag; drag = null; d.el.classList.remove('dragging');
      if (!d.moved) { toggleSelect(d.id); return; }
      const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(d.el.getAttribute('transform')); const x = Number(m[1]), y = Number(m[2]);
      const near = nearestGhost(x, y);
      svg.querySelector('.objects').appendChild(d.el);
      if (near === d.id) { await place(d.id, { x, y }); }
      else {
        if (near) { flash(svg.querySelector(`.ghost[data-id="${near}"]`), 'shake', 420); Sound.play('nope'); ctx.announce(`that outline is for ${OBJ[near].name}`); cats.blue.setExpression('curious'); setTimeout(() => cats.blue.setExpression('shy'), 1200); }
        const home = trayPos(d.id);
        await tween(380, (t) => { const e2 = ease.inOut(t); setT(d.el, x + (home.x - x) * e2, y + (home.y - y) * e2 - 16 * 4 * t * (1 - t)); });
        setT(d.el, home.x, home.y); d.el.classList.add('in-tray');
        svg.querySelectorAll('.ghost').forEach((gh) => gh.classList.remove('armed'));
        scheduleDemo();
      }
    }
    function onGhostTap(gid) {
      if (state.done || state.placed[gid]) return;
      clearTimeout(demoTimer);
      if (!state.selected) { ctx.announce(`first tap ${OBJ[gid].name} in the tray`); flash(svg.querySelector(`.obj[data-id="${gid}"]`), 'wiggle', 600); return; }
      if (state.selected !== gid) { flash(svg.querySelector(`.ghost[data-id="${gid}"]`), 'shake', 420); Sound.play('nope'); ctx.announce(`that outline is for ${OBJ[gid].name}. try step ${OBJ[state.selected].n}.`); return; }
      const id = state.selected; select(null);
      const o = svg.querySelector(`.obj[data-id="${id}"]`); const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(o.getAttribute('transform'));
      place(id, { x: Number(m[1]), y: Number(m[2]) });
    }
    async function place(id, from) {
      const L = LAY[layout];
      const o = svg.querySelector(`.obj[data-id="${id}"]`); const to = ghostPos(id);
      o.classList.remove('selected', 'in-tray'); svg.querySelectorAll('.ghost').forEach((gh) => gh.classList.remove('armed'));
      await tween(300, (t) => { const e = ease.inOut(t); setT(o, from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e - 20 * 4 * t * (1 - t)); });
      setT(o, to.x, to.y);
      state.placed[id] = true; o.classList.add('placed'); o.setAttribute('tabindex', '-1');
      const gh = svg.querySelector(`.ghost[data-id="${id}"]`); gh.classList.remove('open'); gh.classList.add('filled'); gh.setAttribute('tabindex', '-1');
      flash(o, 'settle', 460); Sound.play('place');
      sparkles(svg, to.x + (OBJ[id].w * L.k) / 2, to.y + OBJ[id].h * L.k, 4, OBJ[id].w * L.k);
      cats.blue.setExpression('excited'); cats.blue.bounce(6, 320); setTimeout(() => cats.blue.setExpression('shy'), 1400);
      updateProgress(); ctx.announce(`${OBJ[id].name} placed. ${C.stairs.progress(IDS.filter((k2) => state.placed[k2]).length)}`);
      if (IDS.every((k2) => state.placed[k2])) { state.done = true; svg.querySelector('.tray').classList.add('away'); await wait(350); await climb(); }
    }
    // the staircase lights up step by step, the cats hop up it, the door opens, blue takes the envelope,
    // pink joins him, they nuzzle, both go in, the door closes and the lantern and peephole glow
    async function climb() {
      state.climbing = true;
      const L = LAY[layout]; const k = L.k; const h = L.catH; const fx = svg.querySelector('.fx');
      const steps = IDS.map((id) => ({ x: L.ghosts[id].x + (OBJ[id].w * k) / 2, y: objTop(id) + 2 }));
      const land = { x: L.plat.x + L.plat.w * 0.36, y: L.plat.y + 1 };
      const doorC = { x: L.door.x + L.door.w / 2, y: L.door.y + L.door.h };
      // 1. the staircase glows from the bottom up
      for (const id of IDS.concat(['plat'])) { const g = svg.querySelector(`.step-glow[data-id="${id}"]`); tween(700, (t) => g.setAttribute('opacity', String(0.75 * Math.sin(Math.PI * t)))); Sound.play('chime'); await wait(190); }
      // 2. both react
      cats.blue.setExpression('joy'); cats.pink.setExpression('delighted');
      await Promise.all([cats.blue.bounce(8, 360), (async () => { await wait(80); await cats.pink.bounce(8, 360); })()]);
      // 3. blue prepares: looks up at the door, crouches
      await Promise.all([cats.blue.lookAt(1, 240), cats.pink.lookAt(1, 240)]); await cats.blue.tiltTo(-8, 240); await wait(160); await cats.blue.tiltTo(0, 200);
      cats.blue.setExpression('excited');
      // 4-6. hops: paws land on each object's top, then the landing; pink follows one step behind
      const hopB = async () => { for (const p of steps) { await cats.blue.hopTo(p.x, p.y, { height: 40 * (k + 0.4), dur: 520 }); await wait(130); } await cats.blue.hopTo(land.x, land.y, { height: 36 * (k + 0.4), dur: 560 }); };
      const hopP = async () => { await wait(640); for (const p of steps) { await cats.pink.hopTo(p.x, p.y, { height: 40 * (k + 0.4), dur: 520 }); await wait(130); } };
      await Promise.all([hopB(), hopP()]);
      // 7. the door swings open on its hinge; warm light inside
      const leaf = svg.querySelector('.door-hinge'); const light = svg.querySelector('.door-light');
      Sound.play('unlock');
      await tween(520, (t) => { const e = ease.inOut(t); leaf.style.transform = `scaleX(${(1 - 0.88 * e).toFixed(3)}) skewY(${(-6 * e).toFixed(2)}deg)`; light.setAttribute('opacity', String(0.9 * e)); });
      cats.blue.setExpression('surprised'); await cats.blue.blinkOnce();
      // 8. the envelope floats out to his paw
      const env = svg.querySelector('.door-envelope'); fx.appendChild(env);
      const b = env.getBBox(); const bc = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      cats.blue.set({ raiseR: 1 });
      const paw = cats.blue.pawPoint('r'); const target = { x: paw.x + paw.flip * b.width * 0.22, y: paw.y - b.height * 0.1 };
      await tween(620, (t) => { const e = ease.inOut(t); const sc = 1 - 0.2 * e; setT(env, (target.x - bc.x) * e, (target.y - bc.y) * e - 10 * Math.sin(Math.PI * t), `rotate(${-12 * e} ${bc.x} ${bc.y}) translate(${bc.x} ${bc.y}) scale(${sc}) translate(${-bc.x} ${-bc.y})`); });
      Sound.play('chime'); spawnHearts(fx, land.x, land.y - h - 8, 3, 40);
      cats.blue.setExpression('delighted'); await wait(300);
      // 9-10. pink joins him on the landing; a little nuzzle
      await cats.pink.hopTo(land.x - h * 0.42, land.y, { height: 36 * (k + 0.4), dur: 560 });
      cats.pink.setExpression('affectionate'); cats.blue.setExpression('affectionate');
      await Promise.all([cats.blue.nuzzle(-1, 320), cats.pink.nuzzle(1, 320)]); Sound.play('meow'); spawnHearts(fx, land.x - h * 0.2, land.y - h - 4, 2, 24); await wait(420);
      await Promise.all([cats.blue.leanTo(0, 200), cats.pink.leanTo(0, 200)]);
      // 11. both go in through the doorway (they shrink a little with the depth and slip behind the frame)
      cats.blue.faceDir(1); cats.pink.faceDir(1);
      const inside = async (c, delay) => { await wait(delay); const x0 = c.s.x, y0 = c.s.y; Sound.play('hop'); svg.querySelector('.door-inside').appendChild(c.el); // behind the frame and the leaf now
        await tween(600, (t) => { const e = ease.inOut(t); c.set({ x: x0 + (doorC.x - x0) * e, y: y0 + (doorC.y - y0) * e - 8 * Math.sin(Math.PI * t), sx: 1 - 0.3 * e, sy: 1 - 0.3 * e }); c.el.setAttribute('opacity', String(1 - Math.max(0, (t - 0.6) / 0.4))); }); };
      await Promise.all([inside(cats.blue, 0), inside(cats.pink, 260), tween(900, (t) => env.setAttribute('opacity', String(1 - t)))]);
      // 12-13. the door closes gently; the peephole and lantern glow, a few sparkles
      await tween(480, (t) => { const e = ease.inOut(t); leaf.style.transform = `scaleX(${(0.12 + 0.88 * e).toFixed(3)}) skewY(${(-6 * (1 - e)).toFixed(2)}deg)`; });
      Sound.play('place'); const peep = svg.querySelector('.door-peep'); peep.style.fill = '#ffe08a'; svg.querySelector('.lantern .lamp-glow').setAttribute('r', String(L.door.w * 0.8));
      Sound.play('flourish'); sparkles(svg, doorC.x, L.door.y + L.door.h * 0.4, 8, L.door.w * 1.6); spawnHearts(fx, doorC.x, L.door.y - 6, 2, 30);
      await wait(500);
      state.climbing = false;
      ctx.complete();
    }
    function finishedVisual() {
      svg.querySelector('.tray').classList.add('away'); svg.querySelector('.door-envelope').setAttribute('opacity', '0');
      cats.blue.el.setAttribute('opacity', '0'); cats.pink.el.setAttribute('opacity', '0');
      const L = LAY[layout]; svg.querySelector('.door-peep').style.fill = '#ffe08a'; svg.querySelector('.lantern .lamp-glow').setAttribute('r', String(L.door.w * 0.8));
    }
    return {
      mount(c, l) { container = c; layout = l; render(); },
      unmount() { clearTimeout(demoTimer); detach(); if (life) life(); life = null; },
      hint() { const id = IDS.find((k2) => !state.placed[k2]); if (!id) return; select(id); flash(svg.querySelector(`.obj[data-id="${id}"]`), 'wiggle', 600); flash(svg.querySelector(`.ghost[data-id="${id}"]`), 'wiggle', 600); ctx.announce(`${OBJ[id].name} goes on outline ${OBJ[id].n}`); },
      async skip() {
        if (state.done) return; select(null);
        for (const id of IDS) { if (!state.placed[id]) { const o = svg.querySelector(`.obj[data-id="${id}"]`); const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(o.getAttribute('transform')); await place(id, { x: Number(m[1]), y: Number(m[2]) }); if (state.done) return; await wait(120); } }
      },
    };
  });

  /* ============================================================
     EPILOGUE — the tiny secret
     ============================================================ */
  TA.registerScene('epilogue', (ctx) => {
    let layout, container, cats, life = null;
    function render() {
      const wide = layout === 'wide';
      const W = wide ? 640 : 400, Hh = wide ? 400 : 384;
      const env = wide ? { x: 170, y: 176, w: 300, h: 164 } : { x: 70, y: 166, w: 260, h: 146 };
      const card = { x: env.x + env.w * 0.1, y: env.y + 14, w: env.w * 0.8, h: env.h * 0.9 };
      const rise = -(env.h * 0.82); const catH = wide ? 104 : 90;
      const stamp = { x: card.x + card.w - 34, y: card.y + 10, s: 24 };
      const inner = `
        <defs>${Doodle.defs('e')}</defs>
        ${Doodle.sky(W, Hh, 'e', 26, 'dusk')}
        ${Doodle.hills(W, Hh - 70, Hh, { tone: '#e9f0fb', tone2: '#f6f9fe' })}
        <ellipse cx="${W / 2}" cy="${env.y + env.h * 0.6}" rx="${env.w * 0.9}" ry="${env.h * 1.1}" fill="url(#e-spot)"/>
        ${Doodle.lights(14, 16, W - 14, 16, wide ? 11 : 8, 16)}
        ${Doodle.snowfall(W, Hh, wide ? 14 : 10, 44)}
        <g class="env-flap env-flap-open" style="transform-origin:${env.x + env.w / 2}px ${env.y}px"><path d="M${env.x} ${env.y} L${env.x + env.w / 2} ${env.y + env.h * 0.62} L${env.x + env.w} ${env.y} Z" fill="#fbe3ec" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/></g>
        ${Doodle.softShadow(env.x + env.w / 2, env.y + env.h + 4, env.w * 0.52, 8, 0.1)}
        <rect x="${env.x}" y="${env.y}" width="${env.w}" height="${env.h}" rx="${env.h * 0.06}" fill="#f7eee2" stroke="var(--ink)" stroke-width="3"/>
        <g class="env-card" style="--card-rise:${rise}px">
          <rect x="${card.x + 4}" y="${card.y + 5}" width="${card.w}" height="${card.h}" rx="10" fill="var(--ink)" opacity=".08"/>
          <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="10" fill="url(#e-paper)" stroke="var(--ink)" stroke-width="3"/>
          <rect x="${card.x + 8}" y="${card.y + 8}" width="${card.w - 16}" height="${card.h - 16}" rx="7" fill="none" stroke="var(--heart)" stroke-width="1.6" stroke-dasharray="5 4" opacity=".7"/>
          <g class="stamp"><rect x="${stamp.x}" y="${stamp.y}" width="${stamp.s}" height="${stamp.s}" rx="3" fill="var(--pink)" stroke="var(--ink)" stroke-width="2" stroke-dasharray="2.5 2.5"/>${Doodle.heart(stamp.x + stamp.s / 2, stamp.y + stamp.s / 2 + 1, 13)}</g>
          <text x="${card.x + card.w / 2}" y="${card.y + card.h * 0.36}" text-anchor="middle" font-size="${wide ? 16 : 14}" fill="var(--ink-soft)">${C.epilogue.label}</text>
          <text x="${card.x + card.w / 2}" y="${card.y + card.h * 0.7}" text-anchor="middle" font-size="${wide ? 44 : 38}" fill="#d9678d">${ctx.secret}</text>
          <path d="M${card.x + card.w * 0.3} ${card.y + card.h * 0.8} h${card.w * 0.4}" stroke="var(--heart)" stroke-width="2" stroke-linecap="round" opacity=".6"/>
        </g>
        ${Doodle.envelopeFront(env.x, env.y, env.w, env.h, 3).replace('fill="#fff"', 'fill="url(#e-paper)"')}
        <path d="M${env.x + 4} ${env.y + env.h - 4} L${env.x + env.w * 0.42} ${env.y + env.h * 0.55} M${env.x + env.w - 4} ${env.y + env.h - 4} L${env.x + env.w * 0.58} ${env.y + env.h * 0.55}" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
        <g class="env-flap env-flap-closed" style="transform-origin:${env.x + env.w / 2}px ${env.y}px"><path d="M${env.x} ${env.y} L${env.x + env.w / 2} ${env.y + env.h * 0.62} L${env.x + env.w} ${env.y} Z" fill="var(--pink)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>${Doodle.heart(env.x + env.w / 2, env.y + env.h * 0.6, 30)}</g>
        <g class="cats"></g>
        <g class="drift" style="--d:0s">${Doodle.heart(W * 0.12, Hh * 0.3, 20)}</g><g class="drift" style="--d:-2s">${Doodle.heart(W * 0.9, Hh * 0.24, 16)}</g><g class="drift" style="--d:-3.4s">${Doodle.star(W * 0.86, Hh * 0.5, 18)}</g>
        <g class="fx"></g>`;
      const svg = makeSvg(container, `0 0 ${W} ${Hh}`, inner, 'the two cats snuggled in front of an open envelope; the secret word rises out of it');
      if (life) life();
      cats = mountCats(svg, catH, 'affectionate', 'affectionate'); life = cats.stop;
      cats.blue.place(W / 2 - catH * 0.52, Hh - 8).set({ lean: 7 }); cats.pink.place(W / 2 + catH * 0.52, Hh - 8).set({ lean: -7 });
      cats.blue.faceDir(1); cats.pink.faceDir(-1);
      const section = ctx.section; section.classList.remove('reveal-ready'); void section.offsetWidth;
      setTimeout(() => { section.classList.add('reveal-ready'); Sound.play('tada'); }, 350);
      setTimeout(async () => { const fx = container.querySelector('.fx'); if (fx) spawnHearts(fx, W / 2, Hh * 0.3, 4, 120); await Promise.all([cats.blue.bounce(10, 520), (async () => { await wait(90); await cats.pink.bounce(10, 520); })()]); }, 1900);
    }
    return { mount(c, l) { container = c; layout = l; render(); }, unmount() { if (life) life(); life = null; } };
  });
})();
