/* ============================================================
   BENIOS Education — shared behaviour (all pages)
   1. Reveal-on-scroll + animated stat counters
   2. Full-page section snap engine (wheel / touch / keyboard)
   Applies to any page whose <body> has class "snap-page".
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. Reveal on scroll + stat count-up ---------- */
  (function () {
    var els = document.querySelectorAll(".reveal, .stat-reveal");
    if (!els.length) return;
    document.body.classList.add("reveal-on");

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function countUp(scope) {
      scope.querySelectorAll("[data-count]").forEach(function (node) {
        var target = parseFloat(node.getAttribute("data-count"));
        var decimals = parseInt(node.getAttribute("data-decimals") || "0", 10);
        var suffix = node.getAttribute("data-suffix") || "";
        if (reduce) { node.textContent = target.toFixed(decimals) + suffix; return; }
        var dur = 1300, start = null;
        function tick(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          node.textContent = (target * eased).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in-view"); if (e.classList.contains("stat-reveal")) countUp(e); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in-view");
        if (en.target.classList.contains("stat-reveal")) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- 2. Section snap engine ---------- */
  (function () {
    if (!document.body.classList.contains("snap-page")) return;

    var sections = Array.prototype.slice.call(document.querySelectorAll(".snap"));
    var footer = document.querySelector(".site-footer");
    if (footer) sections.push(footer);
    if (sections.length < 2) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var EDGE = 4;
    var animating = false;
    var animTimer = null;
    var current = 0;

    function headerH() {
      var h = document.querySelector(".site-header");
      return h ? h.offsetHeight : 64;
    }
    function vh() {
      return window.innerHeight || document.documentElement.clientHeight || 800;
    }
    function snapTopOf(el) {
      return Math.round(window.scrollY + el.getBoundingClientRect().top - headerH());
    }
    function nearestIndex() {
      var best = 0, bestD = Infinity;
      for (var i = 0; i < sections.length; i++) {
        var d = Math.abs(snapTopOf(sections[i]) - window.scrollY);
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    }
    function goTo(i) {
      i = Math.max(0, Math.min(sections.length - 1, i));
      current = i;
      animating = true;
      window.scrollTo({ top: snapTopOf(sections[i]), behavior: reduce ? "auto" : "smooth" });
      clearTimeout(animTimer);
      animTimer = setTimeout(function () { animating = false; }, reduce ? 120 : 750);
    }
    // tolerance so near-full sections snap directly while genuinely tall
    // sections still scroll through their content first
    function slop() { return Math.max(EDGE, Math.round(vh() * 0.07)); }
    function moreWithin(dir) {
      var r = sections[current].getBoundingClientRect();
      if (dir > 0) return r.bottom > vh() + slop();
      return r.top < headerH() - slop();
    }

    // Wheel (trackpad / mouse)
    var wheelCooldown = false;
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return;
      if (animating) { e.preventDefault(); return; }
      var dir = e.deltaY > 0 ? 1 : (e.deltaY < 0 ? -1 : 0);
      if (!dir) return;
      current = nearestIndex();
      if (moreWithin(dir)) return;
      e.preventDefault();
      if (wheelCooldown) return;
      wheelCooldown = true;
      setTimeout(function () { wheelCooldown = false; }, 140);
      goTo(current + dir);
    }, { passive: false });

    // Touch (mobile)
    var startY = null;
    window.addEventListener("touchstart", function (e) {
      startY = e.touches[0].clientY;
      current = nearestIndex();
    }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (animating) { e.preventDefault(); return; }
      var r = sections[current].getBoundingClientRect();
      var fits = r.height <= vh() - headerH() + slop();
      if (fits) e.preventDefault();
    }, { passive: false });
    window.addEventListener("touchend", function (e) {
      if (startY === null || animating) { startY = null; return; }
      var endY = (e.changedTouches[0] || {}).clientY;
      if (endY == null) { startY = null; return; }
      var dy = startY - endY;
      startY = null;
      if (Math.abs(dy) < 28) return;
      var dir = dy > 0 ? 1 : -1;
      current = nearestIndex();
      if (moreWithin(dir)) return;
      goTo(current + dir);
    }, { passive: true });

    // Keyboard
    window.addEventListener("keydown", function (e) {
      if (animating) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      var down = e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ";
      var up = e.key === "ArrowUp" || e.key === "PageUp";
      if (!down && !up) return;
      current = nearestIndex();
      var dir = down ? 1 : -1;
      if (moreWithin(dir)) return;
      e.preventDefault();
      goTo(current + dir);
    });

    // keep index synced after native/inertial scrolling settles
    var settle;
    window.addEventListener("scroll", function () {
      if (animating) return;
      clearTimeout(settle);
      settle = setTimeout(function () { current = nearestIndex(); }, 90);
    }, { passive: true });

    current = nearestIndex();
  })();
})();
