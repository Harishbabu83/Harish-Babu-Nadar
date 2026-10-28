// Shimmer placeholder for images and iframes until they finish loading.
(function () {
  if (window.__pfSkel) return; window.__pfSkel = true;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function grad() {
    return document.documentElement.hasAttribute('data-pf-dark')
      ? 'linear-gradient(100deg,#1a1b20 30%,#2a2b31 50%,#1a1b20 70%)'
      : 'linear-gradient(100deg,#ebebef 30%,#f7f7f9 50%,#ebebef 70%)';
  }
  function target(el) {
    if (el.tagName === 'IFRAME') return el;
    if (el.offsetHeight >= 8) return el;
    var p = el.parentElement;
    return p && p.offsetHeight >= 40 ? p : null;
  }
  function apply(el) {
    if (el.__pfSkel) return;
    if (el.tagName === 'IMG') {
      if (el.complete && el.naturalWidth) return;
      var src = el.getAttribute('src') || '';
      if (/\.svg(\?|$)/i.test(src) || /^data:/.test(src)) return;
      var w = el.getAttribute('width');
      if (w && +w < 40) return;
    }
    var t = target(el);
    if (!t || t.__pfSkelOn) return;
    el.__pfSkel = true; t.__pfSkelOn = true;
    var prev = { bi: t.style.backgroundImage, bs: t.style.backgroundSize };
    t.style.backgroundImage = grad();
    t.style.backgroundSize = '300% 100%';
    var anim = reduce || !t.animate ? null : t.animate([{ backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0' }], { duration: 1400, iterations: Infinity, easing: 'ease-in-out' });
    function done() {
      el.removeEventListener('load', done); el.removeEventListener('error', done);
      if (anim) anim.cancel();
      t.style.backgroundImage = prev.bi; t.style.backgroundSize = prev.bs; t.__pfSkelOn = false;
    }
    el.addEventListener('load', done); el.addEventListener('error', done);
    if (el.tagName === 'IMG' && el.complete && el.naturalWidth) done();
  }
  var queued = false;
  function scan() {
    queued = false;
    var list = document.querySelectorAll('img, iframe');
    for (var i = 0; i < list.length; i++) apply(list[i]);
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(scan); } }
  function boot() {
    scan(); setTimeout(scan, 300); setTimeout(scan, 1200);
    new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
