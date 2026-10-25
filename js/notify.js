/* ------------------------------------------------------------
   Getting notified: when she stamps the paperwork, a notification
   with her answer and a little report of how the adventure went
   goes to the department (that is: you).

   Static site, no server of our own, so delivery goes through
   free services. Fill in the settings below (README → "getting
   notified"):
     - push (on by default): ntfy. Install the ntfy app, subscribe
       to the topic below. Anyone who knows the topic name can read
       what is posted to it, so it is long and random.
     - e-mail (optional): a Web3Forms access key for your address
       (the key is meant to be public and does not reveal the
       address), and/or your address for ntfy's e-mail forwarding
       (that one shows the address in the page source).

   Telemetry stays in this browser (localStorage) until the stamp:
   time per chapter (only while the page is visible), hints and
   skips, tile turns, wrong tries, pets, the secret dance, the
   bouncer, coarse device info. No location, no IP lookup.
   Open the site with ?notifytest to send yourself a test.
   ------------------------------------------------------------ */
(() => {
  'use strict';
  const TA = window.TA;
  const C = window.TA_CONTENT;

  // ---- settings ---------------------------------------------------------------------------------------------------
  const NOTIFY = {
    ntfyServer: 'https://ntfy.sh',
    ntfyTopic: 'tiny-adventure-g139hjoyc22k2nx4kl',   // subscribe to this in the ntfy app ('' turns push off)
    web3formsKey: '',                                 // optional e-mail: your Web3Forms access key
    email: '',                                        // optional e-mail via ntfy (your address ends up in the page source)
  };
  // ------------------------------------------------------------------------------------------------------------------

  const store = TA.store;
  const K = 'tinyAdventure.telemetry', K_OUT = 'tinyAdventure.outbox';
  const now = () => Date.now();
  const rid = () => Math.random().toString(16).slice(2, 6);
  const read = (k) => { try { return JSON.parse(store.get(k) || 'null'); } catch (e) { return null; } };
  const fresh = () => ({ v: 1, id: rid(), firstSeen: now(), visits: 0, started: null, scenes: {}, counts: {}, flags: {}, stamps: [], sent: {} });
  let T = read(K); if (!T || T.v !== 1) T = fresh();
  T.visits += 1;
  const save = () => store.set(K, JSON.stringify(T));
  save();

  // ---- the clock: time per scene, counted only while the page is visible
  let cur = null, since = 0;
  const sc = (name) => (T.scenes[name] = T.scenes[name] || { ms: 0, first: 0, done: 0, visits: 0 });
  function pause() { if (cur && since) sc(cur).ms += now() - since; since = 0; }
  function enter(name) { pause(); cur = name; const s = sc(name); if (!s.first) s.first = now(); s.visits += 1; since = document.hidden ? 0 : now(); save(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); save(); } else if (cur) since = now(); });
  const spent = (name) => { const s = T.scenes[name]; if (!s) return 0; return s.ms + (name === cur && since ? now() - since : 0); };

  function count(key, n = 1) {
    T.counts[key] = (T.counts[key] || 0) + n;
    if (/\.skip$/.test(key)) { const name = key.split('.')[0]; if (T.scenes[name] && !T.scenes[name].skipAt) T.scenes[name].skipAt = Math.round(spent(name) / 1000); }
    save();
  }
  function flag(key, v = true) { T.flags[key] = v; save(); }
  function done(name) { const s = sc(name); if (!s.done) { s.done = now(); s.doneMs = spent(name); } save(); }
  function start() { if (!T.started) T.started = now(); save(); }

  // ---- the report ------------------------------------------------------------------------------------------------
  const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`; };
  const times = (n) => `${n}×`;
  const N = (k) => T.counts[k] || 0;
  function when(t) {
    try { return new Date(t).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).toLowerCase(); } catch (e) { return new Date(t).toISOString(); }
  }
  function device() {
    const ua = navigator.userAgent || '';
    const os = /iPhone/.test(ua) ? 'iPhone' : (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'some device';
    const br = /Instagram/.test(ua) ? 'Instagram in-app' : /FBAN|FBAV/.test(ua) ? 'Facebook in-app' : /Edg/.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'a browser';
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
    const dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    return { os, br, tz, w: window.innerWidth, h: window.innerHeight, dpr: Math.round((window.devicePixelRatio || 1) * 10) / 10, touch: (navigator.maxTouchPoints || 0) > 0, lang: navigator.language || '', dark, reduced: !!TA.helpers.REDUCED, sound: !!(TA.Sound && TA.Sound.on) };
  }
  const LABEL = { map: 'the map', lane: 'the lane', balcony: 'the flashback', stairs: 'the staircase', rink: 'the rink', epilogue: 'the letter', office: 'the paperwork' };
  function chapterLine(name) {
    const s = T.scenes[name]; if (!s) return `• ${LABEL[name]}: not reached`;
    if (name === 'balcony') return `• ${LABEL[name]}: ${s.skipAt != null ? `skipped after ${mmss(s.skipAt * 1000)}` : (s.done ? `watched it all (${mmss(s.doneMs || spent(name))})` : 'still watching')}`;
    const bits = [mmss(s.doneMs || spent(name))];
    if (name === 'lane' && N('lane.turns')) bits.push(`${N('lane.turns')} tile turns`);
    if (name === 'stairs') bits.push(N('stairs.wrong') ? `${times(N('stairs.wrong'))} wrong step` : 'no wrong steps');
    if (name === 'rink') bits.push(N('rink.wrong') ? `${times(N('rink.wrong'))} wrong beat` : 'no wrong beats');
    if (N(`${name}.hint`)) bits.push(`${times(N(`${name}.hint`))} hint`);
    if (N(`${name}.skip`)) bits.push('skipped the puzzle');
    return `• ${LABEL[name]}: ${bits.join(' · ')}`;
  }
  function report(stamp) {
    const d = device();
    const total = T.started && stamp ? stamp.at - T.started : 0;
    const active = Object.keys(T.scenes).filter((k) => k !== 'prologue').reduce((a, k) => a + spent(k), 0);   // from the start button on
    const lines = [];
    if (stamp) {
      lines.push(`decision: ${stamp.answer}`, `date: ${stamp.date}`, `stamped: ${when(stamp.at)}${d.tz ? ` (${d.tz})` : ''}`);
      if (total) lines.push(`start to stamp: ${mmss(total)} (${mmss(active)} with the page open)`);
    }
    lines.push('', 'the adventure', ...['map', 'lane', 'balcony', 'stairs', 'rink', 'epilogue', 'office'].map(chapterLine));
    const pets = [N('pet.blue') && `blue ${times(N('pet.blue'))}`, N('pet.pink') && `pink ${times(N('pet.pink'))}`, N('pet.clerk') && `the clerk ${times(N('pet.clerk'))}`].filter(Boolean);
    lines.push('', 'mischief',
      `• tried a "no" button: ${N('office.bouncer') ? `${times(N('office.bouncer'))} (the bouncer held)` : 'never'}`,
      `• pets: ${pets.length ? pets.join(', ') : 'none'}${N('pet.bashful') ? ` · made pink bashful ${times(N('pet.bashful'))}` : ''}`,
      `• secret dance: ${N('rink.dance') ? `found it (${times(N('rink.dance'))})` : 'not found'}`,
      `• stamps: ${T.stamps.length || (stamp ? 1 : 0)} · reply copied: ${T.flags.copied ? 'yes' : 'not yet'}${T.flags.byHand ? ' · going to write it by hand' : ''}`);
    if (N('replays')) lines.push(`• replays: ${N('replays')}`);
    lines.push('', 'device',
      `• ${d.os} · ${d.br} · ${d.w}×${d.h} @${d.dpr}x${d.touch ? ' · touch' : ''} · sound ${d.sound ? 'on' : 'off'}${d.reduced ? ' · reduced motion' : ''}${d.dark ? ' · dark mode' : ''}${d.lang ? ` · ${d.lang}` : ''}`,
      `• visits: ${T.visits} · first opened ${when(T.firstSeen)} · device id ${T.id}`);
    return lines.join('\n').replace(/^\n+/, '');
  }

  // ---- delivery -------------------------------------------------------------------------------------------------
  // ntfy: one JSON publish to the server root. Sent without custom headers ("no-cors"), so the browser never needs a
  // CORS answer from ntfy; the price is that the page cannot read the reply, so "sent" means "left the browser".
  async function viaNtfy(title, message, tags, topic = NOTIFY.ntfyTopic, extra = {}) {
    const body = JSON.stringify(Object.assign({ topic, title, message, tags, priority: 4 }, extra));
    await fetch(NOTIFY.ntfyServer.replace(/\/$/, '') + '/', { method: 'POST', mode: 'no-cors', keepalive: body.length < 60000, body });
    return 'push sent';
  }
  // Web3Forms: a form post (no preflight); its JSON reply says whether the e-mail went out
  async function viaWeb3Forms(title, message) {
    const fd = new FormData();
    fd.append('access_key', NOTIFY.web3formsKey); fd.append('subject', title); fd.append('from_name', 'tiny adventure'); fd.append('message', message);
    const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.success === false) throw new Error(`e-mail refused (${r.status}${j.message ? `: ${j.message}` : ''})`);
    return 'e-mail sent';
  }
  const channels = () => [NOTIFY.ntfyTopic && 'ntfy', NOTIFY.email && NOTIFY.ntfyTopic && 'ntfymail', NOTIFY.web3formsKey && 'web3forms'].filter(Boolean);
  async function deliverOne(ch, m) {
    if (ch === 'ntfy') return viaNtfy(m.title, m.message, m.tags);
    // e-mail via ntfy goes to a twin topic nobody subscribes to, so it never doubles the push (and never sinks it)
    if (ch === 'ntfymail') { await viaNtfy(m.title, m.message, m.tags, `${NOTIFY.ntfyTopic}-mail`, { email: NOTIFY.email }); return 'e-mail handed to ntfy'; }
    if (ch === 'web3forms') return viaWeb3Forms(m.title, m.message);
    throw new Error('unknown channel');
  }
  // sends on every configured channel; whatever fails waits in the outbox (localStorage) for the next visit or for
  // the connection to come back
  async function deliver(m, only) {
    const out = [];
    for (const ch of only || channels()) {
      try { out.push({ ch, ok: true, note: await deliverOne(ch, m) }); } catch (e) { out.push({ ch, ok: false, note: String((e && e.message) || e) }); }
    }
    const failed = out.filter((r) => !r.ok).map((r) => r.ch);
    if (failed.length && !m.test) { const box = read(K_OUT) || []; box.push({ m, chs: failed, tries: 0 }); store.set(K_OUT, JSON.stringify(box.slice(-6))); }
    return out;
  }
  let flushing = false;
  async function flushOutbox() {
    if (flushing || (navigator.onLine === false)) return; flushing = true;
    try {
      const box = read(K_OUT) || []; if (!box.length) return;
      store.set(K_OUT, '[]');
      const keep = [];
      for (const item of box) {
        const res = await deliver(item.m, item.chs).catch(() => []);
        const failed = res.filter((r) => !r.ok).map((r) => r.ch);
        if (failed.length && item.tries < 5) keep.push({ m: item.m, chs: failed, tries: item.tries + 1 });
      }
      // deliver() re-queued failures as new items; keep only our own bookkeeping
      store.set(K_OUT, JSON.stringify(keep));
    } finally { flushing = false; }
  }
  window.addEventListener('online', () => flushOutbox());
  setTimeout(flushOutbox, 4000);

  // ---- the moments that send ------------------------------------------------------------------------------------
  // the stamp: the first one sends the full report; a stamp with a different answer or date later sends a short
  // amendment (at most three); the same answer again sends nothing
  async function stamped({ kind, answer, date }) {
    const at = now(); const prev = T.stamps[T.stamps.length - 1];
    T.stamps.push({ kind, answer, date, at }); done('office'); save();
    if (!channels().length) return null;
    let m = null;
    if (!T.sent.stamp) {
      T.sent.stamp = at; save();
      const head = kind === 'yes' ? `💌 she said yes! · ${date}` : `📮 paperwork filed: ${answer} · ${date}`;
      m = { title: head, tags: ['love_letter'], message: `the applicant has filed the official date application.\n\n${report({ answer, date, at })}` };
    } else if (prev && (prev.answer !== answer || prev.date !== date) && (T.sent.amend || 0) < 3) {
      T.sent.amend = (T.sent.amend || 0) + 1; save();
      m = { title: `📝 amended: ${date}`, tags: ['memo'], message: `the application was stamped again.\n\ndecision: ${answer}\ndate: ${date} (was ${prev.date})\nstamped: ${when(at)}` };
    }
    if (!m) return null;
    const res = await deliver(m);
    return res.some((r) => r.ok) ? res : null;
  }
  // she read the letter but closed the page before stamping: one quiet heads-up (sent as the page goes away)
  window.addEventListener('pagehide', () => {
    if (!T.scenes.epilogue || T.sent.stamp || T.sent.unfiled || !NOTIFY.ntfyTopic) return;
    T.sent.unfiled = now(); pause(); save();
    const body = JSON.stringify({ topic: NOTIFY.ntfyTopic, title: '✉️ she finished the story (no paperwork yet)', tags: ['envelope'], priority: 3, message: `the letter has been read; the paperwork was not filed before the page closed.\n\n${report(null)}` });
    try { if (!(navigator.sendBeacon && navigator.sendBeacon(NOTIFY.ntfyServer.replace(/\/$/, '') + '/', body))) fetch(NOTIFY.ntfyServer.replace(/\/$/, '') + '/', { method: 'POST', mode: 'no-cors', keepalive: true, body }); } catch (e) { /* nothing more to do */ }
  });

  // ---- ?notifytest: a test you can send yourself (it does not touch her telemetry or the "sent" flags) ------------
  async function test() {
    const bar = document.createElement('div'); bar.className = 'notify-test';
    bar.innerHTML = '<strong>notification test</strong> <span>sending…</span> <button type="button" aria-label="close">×</button>';
    document.body.appendChild(bar); bar.querySelector('button').addEventListener('click', () => bar.remove());
    const say = (t) => { bar.querySelector('span').textContent = t; };
    if (!channels().length) { say('nothing is set up: fill in the settings at the top of js/notify.js.'); return; }
    const sample = report({ answer: (C.epilogue && C.epilogue.answers[0]) || 'yes', date: (C.epilogue && C.epilogue.dateChoices[0]) || 'friday', at: now() });
    const res = await deliver({ test: true, title: '🧪 test: the pigeon works', tags: ['test_tube'], message: `this is a test from the tiny adventure (the real one arrives when she stamps the paperwork).\n\nwhat this device has recorded so far:\n${sample}` });
    say(res.map((r) => (r.ok ? r.note : `${r.ch} failed: ${r.note}`)).join(' · ') + (res.some((r) => r.ch === 'ntfy' && r.ok) ? ' (check your phone: the browser cannot confirm the push itself)' : ''));
  }
  if (/[?&]notifytest\b/.test(location.search)) window.addEventListener('load', () => setTimeout(test, 300));

  TA.tm = { enter, done, count, flag, start, snapshot: () => JSON.parse(JSON.stringify(T)), report: () => report(null) };
  TA.notify = { stamped, test, configured: () => channels().length > 0, flushOutbox };
})();
