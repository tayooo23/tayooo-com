/* tayooo.com seasonal engine v3
   - Swaps the hero line art (.mountains) per month; seasonal motifs spread across the ridge.
   - Falling things (snow / petals / leaves / rain) fall over the page grid, under the cards,
     on a fixed full-page canvas. Sky effects (stars / fireworks) stay inside the hero.
   - Special window: Jul 1-10 Tanabata (denser Milky Way + more shooting stars).
   - Preview override: ?date=YYYY-MM-DD
   - prefers-reduced-motion: art only. */
(function () {
  'use strict';

  function resolveDate() {
    var m = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    return new Date();
  }
  function resolvePattern(d) {
    var mo = d.getMonth() + 1, day = d.getDate();
    if (mo === 7 && day <= 10) return 'tanabata';
    return ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][mo - 1];
  }
  var pattern = resolvePattern(resolveDate());

  /* ---------- shared CSS ---------- */
  var css =
    '.wrap{position:relative;z-index:1}' +
    '.season-page-canvas{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- shared ridge (brand base) ---------- */
  var RIDGE_BACK = '<path d="M-10,116 L170,116 L246,80 L298,102 L362,60 L428,98 L498,54 L562,90 L632,48 L706,94 L772,66 L852,104 L922,84 L1010,108" stroke="#FFF3E2" stroke-width="2" opacity="0.45"/>';
  var RIDGE_FRONT = '<path d="M-10,128 L236,128 L318,88 L372,108 L442,70 L522,110 L598,64 L672,104 L740,80 L816,114 L884,94 L1010,118" stroke="#FFF3E2" stroke-width="2.4" opacity="0.95"/>' +
    '<path d="M598,64 L576,96 L592,92 L584,112" stroke="#FFF3E2" stroke-width="1.6" opacity="0.7"/>' +
    '<path d="M442,70 L424,96 L438,92 L430,108" stroke="#FFF3E2" stroke-width="1.6" opacity="0.7"/>';
  var SUN = '<circle cx="806" cy="86" r="17" fill="#FFD9AE" stroke="none" opacity="0.95"/>';
  var SNOWCAPS = '<g stroke="#FFFFFF" stroke-width="3.4" opacity="0.9">' +
    '<path d="M305,94 L318,88 L331,94"/><path d="M429,76 L442,70 L455,76"/><path d="M585,70 L598,64 L611,70"/><path d="M727,86 L740,80 L753,86"/></g>';

  function dots(points, fill, op) {
    var s = '';
    for (var i = 0; i < points.length; i++) {
      s += '<circle cx="' + points[i][0] + '" cy="' + points[i][1] + '" r="' + points[i][2] + '" fill="' + fill + '" stroke="none" opacity="' + op + '"/>';
    }
    return s;
  }
  function starArc(n, cx, cy, rx, ry, a0, a1, rMin, rMax, fill, op) {
    var s = '', seed = 42;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    for (var i = 0; i < n; i++) {
      var a = a0 + (a1 - a0) * (i / n) + (rnd() - 0.5) * 0.06;
      var rr = 1 + (rnd() - 0.5) * 0.16;
      var x = Math.round(cx + Math.cos(a) * rx * rr), y = Math.round(cy + Math.sin(a) * ry * rr);
      var r = (rMin + rnd() * (rMax - rMin)).toFixed(1);
      s += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" stroke="none" opacity="' + (op * (0.5 + rnd() * 0.5)).toFixed(2) + '"/>';
    }
    return s;
  }
  /* canopy tree: trunk + dot cluster. baseY = ground point on the ridge. */
  function tree(cx, baseY, topY, colors, spread) {
    var offs = [[-16, 0], [-6, -8], [6, -9], [16, -2], [0, -14], [-11, -13], [11, -14], [0, -4]];
    var s = '<path d="M' + cx + ',' + baseY + ' C' + (cx - 2) + ',' + (baseY - 8) + ' ' + (cx + 1) + ',' + (topY + 8) + ' ' + (cx + 3) + ',' + (topY + 2) + '" stroke="#FFF3E2" stroke-width="2.2" fill="none"/>';
    for (var j = 0; j < offs.length; j++) {
      s += '<circle cx="' + (cx + offs[j][0] * spread) + '" cy="' + (topY + offs[j][1] * spread) + '" r="' + (4.5 + (j % 3)) + '" fill="' + colors[j % colors.length] + '" stroke="none" opacity="0.92"/>';
    }
    return s;
  }
  /* snow pine sprig drawn around (0,0) = base point */
  function pine(x, baseY, s) {
    return '<g transform="translate(' + x + ',' + baseY + ') scale(' + s + ')" stroke="#FFF3E2" stroke-width="2.2" fill="none">' +
      '<path d="M0,0 L0,-30 M0,-11 L-13,-20 M0,-11 L13,-20 M0,-19 L-10,-27 M0,-19 L10,-27"/>' +
      '<g fill="#FFFFFF" stroke="none" opacity="0.9"><circle cx="-13" cy="-20" r="2.6"/><circle cx="13" cy="-20" r="2.6"/><circle cx="-10" cy="-27" r="2.3"/><circle cx="10" cy="-27" r="2.3"/><circle cx="0" cy="-30" r="2.3"/></g></g>';
  }
  function susuki(x, baseY, s) {
    return '<g transform="translate(' + x + ',' + baseY + ') scale(' + s + ')">' +
      '<g stroke="#FFF3E2" stroke-width="1.7" opacity="0.85" fill="none"><path d="M0,0 C-2,-14 -6,-22 -12,-30"/><path d="M4,0 C4,-16 6,-26 10,-34"/></g>' +
      '<g fill="#FFF3E2" stroke="none" opacity="0.75"><ellipse cx="-13" cy="-33" rx="3" ry="7"/><ellipse cx="11" cy="-37" rx="3" ry="7"/></g></g>';
  }

  var SAKURA = ['#F6A9BC', '#F29BB4', '#F9C6D2'];
  var SAKURA_PALE = ['#F6C3CE', '#F29BB4', '#F9D3DA'];
  var MAPLE = ['#E2703A', '#C9502E', '#E18C6D'];
  var MAPLE_DEEP = ['#C9502E', '#A83E22', '#E2703A'];

  var MOON_CRESCENT = '<path d="M868,18 a24,24 0 1,0 17,43 a19,19 0 1,1 -17,-43 Z" fill="#FFE9C4" stroke="none" opacity="0.95"/>';

  var ART = {
    jan: SUN + RIDGE_BACK + RIDGE_FRONT + SNOWCAPS + pine(120, 128, 0.55) + pine(300, 104, 0.62) + pine(520, 112, 0.95) + pine(700, 96, 0.58) + pine(880, 97, 0.5),
    feb: SUN + RIDGE_BACK + RIDGE_FRONT + SNOWCAPS + pine(120, 128, 0.55) + pine(300, 104, 0.6) + pine(700, 96, 0.55) +
      '<path d="M992,0 C932,8 892,22 862,44" stroke="#FFF3E2" stroke-width="2.2" fill="none" opacity="0.9"/>' +
      dots([[934, 10, 4], [910, 18, 3.4], [886, 30, 4], [868, 40, 3.2], [922, 22, 3], [896, 36, 2.8], [946, 6, 2.8]], '#F7C9D4', 0.95),
    mar: '<circle cx="806" cy="78" r="17" fill="#FFD9AE" stroke="none" opacity="0.95"/>' + RIDGE_BACK + RIDGE_FRONT +
      tree(120, 128, 112, SAKURA_PALE, 0.5) + tree(295, 102, 84, SAKURA_PALE, 0.62) + tree(520, 112, 92, SAKURA_PALE, 0.78) + tree(700, 96, 80, SAKURA_PALE, 0.55) + tree(880, 97, 82, SAKURA_PALE, 0.5) +
      dots([[300, 62, 2.4], [470, 60, 2.4], [560, 48, 2.2], [620, 70, 2.4], [716, 58, 2.2]], '#F6C3CE', 0.8),
    apr: '<circle cx="806" cy="74" r="18" fill="#FFD9AE" stroke="none" opacity="0.95"/>' + RIDGE_BACK + RIDGE_FRONT +
      tree(120, 128, 110, SAKURA, 0.55) + tree(295, 102, 82, SAKURA, 0.68) + tree(520, 112, 88, SAKURA, 1.25) + tree(700, 96, 78, SAKURA, 0.6) + tree(880, 97, 80, SAKURA, 0.55) +
      dots([[300, 84, 2.4], [380, 50, 2.2], [452, 66, 2.6], [492, 44, 2.2], [566, 52, 2.6], [600, 82, 2.2], [648, 58, 2.4], [720, 74, 2.2], [420, 92, 2.2]], '#F6A9BC', 0.85),
    may: '<circle cx="150" cy="34" r="17" fill="#FFD9AE" stroke="none" opacity="0.95"/>' + RIDGE_BACK + RIDGE_FRONT +
      '<path d="M318,118 L318,26" stroke="#FFF3E2" stroke-width="2.4"/>' +
      '<path d="M318,34 C336,26 354,28 368,36 C354,44 336,44 318,40 Z" fill="#E18C6D" stroke="none" opacity="0.95"/>' +
      '<path d="M318,52 C332,45 346,47 358,53 C346,60 332,60 318,57 Z" fill="#7E8E9E" stroke="none" opacity="0.95"/>' +
      '<path d="M318,68 C329,62 340,63 350,68 C340,74 329,74 318,72 Z" fill="#875E5C" stroke="none" opacity="0.95"/>' +
      susuki(706, 106, 0.55) + susuki(120, 126, 0.5) +
      dots([[560, 44, 2], [640, 66, 1.8], [760, 62, 1.8], [830, 36, 2], [452, 58, 1.8]], '#DCEBCE', 0.9),
    jun: RIDGE_BACK +
      '<g stroke="#FFF3E2" stroke-width="2.2" fill="none" opacity="0.9">' +
      '<path d="M646,42 a15,11 0 0 1 12,-13 a18,12 0 0 1 30,-5 a14,10 0 0 1 15,11 a12,9 0 0 1 -7,13 l-42,0 a11,9 0 0 1 -8,-6 Z"/>' +
      '<path d="M170,26 a12,9 0 0 1 10,-10 a15,10 0 0 1 25,-4 a11,8 0 0 1 12,9 a9,7 0 0 1 -6,10 l-34,0 a9,7 0 0 1 -7,-5 Z"/></g>' +
      RIDGE_FRONT +
      dots([[168, 118, 5], [178, 112, 6], [188, 118, 5], [173, 124, 4.4], [184, 124, 4.4]], '#9DB1CE', 0.9) +
      dots([[472, 120, 5], [482, 114, 6], [492, 120, 5]], '#9DB1CE', 0.9) +
      dots([[820, 120, 5], [831, 114, 6], [842, 120, 5], [178, 114, 3], [482, 116, 3], [831, 116, 3]], '#B9A8D6', 0.9),
    jul: MOON_CRESCENT + starArc(46, 480, 150, 470, 132, Math.PI * 1.08, Math.PI * 1.92, 0.8, 2.0, '#FFF6EC', 0.9) + RIDGE_BACK + RIDGE_FRONT,
    tanabata: MOON_CRESCENT +
      starArc(90, 480, 155, 480, 140, Math.PI * 1.05, Math.PI * 1.95, 0.8, 2.4, '#FFF6EC', 1) +
      starArc(26, 480, 155, 400, 108, Math.PI * 1.15, Math.PI * 1.85, 1.2, 2.6, '#FFE9C4', 0.95) +
      RIDGE_BACK + RIDGE_FRONT,
    aug: '<circle cx="168" cy="32" r="20" fill="#FFD9AE" stroke="none" opacity="0.95"/>' +
      '<g stroke="#FFF3E2" stroke-width="2.2" fill="none" opacity="0.9">' +
      '<path d="M600,36 a14,10 0 0 1 11,-12 a17,11 0 0 1 28,-4 a13,9 0 0 1 14,10 a11,8 0 0 1 -6,12 l-39,0 a10,8 0 0 1 -8,-6 Z"/>' +
      '<path d="M838,58 a11,8 0 0 1 9,-9 a13,9 0 0 1 21,-3 a10,7 0 0 1 10,8 a8,6 0 0 1 -4,9 l-29,0 a8,6 0 0 1 -7,-5 Z"/></g>' +
      RIDGE_BACK + RIDGE_FRONT +
      '<path d="M884,116 L884,100" stroke="#FFF3E2" stroke-width="2"/>' +
      dots([[884, 92, 4.6]], '#875E5C', 1) +
      dots([[874, 88, 3], [894, 88, 3], [870, 96, 3], [898, 96, 3], [876, 82, 3], [892, 82, 3], [884, 80, 3]], '#F2B544', 0.95),
    sep: '<circle cx="812" cy="66" r="24" fill="#FFE9C4" stroke="none" opacity="0.97"/>' + RIDGE_BACK + RIDGE_FRONT +
      susuki(238, 112, 1) + susuki(486, 112, 0.8) + susuki(700, 106, 1),
    oct: '<circle cx="812" cy="78" r="17" fill="#FFD9AE" stroke="none" opacity="0.95"/>' + RIDGE_BACK + RIDGE_FRONT +
      tree(120, 128, 112, MAPLE, 0.52) + tree(295, 102, 84, MAPLE, 0.64) + tree(520, 112, 90, MAPLE, 1.05) + tree(700, 96, 80, MAPLE, 0.58) + tree(880, 97, 82, MAPLE, 0.5) +
      dots([[300, 80, 2.3], [452, 84, 2.4], [586, 66, 2.4], [636, 92, 2.2], [724, 70, 2.3]], '#E2703A', 0.8),
    nov: '<circle cx="812" cy="82" r="16" fill="#FFD9AE" stroke="none" opacity="0.9"/>' + RIDGE_BACK + RIDGE_FRONT +
      tree(120, 128, 110, MAPLE_DEEP, 0.55) + tree(295, 102, 82, MAPLE_DEEP, 0.7) + tree(520, 112, 88, MAPLE_DEEP, 1.2) + tree(700, 96, 78, MAPLE_DEEP, 0.62) + tree(880, 97, 80, MAPLE_DEEP, 0.55) +
      dots([[300, 92, 2.4], [404, 100, 2.2], [440, 70, 2.6], [492, 96, 2.4], [580, 52, 2.6], [624, 84, 2.4], [668, 60, 2.4], [736, 88, 2.2]], '#C9502E', 0.85),
    dec: SUN + RIDGE_BACK + RIDGE_FRONT + SNOWCAPS + pine(120, 128, 0.55) + pine(300, 104, 0.62) + pine(520, 112, 1) + pine(700, 96, 0.58) + pine(880, 97, 0.5)
  };

  /* ---------- particles ---------- */
  var PAGE_KINDS = { snow: 1, petal: 1, petalLight: 1, leaf: 1, leafLight: 1, rain: 1, sparkle: 1, motes: 1 };
  var PARTICLES = {
    jan: 'snow', feb: 'snow', mar: 'petalLight', apr: 'petal',
    may: 'sparkle', jun: 'rain', jul: 'stars', tanabata: 'starsBig', aug: 'fireworks',
    sep: 'motes', oct: 'leafLight', nov: 'leaf', dec: 'snow'
  };

  function makeEngine(canvas, getSize) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      var s = getSize();
      W = s.w; H = s.h;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    return { ctx: ctx, resize: resize, w: function () { return W; }, h: function () { return H; } };
  }

  function startFalling(kind) {
    var canvas = document.createElement('canvas');
    canvas.className = 'season-page-canvas';
    document.body.appendChild(canvas);
    var eng = makeEngine(canvas, function () { return { w: window.innerWidth, h: window.innerHeight }; });
    var ctx = eng.ctx;
    var parts = [], raf = 0;
    var CAPS = { snow: 260, petal: 95, petalLight: 50, leaf: 88, leafLight: 46, rain: 220, sparkle: 64, motes: 54 };

    function make() {
      var p = { x: Math.random() * eng.w(), y: Math.random() * eng.h(), r: 1 + Math.random() * 2.2, s: 0.3 + Math.random() * 0.8, ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02 };
      if (kind === 'snow') { p.crystal = Math.random() < 0.55; p.r = p.crystal ? 2.6 + Math.random() * 1.5 : 1.2 + Math.random() * 2.1; p.s = 0.35 + Math.random() * 0.75; }
      if (kind === 'petal' || kind === 'petalLight') { p.r = 2.1 + Math.random() * 1.5; p.col = kind === 'petal' ? '#F49FBA' : '#F6BECB'; }
      if (kind === 'leaf' || kind === 'leafLight') { p.r = 2.1 + Math.random() * 1.4; p.col = ['#E2703A', '#C9502E', '#E18C6D'][Math.floor(Math.random() * 3)]; }
      if (kind === 'rain') { p.y = Math.random() * -eng.h(); p.s = 7 + Math.random() * 5; p.len = 10 + Math.random() * 9; }
      return p;
    }
    function spawn() {
      var target = Math.min(CAPS[kind] || 30, Math.round(eng.w() * eng.h() / 5200));
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
      var W = eng.w(), H = eng.h(), i, p;
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
  }

  function startSky(hero, kind) {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;';
    hero.appendChild(canvas);
    var eng = makeEngine(canvas, function () { var r = hero.getBoundingClientRect(); return { w: r.width, h: r.height }; });
    var ctx = eng.ctx;
    var parts = [], raf = 0, lastFw = 0, lastShoot = 0, shoot = null;
    function tick(t) {
      var W = eng.w(), H = eng.h(), i, p;
      ctx.clearRect(0, 0, W, H);
      if (kind === 'stars' || kind === 'starsBig') {
        var target = kind === 'starsBig' ? 55 : 36;
        while (parts.length < target) parts.push({ x: Math.random() * W, y: Math.random() * H * 0.75, r: 0.6 + Math.random() * 1.4, ph: Math.random() * 6.28 });
        for (i = 0; i < parts.length; i++) { p = parts[i];
          var tw = 0.3 + 0.7 * Math.abs(Math.sin(t / 600 + p.ph * 2));
          ctx.globalAlpha = tw; ctx.fillStyle = '#FFF6EC';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill(); }
        var gap = kind === 'starsBig' ? 2600 : 5200;
        if (!shoot && t - lastShoot > gap + Math.random() * 3000) {
          shoot = { x: W * (0.25 + Math.random() * 0.6), y: H * (0.08 + Math.random() * 0.25), vx: -(3.4 + Math.random() * 2), vy: 1.7 + Math.random(), life: 1 };
        }
        if (shoot) {
          shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= 0.016;
          ctx.globalAlpha = Math.max(shoot.life, 0); ctx.strokeStyle = '#FFF6EC'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * 7, shoot.y - shoot.vy * 7); ctx.stroke();
          if (shoot.life <= 0 || shoot.x < -30) { shoot = null; lastShoot = t; }
        }
      } else if (kind === 'fireworks') {
        if (t - lastFw > 3400 + Math.random() * 2200) {
          var bx = W * (0.2 + Math.random() * 0.6), by = H * (0.25 + Math.random() * 0.3);
          var col = ['#FFD9AE', '#F29BB4', '#FFF3E2', '#E18C6D'][Math.floor(Math.random() * 4)];
          for (i = 0; i < 16; i++) {
            var a = (i / 16) * 6.28, sp = 1.1 + Math.random() * 1.3;
            parts.push({ fx: bx, fy: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, col: col });
          }
          lastFw = t;
        }
        for (i = parts.length - 1; i >= 0; i--) { p = parts[i];
          p.fx += p.vx; p.fy += p.vy; p.vy += 0.03; p.life -= 0.014;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          ctx.globalAlpha = p.life; ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.arc(p.fx, p.fy, 1.7, 0, 6.29); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(tick);
    });
  }

  /* ---------- boot ---------- */
  var art = ART[pattern];
  var mounts = document.querySelectorAll('svg.mountains');
  for (var i = 0; i < mounts.length; i++) { if (art) mounts[i].innerHTML = art; }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    var kind = PARTICLES[pattern];
    if (kind && PAGE_KINDS[kind]) startFalling(kind);
    var heroes = document.querySelectorAll('.hero');
    for (var j = 0; j < heroes.length; j++) {
      if (window.getComputedStyle(heroes[j]).position === 'static') heroes[j].style.position = 'relative';
      if (kind && !PAGE_KINDS[kind]) startSky(heroes[j], kind);
    }
  }
})();
