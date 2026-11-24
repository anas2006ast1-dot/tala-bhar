# npm audit triage

Reviewed 2026-11-24 on `feat/r2-menu-image-migration` after `npm ci`. The lockfile reports 10 vulnerable package nodes: 5 moderate and 5 high, with no critical findings. `npm audit --omit=dev` reports only two moderate package nodes: `react-router` and its direct wrapper `react-router-dom`.

## Runtime dependency findings

- `react-router-dom` / `react-router` 6.30.4: the open-redirect advisory affects versions before 7.18.0. In this app, all `navigate()` and `<Navigate to>` destinations are fixed internal route literals; no URL parameter, database value, or other user input becomes a router destination. That makes the reported path unavailable through current app code, but this remains a production dependency finding. The other React Router advisory concerns SSR hydration; this app is a client-rendered `BrowserRouter` app and does not use Framework/Data Mode SSR hydration. A fix requires a React Router major-version upgrade, so do not apply it without reviewing the migration and testing routes. See [open redirect advisory](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6) and [SSR hydration advisory](https://github.com/advisories/GHSA-337j-9hxr-rhxg).

## Development/build dependency findings

These are present in the install used for local development/build but are dev-only and do not ship in the Vite production bundle:

- `vite` and `esbuild`: dev-server file disclosure/request handling issues. The relevant exposure is a reachable development server, not the built static site. Do not expose `vite --host` to public/untrusted networks. See [Vite advisory](https://github.com/vitejs/vite/security/advisories/GHSA-4w7w-66w2-5vf9).
- `postcss` and `source-map-js`: source-map path traversal/disclosure in CSS/source-map processing. This build processes the repository's own CSS; no user CSS is uploaded or processed by the deployed app. See [PostCSS advisory](https://github.com/postcss/postcss/security/advisories/GHSA-r28c-9q8g-f849).
- `browserslist` and `baseline-browser-mapping`: build metadata processing and resource-exhaustion issues; not browser runtime code.
- `nanoid` and `postcss-selector-parser`: transitive build-tool issues; the application does not import them in runtime source.

No broad `npm audit fix` was run. Patch-level fixes available inside existing semver ranges may be applied separately; Vite's recommended fix currently crosses the project's Vite major, while the React Router fix crosses its major. Re-run `npm audit` before and after any targeted dependency change and rerun the production build/tests.
