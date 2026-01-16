# Copilot / AI Agent Instructions for Hatrix Website

This project is a Next.js (app directory) storefront that uses Firebase (Auth + Firestore), a simulated payments API, Tailwind, and some 3D/Three.js UI components. Agents should be pragmatic: make minimal, consistent changes and preserve Turkish naming and UX expectations.

- **Big picture:** The app uses the Next 13+/16 `app/` routing model. UI lives under `src/app/*`; server routes are under `src/app/api/*` (e.g. payments at `src/app/api/odeme/route.js`). Client code often runs in files with `"use client"` (example: [src/app/page.js](src/app/page.js)).
- **State & persistence:** The shopping cart is stored in `localStorage` (see [src/app/page.js](src/app/page.js)) and synced with Firebase auth when available. Be careful when changing cart semantics—keep localStorage persistence intact.
- **Firebase usage:** Shared Firebase config/provider is in [src/lib/firebase.js](src/lib/firebase.js). Some client pages also read globals (`__firebase_config`, `__initial_auth_token`) to initialize Firebase (see [src/app/page.js](src/app/page.js)). Prefer using `src/lib/firebase.js` for centralized refactors; do not hard-code secrets into files — use environment variables for production.
- **Server vs client boundaries:** Any secret or payment integration must live in server code under `src/app/api/*`. The payment endpoint currently simulates a bank response in [src/app/api/odeme/route.js](src/app/api/odeme/route.js). If implementing real payment flows, import and call `iyzipay` or `stripe` from that file only.
- **Scripts / workflows:** Use the npm scripts in `package.json`: `npm run dev` (dev server), `npm run build` (production build), `npm run start` (serve), and `npm run lint` (eslint). Tests are not present—avoid introducing test frameworks without approval.
- **Conventions & patterns:**
  - File and route names use Turkish labels and kebab-case directories (e.g. tum-urunler, giris, kayit). Keep messaging language consistent unless told to localize.
  - Visual components and small UI helpers live in `src/app/components/` (example: [src/app/components/girisEkran.js](src/app/components/girisEkran.js)).
  - Client components include `"use client"` at top; server components omit it. Preserve this separation when moving code between client/server.
- **Dependencies to watch:** `firebase` (auth + firestore), `iyzipay` (present in package.json but not used in server route yet), `@react-three/fiber` and `three` (3D views). Avoid adding duplicate versions of these libs.
- **Examples of actionable tasks:**
  - When adding a new server-only secret, put it in environment variables and read it in `src/app/api/*` (do not expose secrets to client bundles).
  - To add product queries, extend Firestore reads in `src/app/page.js` (watch the `onSnapshot` usage) or centralize via helper functions in `src/lib/`.
  - To integrate real payments, replace the simulation in `src/app/api/odeme/route.js` with the `iyzipay` call and keep the client-side call as a POST to `/api/odeme`.
- **Safety & expectations:**
  - Preserve existing UX (Turkish labels, cart flow, anonymous auth fallback). Minimal UI refactors are fine; avoid large visual redesigns without approval.
  - Run `npm run dev` locally to validate hot-reload behavior before opening a PR; builds may fail if Next or Tailwind config is changed.

If any of these areas are unclear or you want me to expand a section (e.g., exact lines to change for payment integration, or centralizing Firebase initialization), tell me which area to refine and I will iterate.
