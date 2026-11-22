# AULUCK Digital website (static, 7 pages)

This folder is a complete static website. Nothing here is published, deployed or connected to any service.

## How to open it

Double-click `index.html`. It opens in any normal browser (Chrome, Edge, Firefox, Safari). No server, install or internet connection is needed except for the fonts and WhatsApp links, which need the internet when clicked.

## The 7 pages

| File | Page |
|---|---|
| `index.html` | Home |
| `business.html` | Business (services, five-level map, numbered service boxes, search, Enquire per item) |
| `education.html` | Education (five-level map, Education services) |
| `about.html` | About |
| `blogs.html` | Blogs (19 draft titles, Read full dialog) |
| `pricing.html` | Pricing (210 rows with filters) |
| `founder.html` | Founder |

Every page has the same header (logo and seven menu items, with the current page marked), a round Call and WhatsApp button at the bottom right, the enquiry form and the footer with the Terms, Privacy, Cookie and Accessibility pop-ups.

## What is in the folder

- `assets/js/config.js`: phone, WhatsApp number, email and the form setting. Change contact details here only.
- `assets/js/data.js`: the service names, notes, tab labels and blog drafts. Generated, do not edit by hand.
- `assets/js/app.js` and `assets/css/site.css`: behaviour and styling.
- `assets/img/`: the hologram images and background pictures. No generated images are used.
- `screenshots/`: check images from a test run (desktop and phone views of each page, the expanded Call and WhatsApp button, and the business map).
- `tools/`: scripts that rebuild the data and the pages, and the browser test.

## Open points

1. Phone number: `+91 80596 74233` is marked "pending confirmation" in the plan. Confirm it before publishing.
2. Enquiry form: not connected to any service. Until it is, the form opens a WhatsApp message with the details filled in. To connect a form service later, put only its public address in `formService.endpoint` in `assets/js/config.js`. No secret keys belong in any file here.
3. Blogs: the 19 titles are drafts taken from the content plan. The summaries and full text are placeholders and need writing and review before publishing.
4. Prices: the only price shown is "From ₹1,000 per finished minute" for AI video. Pricing page rows show "Get Quote" or "To be confirmed" until AULUCK confirms the amounts. The plan says 145 fixed-price and 65 Get Quote rows; the source list gives 146 "To be confirmed" and 38 "Get Quote" for Business, plus 26 Education rows marked "To be confirmed". Please check these counts against the source.
5. Business tab labels: "Solution", "Services", "Products", "Support" and "All" are kept as the brief set them. "Services", "Products" and "Support" map to the source divisions 02, 03 and 04. Check the labels are the ones you want.
6. Service lists: long lists use a "Show all" button per group instead of the slider in the plan.
7. Map level names: the names on the five-level map come from the real service list (for example "Brand Strategy & Identity", "Career Guidance"), not from the names guessed in the plan.
8. Social links: Instagram, YouTube and LinkedIn are shown as "link to be added".
9. Blog wording: the blog intro says "content plan". Review this public wording before publishing.

## Rebuild (only if the service list or pages change)

Run from this folder with the project's Python:

```
/opt/py/bin/python3 -I tools/make_data.py
/opt/py/bin/python3 -I tools/make_pages.py
```

`make_data.py` reads the service list from the source folder and never writes to it. It also checks the totals (184 Business rows, 26 Education rows).

## Run the browser check

With the test browser installed in `/tmp/aul-test`, from this folder:

```
NODE_PATH=/tmp/aul-test/node_modules node tools/test_site.js
```

It checks all 7 pages at 1280px and 360px wide, writes new screenshots to `screenshots/`, and exits with an error if any check fails.
