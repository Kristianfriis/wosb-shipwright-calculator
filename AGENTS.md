# AGENTS.md

This workspace contains a single-page Vue 3 web app for calculating which shipwright materials are still needed for a build.

## Project shape
- The app logic lives in [app.js](app.js) (Vue 3 Options API).
- The HTML template lives in [index.html](index.html), which loads Vue via an import map (no build step).
- Material→resource conversion formulas live in [data/formulas.json](data/formulas.json) — edit this file to change how materials consume resources.
- There is no build pipeline, package.json, or test runner in this repository.
- Keep changes simple and focused on the existing experience unless the user explicitly asks for a larger refactor.

## Conventions to preserve
- The app is mounted on `#app` with `createApp({...}).mount('#app')` in `app.js`.
- Main state lives under `this.mats` with the shape `{ builds: [...], inventory: {...} }`.
- UI uses **DaisyUI v5** component classes (`btn`, `card`, `input`, `select`, `checkbox`, `navbar`, `badge`, `alert`, `divider`, etc.) on top of **Tailwind CSS v4** utilities for layout.
- The theme is set to `data-theme="dark"` on the `<html>` element.
- Browser persistence writes to `localStorage` under the `wosb_mats` key via a deep watcher on `mats`.
- Lucide icons are loaded via CDN and re-created in the `mounted` and `updated` lifecycle hooks.
- The ship catalog is fetched from `./data/ships.json` and flattened into a flat array indexed by composite IDs.
- The `totals` computed returns `{ materials: {...}, resources: {...}, rawMaterials: {...} }` — the shopping list is split into two visual groups.
- When changing formulas (either in `data/formulas.json` or in the calculation logic), keep the displayed labels and the underlying calculations aligned so the UI remains understandable.

## Editing guidance
- Prefer small updates inside [app.js](app.js), [index.html](index.html), or [data/formulas.json](data/formulas.json) rather than introducing a bundler, framework, or external dependencies.
- If adding features, use Vue 3 Options API patterns and DaisyUI classes.
- If logic changes affect the shopping list, make sure the computed `totals` remains reactive and easy to verify in the browser.

## Validation
- Since there are no automated tests, validate changes by opening the page and checking the calculator behavior directly in the browser.
