# AGENTS.md

This workspace contains a single-page Alpine.js web app for calculating which shipwright materials are still needed for a build.

## Project shape
- The main application lives in [index.html](index.html).
- The app is intentionally lightweight and static; there is no build pipeline, package.json, or test runner in this repository.
- Keep changes simple and focused on the existing single-file experience unless the user explicitly asks for a larger refactor.

## Conventions to preserve
- Preserve the current Alpine.js pattern: the app is initialized with `x-data="shipwrightApp()"` and the main state is stored under `mats`.
- Keep the UI styling consistent with the existing Tailwind-based dark theme.
- Preserve the browser persistence behavior that writes to localStorage under the `wosb_mats` key.
- When changing formulas, keep the displayed labels and the underlying calculations aligned so the UI remains understandable.

## Editing guidance
- Prefer small updates inside [index.html](index.html) rather than introducing new framework or build tooling.
- If adding features, favor plain HTML, Alpine.js, and Tailwind utilities over introducing a bundler, framework, or external dependencies.
- If logic changes affect the shopping list, make sure the totals remain reactive and easy to verify in the browser.

## Validation
- Since there are no automated tests, validate changes by opening the page and checking the calculator behavior directly in the browser.
