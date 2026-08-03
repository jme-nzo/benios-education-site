/* ============================================================
   BENIOS Education — shared behaviour (all pages)
   1. Reveal-on-scroll + animated stat counters
   2. Gentle section snapping (settle-based, 2/3 threshold)
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
    }, { threshold: 0.3, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- 2. Gentle section snapping ----------------------------
     Design goals (per the style guide):
     - Every section stays fully, natively scrollable (we never hijack
       the wheel/touch, so it can NEVER skip two sections at once).
     - After the user stops scrolling, we ease to a section edge — but
       only commit to the NEXT section once they've scrolled past ~2/3
       of the current one, so there's room to nudge without snapping.
     - Sections taller than the viewport scroll through freely; snapping
       only engages near their top/bottom edges, never mid-content.
  ------------------------------------------------------------------- */
  (function () {
    if (!document.body.classList.contains("snap-page")) return;

    var sections = Array.prototype.slice.call(document.querySelectorAll(".snap"));
    var footer = document.querySelector(".site-footer");
    if (footer) sections.push(footer);
    var n = sections.length;
    if (n < 2) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ADVANCE = 0.66;   // must pass 2/3 of a section to snap to the next
    var animating = false, animTimer = null, scrollTimer = null;
    var restY = window.scrollY;   // last committed position (for direction)

    function headerH() { var h = document.querySelector(".site-header"); return h ? h.offsetHeight : 64; }
    function vh() { return window.innerHeight || document.documentElement.clientHeight || 800; }
    function snapTop(i) { return Math.round(window.scrollY + sections[i].getBoundingClientRect().top - headerH()); }
    function clamp(i) { return Math.max(0, Math.min(n - 1, i)); }

    function goTo(i) {
      i = clamp(i);
      var top = Math.max(0, snapTop(i));
      restY = top;
      if (Math.abs(top - window.scrollY) < 2) return;
      animating = true;
      window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
      clearTimeout(animTimer);
      animTimer = setTimeout(function () { animating = false; }, reduce ? 100 : 700);
    }

    // Index of the section whose top is at or just above the current scroll
    function anchorIndex(y) {
      var idx = 0;
      for (var i = 0; i < n; i++) { if (snapTop(i) <= y + 8) idx = i; else break; }
      return idx;
    }

    function settle() {
      if (animating) return;
      var y = window.scrollY;
      if (y < 4) { restY = 0; return; }             // resting at very top
      var i = anchorIndex(y);
      if (i >= n - 1) { restY = y; return; }         // last section / footer: free

      var topI = snapTop(i), topNext = snapTop(i + 1);
      var gap = topNext - topI;                       // laid-out height of section i
      var frame = vh() - headerH();
      var progressed = y - topI;
      var goingDown = (y - restY) >= 0;
      var tall = gap > frame + Math.round(vh() * 0.07);

      if (tall) {
        // Only snap near the edges; leave the middle to natural scrolling.
        if (topNext - y <= frame * 0.34) { goTo(i + 1); return; }
        if (progressed <= frame * 0.16) { goTo(i); return; }
        restY = y;                                    // reading the middle
      } else {
        if (goingDown) { progressed >= gap * ADVANCE ? goTo(i + 1) : goTo(i); }
        else           { progressed <= gap * (1 - ADVANCE) ? goTo(i) : goTo(i + 1); }
      }
    }

    window.addEventListener("scroll", function () {
      if (animating) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(settle, 150);          // snap after scrolling stops
    }, { passive: true });

    // Keyboard: one section per press
    window.addEventListener("keydown", function (e) {
      if (animating) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      var down = e.key === "ArrowDown" || e.key === "PageDown";
      var up = e.key === "ArrowUp" || e.key === "PageUp";
      if (!down && !up) return;
      e.preventDefault();
      var i = anchorIndex(window.scrollY);
      if (down) goTo(i + 1);
      else goTo((window.scrollY - snapTop(i) < 8) ? i - 1 : i);
    });
  })();
})();
