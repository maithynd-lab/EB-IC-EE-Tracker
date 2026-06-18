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
    for (let i = 0; i < n; i++) {
      const ang = opts.dir != null ? (opts.dir + (Math.random() - 0.5) * spread) : Math.random() * Math.PI * 2;
      const sp = power * (0.5 + Math.random());
      parts.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - up,
        s: 5 + Math.random() * 6, c: COLORS[(Math.random() * COLORS.length) | 0],
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
  // small celebration at a point (task done)
  function celebrateTask(x, y) {
    fire({ x, y, count: 26, power: 7, up: 4, dir: -Math.PI / 2, spread: Math.PI });
    popEmoji({ x, y: y - 6, size: 26 });
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
  window.fireConfetti = fire;
  window.popEmoji = popEmoji;
  window.celebrateTask = celebrateTask;
  window.celebrateBig = celebrateBig;
})();
