# Serendib Software Solutions — marketing site

Single-page static site. Plain HTML, CSS and JavaScript, no build step.

```
index.html        Page markup (all sections, icon sprite)
css/styles.css    Design tokens at the top, then base, components, sections, motion
js/main.js        Nav, scroll reveal, hero starfield, contact form validation
assets/           Put logo.png here
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Still to do

- **Logo:** add `assets/logo.png`. Until then, a gradient "S" monogram is shown in its place.
  A square or near-square mark works best. It is scaled with `object-fit: contain`.
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
