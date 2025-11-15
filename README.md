# Nepali Gospel Circle Website

Static, multilingual church website built with [Hugo](https://gohugo.io/). The site serves both English and Nepali visitors, exposes data-driven sections (services, events, leadership, messages, etc.), and includes quick access to church social channels and online Bible links.

## Tech Stack

- **Hugo** (v0.148+ extended) – static-site generator
- **Go modules** – theme/assets dependencies
- **Vanilla CSS/JS** – located in `static/css/style.css` and `static/js/main.js`
- **Netlify** (optional) – production hosting, build command `hugo`

## Local Development

1. Install Hugo extended.
2. Clone the repo and install Go modules:  
   ```bash
   hugo mod get
   ```
3. Start the dev server (includes both languages):  
   ```bash
   hugo server -D
   ```
4. Visit `http://localhost:1313` (English) or `http://localhost:1313/ne` (Nepali).

Running `hugo` in the project root builds the production-ready site into `public/`.

## Project Layout

```
├── config.yaml            # Global site config, menus, church metadata, social & Bible links
├── content/               # Individual pages (unused for landing page sections)
├── data/                  # YAML data powering cards/grids (services, events, team, messages)
├── i18n/                  # Translation files for English/Nepali strings
├── layouts/               # Hugo templates (home page, partials, base markup)
├── static/                # Compiled assets served verbatim (CSS, JS, images)
└── public/                # Generated output (ignored in deployment; kept here for reference)
```

### Key Files

- `layouts/index.html` – homepage sections (hero, about, services, messages, events, leadership, contact, Bible CTA).
- `layouts/partials/header.html` & `layouts/partials/footer.html` – navigation, language switcher, footer links.
- `static/css/style.css` – single CSS entry; includes layout, responsive breakpoints, and component styles.
- `static/js/main.js` – interactions: hero slider, animations, video modal, smooth scrolling, FAB, language drop-down, etc.
- `data/*.yaml` – structured content per language (`en`, `ne`) for services, team, events, messages, etc.
- `i18n/*.yaml` – translation keys referenced via `{{ i18n "key" }}` in templates.

## Editing Content

### Text/Translations
- Edit `i18n/en.yaml` or `i18n/ne.yaml` to update strings used via `i18n` helper.
- Ensure new string IDs exist in both files.

### Structured Sections
- Update YAML under `data/`:
  - `data/services.yaml`
  - `data/events.yaml`
  - `data/messages.yaml`
  - `data/team.yaml`
- Each file stores separate arrays for English (`en`) and Nepali (`ne`).

### Church Metadata / Links
- `config.yaml` → `params.church`, `params.services`, `params.social`, and `params.bible`.
- Bible CTAs (Nepali NNRV & English ASV) rendered from `params.bible.*`.

### Assets
- Place static images under `static/images/`.
- Flags for the language switcher live in `static/images/flags/`.

## Adding New Sections

1. Create a new partial or extend `layouts/index.html`.
2. Add necessary translation keys in both `i18n` files.
3. If the section uses structured content, prefer a `data/*.yaml` file.
4. Style via `static/css/style.css`; keep comments minimal and align with existing structure.

## Deployment Notes

- Default `baseURL` points to `https://nepaligospelcircle.com/`.
- Ensure `public/` is regenerated (`hugo`) before committing if that folder is tracked.
- Keep API keys or secrets out of the repo; use Netlify/CI environment variables for future integrations (e.g., automated YouTube data fetch).

## Future Enhancements

- Automate YouTube messages (YouTube Data API script writing into `data/messages.yaml`).
- Add analytics or form handling via Netlify Functions/forms if needed.
- Expand Bible section to include more translations or embed reading plans.

Feel free to open issues or PRs with improvements. Review `static/js/main.js` for any front-end interactions you plan to modify—many features (hero slider, modals, etc.) initialize there and expect specific DOM hooks.


Author: Bikram Lamsal