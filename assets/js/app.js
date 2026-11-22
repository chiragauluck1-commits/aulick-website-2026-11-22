/* AULUCK website v2: page behaviour (menu, call button, diagram, service lists, sliders, Knowledge Hub, pricing, forms, pop-ups).
   Data comes from assets/js/data.js (window.AULUCK_DATA) and settings from assets/js/config.js (window.AULUCK_CONFIG). */
(function () {
  'use strict';
  var D = window.AULUCK_DATA || {};
  var CFG = window.AULUCK_CONFIG || {};
  var body = document.body;
  var isHome = body.getAttribute('data-page') === 'home';
  var anchorBase = isHome ? '' : 'index.html';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }
  function norm(t) { return String(t || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function waLink(text) {
    var num = CFG.whatsappNumber || '918059674233';
    return 'https://wa.me/' + num + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  /* ---------- settings: call and WhatsApp links ---------- */
  $$('[data-tel]').forEach(function (a) { a.setAttribute('href', 'tel:' + (CFG.phoneTel || '+918059674233')); });
  $$('[data-wa]').forEach(function (a) { a.setAttribute('href', waLink('Hello AULUCK, I would like to know more.')); });
  $$('[data-email]').forEach(function (a) { a.setAttribute('href', 'mailto:' + (CFG.email || 'chiunaulcuk@gmail.com')); });

  /* ---------- header menu ---------- */
  var menuBtn = $('.menu-btn'), nav = $('nav.main');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- floating call and WhatsApp button ---------- */
  var fab = $('.fab-btn'), fabMenu = $('.fab-menu');
  if (fab && fabMenu) {
    fab.addEventListener('click', function () {
      var open = fabMenu.hasAttribute('hidden');
      if (open) { fabMenu.removeAttribute('hidden'); } else { fabMenu.setAttribute('hidden', ''); }
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !fabMenu.hasAttribute('hidden')) {
        fabMenu.setAttribute('hidden', ''); fab.setAttribute('aria-expanded', 'false'); fab.focus();
      }
    });
  }

  /* ---------- pop-up (used for Knowledge Hub articles and footer policies) ---------- */
  var modal = $('#modal'), lastFocus = null;
  function openModal(opts) {
    if (!modal) return;
    lastFocus = document.activeElement;
    $('#modal-tag').innerHTML = opts.tag || '';
    $('#modal-title').textContent = opts.title || '';
    $('#modal-body').innerHTML = opts.html || '';
    $('#modal-foot').innerHTML = opts.foot || '';
    $('#modal-scroll').scrollTop = 0;
    modal.removeAttribute('hidden');
    body.style.overflow = 'hidden';
    $('.modal-x', modal).focus();
  }
  function closeModal() {
    if (!modal || modal.hasAttribute('hidden')) return;
    modal.setAttribute('hidden', '');
    body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (modal) {
    $('.modal-x', modal).addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab' && !modal.hasAttribute('hidden')) {
        var f = $$('button, a[href], [tabindex]:not([tabindex="-1"])', modal).filter(function (x) { return !x.disabled; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  var LEGAL = {
    terms: ['Terms of use', 'The final terms of use will be added by AULUCK before the site goes live.'],
    privacy: ['Privacy notice', 'The final privacy notice will be added by AULUCK before the site goes live. Until then, do not send personal details beyond what the enquiry form asks for.'],
    cookie: ['Cookie notice', 'The final cookie notice will be added by AULUCK before the site goes live.'],
    access: ['Accessibility statement', 'The final accessibility statement will be added by AULUCK before the site goes live. Tell us through the Call or WhatsApp buttons if something is hard to use.']
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-legal]');
    if (!t) return;
    var L = LEGAL[t.getAttribute('data-legal')];
    if (!L) return;
    openModal({tag: '<span class="tag">Policy</span>', title: L[0], html: '<div class="legal-text"><p>' + esc(L[1]) + '</p></div>', foot: ''});
  });

  /* ---------- sliders: two cards visible on desktop and tablet, one on mobile ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-slide]');
    if (!b) return;
    var box = b.closest('.slider');
    var track = box && $('.track', box);
    if (!track) return;
    var first = track.firstElementChild;
    if (!first) return;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 24;
    var step = first.getBoundingClientRect().width + gap;
    var dir = b.getAttribute('data-slide') === 'next' ? 1 : -1;
    track.scrollBy({left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth'});
  });
  function updateSliderButtons(track) {
    var box = track.closest('.slider');
    if (!box) return;
    var prev = $('[data-slide="prev"]', box), next = $('[data-slide="next"]', box);
    var max = track.scrollWidth - track.clientWidth - 4;
    if (prev) prev.disabled = track.scrollLeft <= 4;
    if (next) next.disabled = track.scrollLeft >= max;
  }
  function bindSlider(track) {
    track.addEventListener('scroll', function () { updateSliderButtons(track); }, {passive: true});
    updateSliderButtons(track);
  }
  function sliderHtml(inner, label) {
    return '<div class="slider"><div class="track" role="region" aria-label="' + esc(label) + '" tabindex="0">' + inner + '</div>' +
      '<div class="slide-nav"><button type="button" data-slide="prev" aria-label="Previous">&#8592;</button>' +
      '<button type="button" data-slide="next" aria-label="Next">&#8594;</button></div></div>';
  }

  /* ---------- service lists (Business and Education boxes) ---------- */
  var DIV = {business: D.divisions || [], education: D.depts || []};
  var TABS = {business: D.bizTabs || [], education: D.eduTabs || [], all: [{label: 'All', filter: 'all'}, {label: 'Business', filter: 'business'}, {label: 'Education', filter: 'education'}]};

  function serviceGroups(scope, filter, q) {
    var out = [];
    var sets = scope === 'all' ? ['business', 'education'] : [scope];
    sets.forEach(function (set) {
      if (scope === 'all' && filter !== 'all' && filter !== set) return;
      (DIV[set] || []).forEach(function (d) {
        if (scope !== 'all' && filter !== 'all' && d.id !== filter) return;
        d.categories.forEach(function (c) {
          var catMatch = q && (norm(c.group).indexOf(q) > -1 || norm(c.name).indexOf(q) > -1 || norm(d.name).indexOf(q) > -1);
          var list = c.services.filter(function (s) { return !q || catMatch || norm(s.n).indexOf(q) > -1; });
          if (list.length) out.push({div: d, cat: c, items: list, s: set});
        });
      });
    });
    return out;
  }

  function renderTabs(scope, filter, box) {
    var tabs = TABS[scope] || [];
    return '<div class="seg ' + (scope === 'education' ? 'pu' : '') + ' svc-tabs" role="group" aria-label="Filter">' +
      tabs.map(function (t) {
        return '<button type="button" data-f="' + esc(t.filter) + '" aria-pressed="' + (t.filter === filter ? 'true' : 'false') + '">' + esc(t.label) + '</button>';
      }).join('') + '</div>';
  }

  function listHtml(scope, groups, filter) {
    var out = '', lastDiv = null;
    groups.forEach(function (g, gi) {
      if (filter === 'all' && (!lastDiv || lastDiv !== g.div.id)) {
        var dn = g.div.name;
        var total = groups.filter(function (x) { return x.div.id === g.div.id; }).reduce(function (a, x) { return a + x.items.length; }, 0);
        out += '<h3 class="svc-div">' + esc(dn) + '<span>' + plural(total, 'service', 'services') + '</span></h3>';
        lastDiv = g.div.id;
      }
      if (filter !== 'all' && gi === 0) {
        out += '<h3 class="svc-title">' + esc(g.div.name) + '</h3>';
      }
      var sub = g.cat.name !== g.cat.group ? '<h5>' + esc(g.cat.name) + '</h5>' : '';
      out += '<div class="svc-cat"><h4>' + esc(g.cat.group) + '<span>' + plural(g.cat.services.length, 'service', 'services') + '</span></h4>' + sub +
        '<ul class="svc-list">' + g.items.map(function (s) {
          return '<li><span class="nm">' + esc(s.n) + (s.note ? '<small>' + esc(s.note) + '</small>' : '') + '</span>' +
            '<a class="btn ghost sm" href="' + anchorBase + '#enquiry" data-enq="' + esc(s.n) + '">Enquire</a></li>';
        }).join('') + '</ul></div>';
    });
    return out;
  }

  function sliderCards(scope, groups) {
    var k = 0;
    return groups.map(function (g) {
      k += 1;
      var cls = (g.s || scope) === 'education' ? 'e' : 'b';
      var rows = g.items.map(function (x) {
        var note = x.note ? '<small>' + esc(x.note) + '</small>' : '';
        if (scope !== 'all') return '<li>' + esc(x.n) + note + '</li>';
        return '<li class="enq-row"><span>' + esc(x.n) + note + '</span>' +
          '<a class="btn ghost sm" href="' + anchorBase + '#enquiry" data-enq="' + esc(x.n) + '">Enquire</a></li>';
      }).join('');
      return '<article class="card ' + cls + '"><div class="card-body">' +
        '<div class="num">' + (k < 10 ? '0' + k : k) + ' &middot; ' + esc(g.div.name) + '</div>' +
        '<h4>' + esc(g.cat.group) + '</h4>' +
        '<div class="note">' + plural(g.cat.services.length, 'service', 'services') + '</div>' +
        '<div class="txt"><ul>' + rows + '</ul></div>' +
        '<a class="btn ghost sm" href="' + anchorBase + '#enquiry">Enquire about this</a>' +
        '</div></article>';
    }).join('');
  }

  function initServices(root) {
    var scope = root.getAttribute('data-svc');
    var mode = root.getAttribute('data-mode') || 'list';
    var state = {f: 'all', q: ''};
    var tabsHost = $('.svc-tabs-host', root), listHost = $('.svc-host', root), countHost = $('.count', root);
    var search = $('input[type="search"]', root);
    function draw() {
      var groups = serviceGroups(scope, state.f, state.q);
      var total = groups.reduce(function (a, g) { return a + g.items.length; }, 0);
      tabsHost.innerHTML = renderTabs(scope, state.f);
      $$('[data-f]', tabsHost).forEach(function (b) {
        b.addEventListener('click', function () { state.f = b.getAttribute('data-f'); draw(); });
      });
      countHost.textContent = state.q ? total + ' matching services' : (plural(total, 'service', 'services') + ' shown');
      if (!groups.length) {
        listHost.innerHTML = '<p class="svc-empty">No service matches that search. Try another word or enquire below.</p>';
        return;
      }
      if (mode === 'slider') {
        listHost.innerHTML = sliderHtml(sliderCards(scope, groups), (scope === 'all' ? 'All' : scope === 'education' ? 'Education' : 'Business') + ' services');
        var tr = $('.track', listHost);
        if (tr) { bindSlider(tr); tr.scrollLeft = 0; updateSliderButtons(tr); }
      } else {
        listHost.innerHTML = listHtml(scope, groups, state.f);
      }
    }
    if (search) {
      search.addEventListener('input', function () { state.q = norm(search.value); draw(); });
    }
    draw();
  }

  $$('[data-svc]').forEach(initServices);
  $$('.track').forEach(function (t) { if (!t.hasAttribute('data-bound')) { t.setAttribute('data-bound', '1'); bindSlider(t); } });

  /* ---------- Knowledge Hub (home slider and Blogs page) ---------- */
  var BLOGS = D.blogs || [];
  function blogById(id) {
    for (var i = 0; i < BLOGS.length; i++) if (BLOGS[i].id === id) return BLOGS[i];
    return null;
  }
  function blogCard(b, scope) {
    var cls = b.scope === 'education' ? 'e' : 'b';
    return '<article class="card ' + cls + '">' +
      '<div class="card-body"><span class="tag ' + (b.scope === 'education' ? '' : 'b') + '">' + esc(b.cluster) + '</span>' +
      '<h4>' + esc(b.title) + '</h4>' +
      '<p class="excerpt">' + esc(b.excerpt) + '</p>' +
      '<button type="button" class="btn ghost sm" data-read="' + b.id + '">Read full article</button></div></article>';
  }
  function initBlogs(root) {
    var mode = root.getAttribute('data-mode') || 'slider';
    var state = {scope: 'all', q: ''};
    var tabsHost = $('.blog-tabs', root), listHost = $('.blog-host', root), countHost = $('.count', root), search = $('input[type="search"]', root);
    var scopeTabs = D.scopeTabs || [];
    function draw() {
      var list = BLOGS.filter(function (b) {
        if (state.scope !== 'all' && b.scope !== state.scope) return false;
        if (!state.q) return true;
        return norm(b.title + ' ' + b.cluster + ' ' + b.excerpt).indexOf(state.q) > -1;
      });
      tabsHost.innerHTML = '<div class="seg" role="group" aria-label="Filter articles">' + scopeTabs.map(function (t) {
        return '<button type="button" data-s="' + t.filter + '" aria-pressed="' + (t.filter === state.scope ? 'true' : 'false') + '">' + esc(t.label) + '</button>';
      }).join('') + '</div>';
      $$('[data-s]', tabsHost).forEach(function (b) {
        b.addEventListener('click', function () { state.scope = b.getAttribute('data-s'); draw(); });
      });
      countHost.textContent = state.q ? list.length + ' matching articles' : list.length + ' articles';
      if (!list.length) { listHost.innerHTML = '<p class="svc-empty">No article matches that search.</p>'; return; }
      if (mode === 'grid') {
        var feat = '';
        var rest = list;
        if (state.scope === 'all' && !state.q) {
          feat = '<article class="card b feature">' +
            '<div class="card-body"><span class="tag b">Featured</span><h3>' + esc(list[0].title) + '</h3><p class="excerpt">' + esc(list[0].excerpt) + '</p>' +
            '<button type="button" class="btn p sm" data-read="' + list[0].id + '">Read full article</button></div></article>';
          rest = list.slice(1);
        }
        listHost.innerHTML = feat + '<div class="grid-cards">' + rest.map(function (b) { return blogCard(b); }).join('') + '</div>';
      } else {
        listHost.innerHTML = sliderHtml(list.map(function (b) { return blogCard(b); }).join(''), 'Blog articles');
        var tr = $('.track', listHost);
        if (tr) { bindSlider(tr); }
      }
    }
    if (search) search.addEventListener('input', function () { state.q = norm(search.value); draw(); });
    draw();
  }
  $$('[data-blogs]').forEach(initBlogs);

  document.addEventListener('click', function (e) {
    var r = e.target.closest('[data-read]');
    if (!r) return;
    var b = blogById(parseInt(r.getAttribute('data-read'), 10));
    if (!b) return;
    var html = '' +
      '<div class="banner"><span>Draft. This article is to be reviewed before it is published.</span></div>' +
      '<h2 id="modal-title2" class="sr">' + esc(b.title) + '</h2>' +
      b.body.map(function (it) {
        if (it.h) return '<h3>' + esc(it.h) + '</h3>';
        return '<p>' + esc(it.p) + '</p>';
      }).join('');
    var foot = '<a class="btn s" href="pricing.html">View Pricing</a>' +
      '<a class="btn p" href="' + anchorBase + '#enquiry" data-close-enq>Discuss Your Project</a>';
    openModal({tag: '<span class="tag ' + (b.scope === 'education' ? '' : 'b') + '">' + esc(b.cluster) + '</span>', title: b.title, html: html, foot: foot});
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-close-enq]') || e.target.closest('[data-enq]')) closeModal();
  });

  var W = 1400, PAD = 24, ROOT_W = 280, BR_W = 260, GROUP_GAP = 64, COL_GAP = 14, LEAF_IN = 28, ROW_GAP = 60, LEAF_GAP = 10;
  var DIAGRAM = {
    business: {label: 'Business', e: false, divs: [
      {name: 'Solutions', cats: ['Software & Technology', 'Business Systems & Automation', 'Digital Infrastructure', 'Complete Business Setup']},
      {name: 'Marketing', cats: ['Digital Marketing', 'Offline Marketing', 'Strategy & Consulting']},
      {name: 'Print Media', cats: ['Business Stationery', 'Promotional Print', 'Large-format Print', 'Branded Merchandise', 'Print Production Coordination']},
      {name: 'Branding', cats: ['Brand Strategy', 'Brand Identity', 'Guidelines', 'Brand Applications', 'Creative Direction']}
    ]},
    education: {label: 'Education', e: true, divs: [
      {name: 'Career', cats: ['Industry Guides', 'Career Options', 'Career Planning', 'Skill Pathways', 'Job Guidance / Preparation', 'Internships']},
      {name: 'Help', cats: ['Scholarship Information', 'Scholarship Application Guidance', 'Student Help Desk / Support', 'Course / Admission Guidance', 'Student Discounts']},
      {name: 'Knowledge', cats: ['Professional Courses', 'Tuition & Teaching / Academic Academy', 'Exam Preparation & Learning Resources']}
    ]}
  };
  var diagramSeq = 0;

  /* Step by step: step 1 AULUCK, step 2 Business and Education, step 3 divisions, step 4 categories.
     Default view is step 2. Click AULUCK for the next step. Click Business or Education to open that side. */
  function buildDiagram(root) {
    var which = root.getAttribute('data-dg');
    var branches = which === 'both' ? ['business', 'education'] : [which];
    var stage = $('.dg-stage', root), sizer = $('.dg-sizer', root), canvas = $('.dg-canvas', root), crumb = $('.crumb', root);
    var svgNS = 'http://www.w3.org/2000/svg';
    var uid = 'dgm' + (++diagramSeq);
    var svg = document.createElementNS(svgNS, 'svg');
    canvas.innerHTML = '';
    canvas.style.width = W + 'px';
    canvas.appendChild(svg);
    var nodes = [], links = [], branchInfo = [];
    var depth = 2;

    function node(text, lvl, cls, br) {
      var el = document.createElement('div');
      el.className = 'dg-node l' + lvl + (cls ? ' ' + cls : '') + ' on';
      el.setAttribute('data-lvl', lvl);
      if (lvl <= 2) { el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); }
      el.textContent = text;
      canvas.appendChild(el);
      var n = {el: el, lvl: lvl, br: br || null};
      nodes.push(n);
      return n;
    }
    var rootN = node('AULUCK', 1, 'root', null);
    branches.forEach(function (key) {
      var def = DIAGRAM[key];
      var b = {key: key, label: def.label, e: def.e, open: false, divs: []};
      b.node = node(def.label, 2, def.e ? 'e' : '', b);
      def.divs.forEach(function (dv) {
        var d = {name: dv.name};
        d.node = node(dv.name, 3, def.e ? 'e' : '', b);
        d.cats = dv.cats.map(function (c) { return node(c, 4, def.e ? 'e' : '', b); });
        b.divs.push(d);
      });
      branchInfo.push(b);
    });
    var totalCols = 0;
    branchInfo.forEach(function (b) { totalCols += b.divs.length; });
    var colW = (W - 2 * PAD - (totalCols - branchInfo.length) * COL_GAP - (branchInfo.length - 1) * GROUP_GAP) / totalCols;

    function place(n, x, w) {
      n.el.style.left = x + 'px';
      n.el.style.width = w + 'px';
    }
    function marker(id, color) {
      return '<marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
        '<path d="M0,0 L10,5 L0,10 z" fill="' + color + '"/></marker>';
    }
    function line(d, isE, a, b, arrow) {
      var p = document.createElementNS(svgNS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', 'on' + (isE ? ' e' : ''));
      if (arrow) p.setAttribute('marker-end', 'url(#' + uid + (isE ? 'e' : 'b') + ')');
      svg.appendChild(p);
      links.push({p: p, a: a, b: b});
    }

    function layout() {
      /* show every box while measuring; setHid() hides the ones that are not open */
      nodes.forEach(function (n) { n.el.classList.remove('hid'); });
      var x = PAD;
      branchInfo.forEach(function (b, bi) {
        if (bi > 0) x += GROUP_GAP - COL_GAP;
        b.divs.forEach(function (d) { d.x = x; x += colW + COL_GAP; });
        b.x1 = b.divs[0].x;
        b.x2 = b.divs[b.divs.length - 1].x + colW;
      });
      var firstB = branchInfo[0], lastB = branchInfo[branchInfo.length - 1];
      var mid = (firstB.x1 + lastB.x2) / 2;
      place(rootN, mid - ROOT_W / 2, ROOT_W);
      branchInfo.forEach(function (b) {
        place(b.node, (b.x1 + b.x2) / 2 - BR_W / 2, BR_W);
        b.divs.forEach(function (d) {
          place(d.node, d.x, colW);
          d.cats.forEach(function (c) { place(c, d.x + LEAF_IN, colW - LEAF_IN); });
        });
      });
      // rows: AULUCK, branches, divisions, categories (stacked under each division)
      var y1 = PAD;
      rootN.el.style.top = y1 + 'px';
      var h1 = rootN.el.offsetHeight;
      var y2 = y1 + h1 + ROW_GAP;
      var h2 = 0;
      branchInfo.forEach(function (b) { b.node.el.style.top = y2 + 'px'; h2 = Math.max(h2, b.node.el.offsetHeight); });
      var y3 = y2 + h2 + ROW_GAP;
      var h3 = 0;
      branchInfo.forEach(function (b) { b.divs.forEach(function (d) { d.node.el.style.top = y3 + 'px'; h3 = Math.max(h3, d.node.el.offsetHeight); }); });
      var y4 = y3 + h3 + ROW_GAP;
      var bottom = y4;
      branchInfo.forEach(function (b) {
        b.divs.forEach(function (d) {
          var ly = y4;
          d.cats.forEach(function (c) {
            c.el.style.top = ly + 'px';
            ly += c.el.offsetHeight + LEAF_GAP;
            bottom = Math.max(bottom, ly - LEAF_GAP);
          });
        });
      });
      bottom = 0;
      nodes.forEach(function (n) { if (visible(n)) bottom = Math.max(bottom, n.el.offsetTop + n.el.offsetHeight); });
      var H = bottom + PAD;
      canvas.style.height = H + 'px';
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.innerHTML = '<defs>' + marker(uid + 'b', '#168BFF') + marker(uid + 'e', '#9B5CFF') + '</defs>';
      links = [];
      var rb = y1 + h1;
      branchInfo.forEach(function (b) {
        var bx = (b.x1 + b.x2) / 2, bt = y2, bb = y2 + b.node.el.offsetHeight;
        line('M' + mid + ' ' + rb + ' V' + ((rb + bt) / 2) + ' H' + bx + ' V' + bt, b.e, rootN, b.node, true);
        b.divs.forEach(function (d) {
          var dcx = d.x + colW / 2;
          line('M' + bx + ' ' + bb + ' V' + ((bb + y3) / 2) + ' H' + dcx + ' V' + y3, b.e, b.node, d.node, true);
          if (!d.cats.length) return;
          var tx = d.x + LEAF_IN / 2;
          var dbot = y3 + d.node.el.offsetHeight;
          var lastC = d.cats[d.cats.length - 1];
          line('M' + tx + ' ' + dbot + ' V' + (lastC.el.offsetTop + lastC.el.offsetHeight / 2), b.e, d.node, lastC, false);
          d.cats.forEach(function (c) {
            var cy = c.el.offsetTop + c.el.offsetHeight / 2;
            line('M' + tx + ' ' + cy + ' H' + (d.x + LEAF_IN - 2), b.e, d.node, c, true);
          });
        });
      });
      setScale(root._scale || 1);
    }

    function setScale(s) {
      root._scale = s;
      var H = parseFloat(canvas.style.height) || 600;
      canvas.style.transform = 'scale(' + s + ')';
      sizer.style.width = (W * s) + 'px';
      sizer.style.height = (H * s) + 'px';
    }

    function fit() {
      var avail = stage.clientWidth - 2;
      var s = Math.min(1, avail / W);
      setScale(Math.max(s, 0.6));
      /* centre the diagram on AULUCK when it is wider than the screen */
      var over = W * (root._scale || 1) - stage.clientWidth;
      stage.scrollLeft = over > 0 ? over / 2 : 0; stage.scrollTop = 0;
    }

    function visible(n) { return n.lvl <= depth || !!(n.br && n.br.open); }
    function setHid() {
      nodes.forEach(function (n) { n.el.classList.toggle('hid', !visible(n)); });
      links.forEach(function (l) { l.p.classList.toggle('hid', !(visible(l.a) && visible(l.b))); });
      if (crumb) {
        var open = branchInfo.filter(function (b) { return b.open; }).map(function (b) { return b.label; });
        crumb.innerHTML = '<b>Step ' + depth + ' of 4</b>' + (open.length ? ' &middot; open: ' + esc(open.join(' and ')) : '');
      }
    }
    /* Measure again every time the open level changes, so the canvas is tall enough for the boxes now showing. */
    function apply() { layout(); setHid(); }

    canvas.addEventListener('click', function (e) {
      var el = e.target.closest('.dg-node');
      if (!el) return;
      var n = nodes.filter(function (x) { return x.el === el; })[0];
      if (!n) return;
      if (n.lvl === 1) depth = Math.min(4, depth + 1);
      else if (n.lvl === 2 && n.br) n.br.open = !n.br.open;
      apply();
    });
    canvas.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('dg-node')) {
        e.preventDefault(); e.target.click();
      }
    });
    root.addEventListener('click', function (e) {
      var btnEl = e.target.closest('[data-dgc]');
      if (!btnEl) return;
      var c = btnEl.getAttribute('data-dgc');
      var s = root._scale || 1;
      if (c === 'fit') fit();
      else if (c === 'in') setScale(Math.min(1.6, s * 1.2));
      else if (c === 'out') setScale(Math.max(0.5, s / 1.2));
      else if (c === 'reset') { depth = 2; branchInfo.forEach(function (b) { b.open = false; }); apply(); fit(); }
      else if (c === 'all') { depth = 4; branchInfo.forEach(function (b) { b.open = true; }); apply(); }
    });

    layout();
    apply();
    fit();
    window.addEventListener('resize', function () { layout(); apply(); fit(); }, {passive: true});
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0] && es[0].isIntersecting) { layout(); apply(); fit(); }
      });
      io.observe(root);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { layout(); apply(); fit(); });
    }
  }

  $$('[data-dg]').forEach(function (r) {
    // only build after layout is stable
    buildDiagram(r);
  });

  $$('[data-dgc]').forEach(function (b) { /* controls bound in buildDiagram */ });

  /* ---------- pricing page ---------- */
  function pricingRows() {
    var rows = [];
    (D.divisions || []).forEach(function (d) {
      d.categories.forEach(function (c) {
        c.services.forEach(function (s) {
          rows.push({scope: 'business', div: d.id, divName: d.name, cat: c.group, sub: c.name, n: s.n, note: s.note, kind: s.kind, v: s.v});
        });
      });
    });
    (D.depts || []).forEach(function (d) {
      d.categories.forEach(function (c) {
        c.services.forEach(function (s) {
          rows.push({scope: 'education', div: d.id, divName: d.name, cat: c.group, sub: c.name, n: s.n, note: s.note, kind: s.kind, v: s.v});
        });
      });
    });
    return rows;
  }
  /* Services with Basic, Medium and Premium amounts go in the three boxes. Starting prices and Get Quote go in the table. */
  function isTier(r) { return r.kind !== 'quote' && r.kind !== 'from' && !!r.v && r.v.length; }
  function priceCell(r) {
    if (r.kind === 'quote' || !r.v) return '<td class="pr"><span class="pill-q">Get Quote</span></td>';
    return '<td class="pr"><span class="pill-p">' + esc(r.v) + '</span></td>';
  }

  function initPricing(root) {
    var ROWS = pricingRows();
    var state = {scope: 'all', div: 'all', price: 'all', q: ''};
    var scopeHost = $('.p-scope', root), divHost = $('.p-div', root), priceHost = $('.p-price', root), body2 = $('tbody', root), count = $('.count', root), search = $('input[type="search"]', root);
    function draw() {
      scopeHost.innerHTML = (D.scopeTabs || []).map(function (t) {
        return '<button type="button" data-ps="' + t.filter + '" aria-pressed="' + (t.filter === state.scope ? 'true' : 'false') + '">' + esc(t.label) + '</button>';
      }).join('');
      var divs = state.scope === 'education' ? (D.depts || []) : state.scope === 'business' ? (D.divisions || []) : [];
      divHost.innerHTML = divs.length ? '<span class="note" style="align-self:center;margin-right:4px">Division</span>' + [{id: 'all', name: 'All divisions'}].concat(divs).map(function (d) {
        return '<button type="button" data-pd="' + d.id + '" aria-pressed="' + (d.id === state.div ? 'true' : 'false') + '">' + esc(d.name) + '</button>';
      }).join('') : '';
      priceHost.innerHTML = [['all', 'All'], ['fixed', 'Starting price'], ['quote', 'Get Quote']].map(function (p) {
        return '<button type="button" data-pp="' + p[0] + '" aria-pressed="' + (p[0] === state.price ? 'true' : 'false') + '">' + p[1] + '</button>';
      }).join('');
      var list = ROWS.filter(function (r) {
        if (state.scope !== 'all' && r.scope !== state.scope) return false;
        if (state.div !== 'all' && r.div !== state.div) return false;
        if (state.price === 'fixed' && r.kind === 'quote') return false;
        if (state.price === 'quote' && r.kind !== 'quote') return false;
        if (state.q && norm(r.n + ' ' + r.cat + ' ' + r.sub + ' ' + r.divName).indexOf(state.q) === -1) return false;
        return true;
      });
      count.textContent = 'Showing ' + list.length + ' of ' + ROWS.length + ' services';
      var tierRows = list.filter(isTier);
      var tableRows = list.filter(function (r) { return !isTier(r); });
      var showTiers = state.price === 'all';
      [0, 1, 2].forEach(function (i) {
        var host = $('[data-tier="' + i + '"]', root);
        if (!host) return;
        if (!showTiers) { host.innerHTML = '<li>Basic, Medium and Premium prices are hidden by this filter. Choose All to see them.</li>'; return; }
        host.innerHTML = tierRows.map(function (r) {
          return '<li><span>' + esc(r.n) + '<small>' + esc(r.divName) + ' &rsaquo; ' + esc(r.cat) + '</small></span><b>' + esc(r.v[i] || '') + '</b></li>';
        }).join('') || '<li>No service matches these filters.</li>';
      });
      body2.innerHTML = tableRows.map(function (r) {
        var where = esc(r.divName) + ' &rsaquo; ' + esc(r.cat) + (r.sub !== r.cat ? ' &rsaquo; ' + esc(r.sub) : '');
        return '<tr><td>' + esc(r.n) + (r.note ? '<small style="display:block;color:var(--muted);font-size:13px">' + esc(r.note) + '</small>' : '') + '</td>' +
          '<td class="dv">' + where + '</td>' + priceCell(r) +
          '<td><a class="btn ghost sm" href="' + anchorBase + '#enquiry" data-enq="' + esc(r.n) + '">Enquire</a></td></tr>';
      }).join('') || '<tr><td colspan="4">No starting-price or Get Quote service matches these filters.</td></tr>';
      $$('[data-ps]', scopeHost).forEach(function (b) { b.addEventListener('click', function () { state.scope = b.getAttribute('data-ps'); state.div = 'all'; draw(); }); });
      $$('[data-pd]', divHost).forEach(function (b) { b.addEventListener('click', function () { state.div = b.getAttribute('data-pd'); draw(); }); });
      $$('[data-pp]', priceHost).forEach(function (b) { b.addEventListener('click', function () { state.price = b.getAttribute('data-pp'); draw(); }); });
    }
    if (search) search.addEventListener('input', function () { state.q = norm(search.value); draw(); });
    draw();
  }
  $$('[data-pricing]').forEach(initPricing);

  /* ---------- Education courses (hours from the plan) ---------- */
  var courseHost = $('#course-grid');
  if (courseHost) {
    var COURSES = D.courses || [];
    courseHost.innerHTML = COURSES.map(function (c) {
      return '<div class="course"><span class="cn">' + esc(c.n) + '</span><span>' + esc(c.d) + '</span></div>';
    }).join('') || '<p class="svc-empty">Course list is being updated. Enquire below.</p>';
  }

  /* ---------- enquiry form ---------- */
  $$('form.enq').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = $('.form-status', form);
      if (!form.reportValidity()) { status.textContent = 'Please check the highlighted fields.'; return; }
      var f = new FormData(form);
      var lines = [
        'Enquiry from the AULUCK website',
        'Name: ' + (f.get('name') || ''),
        'Email: ' + (f.get('email') || ''),
        'Phone / WhatsApp: ' + (f.get('phone') || ''),
        'Category: ' + (f.get('category') || ''),
        'Preferred contact: ' + (f.get('contact') || ''),
        'Details: ' + (f.get('details') || '')
      ];
      var msg = lines.join('\n');
      var endpoint = (CFG.formService && CFG.formService.endpoint) || '';
      if (endpoint) {
        status.textContent = 'Sending...';
        fetch(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: f.get('name'), email: f.get('email'), phone: f.get('phone'), category: f.get('category'), contact: f.get('contact'), details: f.get('details')})})
          .then(function (r) { if (!r.ok) throw new Error('bad'); status.textContent = 'Thank you. Your enquiry has been sent.'; form.reset(); })
          .catch(function () { status.textContent = 'Sending did not work. Please use the WhatsApp button to send your enquiry.'; });
      } else {
        window.open(waLink(msg), '_blank', 'noopener');
        status.textContent = 'WhatsApp opened with your details filled in. Press send there to reach AULUCK.';
      }
    });
  });

  /* ---------- small helpers ---------- */
  // scroll targets for "View Pricing" on Home: services section
  window.__aulick = {ready: true, divisionCount: (D.divisions || []).length};
})();
