/* AULUCK Digital site behaviour: service lists, diagrams, pricing, blogs,
   dialogs, floating button and the enquiry form. Data comes from data.js and
   settings from config.js. Nothing here writes prices; prices appear only on
   the Pricing page (and the one AI video rate). */
(function () {
  'use strict';

  var D = window.AULUCK_DATA || {};
  var C = window.AULUCK_CONFIG || {};
  var PAGE = document.body.getAttribute('data-page') || 'home';
  var HOLO = ['assets/img/hologram-01.png', 'assets/img/hologram-02.png', 'assets/img/hologram-03.png'];
  var MOBILE = window.matchMedia('(max-width: 759px)');
  var COL = { business: '#168BFF', education: '#9B5CFF', root: '#4FD8FF' };
  var MAX_LEVEL = 5;
  var holoN = 0;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
  function waLink(text) {
    return 'https://wa.me/' + C.whatsappNumber + '?text=' + encodeURIComponent(text);
  }
  function holoImg(i) {
    var img = el('img');
    img.src = HOLO[i % 3];
    img.alt = '';
    return img;
  }

  /* ---------- Shared: header menu, floating button, legal links, dialog ---------- */

  function openDialog(title, sub, nodes) {
    var m = $('#modal');
    $('#dlg-title').textContent = title;
    $('#dlg-sub').textContent = sub || '';
    var body = $('#dlg-body');
    body.innerHTML = '';
    nodes.forEach(function (n) { body.appendChild(n); });
    body.scrollTop = 0;
    m.scrollTop = 0;
    m._last = document.activeElement;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    $('#dlg-close').focus();
  }

  function closeDialog() {
    var m = $('#modal');
    if (!m.classList.contains('open')) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (m._last && m._last.focus) m._last.focus();
  }

  function initShared() {
    $$('[data-email]').forEach(function (a) { a.href = 'mailto:' + C.email; a.textContent = C.email; });
    $$('[data-tel]').forEach(function (a) { a.href = 'tel:' + C.phoneTel; });
    $$('[data-phone]').forEach(function (s) { s.textContent = C.phoneDisplay; });
    $$('[data-wa-link]').forEach(function (a) {
      a.href = waLink('Hello AULUCK, I would like to talk about your services.');
    });

    var hdr = $('.hdr'), mb = $('#menu-btn');
    mb.addEventListener('click', function () {
      var open = hdr.classList.toggle('open');
      mb.setAttribute('aria-expanded', String(open));
      mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    var fabBtn = $('#fab-main'), fabItems = $('#fab-items');
    function setFab(open) {
      fabItems.hidden = !open;
      fabBtn.setAttribute('aria-expanded', String(open));
    }
    fabBtn.addEventListener('click', function () { setFab(fabItems.hidden); });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeDialog();
      if (!fabItems.hidden) setFab(false);
    });

    $$('[data-legal]').forEach(function (b) {
      b.addEventListener('click', function () {
        var name = b.getAttribute('data-legal');
        openDialog(name, 'AULUCK Digital', [el('p', null, 'The full ' + name.toLowerCase() +
          ' text will be added before the site goes live.')]);
      });
    });

    if (PAGE === 'home') {
      $$('[data-viewpricing]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var t = document.getElementById('all-services');
          if (!t) return;
          e.preventDefault();
          t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    $('#dlg-close').addEventListener('click', closeDialog);
    $('#modal').addEventListener('click', function (e) {
      if (e.target === this) closeDialog();
    });
  }

  /* ---------- Enquiry form ---------- */

  function initForm() {
    var f = $('#enq-form');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('#form-msg');
      function v(n) { return f.elements[n].value.trim(); }
      var name = v('name'), email = v('email'), phone = v('phone');
      var cat = v('category'), details = v('details');
      var pref = f.querySelector('input[name="contact"]:checked');
      var contact = pref ? pref.value : 'WhatsApp';
      var problems = [];
      if (!name) problems.push('your name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push('a valid email');
      if (!phone) problems.push('a phone or WhatsApp number');
      if (!cat) problems.push('a category');
      if (!details) problems.push('some details');
      if (!f.elements.consent.checked) problems.push('your consent');
      if (problems.length) {
        msg.className = 'form-msg err';
        msg.textContent = 'Please add ' + problems.join(', ') + '.';
        return;
      }
      var ep = C.formService && C.formService.endpoint;
      if (ep) {
        msg.className = 'form-msg';
        msg.textContent = 'Sending...';
        fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, phone: phone, category: cat,
            contact: contact, details: details, page: PAGE })
        }).then(function (r) {
          if (!r.ok) throw new Error('send failed');
          msg.className = 'form-msg ok';
          msg.textContent = 'Thank you. We will reply soon.';
          f.reset();
        }).catch(function () {
          msg.className = 'form-msg err';
          msg.textContent = 'Sorry, your message did not send. Please use WhatsApp or the Call button.';
        });
        return;
      }
      var text = ['Hello AULUCK, website enquiry.', 'Name: ' + name, 'Email: ' + email,
        'Phone or WhatsApp: ' + phone, 'Category: ' + cat, 'Preferred contact: ' + contact,
        'Details: ' + details].join('\n');
      window.open(waLink(text), '_blank', 'noopener');
      msg.className = 'form-msg ok';
      msg.textContent = 'WhatsApp is opening with your message filled in. Press send there to finish.';
    });
  }

  /* ---------- Tabs helper ---------- */

  function renderTabs(host, tabs, idx, onPick) {
    host.innerHTML = '';
    tabs.forEach(function (t, i) {
      var b = el('button', 'tab' + (i === idx ? ' on' : ''), t.label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(i === idx));
      b.addEventListener('click', function () {
        onPick(i);
        $$('.tab', host).forEach(function (x, j) {
          x.setAttribute('aria-pressed', String(j === i));
          x.classList.toggle('on', j === i);
        });
      });
      host.appendChild(b);
    });
  }

  /* ---------- Service lists (Business, Education, All Services) ---------- */

  // Groups a division or department by its category group, keeping source order.
  function groupsOf(src) {
    if (src._g) return src._g;
    var out = [], map = {};
    src.categories.forEach(function (c) {
      var g = map[c.group];
      if (!g) {
        g = { name: c.group, subs: [], items: [] };
        map[c.group] = g;
        out.push(g);
      }
      if (g.subs.indexOf(c.name) === -1) g.subs.push(c.name);
      c.services.forEach(function (s) {
        g.items.push({ n: s.n, note: s.note, p: s.p, q: s.q, sub: c.name });
      });
    });
    src._g = out;
    return out;
  }

  function tabMatch(src, f) {
    return f === 'all' || src.scope === f || src.id === f;
  }

  function layoutHolo(grid) {
    var h = grid.querySelector('.holo-card');
    var n = grid.querySelectorAll('.sbox:not([hidden])').length;
    h.style.gridRow = '1 / span ' + Math.max(1, Math.ceil(n / 2));
  }

  function groupBlock(g, items, src, q) {
    var wrap = el('div', 'cat');
    var head = el('h4', 'cat-head');
    head.appendChild(el('span', null, g.name));
    head.appendChild(el('span', 'cnt', q ? items.length + ' matching' : plural(g.items.length, 'service')));
    wrap.appendChild(head);

    var grid = el('div', 'svc-grid');
    var holo = el('div', 'holo-card');
    holo.appendChild(holoImg(holoN));
    holoN++;
    grid.appendChild(holo);

    var open = !!q || g.name === 'Digital Marketing' || items.length <= 4;
    var limit = open ? items.length : 4;
    items.forEach(function (it, i) {
      var box = el('article', 'sbox');
      box.style.gridColumn = i % 2 === 0 ? '1' : '3';
      box.hidden = i >= limit;
      box.appendChild(el('span', 'num', String(i + 1)));
      var body = el('div', 'sbody');
      if (g.subs.length > 1) body.appendChild(el('span', 'tag', it.sub));
      body.appendChild(el('h5', null, it.n));
      if (it.note) body.appendChild(el('p', null, it.note));
      box.appendChild(body);
      var a = el('a', 'enq', 'Enquire');
      a.href = waLink('Hello AULUCK, I would like to enquire about: ' + it.n + ' (' + src.name + ').');
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', 'Enquire about ' + it.n);
      box.appendChild(a);
      grid.appendChild(box);
    });
    wrap.appendChild(grid);
    layoutHolo(grid);

    if (items.length > limit) {
      var more = el('button', 'more', 'Show all ' + items.length);
      more.type = 'button';
      more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', function () {
        var expanded = more.getAttribute('aria-expanded') === 'true';
        var now = !expanded;
        $$('.sbox', grid).forEach(function (b, i) { b.hidden = !now && i >= 4; });
        more.setAttribute('aria-expanded', String(now));
        more.textContent = now ? 'Show fewer' : 'Show all ' + items.length;
        layoutHolo(grid);
      });
      wrap.appendChild(more);
    }
    return wrap;
  }

  function drawList(st) {
    var f = st.tabs[st.idx].filter;
    var q = st.q.trim().toLowerCase();
    var host = $('#' + st.p + '-list');
    host.innerHTML = '';
    var total = 0, shown = 0, first = null;

    st.rows.forEach(function (src) {
      if (!tabMatch(src, f)) return;
      if (!first) first = src;
      var block = el('div', 'lblock');
      block.appendChild(el('h3', 'dv-title', src.name));
      if (src.desc) block.appendChild(el('p', 'dv-desc', src.desc));
      var any = false;
      groupsOf(src).forEach(function (g) {
        total += g.items.length;
        var items = g.items.filter(function (it) {
          return !q || (it.n + ' ' + (it.note || '') + ' ' + it.sub + ' ' + g.name + ' ' + src.name)
            .toLowerCase().indexOf(q) !== -1;
        });
        if (!items.length) return;
        any = true;
        shown += items.length;
        block.appendChild(groupBlock(g, items, src, q));
      });
      if (any) host.appendChild(block);
    });

    if (!shown) host.appendChild(el('p', 'empty', 'No services match this search. Try another word, or send an enquiry.'));
    $('#' + st.p + '-count').textContent = q ? shown + ' matching ' + (shown === 1 ? 'service' : 'services') : plural(total, 'service');
    var cur = '';
    if (f === 'business') cur = 'Business services';
    else if (f === 'education') cur = 'Education services';
    else if (f !== 'all' && first) cur = first.name;
    $('#' + st.p + '-current').textContent = cur;
  }

  function makeList(p, tabs, rows) {
    var st = { p: p, tabs: tabs, idx: 0, rows: rows, q: '' };
    renderTabs($('#' + p + '-tabs'), tabs, 0, function (i) { st.idx = i; drawList(st); });
    $('#' + p + '-q').addEventListener('input', function (e) { st.q = e.target.value; drawList(st); });
    drawList(st);
  }

  /* ---------- Diagram (five levels, one level per click) ---------- */

  function buildDiagram(host) {
    var sides = (host.getAttribute('data-sides') || 'business').split(',');
    var mode = host.getAttribute('data-mode') || 'full';
    var DEF = mode === 'full' ? MAX_LEVEL : 2;
    var depth = DEF;
    var zoom = null, curZ = 1, trail = 'AULUCK';
    var nodes = [], edges = [];
    var svgNS = 'http://www.w3.org/2000/svg';

    host.innerHTML = '';
    var bar = el('div', 'dg-bar');
    var crumb = el('div', 'dg-crumb', 'AULUCK');
    crumb.setAttribute('aria-live', 'polite');
    var ctrls = el('div', 'dg-ctrls');
    var BTN = [
      ['full', 'Show full diagram', 'Show full diagram'],
      ['back', 'Back', 'Go back one level'],
      ['fit', 'Fit to screen', 'Fit to screen'],
      ['zin', '+', 'Zoom in'],
      ['zout', '−', 'Zoom out'],
      ['reset', 'Reset', 'Reset diagram'],
      ['screen', 'Full screen', 'Full screen']
    ];
    BTN.forEach(function (b) {
      if (b[0] === 'full' && mode !== 'progressive') return;
      var k = el('button', 'dg-btn', b[1]);
      k.type = 'button';
      k.dataset.act = b[0];
      k.setAttribute('aria-label', b[2]);
      ctrls.appendChild(k);
    });
    bar.appendChild(crumb);
    bar.appendChild(ctrls);

    var wrap = el('div', 'dg-wrap');
    var stage = el('div', 'dg-stage');
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'dg-svg');
    svg.setAttribute('aria-hidden', 'true');
    stage.appendChild(svg);

    function node(cls, lvl, text, p, go) {
      var b = el('button', 'dn dn-l' + lvl + ' ' + cls, text);
      b.type = 'button';
      b.dataset.lvl = String(lvl);
      b.dataset.path = p;
      if (go) b.dataset.go = go;
      nodes.push(b);
      return b;
    }

    var rootN = node('root', 1, 'AULUCK', 'AULUCK');
    var rootRow = el('div', 'dg-root');
    rootRow.appendChild(rootN);
    stage.appendChild(rootRow);

    var branches = el('div', 'dg-branches');
    sides.forEach(function (side) {
      var isBiz = side === 'business';
      var label = isBiz ? 'Business' : 'Education';
      var items = isBiz ? D.divisions : D.depts;
      var goT = isBiz ? (PAGE === 'home' ? '#business' : '#biz-services')
                      : (PAGE === 'home' ? '#education' : '#edu-services');
      var col = el('div', 'dg-side ' + side);
      var sideN = node(side, 2, label, 'AULUCK > ' + label);
      edges.push([rootN, sideN, side]);
      col.appendChild(sideN);

      var row = el('div', 'dg-divs');
      var lasts = [];
      items.forEach(function (it) {
        var c = el('div', 'dg-div');
        var base = 'AULUCK > ' + label + ' > ' + it.name;
        var dn = node(side, 3, it.name, base);
        edges.push([sideN, dn, side]);
        c.appendChild(dn);
        var cats = el('div', 'dg-cats');
        var last = dn;
        groupsOf(it).forEach(function (g) {
          var gn = node(side, 4, g.name, base + ' > ' + g.name);
          edges.push([dn, gn, side]);
          cats.appendChild(gn);
          last = gn;
        });
        c.appendChild(cats);
        row.appendChild(c);
        lasts.push(last);
      });
      col.appendChild(row);

      var allRow = el('div', 'dg-allrow');
      var allN = node(side + ' dn-all', 5, 'All Services', 'AULUCK > ' + label + ' > All Services', goT);
      allRow.appendChild(allN);
      lasts.forEach(function (l) { edges.push([l, allN, side]); });
      col.appendChild(allRow);
      branches.appendChild(col);
    });
    stage.appendChild(branches);
    wrap.appendChild(stage);

    var cap = el('p', 'dg-cap', host.getAttribute('data-caption') || '');
    host.appendChild(bar);
    host.appendChild(wrap);
    host.appendChild(cap);

    function fitZoom() {
      var z = wrap.clientWidth / stage.offsetWidth;
      return Math.max(0.4, Math.min(1.2, z));
    }

    function drawEdges() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (MOBILE.matches) return;
      var W = stage.offsetWidth, H = stage.offsetHeight;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.width = W + 'px';
      svg.style.height = H + 'px';
      var sr = stage.getBoundingClientRect();
      function pos(n) {
        var r = n.getBoundingClientRect();
        return {
          x: (r.left + r.width / 2 - sr.left) / curZ,
          top: (r.top - sr.top) / curZ,
          bottom: (r.bottom - sr.top) / curZ
        };
      }
      edges.forEach(function (e) {
        if (e[0].hidden || e[1].hidden) return;
        var p = pos(e[0]), q = pos(e[1]);
        var my = (p.bottom + q.top) / 2;
        var d = 'M' + p.x + ' ' + p.bottom + ' C' + p.x + ' ' + my + ' ' + q.x + ' ' + my + ' ' + q.x + ' ' + q.top;
        var pe = document.createElementNS(svgNS, 'path');
        pe.setAttribute('d', d);
        pe.setAttribute('stroke', COL[e[2]] || COL.root);
        svg.appendChild(pe);
      });
    }

    function apply() {
      var mobile = MOBILE.matches;
      var full = document.fullscreenElement === host;
      nodes.forEach(function (n) { n.hidden = +n.dataset.lvl > depth; });
      var z = 1;
      if (!mobile) z = zoom == null ? fitZoom() : zoom;
      curZ = z;
      if (mobile) {
        stage.style.transform = '';
        stage.style.marginLeft = '';
        wrap.style.height = '';
      } else {
        stage.style.transform = 'scale(' + z + ')';
        stage.style.marginLeft = Math.max(0, (wrap.clientWidth - stage.offsetWidth * z) / 2) + 'px';
        wrap.style.height = (full ? window.innerHeight - 110 : stage.offsetHeight * z) + 'px';
      }
      crumb.textContent = trail;
      var sb = ctrls.querySelector('[data-act="screen"]');
      if (sb) sb.textContent = full ? 'Exit full screen' : 'Full screen';
      drawEdges();
    }

    stage.addEventListener('click', function (e) {
      var b = e.target.closest('.dn');
      if (!b) return;
      var lvl = +b.dataset.lvl;
      if (lvl === MAX_LEVEL) {
        var t = b.dataset.go && document.querySelector(b.dataset.go);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        depth = Math.min(MAX_LEVEL, Math.max(depth, lvl + 1));
      }
      trail = b.dataset.path;
      apply();
    });

    ctrls.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var a = b.dataset.act;
      if (a === 'full') depth = MAX_LEVEL;
      else if (a === 'back') { depth = Math.max(1, depth - 1); if (depth === 1) trail = 'AULUCK'; }
      else if (a === 'fit') zoom = null;
      else if (a === 'zin') zoom = Math.min(1.6, (zoom == null ? fitZoom() : zoom) * 1.2);
      else if (a === 'zout') zoom = Math.max(0.4, (zoom == null ? fitZoom() : zoom) / 1.2);
      else if (a === 'reset') { depth = DEF; zoom = null; trail = 'AULUCK'; wrap.scrollLeft = 0; }
      else if (a === 'screen') {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
        } else if (host.requestFullscreen) {
          host.requestFullscreen().catch(function () {});
        }
        return;
      }
      apply();
    });

    document.addEventListener('fullscreenchange', apply);
    window.addEventListener('resize', apply);
    window.addEventListener('load', apply);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
    apply();
  }

  /* ---------- Blogs ---------- */

  function blogCard(b, big) {
    var a = el('article', 'bcard' + (big ? ' big' : ''));
    var im = el('div', 'bimg hue-' + b.hue);
    im.appendChild(holoImg(b.id - 1));
    a.appendChild(im);
    var body = el('div', 'bbody');
    var meta = el('div', 'bmeta');
    meta.appendChild(el('span', 'tag', b.scope === 'business' ? 'Business' : 'Education'));
    meta.appendChild(el('span', 'draft', 'Draft'));
    body.appendChild(meta);
    body.appendChild(el('h3', null, b.title));
    body.appendChild(el('p', null, b.excerpt));
    var btn = el('button', 'btn sm', 'Read full');
    btn.type = 'button';
    btn.addEventListener('click', function () { openBlog(b); });
    body.appendChild(btn);
    a.appendChild(body);
    return a;
  }

  function openBlog(b) {
    var nodes = [];
    var hero = el('div', 'bimg bhero hue-' + b.hue);
    hero.appendChild(holoImg(b.id - 1));
    nodes.push(hero);
    b.body.forEach(function (t) { nodes.push(el('p', null, t)); });
    var cta = el('div', 'dlg-cta');
    var pr = el('a', 'btn solid', 'View Pricing');
    pr.href = PAGE === 'home' ? '#all-services' : 'pricing.html';
    if (PAGE === 'home') pr.addEventListener('click', closeDialog);
    var en = el('a', 'btn', 'Enquire');
    en.href = waLink('Hello AULUCK, I would like to ask about this blog draft: ' + b.title);
    en.target = '_blank';
    en.rel = 'noopener';
    cta.appendChild(pr);
    cta.appendChild(en);
    nodes.push(cta);
    openDialog(b.title, b.cluster + ' | Draft', nodes);
  }

  function initBlogs() {
    var tabsHost = $('#blog-tabs');
    if (!tabsHost || !D.blogs) return;
    var grid = $('#blog-grid'), rail = $('#blog-hscroll');
    var count = $('#blog-count'), qEl = $('#blog-q');
    var idx = 0, query = '';

    function draw() {
      var f = D.blogTabs[idx].filter;
      var list = D.blogs.filter(function (b) {
        if (f !== 'all' && b.scope !== f) return false;
        var t = (b.title + ' ' + b.cluster + ' ' + b.excerpt).toLowerCase();
        return !query || t.indexOf(query) !== -1;
      });
      var host = grid || rail;
      host.innerHTML = '';
      list.forEach(function (b, i) {
        host.appendChild(blogCard(b, !!grid && i === 0 && f === 'all' && !query));
      });
      if (!list.length) host.appendChild(el('p', 'empty', 'No blog drafts match this search.'));
      if (rail) rail.scrollLeft = 0;
      count.textContent = list.length + ' of ' + D.blogs.length + ' drafts';
    }

    renderTabs(tabsHost, D.blogTabs, 0, function (i) { idx = i; draw(); });
    qEl.addEventListener('input', function (e) { query = e.target.value.trim().toLowerCase(); draw(); });
    if (rail) {
      var prev = $('#blog-prev'), next = $('#blog-next');
      prev.addEventListener('click', function () { rail.scrollBy({ left: -300, behavior: 'smooth' }); });
      next.addEventListener('click', function () { rail.scrollBy({ left: 300, behavior: 'smooth' }); });
    }
    draw();
  }

  /* ---------- Pricing (the only page with prices) ---------- */

  function initPricing() {
    var body = $('#pr-body');
    if (!body) return;
    var rows = [];
    function addRows(src, scope) {
      src.categories.forEach(function (c) {
        c.services.forEach(function (s) {
          rows.push({ scope: scope, area: src.name, group: c.group, n: s.n, note: s.note, p: s.p, q: s.q });
        });
      });
    }
    D.divisions.forEach(function (d) { addRows(d, 'business'); });
    D.depts.forEach(function (d) { addRows(d, 'education'); });

    var st = { tab: 0, status: 'all', q: '' };

    function draw() {
      var f = D.allTabs[st.tab].filter;
      var list = rows.filter(function (r) {
        if (f !== 'all' && r.scope !== f) return false;
        if (st.status === 'quote' && !r.q) return false;
        if (st.status === 'confirm' && r.q) return false;
        if (st.q && (r.n + ' ' + r.note + ' ' + r.group + ' ' + r.area).toLowerCase().indexOf(st.q) === -1) return false;
        return true;
      });
      body.innerHTML = '';
      list.forEach(function (r) {
        var tr = el('tr');
        var td1 = el('td');
        td1.appendChild(el('strong', null, r.n));
        if (r.note) td1.appendChild(el('span', 'nt', r.note));
        tr.appendChild(td1);
        tr.appendChild(el('td', null, r.area));
        tr.appendChild(el('td', null, r.group));
        tr.appendChild(el('td', r.q ? 'pr-price quote' : 'pr-price', r.p));
        var td5 = el('td');
        var a = el('a', 'enq', 'Enquire');
        a.href = waLink('Hello AULUCK, I would like to enquire about: ' + r.n + ' (' + r.area + ').');
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', 'Enquire about ' + r.n);
        td5.appendChild(a);
        tr.appendChild(td5);
        body.appendChild(tr);
      });
      if (!list.length) {
        var none = el('tr');
        var cell = el('td', 'empty', 'No services match these filters.');
        cell.colSpan = 5;
        none.appendChild(cell);
        body.appendChild(none);
      }
      $('#pr-count').textContent = list.length + ' of ' + rows.length + ' services';
    }

    renderTabs($('#pr-tabs'), D.allTabs, 0, function (i) { st.tab = i; draw(); });
    $$('#pr-status .tab').forEach(function (b) {
      b.addEventListener('click', function () {
        st.status = b.getAttribute('data-status');
        $$('#pr-status .tab').forEach(function (x) {
          var on = x === b;
          x.setAttribute('aria-pressed', String(on));
          x.classList.toggle('on', on);
        });
        draw();
      });
    });
    $('#pr-q').addEventListener('input', function (e) {
      st.q = e.target.value.trim().toLowerCase();
      draw();
    });
    draw();
  }

  /* ---------- Start ---------- */

  function start() {
    D.divisions = D.divisions || [];
    D.depts = D.depts || [];
    D.divisions.forEach(function (d) { d.scope = 'business'; });
    D.depts.forEach(function (d) { d.scope = 'education'; });

    initShared();
    initForm();
    $$('.diagram').forEach(buildDiagram);
    if ($('#biz-list')) makeList('biz', D.bizTabs, D.divisions);
    if ($('#edu-list')) makeList('edu', D.eduTabs, D.depts);
    if ($('#all-list')) makeList('all', D.allTabs, D.divisions.concat(D.depts));
    initBlogs();
    initPricing();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
