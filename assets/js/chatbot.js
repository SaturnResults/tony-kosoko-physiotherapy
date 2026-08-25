/* ==========================================================================
   Tony Kosoko Physiotherapy — chat widget
   No dependencies. Works with no back end at all (keyword mode); when
   TK_CHAT_API is set it upgrades to AI replies and keeps the keyword table
   as the fallback.

   SAFETY: this is a logistics assistant, not a clinician. Red flag symptoms
   are caught locally, BEFORE anything is sent anywhere, and always route the
   person to urgent care rather than to a booking.
   ========================================================================== */
(function () {
  'use strict';

  var PHONE       = '07966 264812';
  var PHONE_HREF  = 'tel:+447966264812';

  /* Set this to the deployed endpoint to turn on AI replies, transcripts and
     counters, e.g. <script>window.TK_CHAT_API='https://tk-chat-api.vercel.app'</script>
     Left empty, the widget still works from the keyword table below. */
  var API = (window.TK_CHAT_API || '').replace(/\/$/, '');

  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* ── Red flags ────────────────────────────────────────────────────────────
     Checked first, on every message. A false positive only tells someone to
     ring 111, which is safe; a false negative is not. Cauda equina signs are
     the priority: they are the classic physiotherapy emergency.            */
  var RED_FLAGS = [
    /(numb|tingl|pins and needles)[^.]{0,30}(saddle|groin|genital|between my legs|inner thigh|buttock)/i,
    /(saddle|groin|genital)[^.]{0,30}(numb|anaesthesia|anesthesia|no feeling)/i,
    /(lost|losing|no|cannot|can'?t|unable to)[^.]{0,25}(control)[^.]{0,25}(bladder|bowel|wee|urine|poo)/i,
    /(bladder|bowel|urine|incontinen)[^.]{0,30}(control|problem|issue|accident|leak)/i,
    /(cannot|can'?t|unable to)[^.]{0,15}(wee|urinate|pee|empty my bladder|pass urine)/i,
    /(wet|soiled) myself/i,
    /both legs[^.]{0,25}(numb|weak|giving way|collapse|not working)/i,
    /(chest pain|chest tightness|pain in my chest|crushing chest)/i,
    /(short of breath|shortness of breath|can'?t breathe|cannot breathe|struggling to breathe)/i,
    /(face|mouth)[^.]{0,15}(droop|drooping)/i,
    /(slurred|slurring)[^.]{0,15}speech/i,
    /(sudden)[^.]{0,25}(weakness|numbness)[^.]{0,25}(one side|down one side)/i,
    /(cauda equina)/i,
    /(fever|temperature)[^.]{0,30}(back pain|spine|spinal)/i,
    /(back pain)[^.]{0,30}(fever|night sweats|unexplained weight loss|losing weight)/i
  ];

  var RED_FLAG_REPLY = {
    alert: true,
    text: '<strong>Please seek urgent medical help.</strong><br><br>' +
          'What you have described can be a sign of something that needs assessing today, and it is not something I can help with here. ' +
          'Please call <strong>111</strong>, contact your GP urgently, or go to <strong>A&amp;E</strong>. In an emergency call <strong>999</strong>.<br><br>' +
          'Please do not wait for a physiotherapy appointment.'
  };

  function isRedFlag(text) {
    for (var i = 0; i < RED_FLAGS.length; i++) if (RED_FLAGS[i].test(text)) return true;
    return false;
  }

  /* ── Clinical questions the bot must not answer ─────────────────────────── */
  var CLINICAL = new RegExp([
    "what(?:'?s| is| are)?[^.?]{0,12}wrong with",
    "what do i have", "what could it be", "what might it be",
    "why (?:does|is) my [a-z ]{0,22}(?:hurt|ache|painful|sore|swollen)",
    "is it serious", "is this serious", "should i (?:be )?worr",
    "do i need (?:an? )?(?:x-?ray|scan|mri|surgery|operation|referral to)",
    "diagnos",
    "is it (?:a |an )?(?:tear|fracture|broken|trapped nerve|slipped disc|arthritis|sprain|strain|hernia)",
    "should i (?:take|stop|rest|ice|heat)\\b",
    "should i see (?:a |my )?(?:doctor|gp|specialist|consultant|surgeon)",
    "(?:what|which) (?:painkiller|medication|tablet|drug|anti-?inflammator)",
    "is my (?:scan|mri|x-?ray|result|blood test)",
    "treat (?:myself|my own|it myself)",
    "(?:exercise|stretch)e?s?[^.?]{0,22}(?:should i do|for my|to fix|to help)",
    "how do i (?:fix|treat|cure|heal)"
  ].join("|"), "i");

  /* ── Answers ─────────────────────────────────────────────────────────────
     Every figure below is taken from the live pages, so the bot cannot
     contradict the site.                                                    */
  // pages live at /<slug>/, so links need a prefix that depends on how deep
  // the current page is. Each page sets window.TK_BASE before this loads.
  var BASE = (typeof window.TK_BASE === 'string') ? window.TK_BASE : '';

  var A = {
    book:   { label: 'Book an initial assessment', href: BASE + 'book/' },
    fees:   { label: 'See all fees',               href: BASE + 'fees/' },
    where:  { label: 'Locations and directions',   href: BASE + 'locations/' },
    expect: { label: 'What to expect',             href: BASE + 'what-to-expect/' },
    call:   { label: 'Call ' + PHONE,              href: PHONE_HREF }
  };

  var INTENTS = [
    { keys: ['how much', 'cost', 'price', 'fee', 'charge', 'pricing', 'expensive', 'rates'],
      reply: { text: 'The initial assessment is <strong>&pound;145</strong> and lasts 45 to 60 minutes.<br><br>Follow-ups are <strong>&pound;97</strong> for 30 minutes, <strong>&pound;125</strong> for 45 minutes and <strong>&pound;160</strong> for 60 minutes. Home visits are priced on application.',
              acts: ['fees', 'book'] } },

    { keys: ['insurance', 'insurer', 'bupa', 'axa', 'vitality', 'aviva', 'covered', 'claim'],
      reply: { text: '<strong>Bupa UK</strong> is settled directly, so you will not need to pay and claim back. Please have your membership number and authorisation code ready, and do check whether your policy carries an excess, as any shortfall is the patient&rsquo;s responsibility.<br><br>For all other insurers Tony provides a receipt for you to claim back.',
              acts: ['fees', 'book'] } },

    { keys: ['where', 'location', 'address', 'clinic', 'find you', 'based', 'directions', 'parking', 'tube', 'station', 'get there'],
      reply: { text: 'There are two, both in W10.<br><br><strong>The Portobello Clinic</strong>, 12 Raddington Road, W10 5TG, for physiotherapy. Nearest tube Ladbroke Grove or Latimer Road.<br><br><strong>Westway Sports &amp; Fitness</strong>, 1 Crowthorne Road, W10 6RP, for strength and conditioning. Nearest tube Latimer Road.',
              acts: ['where', 'book'] } },

    { keys: ['open', 'hours', 'times', 'when can i', 'availability', 'available', 'weekend', 'saturday', 'evening', 'what days'],
      reply: { text: '<strong>The Portobello Clinic</strong><br>Monday and Wednesday, 8.30am to 5pm. Thursday, 2pm to 5pm.<br><br><strong>Westway</strong>, for strength and conditioning<br>Tuesday and Friday, 7am to 1pm. Saturday, 8am to 11am.',
              acts: ['book', 'call'] } },

    { keys: ['book', 'appointment', 'booking', 'make an appointment', 'see tony', 'arrange', 'schedule'],
      reply: { text: 'There is no online payment or complicated system. Send a short enquiry and Tony will come back to you personally, usually within one working day, to arrange a time. If it is urgent, call him.',
              acts: ['book', 'call'] } },

    { keys: ['cancel', 'cancellation', 'reschedule', 'change my appointment', 'miss', 'late'],
      reply: { text: 'There is a <strong>24 hour cancellation policy</strong>. With more than 24 hours&rsquo; notice Tony can normally fill the slot, so you will not be charged. Less than 24 hours&rsquo; notice, or a missed appointment, is charged at the full fee.',
              acts: ['call'] } },

    { keys: ['first appointment', 'what happens', 'what to expect', 'what should i wear', 'what do i wear', 'what to bring', 'bring', 'prepare', 'first visit', 'first session'],
      reply: { text: 'Arrive 5 to 10 minutes early. Bring clothing that lets Tony assess your movement, such as shorts or gym wear, plus any scans or letters about your problem.<br><br>The session starts with a proper conversation and history, then a physical examination, then treatment and exercises based on the diagnosis.',
              acts: ['expect', 'book'] } },

    { keys: ['how long', 'duration', 'length', 'how many minutes'],
      reply: { text: 'Initial appointments are 45 to 60 minutes. Follow-ups are 30, 45 or 60 minutes, depending on what you need. Strength and conditioning sessions are always 60 minutes.',
              acts: ['fees', 'book'] } },

    { keys: ['physio', 'musculoskeletal', 'msk', 'back', 'neck', 'shoulder', 'spine', 'sciatica', 'knee', 'hip', 'injury', 'sports injury', 'dance'],
      reply: { text: 'Musculoskeletal physiotherapy is Tony&rsquo;s main work, with a special interest in the spine, shoulders, hypermobility, and dance and sports injuries.<br><br>Every course of treatment starts with an initial assessment so the diagnosis is right before any treatment begins.',
              acts: ['book', 'expect'] } },

    { keys: ['strength', 'conditioning', 's&c', 'gym', 'training', 'weights', 'lifting', 'personal training'],
      reply: { text: 'Physiotherapy-led strength and conditioning runs at Westway Sports &amp; Fitness. Sessions are 60 minutes, one to one, or semi-private for two people.<br><br>They suit recovery from injury, preparing for or rebuilding after surgery, and returning to sport.',
              acts: ['book', 'where'] } },

    { keys: ['men', 'mens health', 'pelvic', 'prostat', 'cpp', 'chronic pelvic'],
      reply: { text: 'Tony offers specialist men&rsquo;s health physiotherapy for chronic pelvic pain. He trained with leading experts in the field after experiencing the condition himself, so appointments are private, unhurried and completely confidential.<br><br>If you would rather talk it through before booking, call him directly.',
              acts: ['book', 'call'] } },

    { keys: ['hypermobil', 'ehlers', 'eds'],
      reply: { text: 'Hypermobility and Ehlers-Danlos are among Tony&rsquo;s special interests, alongside spinal and shoulder problems. An initial assessment is the place to start.',
              acts: ['book'] } },

    { keys: ['who is tony', 'about tony', 'qualified', 'experience', 'trained', 'credentials', 'registered', 'hcpc', 'csp', 'macp', 'how long has'],
      reply: { text: 'Tony has been a physiotherapist for more than 30 years. He trained at King&rsquo;s College London, spent six years in the NHS, and founded The Practice Centre in W11, which he ran for 23 years.<br><br>He is HCPC registered, a member of the Chartered Society of Physiotherapy, and recognised by the MACP as an Advanced Practice Physiotherapist. He began his working life as a professional dancer.',
              acts: ['book'] } },

    { keys: ['home visit', 'come to me', 'my house', 'visit me'],
      reply: { text: 'Home visits are possible and are priced on application, based on the appointment time plus travel time. Call Tony to arrange one.',
              acts: ['call'] } },

    { keys: ['gp', 'referral', 'refer', 'do i need'],
      reply: { text: 'You do not need a GP referral to see Tony privately. If your insurer requires one, check with them first. If Tony thinks you need a specialist opinion, he will refer you on.',
              acts: ['book'] } },

    { keys: ['park', 'parking'],
      reply: { text: 'Both sites are in W10 and are easiest to reach by tube, Ladbroke Grove or Latimer Road. For parking on the day, the directions links will show you what is nearby.',
              acts: ['where'] } },

    { keys: ['pay', 'payment', 'card', 'cash'],
      reply: { text: 'Payment is taken at the end of each appointment. If you would like to check which methods Tony accepts, give him a ring.',
              acts: ['fees', 'call'] } },

    { keys: ['contact', 'phone', 'number', 'email', 'speak to', 'call'],
      reply: { text: 'You can reach Tony on <strong>' + PHONE + '</strong>. He answers personally, so if he is with a patient leave a message and he will call back.',
              acts: ['call', 'book'] } },

    { keys: ['thank', 'thanks', 'cheers', 'great', 'perfect', 'brilliant'],
      reply: { text: 'You are very welcome. Anything else I can help with?' } },

    { keys: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
      reply: { text: 'Hello. I can help with fees, opening times, locations, insurance and booking. What would you like to know?' } }
  ];

  var FALLBACK = {
    text: 'I am not sure about that one, and I would rather not guess. Tony will know, so the quickest thing is to ask him directly.',
    acts: ['call', 'book']
  };

  var CLINICAL_REPLY = {
    text: 'I cannot help with symptoms or give any medical advice, and it would not be fair to guess about your body.<br><br>That is exactly what the initial assessment is for. Tony spends 45 to 60 minutes listening and examining properly before saying anything about what is going on.',
    acts: ['book', 'call']
  };

  var GREETING = {
    text: 'Hello. I can answer questions about <strong>fees, opening times, locations, insurance and booking</strong>.<br><br>I cannot give medical advice, but Tony can once he has assessed you.',
    chips: ['How much is it?', 'Where are you?', 'Opening times', 'Do you take Bupa?']
  };

  function matches(lower, keys) {
    for (var i = 0; i < keys.length; i++) if (lower.indexOf(keys[i]) !== -1) return true;
    return false;
  }

  function resolve(input) {
    var lower = ' ' + input.toLowerCase().trim() + ' ';
    if (CLINICAL.test(input)) return CLINICAL_REPLY;
    for (var i = 0; i < INTENTS.length; i++) {
      if (matches(lower, INTENTS[i].keys)) return INTENTS[i].reply;
    }
    return FALLBACK;
  }

  /* ── DOM ─────────────────────────────────────────────────────────────── */
  var launcher, panel, body, foot, input, sendBtn, chipRow, consentPane, legalLine;
  var history = [];
  var session = 'tk-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  var consent = null;          // true = store transcript, false = do not
  var started = false;
  var lastFocus = null;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function track(name) {
    if (!API) return;
    try {
      var payload = JSON.stringify({ name: name, session: session });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(API + '/api/event', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(API + '/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
      }
    } catch (e) { /* never let tracking break the chat */ }
  }

  function addMsg(role, data) {
    // clear any previous chips
    if (chipRow) { chipRow.remove(); chipRow = null; }

    var wrap = el('div', 'tkc-msg tkc-msg--' + role + (data.alert ? ' tkc-msg--alert' : ''));
    var col  = el('div', '', '');
    col.style.cssText = 'display:flex;flex-direction:column;gap:8px;max-width:100%;align-items:' + (role === 'user' ? 'flex-end' : 'flex-start');
    col.appendChild(el('div', 'tkc-bubble', data.text));

    if (data.acts && data.acts.length) {
      var acts = el('div', 'tkc-actions');
      data.acts.forEach(function (k) {
        var a = A[k]; if (!a) return;
        var link = el('a', 'tkc-act', '<span>' + a.label + '</span>' + ARROW);
        link.href = a.href;
        link.addEventListener('click', function () {
          track(a.href === PHONE_HREF ? 'chat_phone_clicked' : 'chat_booking_clicked');
        });
        acts.appendChild(link);
      });
      col.appendChild(acts);
    }

    wrap.appendChild(col);
    body.appendChild(wrap);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { wrap.classList.add('tkc-in'); });
    });

    if (data.chips && data.chips.length) {
      chipRow = el('div', 'tkc-chips');
      data.chips.forEach(function (c) {
        var b = el('button', 'tkc-chip', c);
        b.type = 'button';
        b.addEventListener('click', function () { send(c); });
        chipRow.appendChild(b);
      });
      body.parentNode.insertBefore(chipRow, foot);
    }

    body.scrollTop = body.scrollHeight;
    return wrap;
  }

  function typing() {
    var t = el('div', 'tkc-msg tkc-msg--bot tkc-in', '<div class="tkc-typing"><span></span><span></span><span></span></div>');
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
    return t;
  }

  function localReply(text, delay) {
    var t = typing();
    setTimeout(function () {
      t.remove();
      addMsg('bot', resolve(text));
    }, delay || 420);
  }

  function send(text) {
    text = (text || '').trim();
    if (!text) return;

    addMsg('user', { text: text.replace(/[<>]/g, '') });
    input.value = '';
    autosize();
    track('chat_message_sent');

    /* 1. Red flags first, always, before anything leaves the browser. */
    if (isRedFlag(text)) {
      track('chat_red_flag');
      var t = typing();
      setTimeout(function () { t.remove(); addMsg('bot', RED_FLAG_REPLY); }, 380);
      return;
    }

    /* 2. Clinical questions never reach the model either. */
    if (CLINICAL.test(text)) {
      var t2 = typing();
      setTimeout(function () { t2.remove(); addMsg('bot', CLINICAL_REPLY); }, 420);
      return;
    }

    history.push({ role: 'user', content: text });

    /* 3. No endpoint configured: keyword mode. */
    if (!API) { localReply(text); return; }

    /* 4. Ask the model, fall back to keywords if anything goes wrong. */
    var t3 = typing();
    fetch(API + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, session: session, consent: consent === true })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        t3.remove();
        if (d && d.redFlag) { addMsg('bot', RED_FLAG_REPLY); return; }
        if (d && d.reply) {
          history.push({ role: 'assistant', content: d.reply });
          addMsg('bot', { text: linkify(d.reply), acts: d.acts || [] });
        } else {
          addMsg('bot', resolve(text));
        }
      })
      .catch(function () {
        t3.remove();
        track('chat_fallback_used');
        addMsg('bot', resolve(text));
      });
  }

  function linkify(s) {
    return String(s)
      .replace(/[<>]/g, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 96) + 'px';
  }

  /* ── Consent gate ─────────────────────────────────────────────────────── */
  function showConsent() {
    consentPane = el('div', 'tkc-consent');
    consentPane.innerHTML =
      '<h3>Before we start</h3>' +
      '<p>This chat can answer questions about fees, times, locations and booking. It is not able to give medical advice.</p>' +
      '<p>If you choose <strong>Start chat</strong>, the conversation is saved so Tony can follow up and improve the service. ' +
      'You can ask for it to be deleted at any time. See the <a href="' + BASE + 'privacy/">Privacy Policy</a>.</p>';
    var btns = el('div', 'tkc-btns');
    var yes = el('button', 'tkc-btn tkc-btn--primary', 'Start chat');
    var no  = el('button', 'tkc-btn tkc-btn--quiet', 'Chat without saving');
    yes.type = no.type = 'button';
    yes.addEventListener('click', function () { begin(true); });
    no.addEventListener('click',  function () { begin(false); });
    btns.appendChild(yes); btns.appendChild(no);
    consentPane.appendChild(btns);
    panel.insertBefore(consentPane, foot);
    // the empty message area also claims flex:1, which squeezes the gate
    body.style.display = 'none';
    foot.style.display = 'none';
  }

  function begin(withConsent) {
    consent = withConsent;
    track(withConsent ? 'chat_consent_given' : 'chat_consent_declined');
    if (consentPane) { consentPane.remove(); consentPane = null; }
    body.style.display = '';
    foot.style.display = '';
    started = true;
    /* Show the reference only when the chat is being saved: it is what someone
       quotes to ask for their conversation to be deleted, so a stored chat the
       visitor cannot identify would leave them no way to exercise that right. */
    if (withConsent && legalLine) {
      legalLine.innerHTML = 'Not medical advice. In an emergency call 999. ' +
        'This chat is saved. Reference <strong>' + session + '</strong>, quote it to ask for deletion. ' +
        'See our <a href="' + BASE + 'privacy/">Privacy Policy</a>.';
    }
    addMsg('bot', GREETING);
    input.focus();
  }

  /* ── Open / close ─────────────────────────────────────────────────────── */
  function open() {
    lastFocus = document.activeElement;
    panel.classList.add('tkc-open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.classList.add('tkc-hide');
    launcher.setAttribute('aria-expanded', 'true');
    track('chat_opened');
    fitToViewport();
    if (!started) showConsent();
    else setTimeout(function () { input.focus(); }, 280);
    document.addEventListener('keydown', onKey);
  }

  function close() {
    panel.classList.remove('tkc-open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.classList.remove('tkc-hide');
    launcher.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey);
    panel.style.height = ''; panel.style.top = ''; panel.style.bottom = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKey(e) { if (e.key === 'Escape') close(); }

  /* iOS keyboard. A position:fixed panel is laid out against the layout
     viewport, which does not shrink when the keyboard appears, and Safari
     shunts the page up to reveal the focused field. The panel goes with it and
     a strip of the page shows through underneath. visualViewport is the only
     thing that reports the actual visible area, so on a phone the panel is
     pinned to it explicitly while the keyboard is open. */
  function fitToViewport() {
    var vv = window.visualViewport;
    if (!vv) return;
    if (window.innerWidth > 520 || !panel.classList.contains('tkc-open')) {
      panel.style.height = ''; panel.style.top = ''; panel.style.bottom = '';
      return;
    }
    panel.style.height = vv.height + 'px';
    panel.style.top = vv.offsetTop + 'px';
    panel.style.bottom = 'auto';
  }

  /* ── Mount ───────────────────────────────────────────────────────────── */
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitToViewport);
    window.visualViewport.addEventListener('scroll', fitToViewport);
  }

  function mount() {
    launcher = el('button', 'tkc-launch',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z"/></svg>Ask a question');
    launcher.type = 'button';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'tkChat');

    panel = el('div', 'tkc-panel');
    panel.id = 'tkChat';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with Tony Kosoko Physiotherapy');
    panel.setAttribute('aria-hidden', 'true');

    var head = el('div', 'tkc-head',
      '<img class="tkc-head__mark" src="' + BASE + 'assets/logos/logo-mark-white.png" alt="">' +
      '<div class="tkc-head__txt"><b>Ask a question</b><span>General enquiries only. I cannot give medical advice.</span></div>');
    var closeBtn = el('button', 'tkc-close', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.addEventListener('click', close);
    head.appendChild(closeBtn);

    body = el('div', 'tkc-body');
    body.setAttribute('role', 'log');
    body.setAttribute('aria-live', 'polite');

    foot = el('div', 'tkc-foot');
    input = el('textarea', 'tkc-input');
    input.rows = 1;
    input.placeholder = 'Type your question';
    input.setAttribute('aria-label', 'Type your question');
    sendBtn = el('button', 'tkc-send', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>');
    sendBtn.type = 'button';
    sendBtn.setAttribute('aria-label', 'Send');
    foot.appendChild(input); foot.appendChild(sendBtn);

    legalLine = el('div', 'tkc-legal', 'Not medical advice. In an emergency call 999. See our <a href="' + BASE + 'privacy/">Privacy Policy</a>.');

    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(foot);
    panel.appendChild(legalLine);

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    launcher.addEventListener('click', open);
    sendBtn.addEventListener('click', function () { send(input.value); });
    input.addEventListener('input', autosize);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
    });

    /* expose a tiny surface for testing */
    window.__tkChat = { open: open, close: close, send: send, isRedFlag: isRedFlag, resolve: resolve, begin: begin };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
