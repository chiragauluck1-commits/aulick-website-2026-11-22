"""Writes the seven HTML pages of the AULUCK website from one shared template.

Pages: index.html (Home), business.html, education.html, about.html, blogs.html,
pricing.html, founder.html. Lists, diagrams, pricing rows and blog cards are filled
in by assets/js/app.js from assets/js/data.js, so the pages only hold structure.
Run from anywhere:
    /opt/py/bin/python3 -I tools/make_pages.py
Phone, email and form settings come from assets/js/config.js; never write them here.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ICON_WA = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-3.6A8 8 0 1 1 8.2 19L4 20z"/>'
           '<path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2L9 9z"/></svg>')
ICON_PHONE = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>')
ICON_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'
ICON_CHEV_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'
ICON_CHEV_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
ICON_BRIEF = ('<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/>'
              '<path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/></svg>')
ICON_PEN = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/>'
            '<path d="M13.5 6.5l4 4"/></svg>')

BG = ('<div class="bg-layer" aria-hidden="true">'
      '<img src="assets/img/bg-scroll.png" alt="" style="left:0;top:0;width:100%;height:100%;object-fit:cover">'
      '<img src="assets/img/creature-whale-solid.png" alt="" style="right:-40px;top:8%;width:360px">'
      '<img src="assets/img/creature-shark-solid.png" alt="" style="left:-60px;top:40%;width:320px">'
      '<img src="assets/img/creature-jellyfish-cyan.png" alt="" style="right:6%;top:68%;width:240px">'
      '<img src="assets/img/creature-betta-galaxy.png" alt="" style="left:4%;top:20%;width:280px">'
      '</div>\n')

NAV = [
    ('home', 'Home', 'index.html'),
    ('business', 'Business', 'business.html'),
    ('education', 'Education', 'education.html'),
    ('about', 'About', 'about.html'),
    ('blogs', 'Blogs', 'blogs.html'),
    ('pricing', 'Pricing', 'pricing.html'),
    ('founder', 'Founder', 'founder.html'),
]


def header(active):
    links = ''
    for key, label, href in NAV:
        cur = ' aria-current="page"' if key == active else ''
        links += '<a href="%s"%s>%s</a>' % (href, cur, label)
    return ('<header class="hdr"><div class="hdr-in">'
            '<a class="logo" href="index.html" aria-label="AULUCK Digital home">'
            '<img src="assets/img/logo-crop.jpg" alt="AULUCK Digital"></a>'
            '<button class="menu-btn" id="menu-btn" type="button" aria-label="Open menu" '
            'aria-expanded="false" aria-controls="nav"><span></span></button>'
            '<nav class="nav" id="nav" aria-label="Main">' + links + '</nav>'
            '</div></header>\n')


def footer():
    return ('<footer class="foot"><div class="foot-in">'
            '<div><p><strong>AULUCK Digital</strong><br>Founder: Chirag Auluck<br>'
            'Services for businesses, education and creators.</p></div>'
            '<div><h4>Pages</h4><ul>'
            '<li><a href="index.html">Home</a></li>'
            '<li><a href="business.html">Business</a></li>'
            '<li><a href="education.html">Education</a></li>'
            '<li><a href="about.html">About</a></li>'
            '<li><a href="blogs.html">Blogs</a></li>'
            '<li><a href="pricing.html">Pricing</a></li>'
            '<li><a href="founder.html">Founder</a></li></ul></div>'
            '<div><h4>Contact</h4><ul>'
            '<li><a href="mailto:" data-email></a></li>'
            '<li><a href="tel:" data-tel><span data-phone></span></a></li>'
            '<li><a href="#" data-wa-link target="_blank" rel="noopener">WhatsApp us</a></li></ul></div>'
            '<div><h4>Follow</h4><ul>'
            '<li>Instagram: link to be added</li>'
            '<li>YouTube: link to be added</li>'
            '<li>LinkedIn: link to be added</li></ul>'
            '<div class="legal">'
            '<button type="button" data-legal="Terms">Terms</button>'
            '<button type="button" data-legal="Privacy">Privacy</button>'
            '<button type="button" data-legal="Cookie">Cookie</button>'
            '<button type="button" data-legal="Accessibility">Accessibility</button>'
            '</div></div>'
            '</div>'
            '<div class="foot-bottom">&copy; 2026 AULUCK Digital. All rights reserved.</div></footer>\n')


def enquiry():
    cats = ['Business services', 'Education', 'Pricing question', 'Blogs and articles', 'Something else']
    opts = ''.join('<option value="%s">%s</option>' % (c, c) for c in cats)
    return ('<section class="sec" id="enquire" aria-labelledby="enq-title">'
            '<div class="enquire"><h2 id="enq-title">Send an enquiry</h2>'
            '<p class="intro">Tell us what you need. We reply by email or on WhatsApp.</p>'
            '<form id="enq-form" novalidate>'
            '<div class="form-grid">'
            '<div class="field"><label for="f-name">Name</label>'
            '<input id="f-name" name="name" required autocomplete="name"></div>'
            '<div class="field"><label for="f-email">Email</label>'
            '<input id="f-email" name="email" type="email" required autocomplete="email"></div>'
            '<div class="field"><label for="f-phone">Phone or WhatsApp</label>'
            '<input id="f-phone" name="phone" type="tel" required autocomplete="tel"></div>'
            '<div class="field"><label for="f-cat">Category</label>'
            '<select id="f-cat" name="category" required><option value="">Choose one</option>' + opts + '</select></div>'
            '<div class="field full"><span class="lbl" id="pref-lbl">Preferred contact method</span>'
            '<div class="radios" role="radiogroup" aria-labelledby="pref-lbl">'
            '<label><input type="radio" name="contact" value="WhatsApp" checked> WhatsApp</label>'
            '<label><input type="radio" name="contact" value="Phone call"> Phone call</label>'
            '<label><input type="radio" name="contact" value="Email"> Email</label></div></div>'
            '<div class="field full"><label for="f-details">Details</label>'
            '<textarea id="f-details" name="details" required></textarea></div>'
            '<div class="full"><label class="consent"><input type="checkbox" name="consent" required> '
            'I agree that AULUCK may contact me about this enquiry.</label></div>'
            '</div>'
            '<button class="btn solid" type="submit">Submit</button>'
            '<p class="form-msg" id="form-msg" role="status" aria-live="polite"></p>'
            '</form></div></section>\n')


def fab_and_modal():
    return ('<div class="fab">'
            '<div class="fab-items" id="fab-items" hidden>'
            '<a class="f-call" href="tel:" data-tel>' + ICON_PHONE + 'Call</a>'
            '<a class="f-wa" href="#" data-wa-link target="_blank" rel="noopener">' + ICON_WA + 'WhatsApp</a>'
            '</div>'
            '<button class="fab-main" id="fab-main" type="button" aria-expanded="false" '
            'aria-controls="fab-items" aria-label="Call or WhatsApp us">' + ICON_PHONE + '</button>'
            '</div>\n'
            '<div class="modal" id="modal" role="dialog" aria-modal="true" aria-hidden="true" '
            'aria-labelledby="dlg-title">'
            '<div class="dialog"><div class="dlg-head"><div>'
            '<h2 id="dlg-title"></h2><p class="sub" id="dlg-sub"></p></div>'
            '<button class="x" id="dlg-close" type="button" aria-label="Close">&times;</button></div>'
            '<div class="dlg-body" id="dlg-body"></div></div></div>\n')


def page(title, desc, active, main):
    body_cls = active if active in ('business', 'education') else ''
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '<title>' + title + '</title>\n'
            '<meta name="description" content="' + desc + '">\n'
            '<link rel="stylesheet" href="assets/css/site.css">\n</head>\n<body class="%s" data-page="%s">\n' % (body_cls, active) +
            '<a class="skip" href="#main">Skip to content</a>\n'
            + BG + header(active) +
            '<main id="main" class="wrap">\n' + main + '\n</main>\n'
            + footer() + fab_and_modal() +
            '<script src="assets/js/config.js"></script>\n'
            '<script src="assets/js/data.js"></script>\n'
            '<script src="assets/js/app.js"></script>\n</body>\n</html>\n')


def sec_head(title_id, title, icon=ICON_BRIEF, tag='h2'):
    return ('<div class="sec-head"><%s class="sec-title" id="%s">' % (tag, title_id) + icon + title +
            '</%s><span class="rule"></span></div>' % tag)


def list_block(prefix, title_id, title, intro, label, icon=ICON_BRIEF, tabs_class=''):
    """A tabs + search + grouped list section used for Business, Education and All Services."""
    return ('<div class="sec-head"><h2 class="sec-title" id="%s">' % title_id + icon + title +
            '</h2><span class="rule"></span></div>'
            '<p class="intro">' + intro + '</p>'
            '<div class="tabs" id="%s-tabs" role="group" aria-label="%s"></div>' % (prefix, label) +
            '<div class="toolbar"><label class="search">' + ICON_SEARCH +
            '<input id="%s-q" type="search" placeholder="Search services" aria-label="Search %s"></label>'
            '<span class="count" id="%s-count" aria-live="polite"></span></div>' % (prefix, label, prefix) +
            '<p class="cur" id="%s-current" aria-live="polite"></p>' % prefix +
            '<div class="svc-list" id="%s-list"></div>' % prefix)


def diagram_block(key, sides, caption, mode='full'):
    return ('<div class="diagram" id="diagram-%s" data-sides="%s" data-mode="%s" data-caption="%s"></div>' % (key, sides, mode, caption))


def hero(title, lead, extra=''):
    return ('<section class="hero" aria-labelledby="hero-title"><h1 id="hero-title">' + title + '</h1>'
            '<p class="lead">' + lead + '</p>'
            '<div class="hero-cta"><a class="btn solid" href="pricing.html" data-viewpricing>View Pricing</a>'
            '<a class="btn" href="#enquire">Send an enquiry</a>' + extra + '</div></section>\n')


def home_main():
    faq = [
        ('What does AULUCK offer?',
         'Business services in four divisions (Solutions, Marketing, Print Media and Branding), and education '
         'in three areas (Career, Help and Knowledge). Use the lists above to find what you need.'),
        ('Where can I see prices?',
         'Only on the Pricing page. Some prices are shown as "To be confirmed", and some services are quoted '
         'after a short talk with AULUCK.'),
        ('How do I get in touch?',
         'Use the floating Call or WhatsApp button, or send the enquiry form on this page.'),
    ]
    faq_html = ''.join('<details class="faq"><summary>%s</summary><p>%s</p></details>' % q for q in faq)
    return (
        hero('AULUCK Digital',
             'Business services, education and ideas in one place. Start with the diagram, '
             'then choose a list below.') +
        '<section class="sec" id="diagram-sec" aria-labelledby="diag-title">'
        '<div class="sec-head"><h2 class="sec-title" id="diag-title">' + ICON_BRIEF + 'HOW IT FITS</h2>'
        '<span class="rule"></span></div>' +
        diagram_block('home', 'business,education',
                      'Start with AULUCK. Each click opens the next level. Show full diagram opens all five steps.', 'progressive') +
        '</section>\n'
        '<section class="sec business" id="business" aria-labelledby="biz-title">' +
        list_block('biz', 'biz-title', 'BUSINESS',
                   'Pick a tab, then tap Enquire beside any service. Prices are on the Pricing page.',
                   'Business categories') +
        '<div class="center-btn"><a class="btn solid" href="pricing.html" data-viewpricing>View Pricing</a></div>'
        '</section>\n'
        '<section class="sec education" id="education" aria-labelledby="edu-title">' +
        list_block('edu', 'edu-title', 'EDUCATION',
                   'Career, help and knowledge courses. Tap Enquire to ask about any course.',
                   'Education areas', ICON_PEN) +
        '</section>\n'
        '<section class="sec" id="founder-teaser" aria-labelledby="ft-title">'
        '<div class="teaser"><div class="holo-card"><img src="assets/img/hologram-03.png" alt=""></div>'
        '<div><h2 id="ft-title">Founder: Chirag Auluck</h2>'
        '<p>Chirag Auluck is the founder of AULUCK. His work is shaped by an interest in consumer psychology, '
        'brand perception and the ways digital communication influences trust.</p>'
        '<a class="btn" href="founder.html">Read about the founder</a></div></div></section>\n'
        '<section class="sec" id="blogs" aria-labelledby="blogs-title">' +
        '<div class="sec-head"><h2 class="sec-title" id="blogs-title">' + ICON_PEN + 'BLOGS</h2>'
        '<span class="rule"></span></div>'
        '<p class="intro">Short reads from the AULUCK content plan. These are drafts; titles are shown, full text is to be added after review.</p>'
        '<div class="tabs" id="blog-tabs" role="group" aria-label="Blog categories"></div>'
        '<div class="toolbar"><label class="search">' + ICON_SEARCH +
        '<input id="blog-q" type="search" placeholder="Search blogs" aria-label="Search blogs"></label>'
        '<span class="count" id="blog-count" aria-live="polite"></span></div>'
        '<div class="hscroll-row"><button class="arr" id="blog-prev" type="button" aria-label="Previous blogs">' + ICON_CHEV_L + '</button>'
        '<div class="hscroll" id="blog-hscroll"></div>'
        '<button class="arr" id="blog-next" type="button" aria-label="Next blogs">' + ICON_CHEV_R + '</button></div>'
        '<div class="center-btn"><a class="btn solid" href="blogs.html">View All blogs</a></div>'
        '</section>\n'
        '<section class="sec" id="all-services" aria-labelledby="all-title">' +
        list_block('all', 'all-title', 'ALL SERVICES',
                   'Every Business and Education service in one list. No prices here; see the Pricing page.',
                   'All services') +
        '</section>\n'
        + enquiry() +
        '<section class="sec" id="faq" aria-labelledby="faq-title"><h2 class="sec-title" id="faq-title">FAQ</h2>'
        '<div class="faqs">' + faq_html + '</div></section>\n')


def business_main():
    return (hero('Business services',
                 'Four divisions: Solutions, Marketing, Print Media and Branding. Follow the diagram, then '
                 'use the full list below.') +
            '<section class="sec business" aria-labelledby="diag-biz-title">'
            '<div class="sec-head"><h2 class="sec-title" id="diag-biz-title">' + ICON_BRIEF + 'BUSINESS MAP</h2>'
            '<span class="rule"></span></div>' +
            diagram_block('biz', 'business',
                          'On the real site, the diagram opens one level per click. All five steps are shown here.') +
            '</section>\n'
            '<section class="sec business" id="biz-services" aria-labelledby="biz-title">' +
            list_block('biz', 'biz-title', 'BUSINESS',
                       'Pick a tab, then tap Enquire beside any service. Prices are on the Pricing page.',
                       'Business categories') +
            '<div class="center-btn"><a class="btn solid" href="pricing.html" data-viewpricing>View Pricing</a></div>'
            '</section>\n' + enquiry())


def education_main():
    return (hero('Education',
                 'Career guidance, student help and knowledge courses. Follow the diagram, then use the full list below.') +
            '<section class="sec education" aria-labelledby="diag-edu-title">'
            '<div class="sec-head"><h2 class="sec-title" id="diag-edu-title">' + ICON_PEN + 'EDUCATION MAP</h2>'
            '<span class="rule"></span></div>' +
            diagram_block('edu', 'education',
                          'On the real site, the diagram opens one level per click. All five steps are shown here.') +
            '</section>\n'
            '<section class="sec education" id="edu-services" aria-labelledby="edu-title">' +
            list_block('edu', 'edu-title', 'EDUCATION',
                       'Tap Enquire to ask about any course or area. Course details are confirmed with AULUCK.',
                       'Education areas', ICON_PEN) +
            '</section>\n' + enquiry())


def about_main():
    return (hero('About AULUCK',
                 'AULUCK Digital brings business services and education together, so that clear thinking '
                 'leads to clear action.') +
            '<section class="sec" aria-labelledby="story-title"><h2 class="sec-title" id="story-title">OUR STORY</h2>'
            '<div class="panel-text"><p>AULUCK Digital is a small, focused team of services. The story of how it began '
            '<strong>to be added</strong>.</p>'
            '<p>Today AULUCK works in two connected parts: Business (Solutions, Marketing, Print Media and Branding) '
            'and Education (Career, Help and Knowledge).</p></div></section>\n'
            '<section class="sec" aria-labelledby="phil-title"><h2 class="sec-title" id="phil-title">PHILOSOPHY</h2>'
            '<div class="cards3">'
            '<div class="pcard"><h3>Perception</h3><p>How people see a business shapes what they expect.</p></div>'
            '<div class="pcard"><h3>Trust</h3><p>Clear, honest communication earns the trust that growth needs.</p></div>'
            '<div class="pcard"><h3>Growth</h3><p>Growth follows when perception and trust work together.</p></div>'
            '</div></section>\n'
            '<section class="sec" aria-labelledby="approach-title"><h2 class="sec-title" id="approach-title">APPROACH</h2>'
            '<ol class="steps"><li><strong>Understand</strong> the business, its customers and its limits.</li>'
            '<li><strong>Choose</strong> the services that fit, with a quote where needed.</li>'
            '<li><strong>Deliver</strong> with a clear point of contact.</li></ol></section>\n'
            '<section class="sec" aria-labelledby="connect-title"><h2 class="sec-title" id="connect-title">HOW BUSINESS AND EDUCATION CONNECT</h2>'
            '<div class="panel-text"><p>Business services and education share one idea: people make better '
            'decisions when they understand the work behind them. Education helps people learn the skills; '
            'Business helps organisations use them.</p></div></section>\n'
            '<section class="sec" aria-labelledby="work-title"><h2 class="sec-title" id="work-title">OUR WORK</h2>'
            '<div class="panel-text"><p>Approved project examples will be added here. <strong>To be added.</strong></p></div></section>\n'
            '<section class="sec"><div class="teaser"><div class="holo-card"><img src="assets/img/hologram-02.png" alt=""></div>'
            '<div><h2>Meet the founder</h2><p>Read about Chirag Auluck, the founder of AULUCK, and the thinking behind it.</p>'
            '<a class="btn solid" href="founder.html">Founder page</a></div></div></section>\n'
            + enquiry())


def blogs_main():
    return ('<section class="sec" aria-labelledby="blogs-page-title">'
            '<div class="sec-head"><h1 class="sec-title" id="blogs-page-title">' + ICON_PEN + 'BLOGS</h1>'
            '<span class="rule"></span></div>'
            '<p class="intro">Drafts from the AULUCK content plan. Titles are shown; the full text is to be written and reviewed before publishing.</p>'
            '<div class="tabs" id="blog-tabs" role="group" aria-label="Blog categories"></div>'
            '<div class="toolbar"><label class="search">' + ICON_SEARCH +
            '<input id="blog-q" type="search" placeholder="Search blogs" aria-label="Search blogs"></label>'
            '<span class="count" id="blog-count" aria-live="polite"></span></div>'
            '<div class="bgrid" id="blog-grid"></div>'
            '</section>\n' + enquiry())


def pricing_main():
    return ('<section class="sec" aria-labelledby="pricing-title">'
            '<div class="sec-head"><h1 class="sec-title" id="pricing-title">' + ICON_BRIEF + 'PRICING</h1>'
            '<span class="rule"></span></div>'
            '<p class="intro">Every service, with its price or a quote option. Prices to be confirmed by AULUCK.</p>'
            '<div class="tabs tabs3" id="pr-tabs" role="group" aria-label="Pricing scope"></div>'
            '<div class="tabs tabs3" id="pr-status" role="group" aria-label="Price type">'
            '<button class="tab" type="button" data-status="all" aria-pressed="true">All prices</button>'
            '<button class="tab" type="button" data-status="confirm" aria-pressed="false">Fixed price</button>'
            '<button class="tab" type="button" data-status="quote" aria-pressed="false">Get Quote</button></div>'
            '<div class="toolbar"><label class="search">' + ICON_SEARCH +
            '<input id="pr-q" type="search" placeholder="Search services" aria-label="Search services"></label>'
            '<span class="count" id="pr-count" aria-live="polite"></span></div>'
            '<div class="twrap"><table class="ptable"><caption class="sr">Services and prices</caption>'
            '<thead><tr><th scope="col">Service</th><th scope="col">Area</th><th scope="col">Category</th>'
            '<th scope="col">Price</th><th scope="col"><span class="sr">Enquire</span></th></tr></thead>'
            '<tbody id="pr-body"></tbody></table></div>'
            '<p class="note">Prices to be confirmed by AULUCK. The only published rate is for AI video: from '
            '₹1,000 per finished minute.</p>'
            '</section>\n' + enquiry())


def founder_main():
    return ('<section class="sec" aria-labelledby="founder-title">'
            '<div class="teaser big"><div class="holo-card"><img src="assets/img/hologram-01.png" alt=""></div>'
            '<div><h1 id="founder-title">Chirag Auluck</h1><p class="lead">Founder of AULUCK</p>'
            '<p>Chirag Auluck is the founder of AULUCK. His work is shaped by an interest in consumer psychology, '
            'brand perception, premium positioning and the ways digital communication influences trust and customer '
            'decisions.</p>'
            '<p>Through AULUCK, he is developing a connected approach to solutions, marketing, print media, branding '
            'and education. His stated areas of focus include digital trust systems, conversion behaviour, strategy '
            'and AI-enhanced execution.</p>'
            '<div class="hero-cta"><a class="btn solid" href="pricing.html" data-viewpricing>View Pricing</a>'
            '<a class="btn" href="#enquire">Send an enquiry</a></div></div></div></section>\n'
            '<section class="sec" aria-labelledby="phil-f"><h2 class="sec-title" id="phil-f">PHILOSOPHY</h2>'
            '<div class="cards3"><div class="pcard"><h3>Perception</h3><p>How customers see a business.</p></div>'
            '<div class="pcard"><h3>Trust</h3><p>What makes people trust a brand.</p></div>'
            '<div class="pcard"><h3>Growth</h3><p>What follows when trust is in place.</p></div></div>'
            '<p class="note">Founder explanation of this philosophy: <strong>to be added</strong>.</p></section>\n'
            '<section class="sec" aria-labelledby="tl-title"><h2 class="sec-title" id="tl-title">TIMELINE</h2>'
            '<div class="panel-text"><p>Milestones and dates: <strong>to be added</strong>, once confirmed by the founder.</p></div></section>\n'
            '<section class="sec" aria-labelledby="proof-title"><h2 class="sec-title" id="proof-title">SELECTED WORK</h2>'
            '<div class="panel-text"><p>Approved projects, public profiles and official links: <strong>to be added</strong>.</p>'
            '<p class="quote">&ldquo;Quote to be added.&rdquo;</p></div></section>\n'
            + enquiry())


def write(name, html):
    with open(os.path.join(ROOT, name), 'w', encoding='utf-8') as f:
        f.write(html)
    print('wrote', name)


def main():
    write('index.html', page('AULUCK Digital | Home',
                             'AULUCK Digital: business services, education, blogs and an enquiry form.',
                             'home', home_main()))
    write('business.html', page('AULUCK Digital | Business',
                                'AULUCK Business: Solutions, Marketing, Print Media and Branding services.',
                                'business', business_main()))
    write('education.html', page('AULUCK Digital | Education',
                                 'AULUCK Education: career guidance, student help and knowledge courses.',
                                 'education', education_main()))
    write('about.html', page('AULUCK Digital | About',
                             'About AULUCK Digital: our story, philosophy and approach.',
                             'about', about_main()))
    write('blogs.html', page('AULUCK Digital | Blogs',
                             'AULUCK blog drafts on business and education. Full text to be added.',
                             'blogs', blogs_main()))
    write('pricing.html', page('AULUCK Digital | Pricing',
                               'AULUCK pricing: every service with its price or a quote option.',
                               'pricing', pricing_main()))
    write('founder.html', page('Chirag Auluck | Founder of AULUCK',
                               'Meet Chirag Auluck, founder of AULUCK. Business philosophy, focus on perception and trust.',
                               'founder', founder_main()))


if __name__ == '__main__':
    main()
