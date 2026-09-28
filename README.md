# Serendib Software Solutions — marketing site

Single-page static site. Plain HTML, CSS and JavaScript, no build step.

```
index.html        Page markup (all sections, icon sprite)
css/styles.css    Design tokens at the top, then base, components, sections, motion
js/main.js        Nav, scroll reveal, hero starfield, contact form validation
assets/           logo-mark.png (nav, footer), logo-icon.png (hero), favicons, og-image.jpg
                  logo.png is the 5.8 MB source image; it is no longer loaded by the page
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Still to do

- **Logo:** the page uses crops of `assets/logo.png`. For the sharpest result, get the "S" symbol as an SVG
  or a transparent PNG from whoever designed the logo, and replace `logo-mark.png` and `logo-icon.png`.
- **Selected work:** replace the `[Industry]`, `[Project name]`, `[Description]`, `[Tech]` and `[Result]`
  placeholders in the `#work` section. To add a screenshot, swap the `.work-media` div for an `<img>`
  (see the comment in the HTML).
- **Contact details:** replace the bracketed email, phone, city and hours, plus the `mailto:`/`tel:` links.
- **Contact form:** it validates but doesn't send anything yet. Replace `submitContactForm()` in
  `js/main.js` with a real request (your API, Formspree, Netlify Forms, etc.).

## Brand tokens

All colours, fonts, radii and spacing are CSS custom properties in `:root` at the top of
`css/styles.css`. The blue→teal gradient (`--gradient-brand`) is intentionally limited to the primary
CTA, the eyebrow accent bars and the active nav underline.
