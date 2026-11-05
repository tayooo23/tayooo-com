/* tayooo.com seasonal engine
   - Swaps the hero line art (.mountains) and adds particle effects per month.
   - Special days: Jan 1-3 sunrise, Jul 1-10 Tanabata, Oct 31 Halloween, Dec 24-25 Santa.
   - Preview override: ?date=YYYY-MM-DD
   - Respects prefers-reduced-motion (art only, no particles). */
(function () {
  'use strict';

  function resolveDate() {
    var m = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    return new Date();
  }

  function resolvePattern(d) {
    var mo = d.getMonth() + 1, day = d.getDate();
    if (mo === 1 && day <= 3) return 'sunrise';
    if (mo === 12 && (day === 24 || day === 25)) return 'santa';
    if (mo === 10 && day === 31) return 'halloween';
    if (mo === 7 && day <= 10) return 'tanabata';
    return ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][mo - 1];
  }

  /* ---------- shared ridge (brand base) ---------- */
  var RIDGE_BACK = '<path d="M-10,116 L170,116 L246,80 L298,102 L362,60 L428,98 L498,54 L562,90 L632,48 L706,94 L772,66 L852,104 L922,84 L1010,108" stroke="#FFF3E2" stroke-width="2" opacity="0.45"/>';
  var RIDGE_FRONT = '<path d="M-10,128 L236,128 L318,88 L372,108 L442,70 L522,110 L598,64 L672,104 L740,80 L816,114 L884,94 L1010,118" stroke="#FFF3E2" stroke-width="2.4" opacity="0.95"/>' +
    '<path d="M598,64 L576,96 L592,92 L584,112" stroke="#FFF3E2" stroke-width="1.6" opacity="0.7"/>' +
    '<path d="M442,70 L424,96 L438,92 L430,108" stroke="#FFF3E2" stroke-width="1.6" opacity="0.7"/>';
  var SUN = '<circle cx="806" cy="86" r="17" fill="#FFD9AE" stroke="none" opacity="0.95"/>';
  var SNOWCAPS = '<g stroke="#FFFFFF" stroke-width="3.4" opacity="0.9">' +
    '<path d="M305,94 L318,88 L331,94"/><path d="M429,76 L442,70 L455,76"/><path d="M585,70 L598,64 L611,70"/><path d="M727,86 L740,80 L753,86"/></g>';

  function dots(points, r, fill, op) {
    var s = '';
    for (var i = 0; i < points.length; i++) {
      s += '<circle cx="' + points[i][0] + '" cy="' + points[i][1] + '" r="' + (points[i][2] || r) + '" fill="' + fill + '" stroke="none" opacity="' + op + '"/>';
    }
    return s;
  }

  /* deterministic star/milkyway dots along an arc */
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

  function tree(cx, baseY, trunkTop, colors, spread) {
    var pts = [];
    var cxv = [[-16, 0], [-6, -8], [6, -9], [16, -2], [0, -14], [-11, -13], [11, -14], [0, -4]];
    for (var i = 0; i < cxv.length; i++) pts.push([cx + cxv[i][0] * spread, trunkTop + cxv[i][1] * spread, 4.5 + (i % 3)]);
    var s = '<path d="M' + cx + ',' + baseY + ' C' + (cx - 2) + ',' + (baseY - 8) + ' ' + (cx + 1) + ',' + (trunkTop + 8) + ' ' + (cx + 3) + ',' + (trunkTop + 2) + '" stroke="#FFF3E2" stroke-width="2.2"/>';
    for (var j = 0; j < pts.length; j++) {
      s += '<circle cx="' + pts[j][0] + '" cy="' + pts[j][1] + '" r="' + pts[j][2] + '" fill="' + colors[j % colors.length] + '" stroke="none" opacity="0.92"/>';
    }
    return s;
  }

  var ART = {
    jan: SUN + RIDGE_BACK + RIDGE_FRONT + SNOWCAPS,
    sunrise:
      '<circle cx="500" cy="122" r="36" fill="#FFC98A" stroke="none" opacity="0.95"/>' +
      '<g stroke="#FFC98A" stroke-width="2.4" opacity="0.8"><path d="M448,84 L440,72"/><path d="M500,76 L500,60"/><path d="M552,84 L560,72"/></g>' +
      RIDGE_BACK + RIDGE_FRONT + SNOWCAPS,
    feb: SUN + RIDGE_BACK + RIDGE_FRONT + SNOWCAPS +
      '<path d="M1012,2 C950,10 908,24 878,46" stroke="#FFF3E2" stroke-width="2.2" opacity="0.9"/>' +
      dots([[952, 12, 4], [928, 20, 3.4], [902, 32, 4], [884, 42, 3.2], [940, 22, 3], [912, 38, 2.8], [962, 8, 2.8]], 3.4, '#F7C9D4', 0.95),
    mar: '<circle cx="806" cy="78" r="17" fill="#FFD9AE" stroke="none" opacity="0.95"/>' + RIDGE_BACK + RIDGE_FRONT +
      tree(520, 112, 92, ['#F6C3CE', '#F29BB4', '#F9D3DA'], 0.75) +
      dots([[470, 60, 2.4], [560, 48, 2.2], [620, 70, 2.4]], 2.3, '#F6C3CE', 0.8),
    apr: '<circle cx="806" cy="74" r="18" fill="#FFD9AE" stroke="none" opacity="0.95"/>' + RIDGE_BACK + RIDGE_FRONT +
      tree(520, 112, 88, ['#F6A9BC', '#F29BB4', '#F9C6D2'], 1.25) +
      dots([[452, 66, 2.6], [492, 44, 2.2], [566, 52, 2.6], [600, 82, 2.2], [420, 92, 2.2], [648, 58, 2.4]], 2.4, '#F6A9BC', 0.85),
    may: '<circle cx="150" cy="34" r="17" fill="#FFD9AE" stroke="none" opacity="0.95"/>' + RIDGE_BACK + RIDGE_FRONT +
      '<path d="M318,118 L318,26" stroke="#FFF3E2" stroke-width="2.4"/>' +
      '<path d="M318,34 C336,26 354,28 368,36 C354,44 336,44 318,40 Z" fill="#E18C6D" stroke="none" opacity="0.95"/>' +
      '<path d="M318,52 C332,45 346,47 358,53 C346,60 332,60 318,57 Z" fill="#7E8E9E" stroke="none" opacity="0.95"/>' +
      '<path d="M318,68 C329,62 340,63 350,68 C340,74 329,74 318,72 Z" fill="#875E5C" stroke="none" opacity="0.95"/>' +
      dots([[700, 40, 2], [760, 62, 1.8], [640, 66, 1.8], [830, 36, 2]], 1.9, '#DCEBCE', 0.9),
    jun: RIDGE_BACK +
      '<g stroke="#FFF3E2" stroke-width="2.2" fill="none" opacity="0.9">' +
      '<path d="M646,42 a15,11 0 0 1 12,-13 a18,12 0 0 1 30,-5 a14,10 0 0 1 15,11 a12,9 0 0 1 -7,13 l-42,0 a11,9 0 0 1 -8,-6 Z"/>' +
      '<path d="M170,26 a12,9 0 0 1 10,-10 a15,10 0 0 1 25,-4 a11,8 0 0 1 12,9 a9,7 0 0 1 -6,10 l-34,0 a9,7 0 0 1 -7,-5 Z"/></g>' +
      RIDGE_FRONT +
      dots([[168, 118, 5], [178, 112, 6], [188, 118, 5], [173, 124, 4.4], [184, 124, 4.4], [820, 120, 5], [831, 114, 6], [842, 120, 5]], 5, '#9DB1CE', 0.9) +
      dots([[178, 114, 3], [831, 116, 3]], 3, '#B9A8D6', 0.9),
    jul: '<path d="M868,18 a24,24 0 1,0 17,43 a19,19 0 1,1 -17,-43 Z" fill="#FFE9C4" stroke="none" opacity="0.95"/>' +
      starArc(46, 480, 150, 470, 132, Math.PI * 1.08, Math.PI * 1.92, 0.8, 2.0, '#FFF6EC', 0.9) +
      RIDGE_BACK + RIDGE_FRONT,
    tanabata: '<path d="M868,18 a24,24 0 1,0 17,43 a19,19 0 1,1 -17,-43 Z" fill="#FFE9C4" stroke="none" opacity="0.95"/>' +
      starArc(90, 480, 155, 480, 140, Math.PI * 1.05, Math.PI * 1.95, 0.8, 2.4, '#FFF6EC', 1) +
      starArc(26, 480, 155, 400, 108, Math.PI * 1.15, Math.PI * 1.85, 1.2, 2.6, '#FFE9C4', 0.95) +
      RIDGE_BACK + RIDGE_FRONT,
    aug: '<circle cx="168" cy="32" r="20" fill="#FFD9AE" stroke="none" opacity="0.95"/>' +
      '<g stroke="#FFF3E2" stroke-width="2.2" fill="none" opacity="0.9">' +
      '<path d="M600,36 a14,10 0 0 1 11,-12 a17,11 0 0 1 28,-4 a13,9 0 0 1 14,10 a11,8 0 0 1 -6,12 l-39,0 a10,8 0 0 1 -8,-6 Z"/>' +
      '<path d="M838,58 a11,8 0 0 1 9,-9 a13,9 0 0 1 21,-3 a10,7 0 0 1 10,8 a8,6 0 0 1 -4,9 l-29,0 a8,6 0 0 1 -7,-5 Z"/></g>' +
      RIDGE_BACK + RIDGE_FRONT,
    sep: '<circle cx="812" cy="66" r="24" fill="#FFE9C4" stroke="none" opacity="0.97"/>' + RIDGE_BACK + RIDGE_FRONT +
      '<g stroke="#FFF3E2" stroke-width="1.7" opacity="0.85" fill="none">' +
      '<path d="M238,112 C236,98 232,90 226,82"/><path d="M246,112 C246,96 248,88 252,78"/><path d="M700,106 C698,92 694,84 688,76"/><path d="M708,106 C708,90 710,82 714,72"/></g>' +
      '<g fill="#FFF3E2" stroke="none" opacity="0.75"><ellipse cx="225" cy="78" rx="3" ry="7"/><ellipse cx="253" cy="74" rx="3" ry="7"/><ellipse cx="687" cy="72" rx="3" ry="7"/><ellipse cx="715" cy="68" rx="3" ry="7"/></g>',
    oct: '<circle cx="812" cy="78" r="17" fill="#FFD9AE" stroke="none" opacity="0.95"/>' + RIDGE_BACK + RIDGE_FRONT +
      tree(520, 112, 90, ['#E2703A', '#C9502E', '#E18C6D'], 1.05) +
      dots([[452, 84, 2.4], [586, 66, 2.4], [636, 92, 2.2]], 2.3, '#E2703A', 0.8),
    halloween: '<circle cx="812" cy="72" r="20" fill="#FFE9C4" stroke="none" opacity="0.97"/>' + RIDGE_BACK + RIDGE_FRONT +
      tree(520, 112, 90, ['#E2703A', '#C9502E', '#E18C6D'], 1.05) +
      '<g stroke="#23233F" stroke-width="2.2" fill="none" opacity="0.6"><path d="M196,34 q7,-7 14,0 q7,-7 14,0"/><path d="M306,20 q6,-6 12,0 q6,-6 12,0"/></g>' +
      '<ellipse cx="884" cy="116" rx="13" ry="10" fill="#E2703A" stroke="none" opacity="0.95"/>' +
      '<path d="M884,106 q2,-5 6,-6" stroke="#875E5C" stroke-width="2.4" fill="none"/>',
    nov: '<circle cx="812" cy="82" r="16" fill="#FFD9AE" stroke="none" opacity="0.9"/>' + RIDGE_BACK + RIDGE_FRONT +
      tree(520, 112, 88, ['#C9502E', '#A83E22', '#E2703A'], 1.2) +
      dots([[440, 70, 2.6], [492, 96, 2.4], [580, 52, 2.6], [624, 84, 2.4], [404, 100, 2.2], [668, 60, 2.4]], 2.4, '#C9502E', 0.85),
    dec: SUN + RIDGE_BACK + RIDGE_FRONT + SNOWCAPS +
      '<path d="M520,112 L520,86 M520,96 L508,88 M520,96 L532,88 M520,104 L510,98 M520,104 L530,98" stroke="#FFF3E2" stroke-width="2.2"/>' +
      dots([[512, 92, 3], [528, 92, 3], [515, 101, 2.6], [525, 101, 2.6]], 2.8, '#FFFFFF', 0.9),
    santa: SUN + RIDGE_BACK + RIDGE_FRONT + SNOWCAPS +
      '<path d="M520,112 L520,86 M520,96 L508,88 M520,96 L532,88 M520,104 L510,98 M520,104 L530,98" stroke="#FFF3E2" stroke-width="2.2"/>' +
      dots([[512, 92, 3], [528, 92, 3], [515, 101, 2.6], [525, 101, 2.6]], 2.8, '#FFFFFF', 0.9)
  };

  var PARTICLES = {
    jan: 'snow', sunrise: 'snow', feb: 'snow', mar: 'petalLight', apr: 'petal',
    may: 'sparkle', jun: 'rain', jul: 'stars', tanabata: 'starsBig', aug: 'fireworks',
    sep: 'motes', oct: 'leafLight', halloween: 'leafLight', nov: 'leaf', dec: 'snow', santa: 'snow'
  };

  /* ---------- santa overlay ---------- */
  var SANTA_SVG = '<svg viewBox="0 0 180 60" width="168" height="56" aria-hidden="true">' +
    '<g fill="#23233F" opacity="0.85">' +
    '<path d="M62,28 Q104,20 148,17" stroke="#23233F" stroke-width="1.6" fill="none"/>' +
    '<path d="M12,36 Q32,47 58,43 L63,29 Q40,36 20,29 Z"/>' +
    '<path d="M10,47 Q36,52 66,47" stroke="#23233F" stroke-width="2.2" fill="none"/>' +
    '<circle cx="54" cy="25" r="7.5"/>' +
    '<path d="M27,31 q2,-11 11,-11 q9,0 10,11 Z"/>' +
    '<circle cx="37" cy="19" r="5.5"/>' +
    '<path d="M31,16 L45,6 L47,16 Z"/><circle cx="46" cy="6" r="2.6"/>' +
    '<ellipse cx="118" cy="31" rx="18" ry="7.5"/>' +
    '<path d="M130,28 L147,13 L158,14 L159,19 L149,21 L139,32 Z"/>' +
    '<path d="M149,13 q-3,-8 -9,-10 M149,13 q4,-7 10,-8 M143,6 l-4,-3 M154,7 l5,-3" stroke="#23233F" stroke-width="2" fill="none"/>' +
    '<path d="M127,37 l11,6 M122,38 l6,8 M105,37 l-9,6 M109,38 l-4,8" stroke="#23233F" stroke-width="2.4" fill="none"/>' +
    '<path d="M100,27 l-7,-4 l2,8 Z"/>' +
    '</g></svg>';

  function addSanta(hero) {
    var st = document.createElement('style');
    st.textContent = '@keyframes santaFly{0%{transform:translateX(-160px)}22%{transform:translateX(110vw)}100%{transform:translateX(110vw)}}' +
      '.season-santa{position:absolute;top:14px;left:0;z-index:2;pointer-events:none;animation:santaFly 26s linear infinite;}';
    document.head.appendChild(st);
    var el = document.createElement('div');
    el.className = 'season-santa';
    el.innerHTML = SANTA_SVG;
    hero.appendChild(el);
  }

  /* ---------- particles ---------- */
  function startParticles(hero, kind) {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;';
    hero.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, parts = [], raf = 0, lastFw = 0, lastShoot = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn(n) {
      var area = W * H;
      var target = Math.min(n, Math.round(area / 14000));
      while (parts.length < target) parts.push(make());
      parts.length = target;
    }
    function make() {
      var p = { x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.2, s: 0.3 + Math.random() * 0.8, ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.03 };
      if (kind === 'rain') { p.y = Math.random() * -H; p.s = 7 + Math.random() * 5; p.len = 9 + Math.random() * 8; }
      if (kind === 'stars' || kind === 'starsBig') { p.r = 0.6 + Math.random() * 1.4; }
      return p;
    }

    var PETAL = { petal: '#F7A8BC', petalLight: '#F8C3D0' };
    function drawPetal(p, color) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = color; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.7, p.r * 1.05, 0, 0, 6.29); ctx.fill(); ctx.restore();
    }
    function drawLeaf(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = ['#E2703A', '#C9502E', '#E18C6D'][Math.floor(p.ph) % 3]; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.8, p.r * 1.0, 0, 0, 6.29); ctx.fill(); ctx.restore();
    }

    function burst() {
      var bx = W * (0.2 + Math.random() * 0.6), by = H * (0.25 + Math.random() * 0.3);
      var col = ['#FFD9AE', '#F29BB4', '#FFF3E2', '#E18C6D'][Math.floor(Math.random() * 4)];
      for (var i = 0; i < 16; i++) {
        var a = (i / 16) * 6.28, sp = 1.1 + Math.random() * 1.3;
        parts.push({ fx: bx, fy: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, col: col, fw: true });
      }
    }
    var shoot = null;
    function makeShoot() {
      shoot = { x: W * (0.25 + Math.random() * 0.6), y: H * (0.08 + Math.random() * 0.25), vx: -(3.4 + Math.random() * 2), vy: 1.7 + Math.random(), life: 1 };
    }

    function tick(t) {
      ctx.clearRect(0, 0, W, H);
      var i, p;
      if (kind === 'snow') {
        spawn(64);
        for (i = 0; i < parts.length; i++) { p = parts[i];
          p.y += p.s; p.x += Math.sin(t / 1600 + p.ph) * 0.35; p.ph += 0.002;
          if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; }
          ctx.globalAlpha = 0.55 + 0.4 * Math.sin(p.ph * 3); ctx.fillStyle = '#FFF';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill(); }
      } else if (kind === 'petal' || kind === 'petalLight') {
        spawn(kind === 'petal' ? 42 : 20);
        for (i = 0; i < parts.length; i++) { p = parts[i];
          p.y += p.s * 0.9; p.x += Math.sin(t / 900 + p.ph) * 0.7; p.rot += p.vr * 2;
          if (p.y > H + 6) { p.y = -6; p.x = Math.random() * W; }
          drawPetal(p, PETAL[kind]); }
      } else if (kind === 'leaf' || kind === 'leafLight') {
        spawn(kind === 'leaf' ? 36 : 18);
        for (i = 0; i < parts.length; i++) { p = parts[i];
          p.y += p.s * 0.85; p.x += Math.sin(t / 800 + p.ph) * 0.8; p.rot += p.vr * 2.4;
          if (p.y > H + 6) { p.y = -6; p.x = Math.random() * W; }
          drawLeaf(p); }
      } else if (kind === 'rain') {
        spawn(85);
        ctx.strokeStyle = 'rgba(255,246,236,0.55)'; ctx.lineWidth = 1.1; ctx.beginPath();
        for (i = 0; i < parts.length; i++) { p = parts[i];
          p.y += p.s; p.x -= p.s * 0.12;
          if (p.y > H + 12) { p.y = -12; p.x = Math.random() * (W + 40); }
          ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.len * 0.12, p.y + p.len); }
        ctx.stroke();
      } else if (kind === 'sparkle' || kind === 'motes') {
        spawn(kind === 'sparkle' ? 30 : 24);
        for (i = 0; i < parts.length; i++) { p = parts[i];
          p.y -= p.s * 0.18; p.x += Math.sin(t / 1400 + p.ph) * 0.25;
          if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
          var tw = 0.35 + 0.65 * Math.abs(Math.sin(t / 700 + p.ph));
          ctx.globalAlpha = tw * 0.8; ctx.fillStyle = kind === 'sparkle' ? '#EAF3DC' : '#FFE9C4';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.8, 0, 6.29); ctx.fill(); }
      } else if (kind === 'stars' || kind === 'starsBig') {
        spawn(kind === 'starsBig' ? 55 : 36);
        for (i = 0; i < parts.length; i++) { p = parts[i];
          var tw2 = 0.3 + 0.7 * Math.abs(Math.sin(t / 600 + p.ph * 2));
          ctx.globalAlpha = tw2; ctx.fillStyle = '#FFF6EC';
          ctx.beginPath(); ctx.arc(p.x, p.y * 0.75, p.r, 0, 6.29); ctx.fill(); }
        var gap = kind === 'starsBig' ? 2600 : 5200;
        if (!shoot && t - lastShoot > gap + Math.random() * 3000) makeShoot();
        if (shoot) {
          shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= 0.016;
          ctx.globalAlpha = Math.max(shoot.life, 0); ctx.strokeStyle = '#FFF6EC'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * 7, shoot.y - shoot.vy * 7); ctx.stroke();
          if (shoot.life <= 0 || shoot.x < -30) { shoot = null; lastShoot = t; }
        }
      } else if (kind === 'fireworks') {
        if (t - lastFw > 3400 + Math.random() * 2200) { burst(); lastFw = t; }
        for (i = parts.length - 1; i >= 0; i--) { p = parts[i];
          if (!p.fw) { parts.splice(i, 1); continue; }
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
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(tick);
    });
  }

  /* ---------- boot ---------- */
  var pattern = resolvePattern(resolveDate());
  var art = ART[pattern];
  var mounts = document.querySelectorAll('svg.mountains');
  for (var i = 0; i < mounts.length; i++) {
    if (art) mounts[i].innerHTML = art;
  }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heroes = document.querySelectorAll('.hero');
  for (var j = 0; j < heroes.length; j++) {
    if (window.getComputedStyle(heroes[j]).position === 'static') heroes[j].style.position = 'relative';
    if (!reduced) {
      if (pattern === 'santa') addSanta(heroes[j]);
      var kind = PARTICLES[pattern];
      if (kind) startParticles(heroes[j], kind);
    }
  }
})();
