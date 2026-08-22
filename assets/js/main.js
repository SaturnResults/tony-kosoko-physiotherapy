/* ==========================================================================
   Tony Kosoko Physiotherapy — site scripts
   No dependencies. Everything degrades gracefully without JS.
   ========================================================================== */
(function(){
  'use strict';

  /* ---- reveal on scroll ---- */
  /* This runs first on purpose. `.js .reveal` starts at opacity 0, so if any
     code below were to throw before the observer was attached, every section on
     the page would stay invisible. Nothing here depends on the rest of the file. */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, {threshold:.14, rootMargin:'0px 0px -8% 0px'});
    var vh = window.innerHeight || document.documentElement.clientHeight;
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function(el){
      /* Anything already on screen at load is shown at once, by dropping the
         class that hides it. Fading it in means half a second of empty page,
         and on a phone the hero is short enough that the section below it is
         usually already in view, so the first thing you see is a blank block. */
      if (el.getBoundingClientRect().top < vh) { el.classList.remove('reveal'); return; }
      io.observe(el);
    });

    /* Belt and braces. Every section on this site starts at opacity 0 and is
       revealed by the observer above, so if the observer is throttled or
       blocked the page renders blank. If anything is still hidden well inside
       the viewport a moment after load, assume it is not coming and drop the
       class that hides them, which shows the lot. */
    window.setTimeout(function(){
      var vh = window.innerHeight;
      var stuck = Array.prototype.filter.call(
        document.querySelectorAll('.reveal:not(.in)'),
        function(el){ var r = el.getBoundingClientRect(); return r.top < vh * 0.86 && r.bottom > 0; }
      );
      if (stuck.length) document.documentElement.classList.remove('js');
    }, 1500);
  }

  /* ---- header ---- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var hero = document.querySelector('.hero') || document.querySelector('.page-hero');

    /* While the hero is on screen the header belongs to it: transparent, no
       pill, and always there. Past the hero it becomes the floating white pill,
       and from then on it only appears when you scroll back up. */
    var heroEdge = function(){
      return hero ? Math.max(hero.offsetHeight - 96, 120) : 120;
    };

    /* Direction is accumulated rather than compared between consecutive events.
       A trackpad fires a stream of scroll events a few pixels apart, so a
       per-event threshold is never crossed on a smooth scroll and the header
       would only come back if you flicked at it. */
    var lastY = Math.max(window.scrollY, 0);
    var up = 0, down = 0;
    var UP_TO_SHOW = 6, DOWN_TO_HIDE = 10;

    /* The home page's hero fills the screen; the chat launcher is hidden over it
       on a phone so it does not sit on top of the booking bar. */
    var homeHero = !!document.querySelector('.hero');
    var floating = null;

    var updateHeader = function(){
      var y = Math.max(window.scrollY, 0);
      if (y < lastY) { up += lastY - y; down = 0; }
      else if (y > lastY) { down += y - lastY; up = 0; }
      lastY = y;

      var pastHero = y > heroEdge();

      if (pastHero !== floating) {
        /* Crossing the boundary the header changes from docked to floating.
           Snap straight to the new state with the transition off: otherwise it
           lands at the top of the viewport at full opacity and then fades out,
           which reads as the header flashing into view at the end of the hero. */
        floating = pastHero;
        header.classList.add('no-anim');
        header.classList.toggle('is-solid', pastHero);
        header.classList.toggle('is-hidden', pastHero);
        if (homeHero) document.documentElement.classList.toggle('in-home-hero', !pastHero);
        void header.offsetWidth;
        header.classList.remove('no-anim');
        up = down = 0;
        return;
      }

      if (!pastHero) { header.classList.remove('is-hidden'); return; }
      if (up > UP_TO_SHOW) header.classList.remove('is-hidden');
      else if (down > DOWN_TO_HIDE) header.classList.add('is-hidden');
    };
    window.addEventListener('scroll', updateHeader, {passive:true});
    window.addEventListener('resize', updateHeader);
    updateHeader();
  }

  /* ---- mobile drawer ---- */
  var toggle = document.getElementById('navToggle');
  var drawer = document.getElementById('mobileDrawer');
  var overlay = document.getElementById('drawerOverlay');
  var closeBtn = document.getElementById('drawerClose');

  if (toggle && drawer && overlay && closeBtn) {
    var lastFocus = null;
    var focusables = function(){
      // a collapsed services panel is still in the DOM, so skip anything
      // that is not actually on screen or the tab order runs into nothing
      return Array.prototype.filter.call(
        drawer.querySelectorAll('a[href],button:not([disabled])'),
        function(el){ return el.offsetParent !== null; }
      );
    };
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

  /* ---- drawer: services disclosure ---- */
  var accs = document.querySelectorAll('.drawer__acc');
  Array.prototype.forEach.call(accs, function(btn){
    btn.addEventListener('click', function(){
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
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
      var target = bookingBar.getAttribute('action') || 'book/';
      window.location.href = target + (q.length ? '?' + q.join('&') : '');
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

  /* ---- footer year ---- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function(el){
    el.textContent = new Date().getFullYear();
  });
})();
