/* ==========================================================================
   Tony Kosoko Physiotherapy — site scripts
   No dependencies. Everything degrades gracefully without JS.
   ========================================================================== */
(function(){
  'use strict';

  /* ---- header: solid pill on scroll, hide on scroll down, reveal on scroll up ---- */
  var header = document.getElementById('siteHeader');
  if (header && !header.classList.contains('always-solid')) {
    var lastY = Math.max(window.scrollY, 0);
    var SOLID_AT = 40, DELTA = 5;
    var updateHeader = function(){
      var y = Math.max(window.scrollY, 0);
      header.classList.toggle('is-solid', y > SOLID_AT);
      if (y <= SOLID_AT) header.classList.remove('is-hidden');
      else if (y > lastY + DELTA) header.classList.add('is-hidden');
      else if (y < lastY - DELTA) header.classList.remove('is-hidden');
      lastY = y;
    };
    window.addEventListener('scroll', updateHeader, {passive:true});
    updateHeader();
  } else if (header) {
    // inner pages: pill is always on, but still tuck away when scrolling down
    var lastY2 = Math.max(window.scrollY, 0);
    window.addEventListener('scroll', function(){
      var y = Math.max(window.scrollY, 0);
      if (y <= 60) header.classList.remove('is-hidden');
      else if (y > lastY2 + 5) header.classList.add('is-hidden');
      else if (y < lastY2 - 5) header.classList.remove('is-hidden');
      lastY2 = y;
    }, {passive:true});
  }

  /* ---- mobile drawer ---- */
  var toggle = document.getElementById('navToggle');
  var drawer = document.getElementById('mobileDrawer');
  var overlay = document.getElementById('drawerOverlay');
  var closeBtn = document.getElementById('drawerClose');

  if (toggle && drawer && overlay && closeBtn) {
    var lastFocus = null;
    var focusables = function(){ return drawer.querySelectorAll('a[href],button:not([disabled])'); };
    var onKey = function(e){
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    var openDrawer = function(){
      lastFocus = document.activeElement;
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      drawer.setAttribute('aria-hidden','false');
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-label','Close menu');
      document.body.classList.add('no-scroll');
      document.addEventListener('keydown', onKey);
      var f = focusables(); if (f.length) f[0].focus();
    };
    var closeDrawer = function(returnFocus){
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      drawer.setAttribute('aria-hidden','true');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Open menu');
      document.body.classList.remove('no-scroll');
      document.removeEventListener('keydown', onKey);
      if (returnFocus !== false && lastFocus && lastFocus.focus) lastFocus.focus();
    };
    toggle.addEventListener('click', function(){
      drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
    });
    closeBtn.addEventListener('click', function(){ closeDrawer(); });
    overlay.addEventListener('click', function(){ closeDrawer(); });
    Array.prototype.forEach.call(drawer.querySelectorAll('a[href]'), function(a){
      a.addEventListener('click', function(){ closeDrawer(false); });
    });
    window.addEventListener('resize', function(){
      if (window.innerWidth > 920 && drawer.classList.contains('is-open')) closeDrawer(false);
    });
  }

  /* ---- services dropdown: keyboard + touch support (hover handled in CSS) ---- */
  Array.prototype.forEach.call(document.querySelectorAll('.has-sub > button'), function(btn){
    var parent = btn.parentNode;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var open = parent.getAttribute('aria-expanded') === 'true';
      parent.setAttribute('aria-expanded', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    document.addEventListener('click', function(e){
      if (!parent.contains(e.target)) {
        parent.setAttribute('aria-expanded','false');
        btn.setAttribute('aria-expanded','false');
      }
    });
  });

  /* ---- hero booking bar -> book page with the choice carried over ---- */
  var bookingBar = document.getElementById('bookingBar');
  if (bookingBar) {
    bookingBar.addEventListener('submit', function(e){
      e.preventDefault();
      var svc = document.getElementById('svc');
      var loc = document.getElementById('loc');
      var q = [];
      if (svc && svc.value) q.push('service=' + encodeURIComponent(svc.value));
      if (loc && loc.value) q.push('location=' + encodeURIComponent(loc.value));
      window.location.href = 'book.html' + (q.length ? '?' + q.join('&') : '');
    });
  }

  /* ---- book page: prefill from the query string ---- */
  var bookForm = document.getElementById('bookForm');
  if (bookForm) {
    var params = new URLSearchParams(window.location.search);
    var preset = function(id, value){
      if (!value) return;
      var el = document.getElementById(id);
      if (!el) return;
      for (var i = 0; i < el.options.length; i++) {
        if (el.options[i].value === value) { el.selectedIndex = i; return; }
      }
    };
    preset('f-service', params.get('service'));
    preset('f-location', params.get('location'));

    /* client-side validation, so nothing is lost to a silent failure */
    bookForm.addEventListener('submit', function(e){
      var ok = true;
      Array.prototype.forEach.call(bookForm.querySelectorAll('[required]'), function(input){
        var field = input.closest('.field') || input.closest('.check');
        var valid = input.type === 'checkbox' ? input.checked : String(input.value).trim() !== '';
        if (valid && input.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
        if (field) field.classList.toggle('has-error', !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) { e.preventDefault(); return; }
      /* No back end is wired up yet, so show a confirmation instead of losing the enquiry.
         TODO [CONFIRM]: point action= at Formspree/Basin/Netlify, then delete this block. */
      e.preventDefault();
      var status = document.getElementById('formStatus');
      if (status) {
        status.classList.add('is-visible');
        status.setAttribute('role','status');
        status.scrollIntoView({behavior:'smooth', block:'center'});
      }
    });
    Array.prototype.forEach.call(bookForm.querySelectorAll('[required]'), function(input){
      input.addEventListener('input', function(){
        var field = input.closest('.field') || input.closest('.check');
        if (field) field.classList.remove('has-error');
      });
    });
  }

  /* ---- click-to-load maps (nothing is requested from Google until asked) ---- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-map]'), function(box){
    var btn = box.querySelector('.map__load');
    if (!btn) return;
    btn.addEventListener('click', function(){
      var iframe = document.createElement('iframe');
      iframe.src = box.getAttribute('data-map');
      iframe.title = box.getAttribute('data-map-title') || 'Map';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.setAttribute('allowfullscreen','');
      box.innerHTML = '';
      box.appendChild(iframe);
    });
  });

  /* ---- reveal on scroll ---- */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, {threshold:.14, rootMargin:'0px 0px -8% 0px'});
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function(el){ io.observe(el); });
  }

  /* ---- footer year ---- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function(el){
    el.textContent = new Date().getFullYear();
  });
})();
