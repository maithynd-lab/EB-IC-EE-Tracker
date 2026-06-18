// confetti.js — lightweight canvas confetti + emoji pop + big celebrate. Plain JS (no babel).
(function () {
  let canvas, ctx, parts = [], raf = null;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#E84393', '#F97316', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

  function ensure() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483645';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    if (!canvas) return;
    const d = window.devicePixelRatio || 1;
    canvas.width = innerWidth * d; canvas.height = innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.vy += 0.2; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.life--;
      const a = Math.min(1, p.life / 26);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = a; ctx.fillStyle = p.c;
      if (p.shape === 0) ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.55);
      else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop); else raf = null;
  }
  function fire(opts) {
    opts = opts || {};
    if (reduce) return;
    ensure();
    const x = opts.x == null ? innerWidth / 2 : opts.x;
    const y = opts.y == null ? innerHeight / 2 : opts.y;
    const n = opts.count || 32, spread = opts.spread || Math.PI * 2, power = opts.power || 7, up = opts.up == null ? 3 : opts.up;
    const palette = opts.colors || COLORS;
    for (let i = 0; i < n; i++) {
      const ang = opts.dir != null ? (opts.dir + (Math.random() - 0.5) * spread) : Math.random() * Math.PI * 2;
      const sp = power * (0.5 + Math.random());
      parts.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - up,
        s: 5 + Math.random() * 6, c: palette[(Math.random() * palette.length) | 0],
        rot: Math.random() * 7, vr: (Math.random() - 0.5) * 0.4, life: 50 + Math.random() * 26,
        shape: Math.random() < 0.5 ? 0 : 1,
      });
    }
    if (!raf) loop();
  }
  function popEmoji(opts) {
    opts = opts || {};
    if (reduce) return;
    const x = opts.x == null ? innerWidth / 2 : opts.x;
    const y = opts.y == null ? innerHeight / 2 : opts.y;
    const set = ['😄', '🤩', '🎉', '😎', '🥳', '✨', '👏', '🙌'];
    const el = document.createElement('div');
    el.textContent = opts.emoji || set[(Math.random() * set.length) | 0];
    el.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px;transform:translate(-50%,-50%);font-size:' +
      (opts.size || 30) + 'px;z-index:2147483646;pointer-events:none;will-change:transform,opacity';
    document.body.appendChild(el);
    el.animate([
      { transform: 'translate(-50%,-50%) scale(.4) rotate(-12deg)', opacity: 0 },
      { transform: 'translate(-50%,-135%) scale(1.15) rotate(8deg)', opacity: 1, offset: 0.4 },
      { transform: 'translate(-50%,-230%) scale(1) rotate(-4deg)', opacity: 0 },
    ], { duration: opts.duration || 1100, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => el.remove();
  }
  // floating congrats pill
  function celebrateText(x, y, text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px;transform:translate(-50%,-50%);z-index:2147483646;pointer-events:none;'
      + 'font:800 15px/1 "Plus Jakarta Sans",system-ui,sans-serif;color:#fff;white-space:nowrap;'
      + 'padding:7px 14px;border-radius:999px;background:linear-gradient(135deg,#7C3AED,#EC4899);'
      + 'box-shadow:0 6px 18px rgba(124,58,237,.35)';
    document.body.appendChild(el);
    el.animate([
      { transform: 'translate(-50%,-50%) scale(.5) rotate(-6deg)', opacity: 0 },
      { transform: 'translate(-50%,-150%) scale(1.05) rotate(3deg)', opacity: 1, offset: .35 },
      { transform: 'translate(-50%,-215%) scale(1) rotate(0deg)', opacity: 0 },
    ], { duration: 1450, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => el.remove();
  }
  // small celebration at a point (task done)
  function celebrateTask(x, y) {
    fire({ x, y, count: 30, power: 8, up: 4, dir: -Math.PI / 2, spread: Math.PI });
    const around = ['\uD83C\uDF89', '\u2728', '\uD83E\uDD73', '\uD83D\uDC9C', '\u2B50', '\uD83D\uDC4F'];
    for (let i = 0; i < 5; i++) {
      const a = (-Math.PI / 2) + (i - 2) * 0.52, r = 44;
      popEmoji({ emoji: around[i % around.length], size: 22 + Math.random() * 8, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r - 4 });
    }
    celebrateText(x, y - 16, 'Chúc mừng bà nha \uD83C\uDF89');
  }
  // big celebration (event complete)
  function celebrateBig() {
    if (reduce) { popEmoji({ emoji: '🥳', size: 54, x: innerWidth / 2, y: innerHeight * 0.34 }); return; }
    const pts = [[innerWidth * 0.25, innerHeight * 0.42], [innerWidth * 0.5, innerHeight * 0.34], [innerWidth * 0.75, innerHeight * 0.42]];
    pts.forEach((p, i) => setTimeout(() => fire({ x: p[0], y: p[1], count: 64, power: 11, up: 6 }), i * 130));
    popEmoji({ emoji: '🥳', size: 56, x: innerWidth / 2, y: innerHeight * 0.34, duration: 1500 });
    setTimeout(() => popEmoji({ emoji: '🎉', size: 42, x: innerWidth * 0.4, y: innerHeight * 0.42 }), 180);
    setTimeout(() => popEmoji({ emoji: '✨', size: 42, x: innerWidth * 0.6, y: innerHeight * 0.42 }), 300);
  }
  // rocket flies diagonally across the screen with fire/smoke trail + a sparkle burst
  function celebrateRocket() {
    if (reduce) { popEmoji({ emoji: '\uD83D\uDE80', size: 58, x: innerWidth / 2, y: innerHeight * 0.5 }); return; }
    ensure();
    const el = document.createElement('div');
    el.textContent = '\uD83D\uDE80';
    el.style.cssText = 'position:fixed;left:0;top:0;font-size:60px;z-index:2147483646;pointer-events:none;will-change:transform;filter:drop-shadow(0 6px 14px rgba(0,0,0,.18))';
    document.body.appendChild(el);
    const sx = -100, sy = innerHeight + 100;
    const ex = innerWidth + 120, ey = -120;
    const dur = 1650, t0 = performance.now();
    let mid = false;
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const x = sx + (ex - sx) * p;
      const y = sy + (ey - sy) * p;
      el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(-3deg)';
      for (let i = 0; i < 3; i++) {
        parts.push({
          x: x + 8 + (Math.random() - 0.5) * 14, y: y + 42 + (Math.random() - 0.5) * 14,
          vx: -1.4 - Math.random() * 1.4, vy: 1.1 + Math.random() * 1.3,
          s: 4 + Math.random() * 7, rot: Math.random() * 7, vr: (Math.random() - 0.5) * 0.3,
          life: 20 + Math.random() * 16, shape: 1,
          c: Math.random() < 0.58 ? ['#F97316', '#F59E0B', '#FCD34D', '#EF4444'][(Math.random() * 4) | 0]
                                  : 'rgba(168,168,178,' + (0.35 + Math.random() * 0.3).toFixed(2) + ')',
        });
      }
      if (!raf) loop();
      if (!mid && p >= 0.46) {
        mid = true;
        popEmoji({ emoji: '\u2728', size: 30, x, y: y - 6 });
        fire({ x: innerWidth / 2, y: innerHeight * 0.46, count: 30, power: 8, up: 2,
               colors: ['#7C3AED', '#A855F7', '#EC4899', '#FCD34D', '#F97316'] });
      }
      if (p < 1) requestAnimationFrame(step); else el.remove();
    }
    requestAnimationFrame(step);
  }
  window.fireConfetti = fire;
  window.popEmoji = popEmoji;
  window.celebrateText = celebrateText;
  window.celebrateTask = celebrateTask;
  window.celebrateBig = celebrateBig;
  window.celebrateRocket = celebrateRocket;
})();
