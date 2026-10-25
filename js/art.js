/* ------------------------------------------------------------
   a tiny adventure — the shared illustration kit
   One hand draws everything: a 3-ish ink line with round caps,
   pastel fills, soft shadows under things, pale outline-less
   shapes in the distance, and a little life (snow, lights, crowd).
   Extends TA.helpers.Doodle; scenes compose their worlds from it.
   ------------------------------------------------------------ */
(() => {
  'use strict';
  const TA = window.TA;
  const D = TA.helpers.Doodle;
  const INK = 'var(--ink)';
  const f = (n) => Number(n.toFixed(1));
  // small seeded generator so a re-render (resize) draws the same world
  function rng(seed) { let s = (seed * 2654435761) >>> 0 || 7; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const PASTELS = ['#dcd4f5', '#f6d2e0', '#cfe0f8', '#fde9c0', '#e6def7', '#f9d5e4'];
  // a point on a quadratic bezier
  const qb = (p0, p1, p2, t) => ({ x: (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], y: (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1] });

  Object.assign(D, {
    // ---- gradients a scene drops into its <defs>; ids are prefixed per scene
    defs(p = 'd') {
      return `
        <linearGradient id="${p}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#edf5fe"/><stop offset="1" stop-color="#fdf4f7"/></linearGradient>
        <linearGradient id="${p}-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7e2f8"/><stop offset=".55" stop-color="#f6eef7"/><stop offset="1" stop-color="#fdf6f1"/></linearGradient>
        <linearGradient id="${p}-ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6fbff"/><stop offset="1" stop-color="#d9e9fa"/></linearGradient>
        <linearGradient id="${p}-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f6efe3"/></linearGradient>
        <linearGradient id="${p}-cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf8ee"/><stop offset="1" stop-color="#f3e6cc"/></linearGradient>
        <linearGradient id="${p}-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eaf2fb"/></linearGradient>
        <radialGradient id="${p}-glow"><stop offset="0" stop-color="#fff0bf" stop-opacity=".95"/><stop offset="1" stop-color="#fff0bf" stop-opacity="0"/></radialGradient>
        <radialGradient id="${p}-spot"><stop offset="0" stop-color="#ffffff" stop-opacity=".6"/><stop offset=".65" stop-color="#ffffff" stop-opacity=".16"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
        <radialGradient id="${p}-pinkglow"><stop offset="0" stop-color="#f49fbb" stop-opacity=".55"/><stop offset="1" stop-color="#f49fbb" stop-opacity="0"/></radialGradient>
        <radialGradient id="${p}-vignette" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#d9d2f3" stop-opacity=".35"/></radialGradient>`;
    },
    // ---- the page behind a scene: a rounded sky card with a whisper of vignette
    sky(W, H, p = 'd', r = 24, kind = 'sky') {
      return `<rect x="0" y="0" width="${W}" height="${H}" rx="${r}" fill="url(#${p}-${kind})"/><rect x="0" y="0" width="${W}" height="${H}" rx="${r}" fill="url(#${p}-vignette)"/>`;
    },
    // ---- soft rolling snow hills, no ink (they live in the distance)
    hills(W, y, H, { tone = '#e3edf9', tone2 = '#f1f6fc' } = {}) {
      return `
        <path d="M0 ${y + 22} C ${W * 0.18} ${y - 12}, ${W * 0.36} ${y + 26}, ${W * 0.52} ${y + 6} S ${W * 0.84} ${y - 14}, ${W} ${y + 12} V ${H} H0 Z" fill="${tone}"/>
        <path d="M0 ${y + 46} C ${W * 0.22} ${y + 22}, ${W * 0.42} ${y + 56}, ${W * 0.62} ${y + 38} S ${W * 0.9} ${y + 20}, ${W} ${y + 42} V ${H} H0 Z" fill="${tone2}"/>`;
    },
    // ---- a snowy pine: three scalloped tiers and a stubby trunk; ink only in the foreground
    pine(x, y, h, { ink = true, fill = '#cfe3f7', snow = true } = {}) {
      const sw = ink ? 2.6 : 0;
      const tier = (w, top, hh) => {
        const b = top + hh; const q = w / 4;
        return `M${f(x)} ${f(top)} C ${f(x + w * 0.16)} ${f(top + hh * 0.35)}, ${f(x + w * 0.42)} ${f(b - 6)}, ${f(x + w / 2)} ${f(b)} q ${f(-q / 2)} -5 ${f(-q)} 0 q ${f(-q / 2)} -5 ${f(-q)} 0 q ${f(-q / 2)} -5 ${f(-q)} 0 q ${f(-q / 2)} -5 ${f(-q)} 0 C ${f(x - w * 0.42)} ${f(b - 6)}, ${f(x - w * 0.16)} ${f(top + hh * 0.35)}, ${f(x)} ${f(top)} Z`;
      };
      const t0 = y - h, trunk = h * 0.12;
      const tiers = [[h * 0.78, t0 + h * 0.34, h * 0.56], [h * 0.6, t0 + h * 0.14, h * 0.48], [h * 0.42, t0, h * 0.4]];
      return `<g class="pine">
        <rect x="${f(x - h * 0.06)}" y="${f(y - trunk - 2)}" width="${f(h * 0.12)}" height="${f(trunk + 2)}" rx="2" fill="#d9b98a" ${ink ? `stroke="${INK}" stroke-width="${sw}"` : ''}/>
        ${tiers.map(([w, top, hh]) => `<path d="${tier(w, top, hh)}" fill="${fill}" ${ink ? `stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"` : ''}/>`).join('')}
        ${snow && ink ? tiers.map(([w, top, hh]) => `<path d="M${f(x - w * 0.22)} ${f(top + hh * 0.5)} q ${f(w * 0.11)} -6 ${f(w * 0.22)} 0 q ${f(w * 0.11)} -6 ${f(w * 0.22)} 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>`).join('') : ''}
      </g>`;
    },
    // ---- a little lamp post with a warm pool of light
    lamp(x, y, h, p = 'd') {
      const top = y - h;
      return `<g class="lamp">
        <circle class="lamp-glow" cx="${x}" cy="${f(top + 8)}" r="${f(h * 0.42)}" fill="url(#${p}-glow)"/>
        <path d="M${x} ${y} V ${f(top + 16)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
        <path d="M${x - 11} ${y} h22" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
        <path d="M${x - 9} ${f(top + 16)} l-2 -14 h22 l-2 14 z" fill="#fff5d6" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M${x - 13} ${f(top + 2)} l13 -9 l13 9 z" fill="${INK}"/>
        <circle cx="${x}" cy="${f(top + 9)}" r="3" fill="#ffd76a"/>
      </g>`;
    },
    // ---- a string of little lights (bulbs twinkle), sagging between two points
    lights(x1, y1, x2, y2, n = 7, sag = 18) {
      const c = [(x1 + x2) / 2, Math.max(y1, y2) + sag];
      let out = `<g class="lights"><path d="M${x1} ${y1} Q ${f(c[0])} ${f(c[1])} ${x2} ${y2}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
      for (let i = 0; i < n; i++) {
        const pt = qb([x1, y1], c, [x2, y2], (i + 0.5) / n); const col = ['#ffe08a', '#f9b8cc', '#bfe0fb', '#dcd4f5'][i % 4];
        out += `<circle class="bulb-halo" cx="${f(pt.x)}" cy="${f(pt.y + 5)}" r="7" fill="${col}" opacity=".4" style="--d:${(i * 0.37).toFixed(2)}s"/>
          <path d="M${f(pt.x)} ${f(pt.y)} v3" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
          <circle class="bulb" cx="${f(pt.x)}" cy="${f(pt.y + 6)}" r="3.4" fill="${col}" stroke="${INK}" stroke-width="1.6" style="--d:${(i * 0.37).toFixed(2)}s"/>`;
      }
      return out + '</g>';
    },
    // ---- bunting: little pastel flags on a sagging string
    bunting(x1, y1, x2, y2, n = 7, sag = 16) {
      const c = [(x1 + x2) / 2, Math.max(y1, y2) + sag];
      let out = `<g class="bunting"><path d="M${x1} ${y1} Q ${f(c[0])} ${f(c[1])} ${x2} ${y2}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
      for (let i = 0; i < n; i++) {
        const pt = qb([x1, y1], c, [x2, y2], (i + 0.5) / n); const col = PASTELS[(i * 2) % PASTELS.length];
        out += `<path class="flag" d="M${f(pt.x - 7)} ${f(pt.y)} L${f(pt.x + 7)} ${f(pt.y)} L${f(pt.x)} ${f(pt.y + 13)} Z" fill="${col}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" style="--d:${(i * 0.3).toFixed(2)}s"/>`;
      }
      return out + '</g>';
    },
    // ---- a slow snowfall across the scene (CSS animates the flakes; the circles carry no transform attribute)
    snowfall(W, H, n = 12, seed = 3) {
      const r = rng(seed); let out = '<g class="snowfall" aria-hidden="true">';
      for (let i = 0; i < n; i++) {
        const x = f(8 + r() * (W - 16)), rad = f(1.6 + r() * 1.8), t = (9 + r() * 7).toFixed(1), d = (-r() * 16).toFixed(1), sway = f((r() - 0.5) * 40);
        out += `<circle class="flake" cx="${x}" cy="-6" r="${rad}" fill="#fff" stroke="#cfe2f6" stroke-width="1" style="--t:${t}s;--d:${d}s;--fall:${H + 14}px;--sway:${sway}px"/>`;
      }
      return out + '</g>';
    },
    softShadow: (cx, cy, rx, ry = rx * 0.18, op = 0.09) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${INK}" opacity="${op}"/>`,
    spotlight: (cx, cy, rx, ry, p = 'd', cls = 'spot') => `<ellipse class="${cls}" cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${p}-spot)"/>`,
    // ---- a soft crowd of tiny cats in the stands: head with two ears over round shoulders, back row first,
    //      pastel tints that fade with distance, a few paws and hearts up
    audience(x, y, w, rows = 3, seed = 5, k = 1) {
      const r = rng(seed); let out = '<g class="audience" aria-hidden="true">';
      const tints = [['#d9d0f3', '#c4b8ea'], ['#f6d0df', '#ecb6cc'], ['#cddff7', '#b4cdf0'], ['#fbe6c4', '#f0d19e'], ['#e3dbf6', '#cfc3ee'], ['#f9d5e4', '#efbdd2']];
      for (let row = 0; row < rows; row++) {
        const rad = (5.6 + row * 0.9) * k; const step = rad * 2.35; const yr = y + row * rad * 2.15;
        const n = Math.floor(w / step); const off = (w - n * step) / 2 + (row % 2 ? step / 2 : 0); const far = (rows - 1 - row) * 0.18;
        out += `<g class="aud-row">`;
        for (let i = 0; i < n; i++) {
          const cx = x + off + i * step; if (cx > x + w - rad) break;
          const [fill, line] = tints[Math.floor(r() * tints.length)]; const jy = (r() - 0.5) * 2.5; const cy = yr + jy;
          const paw = r() < 0.12; const heart = !paw && r() < 0.1;
          out += `<g class="aud" style="--d:${(r() * 3).toFixed(2)}s" opacity="${(1 - far).toFixed(2)}">
            <path d="M${f(cx - rad * 1.35)} ${f(cy + rad * 2.1)} q0 -${f(rad * 1.3)} ${f(rad * 1.35)} -${f(rad * 1.3)} q${f(rad * 1.35)} 0 ${f(rad * 1.35)} ${f(rad * 1.3)} z" fill="${fill}" stroke="${line}" stroke-width="1.2"/>
            <path d="M${f(cx - rad * 0.9)} ${f(cy - rad * 0.35)} l-${f(rad * 0.2)} -${f(rad * 0.95)} l${f(rad * 0.75)} ${f(rad * 0.45)} z M${f(cx + rad * 0.9)} ${f(cy - rad * 0.35)} l${f(rad * 0.2)} -${f(rad * 0.95)} l-${f(rad * 0.75)} ${f(rad * 0.45)} z" fill="${fill}" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/>
            <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad)}" fill="${fill}" stroke="${line}" stroke-width="1.2"/>
            ${paw ? `<circle cx="${f(cx + rad * 1.5)}" cy="${f(cy - rad * 0.2)}" r="${f(rad * 0.42)}" fill="${fill}" stroke="${line}" stroke-width="1.2"/>` : ''}
          </g>`;
          if (heart) out += `<g class="aud-heart" style="--d:${(r() * 4).toFixed(2)}s">${D.heart(cx + rad * 0.9, cy - rad * 1.9, 7 * k)}</g>`;
        }
        out += '</g>';
      }
      return out + '</g>';
    },
    // ---- rink boards along the back of the ice: a white band with little posts and a pink stripe
    boards(cx, cy, rx, ry, a0 = 196, a1 = 344, band = 12) {
      const P = (r1, r2, a) => [f(cx + r1 * Math.cos(a * Math.PI / 180)), f(cy + r2 * Math.sin(a * Math.PI / 180))];
      const o0 = P(rx + band, ry + band, a0), o1 = P(rx + band, ry + band, a1), i0 = P(rx, ry, a0), i1 = P(rx, ry, a1);
      const d = `M${o0[0]} ${o0[1]} A${rx + band} ${ry + band} 0 0 1 ${o1[0]} ${o1[1]} L${i1[0]} ${i1[1]} A${rx} ${ry} 0 0 0 ${i0[0]} ${i0[1]} Z`;
      let posts = '';
      for (let a = a0 + 8; a < a1; a += 12) { const u = P(rx + band - 1.5, ry + band - 1.5, a), v = P(rx + 1.5, ry + 1.5, a); posts += `<path d="M${u[0]} ${u[1]} L${v[0]} ${v[1]}" stroke="${INK}" stroke-width="1.6" opacity=".35"/>`; }
      const m0 = P(rx + band * 0.5, ry + band * 0.5, a0 + 1), m1 = P(rx + band * 0.5, ry + band * 0.5, a1 - 1);
      return `<g class="boards">
        <path d="${d}" fill="#fbfcff" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M${m0[0]} ${m0[1]} A${rx + band * 0.5} ${ry + band * 0.5} 0 0 1 ${m1[0]} ${m1[1]}" fill="none" stroke="var(--pink)" stroke-width="${band * 0.4}" opacity=".9"/>
        ${posts}
      </g>`;
    },
    // ---- a hanging banner with a scalloped hem
    banner(cx, y, w, h, text, { fill = '#fff', size = 15 } = {}) {
      const x = cx - w / 2; const n = 6; const q = w / n;
      let hem = ''; for (let i = 0; i < n; i++) hem += ` q ${f(-q / 2)} 9 ${f(-q)} 0`;
      return `<g class="banner">
        <path d="M${f(x + 6)} ${f(y - 14)} l-6 14 M${f(x + w - 6)} ${f(y - 14)} l6 14" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
        <path d="M${f(x)} ${y} h${f(w)} v${f(h)}${hem} Z" fill="${fill}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>
        <text x="${cx}" y="${f(y + h * 0.66)}" text-anchor="middle" font-size="${size}" fill="${INK}">${text}</text>
        ${D.heart(x + 14, y + h * 0.5, 11)}${D.heart(x + w - 14, y + h * 0.5, 11)}
      </g>`;
    },
    // ---- a scalloped snow cap along a sloping roof edge, from (x1,y1) to (x2,y2)
    snowcap(x1, y1, x2, y2, thick = 9, bumps = 4) {
      const dx = (x2 - x1) / bumps, dy = (y2 - y1) / bumps; const nx = -(y2 - y1), ny = (x2 - x1); const L = Math.hypot(nx, ny) || 1; const ox = nx / L * thick, oy = ny / L * thick;
      let d = `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} L${f(x2 - ox)} ${f(y2 - oy)}`;
      for (let i = bumps - 1; i >= 0; i--) { const mx = x1 + dx * (i + 0.5) - ox * 1.9, my = y1 + dy * (i + 0.5) - oy * 1.9; d += ` Q ${f(mx)} ${f(my)} ${f(x1 + dx * i - ox)} ${f(y1 + dy * i - oy)}`; }
      return `<path d="${d} Z" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
    },
    // ---- the lane's ticket booth, dressed up: striped awning, warm window, sign, snow on the roof
    booth2(x, y, w, h, p = 'd') {
      const roofH = h * 0.24, wallY = y + roofH, wallH = h - roofH; const awY = wallY + wallH * 0.2;
      let stripes = ''; const n = 6; for (let i = 0; i < n; i++) { if (i % 2) stripes += `<rect x="${f(x + 2 + (w - 4) * i / n)}" y="${f(awY)}" width="${f((w - 4) / n)}" height="${f(wallH * 0.17)}" fill="var(--pink)"/>`; }
      let hem = ''; const q = (w - 4) / n; for (let i = 0; i < n; i++) hem += ` q ${f(-q / 2)} 6 ${f(-q)} 0`;
      return `<g class="booth">
        ${D.softShadow(x + w / 2, y + h + 2, w * 0.55, 6, 0.08)}
        <rect x="${f(x + w * 0.06)}" y="${f(wallY)}" width="${f(w * 0.88)}" height="${f(wallH)}" rx="${f(w * 0.06)}" fill="url(#${p}-paper)" stroke="${INK}" stroke-width="3"/>
        <path d="M${f(x + w * 0.1)} ${f(wallY + wallH * 0.1)} v${f(wallH * 0.82)} M${f(x + w * 0.9)} ${f(wallY + wallH * 0.1)} v${f(wallH * 0.82)}" stroke="#e8dcc6" stroke-width="2" stroke-linecap="round"/>
        <rect x="${f(x + w * 0.24)}" y="${f(wallY + wallH * 0.36)}" width="${f(w * 0.52)}" height="${f(wallH * 0.36)}" rx="${f(w * 0.07)}" fill="#fff5d6" stroke="${INK}" stroke-width="3"/>
        <path d="M${f(x + w * 0.24)} ${f(wallY + wallH * 0.58)} h${f(w * 0.52)}" stroke="${INK}" stroke-width="2.2"/>
        <rect x="${f(x + w * 0.2)}" y="${f(wallY + wallH * 0.7)}" width="${f(w * 0.6)}" height="${f(wallH * 0.07)}" rx="3" fill="#f3dcb4" stroke="${INK}" stroke-width="2.2"/>
        <g>${stripes}<path d="M${f(x + 2)} ${f(awY)} h${f(w - 4)} v${f(wallH * 0.17)}${hem} Z" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/></g>
        <path d="M${x} ${f(wallY + 4)} L${f(x + w / 2)} ${y} L${f(x + w)} ${f(wallY + 4)} Z" fill="var(--pink)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        ${D.snowcap(x + w * 0.1, wallY - roofH * 0.42 + 4, x + w * 0.5, y + 2, 7, 3)}
        <rect x="${f(x + w * 0.22)}" y="${f(wallY - 6)}" width="${f(w * 0.56)}" height="${f(roofH * 0.62)}" rx="${f(roofH * 0.2)}" fill="#fff" stroke="${INK}" stroke-width="2.6"/>
        <text x="${f(x + w / 2)}" y="${f(wallY + roofH * 0.4 - 5)}" text-anchor="middle" font-size="${f(roofH * 0.46)}">tickets</text>
        ${D.heart(x + w * 0.5, wallY + wallH * 0.9, w * 0.13)}
      </g>`;
    },
    // ---- the tower of the stairs chapter: no ground entrance, a little landing high up with an arched door,
    //      a round attic window above it, a lantern by the door. The door group swings on its left hinge.
    tower(x, y, w, h, door, plat, p = 'd') {
      const roofH = w * 0.42; const wallY = y + roofH; const wallH = h - roofH;
      const dx = door.x, dy = door.y, dw = door.w, dh = door.h; const r = dw / 2;
      const arch = `M${f(dx)} ${f(dy + dh)} v-${f(dh - r)} a${f(r)} ${f(r)} 0 0 1 ${f(dw)} 0 v${f(dh - r)} z`;
      const attic = { cx: x + w / 2, cy: wallY + (dy - wallY) * 0.48, r: Math.min(w * 0.13, (dy - wallY) * 0.3) };
      return `<g class="tower">
        ${D.softShadow(x + w / 2, y + h + 2, w * 0.6, 7, 0.08)}
        <rect x="${f(x)}" y="${f(wallY)}" width="${f(w)}" height="${f(wallH)}" fill="url(#${p}-paper)" stroke="${INK}" stroke-width="3.2"/>
        <g stroke="#ebe1cf" stroke-width="2" stroke-linecap="round">${[0.3, 0.5, 0.7, 0.9].map((t) => `<path d="M${f(x + 6)} ${f(wallY + wallH * t)} h${f(w - 12)}"/>`).join('')}</g>
        <path d="M${f(x - w * 0.12)} ${f(wallY + 2)} L${f(x + w / 2)} ${f(y)} L${f(x + w * 1.12)} ${f(wallY + 2)} Z" fill="var(--pink)" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M${f(x + w * 0.1)} ${f(wallY - roofH * 0.33)} L${f(x + w * 0.5)} ${f(y + roofH * 0.25)} L${f(x + w * 0.9)} ${f(wallY - roofH * 0.33)}" fill="none" stroke="#e9b4c8" stroke-width="2" stroke-linecap="round"/>
        ${D.snowcap(x - w * 0.12 + 6, wallY - 1, x + w / 2 - 2, y + 1, 8, 4)}
        <circle cx="${f(attic.cx)}" cy="${f(attic.cy)}" r="${f(attic.r)}" fill="url(#${p}-ice)" stroke="${INK}" stroke-width="2.8"/>
        <path d="M${f(attic.cx - attic.r)} ${f(attic.cy)} h${f(attic.r * 2)} M${f(attic.cx)} ${f(attic.cy - attic.r)} v${f(attic.r * 2)}" stroke="${INK}" stroke-width="1.8" opacity=".3"/>
        <g class="door-inside"><path d="${arch}" fill="#fff1cc"/><path d="${arch}" class="door-light" fill="#ffe08a" opacity="0"/>
          <g class="door-hook"><path d="M${f(dx + dw / 2)} ${f(dy + dh * 0.3)} v-6" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g></g>
        <g class="door-frame"><path d="${arch}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/></g>
        <g class="door-hinge" style="transform-origin:${f(dx)}px ${f(dy)}px; transform-box: view-box">
          <path d="${arch}" fill="var(--pink)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
          <circle class="door-peep" cx="${f(dx + dw / 2)}" cy="${f(dy + dh * 0.36)}" r="${f(dw * 0.19)}" fill="url(#${p}-ice)" stroke="${INK}" stroke-width="2.2"/>
          ${D.heart(dx + dw / 2, dy + dh * 0.7, dw * 0.3)}
          <circle cx="${f(dx + dw * 0.8)}" cy="${f(dy + dh * 0.58)}" r="2.4" fill="${INK}"/>
        </g>
        <g class="landing">
          <rect x="${f(plat.x)}" y="${f(plat.y)}" width="${f(plat.w)}" height="${f(plat.h)}" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/>
          <path d="M${f(plat.x + 6)} ${f(plat.y + plat.h)} v7 M${f(plat.x + plat.w * 0.5)} ${f(plat.y + plat.h)} v7" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M${f(plat.x + 4)} ${f(plat.y)} v-${f(plat.rail)} M${f(plat.x + 4)} ${f(plat.y - plat.rail)} h${f(plat.railW)}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
        </g>
        <g class="lantern"><circle class="lamp-glow" cx="${f(dx + dw + 12)}" cy="${f(dy + dh * 0.3)}" r="${f(dw * 0.5)}" fill="url(#${p}-glow)"/><path d="M${f(dx + dw + 12)} ${f(dy + dh * 0.1)} v4" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><rect x="${f(dx + dw + 7)}" y="${f(dy + dh * 0.1 + 4)}" width="10" height="13" rx="2.5" fill="#fff5d6" stroke="${INK}" stroke-width="2.2"/><circle cx="${f(dx + dw + 12)}" cy="${f(dy + dh * 0.1 + 10.5)}" r="2.2" fill="#ffd76a"/></g>
      </g>`;
    },
    // ---- the Geneva house (the flashback's building, and the one the staircase leads up to).
    // Drawn in house units (wall 270 wide, 370 tall, origin at the left wall on the ground) and scaled by s;
    // stroke widths are divided by s so the ink stays the same weight as the rest of the scene.
    // Geometry (house units): ground door x 116 w 76 h 122; keypad x 78 y -84 w 26 h 36; balcony x 86..236 at y -208
    // (floor h 10, rail 44); balcony door x 116..206, y -294..-208. HOUSE.door/plat give them back in scene units.
    house(x, ground, s = 1, p = 'd', { keypad = true } = {}) {
      const SW = (v) => f(v / s); const g = 0;
      const win = (wx, wy, ww, wh) => `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="4" fill="url(#${p}-ice)" stroke="${INK}" stroke-width="${SW(2.6)}"/><path d="M${wx + ww / 2} ${wy + 2} v${wh - 4} M${wx + 2} ${wy + wh / 2} h${ww - 4}" stroke="${INK}" stroke-width="${SW(1.6)}" opacity=".3"/><rect x="${wx - 4}" y="${wy + wh - 1}" width="${ww + 8}" height="5" rx="2" fill="#fff" stroke="${INK}" stroke-width="${SW(2)}"/>`;
      const B = { w: 270, y: -370 }, Dr = { x: 116, w: 76, h: 122 }, P = { x: 78, y: -84, w: 26, h: 36 }, K = { x: 86, y: -208, w: 150, h: 10, rail: 44 };
      const BD = { x: K.x + 30, y: K.y - 86, w: K.w - 60, h: 86 };   // the balcony door
      const doorY = g - Dr.h;
      let keys = ''; if (keypad) for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys += `<rect class="key" data-k="${r * 3 + c}" x="${P.x + 4 + c * 6.4}" y="${P.y + 4 + r * 6.6}" width="5" height="5" rx="1.2" fill="#fff" stroke="${INK}" stroke-width="${SW(1)}"/>`;
      const bdRect = `x="${BD.x}" y="${BD.y}" width="${BD.w}" height="${BD.h}" rx="3"`;
      const inv = `scale(${Number((1 / s).toFixed(5))}) translate(${f(-x)} ${f(-ground)})`;   // slots for cats keep scene coordinates
      return `<g class="house" transform="translate(${f(x)} ${f(ground)}) scale(${s})">
        ${D.softShadow(B.w / 2, g + 2, B.w * 0.56, 7 / s, 0.08)}
        <rect x="0" y="${B.y}" width="${B.w}" height="${-B.y}" fill="url(#${p}-paper)" stroke="${INK}" stroke-width="${SW(3.2)}"/>
        <g stroke="#ebe1cf" stroke-width="${SW(2)}" stroke-linecap="round">${[0.22, 0.4, 0.58, 0.76, 0.92].map((t) => `<path d="M6 ${B.y + (-B.y) * t} h${B.w - 12}"/>`).join('')}</g>
        <path d="M-10 ${B.y + 2} h${B.w + 20} v-10 q0 -4 4 -4 h-${B.w + 28} q4 0 4 4 z" fill="var(--pink)" stroke="${INK}" stroke-width="${SW(3)}" stroke-linejoin="round"/>
        ${D.snowcap(-10, B.y - 10, B.w + 10, B.y - 10, 8, 6).replace(/stroke-width="([\d.]+)"/g, (m, v) => `stroke-width="${SW(Number(v))}"`)}
        ${win(24, B.y + 38, 44, 50)}${win(B.w - 68, B.y + 38, 44, 50)}
        ${win(24, B.y + 150, 44, 50)}
        <!-- the balcony door (it opens in chapter 3): warm inside, frame, the leaf on its hinge -->
        <g class="door-inside"><rect ${bdRect} fill="#fff1cc"/><rect class="door-light" ${bdRect} fill="#ffe08a" opacity="0"/><g class="door-cats" transform="${inv}"></g></g>
        <g class="door-slot" transform="${inv}"></g>
        <g class="door-frame"><rect ${bdRect} fill="none" stroke="${INK}" stroke-width="${SW(2.8)}"/></g>
        <g class="door-hinge" style="transform-origin:${f(BD.x)}px ${f(BD.y)}px; transform-box: view-box">
          <rect class="door-peep" ${bdRect} fill="url(#${p}-ice)" stroke="${INK}" stroke-width="${SW(2.8)}"/>
          <path d="M${BD.x + BD.w / 2} ${BD.y + 2} v${BD.h - 4}" stroke="${INK}" stroke-width="${SW(1.6)}" opacity=".3"/>
          <circle cx="${BD.x + BD.w * 0.42}" cy="${BD.y + BD.h * 0.55}" r="2" fill="${INK}"/>
        </g>
        <g class="lantern"><circle class="lamp-glow" cx="${BD.x + BD.w + 14}" cy="${BD.y + 22}" r="18" fill="url(#${p}-glow)"/><path d="M${BD.x + BD.w + 14} ${BD.y + 8} v4" stroke="${INK}" stroke-width="${SW(2)}" stroke-linecap="round"/><rect x="${BD.x + BD.w + 9}" y="${BD.y + 12}" width="10" height="13" rx="2.5" fill="#fff5d6" stroke="${INK}" stroke-width="${SW(2)}"/><circle cx="${BD.x + BD.w + 14}" cy="${BD.y + 18.5}" r="2.4" fill="#ffd36b"/></g>
        <g class="balcony-cats" transform="${inv}"></g>
        <g class="balcony-front">
          <rect x="${K.x}" y="${K.y}" width="${K.w}" height="${K.h}" rx="3" fill="#fff" stroke="${INK}" stroke-width="${SW(3)}"/>
          <path d="M${K.x + 6} ${K.y + K.h} v8 M${K.x + K.w - 6} ${K.y + K.h} v8 M${K.x + K.w / 2} ${K.y + K.h} v8" stroke="${INK}" stroke-width="${SW(2.4)}" stroke-linecap="round"/>
          ${Array.from({ length: 9 }, (_, i) => `<path d="M${K.x + 8 + i * (K.w - 16) / 8} ${K.y} v-${K.rail}" stroke="${INK}" stroke-width="${SW(2.2)}" stroke-linecap="round"/>`).join('')}
          <path d="M${K.x - 2} ${K.y - K.rail} h${K.w + 4}" stroke="${INK}" stroke-width="${SW(3.2)}" stroke-linecap="round"/>
          <g class="flowerpot"><path d="M${K.x + K.w - 34} ${K.y - 1} l3 -16 h18 l3 16 z" fill="#e9b48f" stroke="${INK}" stroke-width="${SW(2.2)}" stroke-linejoin="round"/>${D.heart(K.x + K.w - 22, K.y - 24, 11)}${D.heart(K.x + K.w - 30, K.y - 20, 8)}${D.heart(K.x + K.w - 13, K.y - 20, 8)}</g>
        </g>
        <!-- the entrance: a door with a little round window and, beside it, the keypad and the number -->
        <path d="M${Dr.x} ${g} v-${Dr.h - Dr.w / 2} a${Dr.w / 2} ${Dr.w / 2} 0 0 1 ${Dr.w} 0 v${Dr.h - Dr.w / 2} z" fill="#e7f0fb" stroke="${INK}" stroke-width="${SW(3.2)}"/>
        <path d="M${Dr.x + Dr.w / 2} ${doorY + 6} v${Dr.h - 6}" stroke="${INK}" stroke-width="${SW(2.2)}"/>
        <circle cx="${Dr.x + Dr.w / 2}" cy="${doorY + Dr.w * 0.42}" r="${Dr.w * 0.16}" fill="url(#${p}-ice)" stroke="${INK}" stroke-width="${SW(2.4)}"/>
        <circle cx="${Dr.x + Dr.w * 0.4}" cy="${doorY + Dr.h * 0.58}" r="2.6" fill="${INK}"/><circle cx="${Dr.x + Dr.w * 0.6}" cy="${doorY + Dr.h * 0.58}" r="2.6" fill="${INK}"/>
        <rect x="${Dr.x - 2}" y="${g - 6}" width="${Dr.w + 4}" height="6" fill="#fff" stroke="${INK}" stroke-width="${SW(2.4)}"/>
        ${keypad ? `<g class="keypad">
          <rect x="${P.x - 3}" y="${P.y - 3}" width="${P.w + 6}" height="${P.h + 12}" rx="4" fill="#fff" stroke="${INK}" stroke-width="${SW(2.6)}"/>
          <rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="3" fill="#dfe8f3"/>
          ${keys}
          <circle class="pad-light" cx="${P.x + P.w / 2}" cy="${P.y + P.h + 4.5}" r="2.8" fill="#cfd8e3" stroke="${INK}" stroke-width="${SW(1.2)}"/>
        </g>` : ''}
        <g class="house-number"><rect x="${Dr.x + Dr.w + 8}" y="${doorY + 10}" width="20" height="16" rx="3" fill="#fff" stroke="${INK}" stroke-width="${SW(2)}"/><text class="ui-text" x="${Dr.x + Dr.w + 18}" y="${doorY + 22}" text-anchor="middle" font-size="11" fill="${INK}">7</text></g>
      </g>`;
    },
    // scene-unit geometry of the house drawn by D.house(x, ground, s): the balcony floor (plat) and the balcony door
    houseGeometry(x, ground, s) {
      return {
        plat: { x: x + 86 * s, y: ground - 208 * s, w: 150 * s, h: 10 * s, rail: 44 * s },
        door: { x: x + 116 * s, y: ground - 294 * s, w: 90 * s, h: 86 * s },
        groundDoor: { x: x + 116 * s, y: ground - 122 * s, w: 76 * s, h: 122 * s },
        pad: { x: x + 78 * s, y: ground - 84 * s, w: 26 * s, h: 36 * s },
        wall: { x, y: ground - 370 * s, w: 270 * s, h: 370 * s },
        balconyX: x + 86 * s, balconyW: 150 * s, balconyY: ground - 208 * s,
      };
    },
    // ---- a little snowman with a pink scarf and the cats' own ω smile
    snowman(x, y, s = 1) {
      return `<g class="snowman" transform="translate(${f(x)} ${f(y)}) scale(${s})">
        ${D.softShadow(0, 2, 26, 5, 0.08)}
        <circle cx="0" cy="-20" r="21" fill="url(#d-snow) #fff" stroke="${INK}" stroke-width="2.8"/>
        <circle cx="0" cy="-50" r="15" fill="#fff" stroke="${INK}" stroke-width="2.8"/>
        <path d="M-15 -39 q15 7 30 0 l-2 -5 q-13 5 -26 0 z" fill="var(--pink)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M9 -39 l4 10" stroke="var(--pink)" stroke-width="5" stroke-linecap="round"/><path d="M9 -39 l4 10" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>
        <circle cx="-5" cy="-53" r="1.8" fill="${INK}"/><circle cx="5" cy="-53" r="1.8" fill="${INK}"/>
        <path class="snowman-mouth" d="M-3.5 -48.5 q1.75 2.5 3.5 0 q1.75 2.5 3.5 0" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
        <circle class="snowman-o" cx="0" cy="-46.8" r="2.3" fill="none" stroke="${INK}" stroke-width="1.6" opacity="0"/>
        <path d="M-21 -26 l-12 -8 M-27 -31 l-3 4" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M21 -26 l12 -8 M27 -31 l3 4" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="0" cy="-24" r="1.8" fill="${INK}"/><circle cx="0" cy="-15" r="1.8" fill="${INK}"/>
        <g class="snowman-hat" transform="rotate(-8 0 -63)">
          <path d="M-10.5 -64 L-9.5 -86 q9.5 -2.5 19 0 L10.5 -64 z" fill="#4a4458" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
          <rect x="-10.6" y="-70.5" width="21.2" height="4.5" fill="var(--heart)" stroke="${INK}" stroke-width="1.4"/>
          <path d="M-6.5 -82 v10" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".45"/>
          <rect x="-17" y="-66" width="34" height="5" rx="2.5" fill="#4a4458" stroke="${INK}" stroke-width="2.2"/>
        </g>
      </g>`;
    },
    // ---- a thought-bubble style cloud, soft, for distance
    puff: (x, y, s = 1, fill = '#fff') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 c-10 0 -14 -10 -6 -15 c 2 -10 16 -12 20 -4 c 8 -4 16 4 12 12 c 6 2 4 8 -2 8 z" fill="${fill}" opacity=".9"/>`,
  });
})();
