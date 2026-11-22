"""Builds assets/js/data.js from the real Business and Education service lists.

Names and short notes only. Prices: the only price shown anywhere is the AI video
rate from the brief ("From Rs 1,000 per finished minute"). Every other row shows
"Get Quote" (no fixed price in the source) or "To be confirmed" (fixed price in the
source, amount not yet approved for publishing).
Re-run after the source list changes:
    /opt/py/bin/python3 -I tools/make_data.py
The source folder is read only and never written.
"""
import json
import os
import sys

SRC_DIR = '/workspace/agent/projects/aulick-all-services-2026-11-19/src'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'assets', 'js', 'data.js')

sys.path.insert(0, SRC_DIR)
from data import BUSINESS, EDUCATION  # noqa: E402  (read-only import of the source lists)

AI_VIDEO_PREFIX = 'AI Video Creation'
AI_VIDEO_PRICE = 'From ₹1,000 per finished minute'


def price_for(name, tiers, scope):
    if name.startswith(AI_VIDEO_PREFIX):
        return {'p': AI_VIDEO_PRICE, 'q': False}
    if scope == 'education':
        return {'p': 'To be confirmed', 'q': False}
    if tiers is None:
        return {'p': 'Get Quote', 'q': True}
    return {'p': 'To be confirmed', 'q': False}


def build_business():
    divisions = []
    for code, name, desc, cats in BUSINESS:
        categories = []
        for cat_id, group, cat_name, services in cats:
            rows = []
            for svc_name, note, tiers in services:
                pr = price_for(svc_name, tiers, 'business')
                rows.append({'n': svc_name, 'note': note or '', 'p': pr['p'], 'q': pr['q']})
            categories.append({
                'id': cat_id,
                # Offline Marketing has no group in the source; use its own name so the diagram has a label.
                'group': group or cat_name,
                'name': cat_name,
                'services': rows,
            })
        divisions.append({
            'id': code,
            'name': name,
            'desc': desc,
            'categories': categories,
            'count': sum(len(c['services']) for c in categories),
        })
    return divisions


def build_education():
    depts = []
    for code, name, desc, cats in EDUCATION:
        categories = []
        for cat_id, group, cat_name, services in cats:
            rows = []
            for svc_name, note, tiers in services:
                pr = price_for(svc_name, tiers, 'education')
                rows.append({'n': svc_name, 'note': note or '', 'p': pr['p'], 'q': pr['q']})
            categories.append({'id': cat_id, 'group': group or cat_name, 'name': cat_name, 'services': rows})
        depts.append({
            'id': code,
            'name': name,
            'desc': desc,
            'categories': categories,
            'count': sum(len(c['services']) for c in categories),
        })
    return depts


DIVISIONS = build_business()
DEPTS = build_education()
TOTAL = sum(d['count'] for d in DIVISIONS)
EDU_TOTAL = sum(d['count'] for d in DEPTS)
assert TOTAL == 184, TOTAL  # matches the 184 Business rows in the source
assert EDU_TOTAL == 26, EDU_TOTAL  # matches the 26 Education rows in the source

# Tab labels for the Business list. 'filter' is a division id ('01'..'04') or 'all'.
BIZ_TABS = [
    {'label': 'Business', 'filter': 'all'},
    {'label': 'Solution', 'filter': '01'},
    {'label': 'Services', 'filter': '02'},
    {'label': 'Products', 'filter': '03'},
    {'label': 'Support', 'filter': '04'},
    {'label': 'All', 'filter': 'all'},
]
EDU_TABS = [
    {'label': 'All', 'filter': 'all'},
    {'label': 'Career', 'filter': '01'},
    {'label': 'Help', 'filter': '02'},
    {'label': 'Knowledge', 'filter': '03'},
]
BLOG_TABS = [
    {'label': 'All', 'filter': 'all'},
    {'label': 'Business', 'filter': 'business'},
    {'label': 'Education', 'filter': 'education'},
]
ALL_TABS = [
    {'label': 'All', 'filter': 'all'},
    {'label': 'Business', 'filter': 'business'},
    {'label': 'Education', 'filter': 'education'},
]

# Knowledge Hub draft titles, taken from the content plan (section 12, audit register).
# These are drafts, not published articles. Text is not written yet.
_DRAFTS = [
    ('Digital Marketing Strategy: A Practical Guide for Businesses', 'Digital Marketing', 'business'),
    ('SEO for Businesses: How Search Visibility Is Built', 'SEO', 'business'),
    ('Social Media Marketing: From Posting to Purpose', 'Social Media', 'business'),
    ('Paid Advertising vs Organic Marketing: Choosing the Right Mix', 'Paid Advertising', 'business'),
    ('Brand Positioning: Helping Customers Understand Why You Matter', 'Branding', 'business'),
    ('Consumer Psychology in Marketing: Understanding Decisions Ethically', 'Consumer Psychology', 'business'),
    ('The Business Growth Funnel: From Attention to Retention', 'Business Growth', 'business'),
    ('Using AI in Marketing: Practical Workflows and Responsible Review', 'AI', 'business'),
    ('A Business Website That Supports Trust and Conversion', 'Web & E-Commerce', 'business'),
    ('Data Analytics for Better Business Decisions', 'Data Analytics', 'business'),
    ('Statistics for Everyday Business: Reading Numbers Carefully', 'Statistics', 'business'),
    ('Graphic Design for Business: Clarity Before Decoration', 'Graphic Design', 'business'),
    ('Video Content Strategy: Plan Stories Before You Press Record', 'Video & Content', 'business'),
    ('Digital Skills and Career Learning: Building a Practical Foundation', 'Education & Careers', 'education'),
    ('Podcast Marketing for Businesses: Conversations That Build Context', 'Podcast & Media', 'business'),
    ('Offline Marketing in a Digital World: Connecting Physical and Online Touchpoints', 'Offline Marketing', 'business'),
    ('Influencer Marketing: Planning Creator Partnerships with Care', 'Influencer Marketing', 'business'),
    ('Email and WhatsApp Marketing: Useful Communication, Not Noise', 'Email & WhatsApp', 'business'),
    ('Local Business Visibility: Creating a Reliable Online Presence', 'Local Visibility', 'business'),
]
HUES = ['violet', 'blue', 'sunset', 'green', 'steel']
BLOGS = []
for i, (title, cluster, scope) in enumerate(_DRAFTS, start=1):
    BLOGS.append({
        'id': i,
        'title': title,
        'cluster': cluster,
        'scope': scope,
        'hue': HUES[i % len(HUES)],
        'excerpt': 'Draft title from the AULUCK content plan. The summary will be written and reviewed before publishing.',
        'body': ['This article is a draft. The full text will be written, checked and approved by AULUCK before it is published.',
                 'Until then, please use the enquiry form or WhatsApp to ask about this topic.'],
    })


def main():
    payload = {
        'divisions': DIVISIONS,
        'depts': DEPTS,
        'bizTabs': BIZ_TABS,
        'eduTabs': EDU_TABS,
        'blogTabs': BLOG_TABS,
        'allTabs': ALL_TABS,
        'blogs': BLOGS,
    }
    text = ('// Generated by tools/make_data.py from the real Business and Education service lists.\n'
            '// Names and notes only, plus the price rule (AI video rate only). Edit tab labels here.\n'
            'window.AULUCK_DATA = ' + json.dumps(payload, ensure_ascii=False, indent=1) + ';\n')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(text)
    fixed = sum(1 for d in DIVISIONS for c in d['categories'] for s in c['services'] if not s['q'])
    print('wrote', OUT, 'business', TOTAL, 'education', EDU_TOTAL,
          'quote', sum(1 for d in DIVISIONS for c in d['categories'] for s in c['services'] if s['q']),
          'fixed-to-confirm', fixed, 'blogs', len(BLOGS))


if __name__ == '__main__':
    main()
