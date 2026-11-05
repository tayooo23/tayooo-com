/* tayooo.com seasonal engine v4
   - The hero line art stays exactly as designed (no seasonal swaps).
   - Only job: seasonal things fall/drift over the page grid, under the cards,
     on a fixed full-page canvas. Snow mixes crystal flakes and round dots.
   - Months: Jan/Feb/Dec snow, Mar/Apr petals, May sparkle, Jun rain,
     Jul sparkle, Aug/Sep golden motes, Oct/Nov maple leaves.
   - Preview override: ?date=YYYY-MM-DD
   - prefers-reduced-motion: no particles. */
(function () {
  'use strict';

  function resolveDate() {
    var m = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    return new Date();
  }
  var KINDS = ['snow', 'snow', 'petalLight', 'petal', 'sparkle', 'rain', 'sparkle', 'motes', 'motes', 'leafLight', 'leaf', 'snow'];
  var kind = KINDS[resolveDate().getMonth()];

  var st = document.createElement('style');
  st.textContent =
    '.wrap{position:relative;z-index:1}' +
    '.season-page-canvas{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}';
  document.head.appendChild(st);

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !kind) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'season-page-canvas';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  var CAPS = { snow: 260, petal: 95, petalLight: 50, leaf: 88, leafLight: 46, rain: 220, sparkle: 64, motes: 54 };
  var parts = [], raf = 0;

  function make() {
    var p = { x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.2, s: 0.3 + Math.random() * 0.8, ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02 };
    if (kind === 'snow') { p.crystal = Math.random() < 0.55; p.r = p.crystal ? 2.6 + Math.random() * 1.5 : 1.2 + Math.random() * 2.1; p.s = 0.35 + Math.random() * 0.75; }
    if (kind === 'petal' || kind === 'petalLight') { p.r = 2.1 + Math.random() * 1.5; p.col = kind === 'petal' ? '#F49FBA' : '#F6BECB'; }
    if (kind === 'leaf' || kind === 'leafLight') { p.r = 2.1 + Math.random() * 1.4; p.col = ['#E2703A', '#C9502E', '#E18C6D'][Math.floor(Math.random() * 3)]; }
    if (kind === 'rain') { p.y = Math.random() * -H; p.s = 7 + Math.random() * 5; p.len = 10 + Math.random() * 9; }
    return p;
  }
  function spawn() {
    var target = Math.min(CAPS[kind] || 30, Math.round(W * H / 5200));
    while (parts.length < target) parts.push(make());
    parts.length = target;
  }
  function drawFlake(p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 1.1;
    var L = p.r * 2.1;
    ctx.beginPath();
    for (var k = 0; k < 3; k++) {
      var a = k * Math.PI / 3, dx = Math.cos(a) * L, dy = Math.sin(a) * L;
      ctx.moveTo(-dx, -dy); ctx.lineTo(dx, dy);
      var bx = dx * 0.55, by = dy * 0.55, bl = L * 0.34;
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + 0.6) * bl, by + Math.sin(a + 0.6) * bl);
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.6) * bl, by + Math.sin(a - 0.6) * bl);
      ctx.moveTo(-bx, -by); ctx.lineTo(-bx - Math.cos(a + 0.6) * bl, -by - Math.sin(a + 0.6) * bl);
      ctx.moveTo(-bx, -by); ctx.lineTo(-bx - Math.cos(a - 0.6) * bl, -by - Math.sin(a - 0.6) * bl);
    }
    ctx.stroke(); ctx.restore();
  }
  function drawPetal(p, t) {
    var s = p.r * 2.6;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.rotate(p.rot + Math.sin(t / 520 + p.ph) * 0.35);
    ctx.scale(1, 0.62 + 0.38 * Math.abs(Math.sin(t / 340 + p.ph)));
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.82, -s * 0.4, s * 0.62, s * 0.52, 0, s);
    ctx.bezierCurveTo(-s * 0.62, s * 0.52, -s * 0.82, -s * 0.4, 0, -s);
    ctx.fillStyle = p.col; ctx.globalAlpha = 0.92; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -s * 0.05, s * 0.32, s * 0.48, 0, 0, 6.29);
    ctx.fillStyle = 'rgba(255,255,255,0.30)'; ctx.fill();
    ctx.restore();
  }
  function drawLeaf(p, t) {
    var s = p.r * 2.7;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.rotate(p.rot + Math.sin(t / 540 + p.ph) * 0.3);
    ctx.scale(1, 0.68 + 0.32 * Math.abs(Math.sin(t / 380 + p.ph)));
    ctx.beginPath();
    for (var k = 0; k < 14; k++) {
      var a = k * Math.PI / 7 - Math.PI / 2, rad = (k % 2 === 0) ? s : s * 0.48;
      var px = Math.cos(a) * rad, py = Math.sin(a) * rad;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = p.col; ctx.globalAlpha = 0.94; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, s * 0.3); ctx.lineTo(0, s * 1.15);
    ctx.strokeStyle = p.col; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.restore();
  }
  function tick(t) {
    var i, p;
    ctx.clearRect(0, 0, W, H);
    spawn();
    if (kind === 'snow') {
      for (i = 0; i < parts.length; i++) { p = parts[i];
        p.y += p.s; p.x += Math.sin(t / 1700 + p.ph) * 0.35; p.rot += p.vr * 0.6;
        if (p.y > H + 8) { p.y = -8; p.x = Math.random() * W; }
        if (p.crystal) drawFlake(p);
        else { ctx.globalAlpha = 0.5 + 0.4 * Math.abs(Math.sin(p.ph * 3 + t / 900)); ctx.fillStyle = '#FFF';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill(); } }
    } else if (kind === 'petal' || kind === 'petalLight') {
      for (i = 0; i < parts.length; i++) { p = parts[i];
        p.y += p.s * 0.95; p.x += Math.sin(t / 900 + p.ph) * 0.75; p.rot += p.vr * 2;
        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
        drawPetal(p, t); }
    } else if (kind === 'leaf' || kind === 'leafLight') {
      for (i = 0; i < parts.length; i++) { p = parts[i];
        p.y += p.s * 0.9; p.x += Math.sin(t / 850 + p.ph) * 0.85; p.rot += p.vr * 2.2;
        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
        drawLeaf(p, t); }
    } else if (kind === 'rain') {
      ctx.strokeStyle = 'rgba(110,125,150,0.5)'; ctx.lineWidth = 1.1; ctx.beginPath();
      for (i = 0; i < parts.length; i++) { p = parts[i];
        p.y += p.s; p.x -= p.s * 0.12;
        if (p.y > H + 14) { p.y = -14; p.x = Math.random() * (W + 40); }
        ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.len * 0.12, p.y + p.len); }
      ctx.stroke();
    } else if (kind === 'sparkle' || kind === 'motes') {
      for (i = 0; i < parts.length; i++) { p = parts[i];
        p.y -= p.s * 0.18; p.x += Math.sin(t / 1400 + p.ph) * 0.25;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        var tw = 0.3 + 0.7 * Math.abs(Math.sin(t / 700 + p.ph));
        ctx.globalAlpha = tw * 0.75; ctx.fillStyle = kind === 'sparkle' ? '#B9CF9E' : '#E8B96F';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.85, 0, 6.29); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(tick);
  });
})();
