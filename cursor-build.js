(() => {
  'use strict';

  // Multiplayer-style cursors that type and draw parts of the page.
  // Content is plain HTML first: this script only hides and reveals it, so the
  // page is complete without JavaScript, for reduced motion and on touch screens.
  const root = document.documentElement;
  if (!root.classList.contains('cb-on')) return;
  window.__cursorBuild = true;

  const COLORS = {
    'PM': '#2563eb',
    'Developer': '#0b7a5e',
    'Reviewer': '#14171e',
    'Designer': '#c2410c'
  };
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const HERO_KEY = 'cb-hero-seen';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (p) => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const now = () => performance.now();

  // ---- shared overlay layer ----------------------------------------------
  const layer = document.createElement('div');
  layer.className = 'cb-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  // Overlays (boxes, frames) follow their element while the page scrolls.
  const followers = new Set();
  let followFrame = 0;
  const followLoop = () => {
    followers.forEach((f) => f());
    followFrame = followers.size ? requestAnimationFrame(followLoop) : 0;
  };
  const follow = (fn) => {
    followers.add(fn);
    fn();
    if (!followFrame) followFrame = requestAnimationFrame(followLoop);
    return () => followers.delete(fn);
  };

  // ---- timing ------------------------------------------------------------
  const tween = (ctx, ms, fn) => new Promise((resolve) => {
    if (ctx.skip || ms <= 0) { fn(1); resolve(); return; }
    const start = now();
    const step = () => {
      const p = ctx.skip ? 1 : clamp((now() - start) / ms, 0, 1);
      fn(p);
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
  const wait = (ctx, ms) => tween(ctx, ms, () => {});
  const until = (ctx, ms) => wait(ctx, ctx.start + ms - now());

  // ---- cursors -----------------------------------------------------------
  const spawn = (label, x, y) => {
    const color = COLORS[label] || '#2563eb';
    const el = document.createElement('div');
    el.className = 'cb-cursor';
    el.innerHTML =
      '<svg width="22" height="24" viewBox="0 0 22 24"><path d="M2 1.5 L2 19.5 L7 15 L10.5 22.5 L13.8 21 L10.4 13.8 L17 13.8 Z" fill="' + color +
      '" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><span class="cb-label"></span>';
    const tag = el.querySelector('.cb-label');
    tag.textContent = label;
    tag.style.background = color;
    layer.appendChild(el);
    const seed = Math.random() * 10;
    const cur = {
      el, color, x, y,
      set(nx, ny) {
        cur.x = nx; cur.y = ny;
        const t = now() / 1000 + seed;
        el.style.transform = 'translate3d(' + (nx + Math.sin(t * 3.7) * 1.2).toFixed(1) + 'px,' + (ny + Math.cos(t * 3.1) * 1.2).toFixed(1) + 'px,0)';
      },
      press(on) { el.classList.toggle('is-pressed', on); },
      click() {
        const ring = document.createElement('span');
        ring.className = 'cb-ring';
        ring.style.borderColor = color;
        el.appendChild(ring);
        setTimeout(() => ring.remove(), 450);
      }
    };
    cur.set(x, y);
    return cur;
  };

  const moveTo = (ctx, cur, target, ms = 420) => {
    const fx = cur.x, fy = cur.y;
    return tween(ctx, ms, (p) => {
      const t = target();
      const e = ease(p);
      cur.set(fx + (t.x - fx) * e, fy + (t.y - fy) * e);
    });
  };
  const leave = async (ctx, cur, x, y) => {
    await moveTo(ctx, cur, () => ({ x, y }), 650);
    cur.el.remove();
  };

  // ---- reveal helpers ----------------------------------------------------
  const live = (el) => el.classList.add('cb-live');
  const done = (el) => { el.classList.remove('cb-live'); el.classList.add('cb-done'); };

  // Split every text node into a visible part and a hidden remainder, so the
  // final layout is held from the first frame and nothing below it shifts.
  const framesFor = (text) => {
    const out = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const pre = text.slice(0, i);
      const code = ch.charCodeAt(0) - 0xAC00;
      if (code >= 0 && code < 11172) {
        const L = Math.floor(code / 588);
        const V = Math.floor((code % 588) / 28);
        out.push({ shown: pre + CHO[L], rest: i + 1 });
        if (code % 28) out.push({ shown: pre + String.fromCharCode(0xAC00 + L * 588 + V * 28), rest: i + 1 });
      }
      out.push({ shown: pre + ch, rest: i + 1 });
    }
    return out;
  };
  const prepareType = (el, skip, color) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (skip && n.parentElement.closest(skip)) || !n.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const parts = [];
    while (walker.nextNode()) parts.push(walker.currentNode);
    const caret = document.createElement('span');
    caret.className = 'cb-caret';
    caret.style.background = color;
    const items = parts.map((node) => {
      const shown = document.createElement('span');
      const rest = document.createElement('span');
      rest.className = 'cb-r';
      rest.textContent = node.nodeValue;
      node.replaceWith(shown, rest);
      return { node, shown, rest, text: node.nodeValue, frames: framesFor(node.nodeValue) };
    });
    const total = items.reduce((sum, it) => sum + it.frames.length, 0);
    if (items[0]) items[0].shown.after(caret);
    return {
      total,
      set(k) {
        let left = k;
        let at = null;
        for (const it of items) {
          const n = it.frames.length;
          if (left >= n) {
            it.shown.textContent = it.text; it.rest.textContent = '';
            left -= n; at = it;
          } else if (left > 0) {
            const f = it.frames[left - 1];
            it.shown.textContent = f.shown; it.rest.textContent = it.text.slice(f.rest);
            left = 0; at = it;
          } else {
            it.shown.textContent = ''; it.rest.textContent = it.text;
            if (!at) at = it;
          }
        }
        if (at && caret.previousSibling !== at.shown) at.shown.after(caret);
      },
      caretPoint() {
        const r = caret.getBoundingClientRect();
        return { x: r.right + 1, y: r.bottom - r.height * .08 };
      },
      restore() {
        caret.remove();
        for (const it of items) { it.shown.replaceWith(it.node); it.rest.remove(); }
      }
    };
  };

  const type = async (ctx, cur, el, opts = {}) => {
    const ctl = prepareType(el, opts.skip, cur.color);
    ctl.set(0);
    el.setAttribute('aria-busy', 'true');
    live(el);
    await moveTo(ctx, cur, () => ctl.caretPoint(), opts.approach || 420);
    cur.click();
    const ms = opts.ms || clamp(ctl.total * 34, 420, 1500);
    await tween(ctx, ms, (p) => {
      ctl.set(Math.round(clamp(p + Math.sin(p * 31) * .012, 0, 1) * ctl.total));
      const c = ctl.caretPoint();
      cur.set(c.x, c.y);
    });
    ctl.restore();
    el.removeAttribute('aria-busy');
    done(el);
  };

  const rectOf = (el) => el.getBoundingClientRect();
  const place = (node, x, y, w, h) => {
    node.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    node.style.width = Math.max(0, w).toFixed(1) + 'px';
    node.style.height = Math.max(0, h).toFixed(1) + 'px';
  };

  // Drag a box from the element's top-left corner to its bottom-right, then
  // swap the outline for the real element.
  const draw = async (ctx, cur, el, opts = {}) => {
    const pad = opts.pad ?? 6;
    const box = document.createElement('div');
    box.className = 'cb-box';
    box.style.borderColor = cur.color;
    box.style.background = cur.color + '14';
    layer.appendChild(box);
    let p = 0;
    const stop = follow(() => {
      const r = rectOf(el);
      place(box, r.left - pad, r.top - pad, (r.width + pad * 2) * p, (r.height + pad * 2) * p);
    });
    const corner = () => {
      const r = rectOf(el);
      return { x: r.left - pad + (r.width + pad * 2) * ease(p), y: r.top - pad + (r.height + pad * 2) * ease(p) };
    };
    await moveTo(ctx, cur, corner, opts.approach || 480);
    cur.click();
    cur.press(true);
    await tween(ctx, opts.ms || 480, (q) => { p = q; const c = corner(); cur.set(c.x, c.y); });
    cur.press(false);
    live(el);
    await wait(ctx, 120);
    box.style.opacity = '0';
    setTimeout(() => { stop(); box.remove(); }, ctx.skip ? 0 : 260);
    done(el);
  };

  // A design-tool selection frame with a size label; returns its remover.
  const frame = async (ctx, cur, el, opts = {}) => {
    const box = document.createElement('div');
    box.className = 'cb-frame';
    box.style.borderColor = cur.color;
    box.innerHTML = '<i class="cb-h" style="left:-5px;top:-5px"></i><i class="cb-h" style="right:-5px;top:-5px"></i><i class="cb-h" style="left:-5px;bottom:-5px"></i><i class="cb-h" style="right:-5px;bottom:-5px"></i><span class="cb-dim"></span>';
    box.querySelectorAll('.cb-h').forEach((h) => { h.style.borderColor = cur.color; });
    const dim = box.querySelector('.cb-dim');
    dim.style.background = cur.color;
    layer.appendChild(box);
    let p = 0;
    const stop = follow(() => {
      const r = rectOf(el);
      place(box, r.left, r.top, r.width * p, r.height * p);
      dim.textContent = Math.round(r.width) + ' × ' + Math.round(r.height);
      box.classList.toggle('is-done', p >= 1);
    });
    const corner = () => { const r = rectOf(el); return { x: r.left + r.width * ease(p), y: r.top + r.height * ease(p) }; };
    await moveTo(ctx, cur, corner, opts.approach || 480);
    cur.click();
    cur.press(true);
    await tween(ctx, opts.ms || 420, (q) => { p = q; const c = corner(); cur.set(c.x, c.y); });
    cur.press(false);
    return () => {
      box.style.opacity = '0';
      setTimeout(() => { stop(); box.remove(); }, ctx.skip ? 0 : 260);
    };
  };

  // Pick an element up away from its place and drop it where it belongs.
  const drag = async (ctx, cur, el, opts = {}) => {
    const base = el.dataset.cbBase || '';
    const inline = getComputedStyle(el).display === 'inline';
    if (inline) el.style.display = 'inline-block';
    let dx = opts.dx || 0, dy = opts.dy || 0;
    const apply = () => { el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) ' + base; };
    apply();
    live(el);
    const [gx, gy] = opts.grab || [.5, .6];
    const grab = () => { const r = rectOf(el); return { x: r.left + r.width * gx, y: r.top + r.height * gy }; };
    await moveTo(ctx, cur, grab, opts.approach || 520);
    cur.click();
    cur.press(true);
    const sx = dx, sy = dy;
    await tween(ctx, opts.ms || 600, (p) => {
      const e = ease(p);
      dx = sx * (1 - e); dy = sy * (1 - e);
      apply();
      const g = grab();
      cur.set(g.x, g.y);
    });
    cur.press(false);
    el.style.transform = '';
    if (inline) el.style.display = '';
    done(el);
  };

  const clickOn = async (ctx, cur, el) => {
    if (!el) return;
    await moveTo(ctx, cur, () => { const r = rectOf(el); return { x: r.left + Math.min(24, r.width / 2), y: r.top + r.height * .6 }; }, 420);
    cur.click();
    el.classList.add('cb-pressed');
    await wait(ctx, 220);
    el.classList.remove('cb-pressed');
  };

  // ---- hero intro --------------------------------------------------------
  const heroItems = () => [...document.querySelectorAll('[data-cb-group="hero"]')];
  let heroCtx = null;

  const playHero = async () => {
    const q = (s) => document.querySelector(s);
    const el = {
      eyebrow: q('#home .eyebrow'), title: q('#hero-title'), sw: q('#home .title-primary'), en: q('#home .title-secondary'),
      dot: q('#home .title-dot'), intro: q('#home .hero-intro p'), name: q('#home .hero-name'), art: q('#home .hero-art'),
      links: [...document.querySelectorAll('#home .hero-link')]
    };
    if (Object.values(el).some((v) => !v) || el.links.length < 2) { heroItems().forEach(done); return; }
    try { sessionStorage.setItem(HERO_KEY, '1'); } catch (e) {}

    const ctx = { skip: false, start: now() };
    heroCtx = ctx;
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'cb-skip';
    skipBtn.textContent = '인트로 건너뛰기';
    const skip = () => { ctx.skip = true; };
    const onKey = (e) => { if (e.key === 'Escape') skip(); };
    skipBtn.addEventListener('click', skip);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(skipBtn);

    await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 700))]);
    ctx.start = now();
    const W = innerWidth, H = innerHeight;
    const A = spawn('PM', -60, H * .82);
    const B = spawn('Developer', W + 40, -40);
    const C = spawn('Reviewer', W + 60, H * .45);
    const D = spawn('Designer', W * .62, H + 50);

    try {
      await Promise.all([
        (async () => {
          await until(ctx, 120); await type(ctx, A, el.eyebrow, { ms: 620 });
          await until(ctx, 1950); await type(ctx, A, el.intro, { ms: 1250 });
          live(el.name); await wait(ctx, 200); done(el.name);
          await leave(ctx, A, -80, H + 60);
        })(),
        (async () => {
          await until(ctx, 320); await type(ctx, B, el.sw, { ms: 620 });
          await until(ctx, 3250); await draw(ctx, B, el.links[0], { ms: 420 });
          await leave(ctx, B, W + 80, -80);
        })(),
        (async () => {
          await until(ctx, 700); await type(ctx, C, el.en, { ms: 620, skip: '.title-dot' });
          await until(ctx, 3420); await draw(ctx, C, el.links[1], { ms: 420 });
          await leave(ctx, C, W + 80, H * .7);
        })(),
        (async () => {
          await drag(ctx, D, el.art, { dx: Math.min(320, W * .22), dy: 70, ms: 950, grab: [.42, .5], approach: 650 });
          await until(ctx, 1850);
          const removeFrame = await frame(ctx, D, el.title, { ms: 420 });
          await until(ctx, 2450); await drag(ctx, D, el.dot, { dx: 190, dy: -150, ms: 560, approach: 300 });
          await until(ctx, 3050); removeFrame();
          await leave(ctx, D, W * .5, H + 80);
        })()
      ]);
    } catch (e) {
      // Never leave the page half-built.
    }
    heroItems().forEach(done);
    layer.querySelectorAll('.cb-cursor').forEach((c) => c.remove());
    document.removeEventListener('keydown', onKey);
    skipBtn.remove();
    root.classList.remove('cb-hero');
    heroCtx = null;
  };

  // ---- scroll-triggered pieces ---------------------------------------------
  const playOne = async (el) => {
    const ctx = { skip: false, start: now() };
    const label = el.dataset.cursor || 'PM';
    await wait(ctx, Number(el.dataset.cbDelay || 0));
    const r = rectOf(el);
    const cur = spawn(label, innerWidth + 40, clamp(r.top + 40, 20, innerHeight - 20));
    try {
      if (el.dataset.cb === 'draw') await draw(ctx, cur, el, { pad: 0, ms: 620, approach: 620 });
      else await type(ctx, cur, el, { approach: 560 });
      if (el.dataset.cbClick) await clickOn(ctx, cur, (el.closest('a, article, section') || document).querySelector(el.dataset.cbClick));
    } catch (e) {
      done(el);
    }
    await leave(ctx, cur, innerWidth + 60, clamp(cur.y - 80, -60, innerHeight));
  };

  const pieces = [...document.querySelectorAll('[data-cb]:not([data-cb-group])')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        playOne(entry.target);
      }
    }, { threshold: .35, rootMargin: '0px 0px -12% 0px' });
    pieces.forEach((p) => io.observe(p));
  } else {
    pieces.forEach(done);
  }

  // ---- start -------------------------------------------------------------
  if (root.classList.contains('cb-hero')) playHero();
  else heroItems().forEach(done);

  document.querySelectorAll('[data-cb-replay]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    if (heroCtx) return;
    scrollTo({ top: 0, behavior: 'auto' });
    heroItems().forEach((el) => el.classList.remove('cb-done', 'cb-live'));
    root.classList.add('cb-hero');
    playHero();
  }));
})();
