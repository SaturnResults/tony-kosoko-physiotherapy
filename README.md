# Tony Kosoko Physiotherapy

The website for Tony Kosoko Physiotherapy Ltd, an advanced musculoskeletal physiotherapy practice in Notting Hill, West London.

Thirteen static pages. No build step, no framework, no dependencies. Open `index.html` in a browser and it runs.

## Running it locally

Double-clicking `index.html` works, because every path is relative. To exercise it properly (the booking bar passes the chosen service and location to the booking page through the query string), serve the folder instead:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## What is here

```
index.html              Home
about.html              About Tony
services.html           Services overview
  services-msk.html         Musculoskeletal physiotherapy
  services-strength.html    Strength and conditioning
  services-mens-health.html Men's health physiotherapy
what-to-expect.html     Your first appointment
fees.html               Fees and insurance
locations.html          Both clinics, hours, maps
book.html               Enquiry form
privacy.html            Privacy policy
terms.html              Terms and conditions
cookies.html            Cookie policy

assets/css/main.css     All styling
assets/js/main.js       Header, drawer, form, maps, reveals
assets/js/chatbot.js    Chat widget
assets/img/             Photography
assets/logos/           Brand mark and accreditation logos
```

The header, footer and mobile drawer are repeated in each page rather than pulled in at runtime. That is deliberate: it keeps the site dependency-free and means any page can be edited on its own. The trade-off is that a change to the header has to be made in all thirteen files.

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

- [ ] **The enquiry form does not submit anywhere.** `book.html` has `action="#"` and shows a confirmation message via JavaScript. Point it at a form service (Formspree, Basin, Netlify Forms) or enquiries will be lost.
- [ ] Confirm the email address. `info@tonykosokophysiotherapy.com` is assumed throughout.
- [ ] Add the HCPC registration number and MCSP number on `about.html`.
- [ ] Confirm Westway Saturday hours. The source document says 8.00am to 11.00pm, and 11.00am is assumed.
- [ ] Replace the placeholder testimonial on the home page. It is currently labelled as a placeholder.
- [ ] Confirm strength and conditioning session pricing, and accepted payment methods, on `fees.html`.
- [ ] **Have the legal pages reviewed.** `privacy.html`, `terms.html` and `cookies.html` are drafts and say so on the page. The privacy policy covers clinical records as special category health data and should be read by Tony, and ideally by a data protection adviser, before publication.

Every outstanding item is also marked with a `[CONFIRM]` comment in the HTML:

```bash
grep -rn "CONFIRM" .
```

## Notes on the assets

The photography is licensed stock imagery, resized and optimised for the web. Check the licence terms before redistributing the image files themselves.

The accreditation logos (HCPC, CSP, MACP) belong to those organisations. The Bupa and King's College London marks are included as supplied by the client. Confirm permission with each organisation before the site goes public, as insurers in particular usually require it.

## Conventions

Proper British English, and no dashes used as punctuation anywhere in the copy. Commas, brackets and semicolons instead. Ordinary hyphens in compound words are fine.

---

Tony Kosoko Physiotherapy Ltd, company number 17176720.
