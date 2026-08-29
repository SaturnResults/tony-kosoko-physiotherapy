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

    var status = document.getElementById('formStatus');
    var errorBox = document.getElementById('formError');
    var submitBtn = bookForm.querySelector('[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.textContent : '';

    var show = function(box){
      [status, errorBox].forEach(function(b){ if (b) b.classList.remove('is-visible'); });
      if (!box) return;
      box.classList.add('is-visible');
      box.setAttribute('role', 'status');
      box.scrollIntoView({behavior:'smooth', block:'center'});
    };

    var validate = function(){
      var ok = true;
      Array.prototype.forEach.call(bookForm.querySelectorAll('[required]'), function(input){
        var field = input.closest('.field') || input.closest('.check');
        var valid = input.type === 'checkbox' ? input.checked : String(input.value).trim() !== '';
        if (valid && input.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
        if (field) field.classList.toggle('has-error', !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      return ok;
    };

    bookForm.addEventListener('submit', function(e){
      e.preventDefault();
      if (!validate()) return;

      /* Spam trap. A person cannot see this field, so if it is filled in the
         submission is a bot. Behave exactly as if it worked and send nothing. */
      var trap = bookForm.querySelector('[name="_gotcha"]');
      if (trap && trap.value) { show(status); bookForm.reset(); return; }

      var endpoint = bookForm.getAttribute('action');
      /* Never tell someone their enquiry has been sent when it has not. If no
         endpoint is configured, say so and give them a way to reach Tony. */
      if (!endpoint || endpoint === '#') { show(errorBox); return; }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
      show(null);

      fetch(endpoint, {
        method: 'POST',
        body: new FormData(bookForm),
        headers: {'Accept': 'application/json'}
      }).then(function(res){
        if (!res.ok) throw new Error(res.status);
        bookForm.reset();
        show(status);
      }).catch(function(){
        show(errorBox);
      }).then(function(){
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
      });
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

/* ==========================================================================
   Booking bar dropdowns
   The native <select> stays in the DOM and keeps its name and value, so the
   bar still submits correctly and still works with JavaScript off. All this
   does is hide it and build a styled listbox alongside.

   Focus stays on the trigger the whole time and the active row is announced
   through aria-activedescendant, which is the standard listbox pattern and
   avoids moving focus into the menu.
   ========================================================================== */
(function () {
  var selects = document.querySelectorAll('.booking select');
  if (!selects.length) return;

  var CHEV = '<svg class="bk-chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M2 4.5l4 4 4-4"/></svg>';

  var openOne = null;
  function closeOpen() { if (openOne) openOne(); }

  Array.prototype.forEach.call(selects, function (select, n) {
    var host = select.parentNode;
    if (!host) return;
    host.classList.add('bk-sel');

    var base = 'bk' + n;
    var label = host.querySelector('label');

    /* Placeholder is the option with an empty value. It heads the trigger but
       is deliberately not a row: there is nothing to go back to. */
    var placeholder = '';
    var rows = [];
    Array.prototype.forEach.call(select.options, function (o) {
      if (o.value === '') placeholder = o.text; else rows.push(o);
    });
    if (!rows.length) return;

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'bk-trigger';
    trigger.id = base + 'T';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', base + 'M');
    trigger.innerHTML = '<span class="bk-value"></span>' + CHEV;
    /* button is a labelable element, so the existing label can point at it.
       The select is display:none and therefore out of the accessibility tree. */
    if (label) label.setAttribute('for', trigger.id);

    var menu = document.createElement('div');
    menu.className = 'bk-menu';
    menu.id = base + 'M';
    menu.setAttribute('role', 'listbox');
    if (label) menu.setAttribute('aria-label', label.textContent);

    var value = trigger.firstChild;
    var active = -1;

    rows.forEach(function (o, i) {
      var row = document.createElement('div');
      row.className = 'bk-opt';
      row.id = base + 'o' + i;
      row.setAttribute('role', 'option');
      row.innerHTML = '<span class="bk-radio" aria-hidden="true"></span><span></span>';
      row.lastChild.textContent = o.text;
      row.addEventListener('click', function (e) {
        e.stopPropagation();
        choose(i);
        close();
        trigger.focus();
      });
      row.addEventListener('mousemove', function () {
        menu.classList.remove('is-kbd');
        setActive(i, false);
      });
      menu.appendChild(row);
    });

    function render() {
      var chosen = -1;
      rows.forEach(function (o, i) {
        var on = o.value === select.value;
        if (on) chosen = i;
        menu.children[i].setAttribute('aria-selected', on ? 'true' : 'false');
      });
      value.textContent = chosen < 0 ? placeholder : rows[chosen].text;
      trigger.classList.toggle('is-placeholder', chosen < 0);
      return chosen;
    }

    function choose(i) {
      select.value = rows[i].value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      render();
    }

    function setActive(i, scroll) {
      if (active > -1 && menu.children[active]) menu.children[active].classList.remove('is-active');
      active = i;
      if (i < 0) { trigger.removeAttribute('aria-activedescendant'); return; }
      var row = menu.children[i];
      row.classList.add('is-active');
      trigger.setAttribute('aria-activedescendant', row.id);
      if (scroll !== false && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
    }

    function open() {
      if (openOne) closeOpen();
      /* Opens upwards by default because the home hero clips its overflow and
         the bar sits low in it. Only drop down when there is genuinely room. */
      var box = trigger.getBoundingClientRect();
      var needed = Math.min(rows.length * 48 + 24, 320);
      menu.classList.toggle('bk-menu--down',
        box.bottom + needed + 24 <= window.innerHeight && box.top < needed + 24);
      menu.classList.add('is-open');
      menu.classList.remove('is-kbd');
      trigger.setAttribute('aria-expanded', 'true');
      openOne = close;
      var chosen = render();
      setActive(chosen < 0 ? 0 : chosen);
    }

    function close() {
      menu.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      setActive(-1);
      if (openOne === close) openOne = null;
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.classList.contains('is-open')) close(); else open();
    });

    trigger.addEventListener('keydown', function (e) {
      var isOpen = menu.classList.contains('is-open');
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) { open(); menu.classList.add('is-kbd'); return; }
        menu.classList.add('is-kbd');
        var next = active + (k === 'ArrowDown' ? 1 : -1);
        setActive(next < 0 ? rows.length - 1 : next >= rows.length ? 0 : next);
      } else if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
        e.preventDefault();
        if (!isOpen) open();
        else if (active > -1) { choose(active); close(); }
      } else if (k === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      } else if (k === 'Home' && isOpen) { e.preventDefault(); menu.classList.add('is-kbd'); setActive(0); }
      else if (k === 'End' && isOpen) { e.preventDefault(); menu.classList.add('is-kbd'); setActive(rows.length - 1); }
      else if (k === 'Tab' && isOpen) { close(); }
    });

    host.appendChild(trigger);
    host.appendChild(menu);
    render();
  });

  document.addEventListener('click', closeOpen);

  /* Close on a real resize, but only when the WIDTH changes. Mobile browsers
     fire resize every time the address bar collapses or expands on scroll, and
     closing the menu on that would make it snap shut under the user's thumb. */
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    closeOpen();
  });
})();

/* ==========================================================================
   Testimonials: show three, reveal the rest on request
   All six are in the HTML. This collapses them and adds the button, so if the
   script never runs the visitor sees six reviews rather than three and a
   button that does nothing.
   ========================================================================== */
(function () {
  var grid = document.getElementById('tgrid');
  if (!grid) return;
  var more = grid.querySelectorAll('.tcard--more');
  if (!more.length) return;

  grid.classList.add('is-collapsed');

  var wrap = document.createElement('div');
  wrap.className = 'tmore';
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--outline';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'tgrid');
  btn.textContent = 'Read more reviews';

  btn.addEventListener('click', function () {
    var open = !grid.classList.toggle('is-collapsed');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Show fewer reviews' : 'Read more reviews';
  });

  wrap.appendChild(btn);
  grid.parentNode.insertBefore(wrap, grid.nextSibling);
})();
