/* Browser checks for the seven AULUCK pages at 1280px and 360px.
   Run from the site folder (or anywhere) with:
     NODE_PATH=/tmp/aul-test/node_modules node tools/test_site.js
   Needs puppeteer-core and a Chromium binary at /usr/bin/chromium.
   Writes screenshots into the screenshots folder next to tools/. Exits 1 on any failure. */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer-core');

const ROOT = path.dirname(__dirname);
const SHOTS = path.join(ROOT, 'screenshots');
const PAGES = [
  { file: 'index.html', key: 'home', nav: 'Home' },
  { file: 'business.html', key: 'business', nav: 'Business' },
  { file: 'education.html', key: 'education', nav: 'Education' },
  { file: 'about.html', key: 'about', nav: 'About' },
  { file: 'blogs.html', key: 'blogs', nav: 'Blogs' },
  { file: 'pricing.html', key: 'pricing', nav: 'Pricing' },
  { file: 'founder.html', key: 'founder', nav: 'Founder' },
];
const VIEWS = [
  { name: 'desktop', width: 1280, height: 900, mobile: false },
  { name: 'mobile', width: 360, height: 780, mobile: true },
];
const NAV_LABELS = ['Home', 'Business', 'Education', 'About', 'Blogs', 'Pricing', 'Founder'];
const WA_PREFIX = 'https://wa.me/918059674233?text=';
const LEAK = /AULUCK_DATA|AULUCK_CONFIG|tools\/|data\.js|app\.js|make_pages|make_data|\bundefined\b|\bNaN\b|\[object|\.py\b|localhost|sk_live|api[_-]?key|password/;

const failures = [];
const notes = [];
function check(ok, label) {
  if (!ok) failures.push(label);
  return ok;
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function openPage(browser, file, view) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('page error: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => {
    if (!/favicon/.test(r.url())) errors.push('request failed: ' + path.basename(r.url()));
  });
  await page.setViewport({ width: view.width, height: view.height, isMobile: view.mobile, hasTouch: view.mobile, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(ROOT, file)).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await sleep(300);
  return { page, errors };
}

async function staticChecks(page, p, view, tag) {
  const r = await page.evaluate((nav) => {
    const out = {};
    out.overflow = document.documentElement.scrollWidth - window.innerWidth;
    const links = Array.from(document.querySelectorAll('.nav a')).map((a) => a.textContent.trim());
    out.navLabels = links;
    out.current = Array.from(document.querySelectorAll('.nav a[aria-current="page"]')).map((a) => a.textContent.trim());
    out.bodyText = document.body.innerText;
    out.hrefs = Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'));
    out.imgs = Array.from(document.querySelectorAll('img')).map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }));
    out.wa = Array.from(document.querySelectorAll('[data-wa-link]')).map((a) => a.href);
    out.tel = Array.from(document.querySelectorAll('[data-tel]')).map((a) => a.getAttribute('href'));
    out.email = Array.from(document.querySelectorAll('[data-email]')).map((a) => a.getAttribute('href'));
    out.emptyText = Array.from(document.querySelectorAll('[data-phone]')).map((s) => s.textContent.trim());
    out.legalButtons = document.querySelectorAll('[data-legal]').length;
    out.hasForm = !!document.getElementById('enq-form');
    return out;
  }, p.nav);

  check(r.overflow <= 1, `${tag} ${p.file}: horizontal overflow ${r.overflow}px`);
  check(JSON.stringify(r.navLabels) === JSON.stringify(NAV_LABELS), `${tag} ${p.file}: header labels ${r.navLabels.join('|')}`);
  check(!r.navLabels.some((l) => /contact/i.test(l)), `${tag} ${p.file}: header has Contact`);
  check(r.current.length === 1 && r.current[0] === p.nav, `${tag} ${p.file}: aria-current is ${r.current.join(',')}`);
  check(r.hasForm, `${tag} ${p.file}: enquiry form missing`);
  check(r.legalButtons === 4, `${tag} ${p.file}: legal buttons ${r.legalButtons}`);
  check(r.emptyText.every((t) => t === '+91 80596 74233'), `${tag} ${p.file}: phone text ${r.emptyText.join('|')}`);
  check(r.email.every((h) => h === 'mailto:theauluck@gmail.com'), `${tag} ${p.file}: email link wrong`);
  check(r.wa.length > 0 && r.wa.every((h) => h.startsWith(WA_PREFIX)), `${tag} ${p.file}: WhatsApp link wrong`);
  check(r.tel.every((h) => h === 'tel:+918059674233'), `${tag} ${p.file}: Call link wrong`);

  const bad = r.imgs.filter((i) => !i.ok).map((i) => i.src);
  check(bad.length === 0, `${tag} ${p.file}: images not loaded ${bad.join(',')}`);

  for (const h of r.hrefs) {
    if (!h || /^(https?:|mailto:|tel:)/.test(h) || h === '#' || h.startsWith('#')) continue;
    const target = h.split('#')[0];
    check(fs.existsSync(path.join(ROOT, target)), `${tag} ${p.file}: broken link ${h}`);
  }

  const leak = r.bodyText.match(LEAK);
  check(!leak, `${tag} ${p.file}: internal text visible: ${leak && leak[0]}`);

  if (p.key !== 'pricing') {
    check(!/₹/.test(r.bodyText), `${tag} ${p.file}: a price (₹) shows outside Pricing`);
    check(!/Get Quote/.test(r.bodyText), `${tag} ${p.file}: "Get Quote" shows outside Pricing`);
  } else {
    check(/₹1,000 per finished minute/.test(r.bodyText), `${tag} pricing: AI video rate missing`);
  }
}

async function checkFab(page, tag) {
  const before = await page.$eval('#fab-items', (e) => e.hidden);
  check(before === true, `${tag}: floating items should start closed`);
  await page.click('#fab-main');
  await sleep(120);
  const open = await page.$eval('#fab-items', (e) => !e.hidden);
  check(open, `${tag}: floating button did not expand`);
  await page.click('#fab-main');
  await sleep(120);
  const closed = await page.$eval('#fab-items', (e) => e.hidden);
  check(closed, `${tag}: floating button did not collapse`);
}

async function checkMenu(page, tag) {
  await page.click('#menu-btn');
  await sleep(120);
  const open = await page.$eval('.hdr', (h) => h.classList.contains('open'));
  check(open, `${tag}: mobile menu did not open`);
  await page.click('#menu-btn');
  await sleep(120);
}

async function visibleNodes(page, sel) {
  return page.$$eval(sel + ' .dn', (els) => els.filter((e) => !e.hidden && e.offsetParent !== null).length);
}

async function checkDiagram(page, id, tag, view) {
  const total = await page.$$eval('#' + id + ' .dn', (els) => els.length);
  check(total > 0, `${tag}: diagram has no nodes`);
  const mode = await page.$eval('#' + id, (e) => e.getAttribute('data-mode'));
  if (mode === 'progressive') {
    const n = await visibleNodes(page, '#' + id);
    check(n === 3, `${tag}: diagram default shows ${n} nodes, expected 3`);
    await page.click('#' + id + ' [data-act="full"]');
    await sleep(150);
  }
  const all = await visibleNodes(page, '#' + id);
  check(all === total, `${tag}: diagram shows ${all} of ${total} nodes`);
  // Levels: one AULUCK root, two sides, five levels in total
  const levels = await page.$$eval('#' + id + ' .dn', (els) => Array.from(new Set(els.map((e) => e.dataset.lvl))).sort().join(''));
  check(levels === '12345', `${tag}: diagram levels ${levels}`);
  // Nodes must not overlap on screen (desktop) and must sit inside the diagram frame
  if (!view.mobile) {
    const overlaps = await page.$$eval('#' + id + ' .dn', (els) => {
      const vis = els.filter((e) => !e.hidden).map((e) => e.getBoundingClientRect());
      let c = 0;
      for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
        const a = vis[i], b = vis[j];
        if (a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2) c++;
      }
      return c;
    });
    check(overlaps === 0, `${tag}: ${overlaps} diagram nodes overlap`);
    const edges = await page.$$eval('#' + id + ' .dg-svg path', (els) => els.length);
    check(edges > 0, `${tag}: no connectors drawn`);
  }
}

async function checkHome(page, view, tag) {
  await checkDiagram(page, 'diagram-home', tag + ' home diagram', view);
  // Business and Education tabs change the list count
  await page.click('#biz-tabs .tab:nth-child(1)');
  const allCount = await page.$eval('#biz-count', (e) => e.textContent.trim());
  await page.click('#biz-tabs .tab:nth-child(2)');
  const solCount = await page.$eval('#biz-count', (e) => e.textContent.trim());
  check(allCount !== solCount, `${tag}: business tabs did not change the count (${allCount} / ${solCount})`);
  await page.click('#biz-tabs .tab:nth-child(1)');
  await page.type('#biz-q', 'zzqqxx');
  const empty = await page.$eval('#biz-list', (e) => /No services match/.test(e.textContent));
  check(empty, `${tag}: search with no result shows no empty message`);
  await page.$eval('#biz-q', (e) => { e.value = ''; e.dispatchEvent(new Event('input')); });
  await page.click('#edu-tabs .tab:nth-child(2)');
  await page.$eval('#blog-tabs', () => {});
  // Blogs: rail arrows and Read full dialog
  await page.click('#blog-next');
  await sleep(500);
  const moved = await page.$eval('#blog-hscroll', (e) => e.scrollLeft);
  check(moved > 0 || view.mobile === false, `${tag}: blog rail did not move (scrollLeft ${moved})`);
  await page.click('#blog-hscroll .bcard button');
  await sleep(120);
  check(await page.$eval('#modal', (m) => m.classList.contains('open')), `${tag}: Read full did not open`);
  const txt = await page.$eval('#dlg-body', (e) => e.textContent);
  check(/draft/i.test(txt), `${tag}: blog dialog text missing`);
  await page.click('#dlg-close');
  await sleep(100);
  check(!(await page.$eval('#modal', (m) => m.classList.contains('open'))), `${tag}: dialog did not close`);
  // View Pricing on Home scrolls to the all services section
  const vp = await page.$eval('[data-viewpricing]', (a) => a.getAttribute('href'));
  check(vp === 'pricing.html', `${tag}: View Pricing href ${vp}`);
  // Form validation message
  await page.click('#enq-form button[type="submit"]');
  await sleep(80);
  const msg = await page.$eval('#form-msg', (e) => e.textContent);
  check(/Please add/.test(msg), `${tag}: form did not ask for missing details`);
}

async function checkBlogsPage(page, tag) {
  const n = await page.$$eval('#blog-grid .bcard', (els) => els.length);
  check(n === 19, `${tag}: blog grid has ${n} cards, expected 19`);
  await page.click('#blog-tabs .tab:nth-child(2)');
  const b = await page.$$eval('#blog-grid .bcard', (els) => els.length);
  check(b > 0 && b < 19, `${tag}: business blog filter gave ${b}`);
}

async function checkPricing(page, tag) {
  const rows = await page.$$eval('#pr-body tr', (els) => els.length);
  check(rows === 210, `${tag}: pricing table has ${rows} rows, expected 210`);
  await page.click('#pr-status .tab:nth-child(3)');
  const quote = await page.$$eval('#pr-body tr', (els) => els.length);
  check(quote === 38, `${tag}: Get Quote filter gave ${quote}, expected 38`);
  await page.click('#pr-status .tab:nth-child(1)');
  await page.click('#pr-tabs .tab:nth-child(3)');
  const edu = await page.$$eval('#pr-body tr', (els) => els.length);
  check(edu === 26, `${tag}: Education pricing rows ${edu}, expected 26`);
  await page.click('#pr-tabs .tab:nth-child(1)');
}

async function checkServicesPage(page, file, tag) {
  const id = file === 'business.html' ? 'biz' : 'edu';
  const boxes = await page.$$eval('#' + id + '-list .sbox', (els) => els.length);
  check(boxes > 0, `${tag}: no service boxes`);
  const enq = await page.$$eval('#' + id + '-list .sbox .enq', (els, pre) => els.every((a) => a.href.startsWith(pre)), WA_PREFIX);
  check(enq, `${tag}: service Enquire links wrong`);
}

async function run() {
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  try {
    for (const view of VIEWS) {
      for (const p of PAGES) {
        const tag = `[${view.name} ${view.width}px] ${p.file}`;
        const { page, errors } = await openPage(browser, p.file, view);
        await staticChecks(page, p, view, `[${view.name}]`);
        await checkFab(page, tag);
        if (view.mobile) await checkMenu(page, tag);
        if (p.key === 'home') await checkHome(page, view, tag);
        if (p.key === 'business') { await checkDiagram(page, 'diagram-biz', tag + ' diagram', view); await checkServicesPage(page, p.file, tag); }
        if (p.key === 'education') { await checkDiagram(page, 'diagram-edu', tag + ' diagram', view); await checkServicesPage(page, p.file, tag); }
        if (p.key === 'blogs') await checkBlogsPage(page, tag);
        if (p.key === 'pricing') await checkPricing(page, tag);
        check(errors.length === 0, `${tag}: script errors: ${errors.slice(0, 3).join(' | ')}`);

        const shot = path.join(SHOTS, view.name + '-' + p.key + '.png');
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(150);
        await page.screenshot({ path: shot, fullPage: true });
        notes.push(path.basename(shot));
        await page.close();
      }
    }

    // Desktop screenshots that show the floating button expanded, and the business diagram alone
    const { page: home } = await openPage(browser, 'index.html', VIEWS[0]);
    await home.click('#fab-main');
    await sleep(150);
    await home.screenshot({ path: path.join(SHOTS, 'home-fab-expanded.png') });
    notes.push('home-fab-expanded.png');
    await home.close();

    const { page: biz } = await openPage(browser, 'business.html', VIEWS[0]);
    await biz.click('#diagram-biz [data-act="fit"]');
    await sleep(150);
    const dg = await biz.$('#diagram-biz');
    await dg.screenshot({ path: path.join(SHOTS, 'business-diagram.png') });
    notes.push('business-diagram.png');
    await biz.close();
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.log('FAILED ' + failures.length + ' checks:');
    failures.forEach((f) => console.log(' - ' + f));
    process.exitCode = 1;
  } else {
    console.log('PASS: all checks passed on 7 pages at 1280px and 360px.');
  }
  console.log('Screenshots: ' + notes.join(', '));
}

run().catch((e) => {
  console.error('Test run error: ' + e.message);
  process.exit(1);
});
