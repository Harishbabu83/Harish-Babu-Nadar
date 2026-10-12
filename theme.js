// Shared light/dark theme for case-study pages. Reads/writes the same 'pf-theme' key as the homepage.
(function () {
  if (window.__pfTheme) return;
  var KEY = 'pf-theme', root = document.documentElement, dark = false;
  try { var st = localStorage.getItem(KEY); dark = st === 'dark'; } catch (e) {}

  var BG = [13, 14, 17], INK = [241, 240, 236];
  var COL = /rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|\b(?:white|black)\b/gi;
  function parse(s) {
    s = s.trim().toLowerCase();
    if (s === 'white') return [255, 255, 255, 1];
    if (s === 'black') return [0, 0, 0, 1];
    if (s[0] === '#') {
      var h = s.slice(1);
      if (h.length === 3 || h.length === 4) h = h.split('').map(function (c) { return c + c; }).join('');
      if (h.length !== 6 && h.length !== 8) return null;
      var n = parseInt(h.slice(0, 6), 16);
      return [n >> 16 & 255, n >> 8 & 255, n & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1];
    }
    var m = s.match(/^rgba?\(([^)]*)\)$/); if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return p.length < 3 ? null : [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  function fmt(c) { var r = Math.round(c[0]), g = Math.round(c[1]), b = Math.round(c[2]); return c[3] >= 1 ? 'rgb(' + r + ', ' + g + ', ' + b + ')' : 'rgba(' + r + ', ' + g + ', ' + b + ', ' + (+c[3].toFixed(3)) + ')'; }
  function hsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); }
    return [f(0), f(8), f(4)];
  }
  function lum(c) { var a = [c[0], c[1], c[2]].map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function neutral(c) { return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 18; }
  function wa(rgb, a) { return [rgb[0], rgb[1], rgb[2], a]; }
  function hex(s) { return parse(s); }

  function ladder(l, c) {
    if (l >= .995) return hex('#16171b');
    if (l >= .975) return hex('#131418');
    if (l >= .95) return (c[0] === 246 && c[1] === 245 && c[2] === 242) ? hex('#0d0e11') : hex('#1c1d22');
    if (l >= .925) return hex('#202126');
    if (l >= .895) return hex('#26282d');
    if (l >= .84) return hex('#2e3036');
    return hex('#464850');
  }
  // role: 'bg' | 'grad' | 'text' | 'border' | 'fill'
  function mapColor(c, role) {
    var a = c[3]; if (a === 0) return null;
    var H = hsl(c), l = H[2], n = neutral(c);
    if (role === 'text') {
      if (n) { if (lum(c) >= .45) return null; if (l < .12) return wa(INK, a); return wa(fromHsl(H[0], H[1], .98 - .85 * l), a); }
      var SURF = [38, 40, 45];
      if (contrast(c, SURF) >= 4.6) return null;
      var L = l, rgb = c; while (L < .9) { L += .03; rgb = fromHsl(H[0], H[1], L); if (contrast(rgb, SURF) >= 4.6) break; }
      return wa(rgb, a);
    }
    if (role === 'fill') {
      if (n) { if (lum(c) < .45) return mapColor(c, 'text'); if (l >= .7 && a >= 1) return ladder(l, c); return null; }
      return l >= .88 ? wa(fromHsl(H[0], Math.min(H[1], .5), .15), a) : null;
    }
    if (role === 'border') {
      if (n) {
        if (a < 1 && l < .2) return a < .5 ? [255, 255, 255, Math.min(a * 1.3 + .02, 1)] : null;
        if (a < 1 && l > .9) return a >= .5 ? [255, 255, 255, .1] : null;
        if (l >= .7) return l >= .995 ? hex('#16171b') : l >= .93 ? hex('#26282d') : l >= .84 ? hex('#33353b') : hex('#4a4c54');
        if (l < .15) return wa(INK, a);
        return null;
      }
      return l >= .8 ? wa(fromHsl(H[0], Math.min(H[1], .5), .26), a) : null;
    }
    // bg / grad
    if (n) {
      if (a < 1) {
        if (l < .2) return role === 'bg' && a < .3 ? [255, 255, 255, Math.min(a * 1.2 + .01, 1)] : null;
        if (l > .9) return a >= .5 ? [22, 23, 27, a] : [255, 255, 255, +(a * .15).toFixed(3)];
        return null;
      }
      if (l >= .7) return ladder(l, c);
      return null;
    }
    if (l >= .8) return wa(fromHsl(H[0], Math.min(H[1], .5), .13 + (1 - l) * .3), a);
    return null;
  }
  function isLight(c) { return c && c[3] >= .6 && !neutral(c) && lum(c) >= .3 && hsl(c)[2] < .8; }
  function isNearBlack(c) { return c && c[3] >= .9 && neutral(c) && hsl(c)[2] < .15; }

  var cache = {};
  function mapStr(v, role) {
    if (!v || v.indexOf('url(') > -1) return v;
    var k = role + '|' + v; if (k in cache) return cache[k];
    var out = v.replace(COL, function (t) { var c = parse(t); if (!c) return t; var m = mapColor(c, role); return m ? fmt(m) : t; });
    return (cache[k] = out);
  }
  function splitTop(v) { var out = [], d = 0, s = 0; for (var i = 0; i < v.length; i++) { var ch = v[i]; if (ch === '(') d++; else if (ch === ')') d--; else if (ch === ',' && !d) { out.push(v.slice(s, i)); s = i + 1; } } out.push(v.slice(s)); return out; }
  function mapShadow(v) {
    if (!v || v === 'none') return v;
    var k = 'sh|' + v; if (k in cache) return cache[k];
    var out = splitTop(v).map(function (seg) {
      var m = seg.match(COL); if (!m) return seg;
      var c = parse(m[0]); if (!c) return seg;
      var nums = seg.replace(m[0], ' ').trim().split(/\s+/).filter(function (t) { return t && t !== 'inset'; }).map(parseFloat);
      var blur = nums[2] || 0, nc = null, l = hsl(c)[2];
      if (!blur) nc = mapColor(c, 'border');
      else if (neutral(c) && l < .2) nc = [0, 0, 0, Math.min(c[3] * 2.2, .7)];
      else if (neutral(c) && l > .9) nc = [255, 255, 255, c[3] * .06];
      return nc ? seg.replace(m[0], fmt(nc)) : seg;
    }).join(',');
    return (cache[k] = out);
  }
  function mapProp(p, v) {
    if (p.charCodeAt(0) === 45 && p.charCodeAt(1) === 45) { var c = parse(v.trim()); if (!c) return v; var l = hsl(c)[2], m = l >= .9 || (l >= .8 && neutral(c)) ? mapColor(c, 'bg') : l >= .8 ? wa(fromHsl(hsl(c)[0], Math.min(hsl(c)[1], .6), .34), c[3]) : l < .35 ? mapColor(c, 'text') : null; return m ? fmt(m) : v; }
    if (p === 'box-shadow') return mapShadow(v);
    if (p === 'color' || p === 'caret-color') return mapStr(v, 'text');
    if (p === 'background-color') return mapStr(v, 'bg');
    if (p === 'background-image') return mapStr(v, 'grad');
    if (p === 'fill' || p === 'stroke') return mapStr(v, 'fill');
    if (p === 'background') return v.indexOf('var(') > -1 ? mapStr(v, 'bg') : v;
    return mapStr(v, 'border');
  }
  function bgTokens(o) {
    var t = [], bc = o['background-color'], bi = o['background-image'] || (o.background && o.background.indexOf('var(') > -1 ? o.background : '');
    if (bc) { var c = parse(bc); if (c) t.push(c); }
    if (bi && bi.indexOf('url(') < 0) (bi.match(COL) || []).forEach(function (s) { var c = parse(s); if (c) t.push(c); });
    return t;
  }

  var PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'box-shadow', 'fill', 'stroke', 'background'];
  var ATTRS = ['fill', 'stroke'];
  var SKIP = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TEMPLATE: 1, HEAD: 1, TITLE: 1, NOSCRIPT: 1 };
  var recs = new WeakMap(), kinds = new WeakMap(), tracked = new Set();

  function inIsland(el) { for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) { var k = kinds.get(p); if (k === 'light' || k === 'dark') return true; } return false; }
  var STATS={proc:0,batch:0,writes:0};
  function custom(s, extra) { var out = []; for (var i = 0; i < s.length; i++) if (s[i].charCodeAt(0) === 45 && s[i].charCodeAt(1) === 45) out.push(s[i]); if (extra) Object.keys(extra).forEach(function (k) { if (k.charCodeAt(0) === 45 && out.indexOf(k) < 0) out.push(k); }); return out; }
  function proc(el) {
    STATS.proc++;
    if (!el || el.nodeType !== 1 || SKIP[el.tagName]) return null;
    var s = el.style; if (!s) return null;
    var rec = recs.get(el);
    if (!rec) { rec = { o: {}, w: {}, t: {}, ao: {}, aw: {} }; recs.set(el, rec); tracked.add(el); }
    var PR = PROPS.concat(custom(s, rec.o));
    PR.forEach(function (p) { var cur = s.getPropertyValue(p); if (p in rec.w && rec.w[p] === cur) return; rec.o[p] = cur; delete rec.w[p]; delete rec.t[p]; });
    var svg = el instanceof SVGElement;
    if (svg) ATTRS.forEach(function (a) { var cur = el.getAttribute(a); if (a in rec.aw && rec.aw[a] === cur) return; rec.ao[a] = cur; delete rec.aw[a]; });

    var want = {}, aWant = {}, kind = null, o = rec.o;
    if (!inIsland(el)) {
      var toks = bgTokens(o), bc = parse(o['background-color'] || '');
      if (toks.some(isLight)) { kind = 'light'; if (!o.color) want.color = '#0f1013'; }
      else if (isNearBlack(bc)) {
        if (s.position === 'fixed') kind = 'dark';
        else {
          var rad = s.borderRadius || '', r = parseFloat(rad) || 0, h = el.getBoundingClientRect().height;
          if ((rad.indexOf('%') > -1 || r >= 12) && h <= 72) {
            want['background-color'] = '#f1f0ec';
            var oc = o.color ? parse(o.color) : null;
            if (!oc || lum(oc) >= .5) want.color = '#0d0e11';
            ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'box-shadow', 'outline-color'].forEach(function (p) { if (o[p]) want[p] = mapProp(p, o[p]); });
          } else { kind = 'dark'; want['background-color'] = '#18191d'; }
        }
      } else {
        PR.forEach(function (p) { if (o[p]) want[p] = mapProp(p, o[p]); });
        if (svg) ATTRS.forEach(function (a) { var v = rec.ao[a]; if (v && v !== 'none' && v !== 'currentColor') aWant[a] = mapStr(v, 'fill'); });
      }
    }
    PR.forEach(function (p) {
      var target = p in want ? want[p] : o[p];
      if (target === o[p]) { if (p in rec.w) { if (o[p]) s.setProperty(p, o[p]); else s.removeProperty(p); delete rec.w[p]; delete rec.t[p]; } return; }
      if (p in rec.w && rec.t[p] === target && s.getPropertyValue(p) === rec.w[p]) return;
      s.setProperty(p, target); rec.w[p] = s.getPropertyValue(p); rec.t[p] = target; STATS.writes++;
    });
    if (svg) ATTRS.forEach(function (a) {
      var orig = rec.ao[a], target = a in aWant ? aWant[a] : orig;
      if (target === orig) { if (a in rec.aw) { if (orig == null) el.removeAttribute(a); else el.setAttribute(a, orig); delete rec.aw[a]; } return; }
      if (el.getAttribute(a) !== target) el.setAttribute(a, target); rec.aw[a] = target;
    });
    var prev = kinds.get(el); kinds.set(el, kind);
    return prev !== kind;
  }
  function procTree(el) { if (!el || el.nodeType !== 1) return; proc(el); var all = el.querySelectorAll('*'); for (var i = 0; i < all.length; i++) proc(all[i]); }
  function restoreAll() {
    tracked.forEach(function (el) {
      var rec = recs.get(el); if (!rec) return;
      if (el.isConnected) {
        Object.keys(rec.w).forEach(function (p) { if (el.style.getPropertyValue(p) === rec.w[p]) { if (rec.o[p]) el.style.setProperty(p, rec.o[p]); else el.style.removeProperty(p); } });
        Object.keys(rec.aw).forEach(function (a) { if (el.getAttribute(a) === rec.aw[a]) { if (rec.ao[a] == null) el.removeAttribute(a); else el.setAttribute(a, rec.ao[a]); } });
      }
      recs.delete(el); kinds.delete(el);
    });
    tracked.clear();
  }

  var ruleRecs = new Map(), seenRules = new WeakSet();
  function walkRules(list) {
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r.style || !r.selectorText) { if (r.cssRules && !(r instanceof CSSFontFaceRule)) walkRules(r.cssRules); continue; }
      if (seenRules.has(r)) continue; seenRules.add(r);
      var sel = r.selectorText, pseudo = /:(hover|active|focus)/.test(sel), changes = {};
      var bc = parse(r.style.getPropertyValue('background-color') || '');
      PROPS.concat(custom(r.style)).forEach(function (p) {
        var v = r.style.getPropertyValue(p); if (!v) return;
        var m;
        if (p === 'background-color' && isNearBlack(bc)) m = pseudo ? '#f1f0ec' : v;
        else if (p === 'color' && pseudo && isNearBlack(bc)) { var c = parse(v); m = c && lum(c) >= .5 ? '#0d0e11' : mapProp(p, v); }
        else m = mapProp(p, v);
        if (m !== v) { changes[p] = [v, r.style.getPropertyPriority(p)]; r.style.setProperty(p, m, changes[p][1]); }
      });
      if (Object.keys(changes).length) ruleRecs.set(r, changes);
    }
  }
  function procRules() { for (var i = 0; i < document.styleSheets.length; i++) { var ss = document.styleSheets[i], rules; if (ss.ownerNode && ss.ownerNode.id === 'pf-theme-css') continue; try { rules = ss.cssRules; } catch (e) { continue; } if (rules) walkRules(rules); } }
  function restoreRules() { ruleRecs.forEach(function (ch, r) { Object.keys(ch).forEach(function (p) { try { r.style.setProperty(p, ch[p][0], ch[p][1]); } catch (e) {} }); }); ruleRecs.clear(); seenRules = new WeakSet(); }

  var CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
  if (CP) ['fillStyle', 'strokeStyle'].forEach(function (k) {
    var d = Object.getOwnPropertyDescriptor(CP, k); if (!d || !d.set) return;
    Object.defineProperty(CP, k, { configurable: true, get: function () { return d.get.call(this); }, set: function (v) { if (dark && typeof v === 'string' && /^(rgba?\(\s*(15|0)\s*,\s*(16|0)\s*,\s*(19|0)\b|#(0f1013|ffffff|f6f5f2))/i.test(v)) { var c = parse(v); var m = c && mapColor(c, 'canvas'); if (m) v = fmt(m); } d.set.call(this, v); } });
  });
  var baseMap = mapColor;
  mapColor = function (c, role) {
    if (role !== 'canvas') return baseMap(c, role);
    var l = hsl(c)[2];
    if (neutral(c) && l < .2) return [255, 255, 255, Math.min(c[3] * 1.1, 1)];
    if (neutral(c) && l >= .7 && c[3] >= 1) return ladder(l, c);
    return null;
  };

  var ruleTimer = 0;
  function queueRules() { if (ruleTimer) return; ruleTimer = setTimeout(function () { ruleTimer = 0; if (dark) procRules(); }, 60); }
  var winT = 0, winN = 0;
  var mo = new MutationObserver(function (list) {
    STATS.batch++;
    var now = Date.now(); if (now - winT > 1000) { winT = now; winN = 0; }
    if (++winN > 240) { mo.disconnect(); setTimeout(function () { if (!dark) return; procTree(document.body); mo.observe(document.body || root, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'fill', 'stroke'] }); }, 800); return; }
    var adds = false;
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type === 'attributes') { if (proc(m.target)) procTree(m.target); }
      else { adds = true; for (var j = 0; j < m.addedNodes.length; j++) procTree(m.addedNodes[j]); }
    }
    if (adds) queueRules();
    mo.takeRecords();
  });

  var css = document.createElement('style'); css.id = 'pf-theme-css';
  css.textContent = 'html[data-pf-dark]{background:#0d0e11}::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}';
  (document.head || root).appendChild(css);

  function updateToggles() {
    var t = dark ? 'Switch to light mode' : 'Switch to dark mode';
    document.querySelectorAll('[data-pf-theme]').forEach(function (b) { if (b.getAttribute('title') !== t) { b.setAttribute('aria-label', t); b.setAttribute('title', t); } });
    document.querySelectorAll('[data-pf-icon]').forEach(function (i) { var v = (i.getAttribute('data-pf-icon') === 'sun') === dark ? 'block' : 'none'; if (i.style.display !== v) i.style.display = v; });
  }
  function apply(d) {
    dark = d;
    root.style.colorScheme = d ? 'dark' : 'light';
    if (d) root.setAttribute('data-pf-dark', ''); else root.removeAttribute('data-pf-dark');
    mo.disconnect();
    if (d) {
      procRules();
      if (document.body) procTree(document.body);
      proc(root);
      mo.observe(document.body || root, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'fill', 'stroke'] });
      if (document.body) mo.observe(root, { attributes: true, attributeFilter: ['style'] });
      setTimeout(queueRules, 400); setTimeout(queueRules, 1500);
    } else { restoreAll(); restoreRules(); }
    updateToggles();
  }

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-pf-theme]'); if (!b) return;
    e.preventDefault();
    var d = !dark;
    try { localStorage.setItem(KEY, d ? 'dark' : 'light'); } catch (er) {}
    var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || rm) { apply(d); return; }
    var r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var vt = document.startViewTransition(function () { apply(d); });
    vt.ready.then(function () { root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }); });
  });
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(e.newValue === 'dark'); });

  window.__pfTheme = { stats: function () { return STATS; }, apply: apply, isDark: function () { return dark; } };
  function boot() { apply(dark); }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
  if (dark) { var n = 0, iv = setInterval(function () { updateToggles(); if (++n > 20) clearInterval(iv); }, 150); }
  new MutationObserver(function () { updateToggles(); }).observe(document.body || root, { childList: true, subtree: true });
})();
