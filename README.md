# Tony Kosoko Physiotherapy

The website for Tony Kosoko Physiotherapy Ltd, an advanced musculoskeletal physiotherapy practice in Notting Hill, West London.

Thirteen static pages. No build step, no framework, no dependencies.

## Running it locally

The pages use extensionless URLs (`/fees/`, not `/fees.html`), so each one is a folder containing an `index.html`. That means opening a file directly from Finder will not work: a link to `../fees/` needs a server to resolve to `fees/index.html`. Serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## What is here

```
index.html                      Home                      /
about/index.html                About Tony                /about/
services/index.html             Services overview         /services/
  services-msk/                   Musculoskeletal physiotherapy
  services-strength/              Strength and conditioning
  services-mens-health/           Men's health physiotherapy
what-to-expect/index.html       Your first appointment    /what-to-expect/
fees/index.html                 Fees and insurance        /fees/
locations/index.html            Both clinics, hours, maps /locations/
book/index.html                 Enquiry form              /book/
privacy/index.html              Privacy policy            /privacy/
terms/index.html                Terms and conditions      /terms/
cookies/index.html              Cookie policy             /cookies/

assets/css/main.css     All styling
assets/js/main.js       Header, drawer, form, maps, reveals
assets/js/chatbot.js    Chat widget
assets/img/             Photography
assets/logos/           Brand mark and accreditation logos
```

The header, footer and mobile drawer are repeated in each page rather than pulled in at runtime. That is deliberate: it keeps the site dependency-free and means any page can be edited on its own. The trade-off is that a change to the header has to be made in all thirteen files.

Every path is relative, and the inner pages sit one folder down, so their links to assets carry a `../` prefix while the home page's do not. `assets/js/chatbot.js` builds some links in JavaScript, so each page sets `window.TK_BASE` (empty on the home page, `../` elsewhere) just before loading it.

## Design

Charcoal, white and teal. Newsreader for headings, Work Sans for body text, both from Google Fonts.

Colours are CSS custom properties at the top of `main.css`, and each section picks up a palette from a small token system (`.section`, `.section--light`, `.section--teal`, `.section--cta`), so a section changes its entire colour scheme by swapping one class.

The header is a floating white pill that hides when you scroll down and returns when you scroll up. The mobile menu is a drawer with focus trapping and a scroll lock.

## The chat widget

`assets/js/chatbot.js` answers questions about fees, opening times, locations, insurance and booking, from a keyword table holding the same figures as the pages.

It works with no back end. There is a separate serverless endpoint that adds conversational replies, but it is not deployed and the widget does not need it.

Two safety features are load-bearing and should not be removed:

1. **Red flag detection** runs before anything else, on every message. Cauda equina signs, chest pain and stroke signs return an urgent care message pointing to 111, A&E or 999, and never offer an appointment.
2. **Clinical questions are refused.** Anything asking for a diagnosis, medication, or exercises gets a plain refusal and a pointer to booking an assessment.

## Before this goes live

- [ ] **The enquiry form does not submit anywhere.** `book/index.html` has `action="#"` and shows a confirmation message via JavaScript. Point it at a form service (Formspree, Basin, Netlify Forms) or enquiries will be lost.
- [ ] Confirm the email address. `info@tonykosokophysiotherapy.com` is assumed throughout.
- [ ] Add the HCPC registration number and MCSP number on `about/index.html`.
- [ ] Confirm Westway Saturday hours. The source document says 8.00am to 11.00pm, and 11.00am is assumed.
- [ ] Replace the placeholder testimonial on the home page. It is currently labelled as a placeholder.
- [ ] Confirm strength and conditioning session pricing, and accepted payment methods, on `fees/index.html`.
- [ ] **Have the legal pages reviewed.** `privacy/`, `terms/` and `cookies/` are drafts and say so on the page. The privacy policy covers clinical records as special category health data and should be read by Tony, and ideally by a data protection adviser, before publication.

Every outstanding item is also marked with a `[CONFIRM]` comment in the HTML:

```bash
grep -rn "CONFIRM" .
```

The `[CONFIRM]` markers live in `build_site.py` as well, since the pages are generated.

## Search

Every page has a unique title (all under 60 characters so Google does not truncate them), a unique meta description, a canonical URL, Open Graph and Twitter card tags, and a single `h1` with no gaps in the heading levels below it.

Structured data is one `@graph` per page, in `<head>`:

- a `MedicalBusiness` / `Physiotherapy` entity for the practice, carrying the phone number, email, the Portobello address, opening hours, the areas served and an `OfferCatalog` of the real fees
- a `Place` for Westway, with its own address and hours
- a `Person` for Tony, with his job title, King's College London, and CSP and MACP membership
- a `WebPage` and, on every page below the home page, a `BreadcrumbList` matching the visible breadcrumb trail

Opening hours are declared once, in `LOCS` in the generator, as `(days, opens, closes)`. The visible times on the page and the `openingHoursSpecification` in the schema are both derived from that, so they cannot drift apart.

`sitemap.xml`, `robots.txt` and `404.html` are all generated, so none of them can fall out of step with the pages.

### This is currently a preview build

The site is live at **https://saturnresults.co.uk/tony-kosoko-physiotherapy/** for review, and is deliberately hidden from search engines.

**Going live is one change.** Set `PREVIEW = False` at the top of `build_site.py` and rebuild. That removes the `noindex` meta tag from all thirteen pages, replaces it with an explicit `index, follow`, opens `robots.txt` and points it at the sitemap, and repoints the 404 page's links from the preview subdirectory to the domain root.

Do not hand-edit the `noindex` tags. They are generated, and the next rebuild would put them back.

### Not done, and worth doing

- **A Google Business Profile is the single biggest thing missing.** For a local practice it outweighs everything on this list. The site's structured data is built to agree with it, so the name, address, phone number and hours should be entered exactly as they appear on the Locations page.
- **HCPC and MCSP registration numbers.** They are a direct trust signal, they belong on the About page, and they would go into the schema as `identifier` entries on the `Person`. Marked `[CONFIRM]`.
- **No reviews or ratings are claimed anywhere.** `AggregateRating` markup would be tempting and is a manual penalty if the reviews are not real and visible on the page. Once Tony has genuine reviews, they can be added properly.
- **Latitude and longitude are not in the schema.** Google geocodes the postal address instead, so this is optional, but exact coordinates are better if the clinic entrances are hard to find.
- **No social profiles are linked.** If Tony has any, they should go in the `sameAs` array on the practice entity.

## Notes on the assets

The photography is licensed stock imagery, resized and optimised for the web. Check the licence terms before redistributing the image files themselves.

The accreditation logos (HCPC, CSP, MACP) belong to those organisations. The Bupa and King's College London marks are included as supplied by the client. Confirm permission with each organisation before the site goes public, as insurers in particular usually require it.

## Conventions

Proper British English, and no dashes used as punctuation anywhere in the copy. Commas, brackets and semicolons instead. Ordinary hyphens in compound words are fine.

---

Tony Kosoko Physiotherapy Ltd, company number 17176720.
