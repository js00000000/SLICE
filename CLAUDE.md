# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build  (REQUIRED before committing — see GEMINI.md)
npm run build:dev    # build with --mode local
npm run lint         # eslint .
npm test             # vitest run  (unit tests; excludes e2e/)
npx vitest run path/to/file.test.ts        # single test file
npx vitest run -t "name of test"           # single test by name
npm run test:e2e     # playwright test  (signed-out suite; boots its own vite dev server)
npm run test:e2e:ui  # playwright test --ui
npx playwright test e2e/landing.spec.ts    # single e2e spec
npm run test:e2e:dev # authenticated suite against the DEV Firebase project (needs .env.local)
```

There is no separate typecheck script; `npm run build` runs `tsc -b` first and is the canonical pre-commit gate.

There are **two** Playwright suites; Vitest excludes both dirs (see `vite.config.ts` `test.exclude`), so keep unit tests as `*.test.ts` and e2e as `*.spec.ts`.

- **`e2e/`** (config `playwright.config.ts`) — the **unauthenticated, deterministic surface**: landing page, legal pages, client-side routing, i18n. Renders with no Firebase round-trip, so it's stable even with the dummy `VITE_FIREBASE_*` values used in CI and never writes to Firebase. Runs in the CI `test` job (every push/PR).
- **`e2e-dev/`** (config `playwright.dev.config.ts`, run via `npm run test:e2e:dev`) — **authenticated flows** (Quick Start anonymous auth, adding expenses) driven against the real **dev** project (`easy-split-dev-1cfa3`). These write throwaway anonymous users + groups and clean up after themselves via the app's Delete Account flow (`cleanupCurrentAccount` in `e2e-dev/helpers.ts`, best-effort in `afterEach`). Runs serially. Two modes: **local** boots the dev server on port 5174 loading `.env.local`; **remote** targets an already-deployed URL when `E2E_BASE_URL` is set (no server started). In CI this runs in the **`e2e-dev` job after `deploy-test`**, pointed at `https://slice-test.pages.dev` — i.e. it tests the just-deployed dev site (push to `main` only, not PRs).

## Architecture

SLICE is a mobile-first group-expense splitting SPA. Frontend-only (React 19 + Vite 8 + Tailwind 4); persistence and auth are Firebase (Firestore + Auth) accessed directly from the browser. There is no application server.

### Provider stack (`src/main.tsx`)

`HelmetProvider → BrowserRouter → DialogProvider → AuthProvider → GroupProvider → App`. The order matters:
- `GroupProvider` consumes `useAuth()` and `useDialog()`, so it must be inside both.
- `AuthProvider` uses `useNavigate()`, so it must be inside `BrowserRouter`.

### Two contexts hold all app state

- **`AuthContext`** (`src/contexts/AuthContext.tsx`) — Firebase Auth lifecycle. Three login paths: Google popup (with redirect fallback when popup is blocked), anonymous "Guest", and `handleQuickStart` (anonymous sign-in that auto-creates a default group and navigates into it). The "guest → Google" upgrade uses `linkWithPopup`; if that Google account already exists in Firebase, we surface `AbandonGuestConfirmationModal` and on confirm run `cleanupUserData` (delete the guest's owned groups + their auth user) before signing in as the existing Google user. **`isSoftLoggedOut`** is persisted in `localStorage` and lets an anonymous user "log out" of the UI without losing their data — anonymous Firebase sessions are kept alive so the data can be reclaimed by logging back in or upgrading.

- **`GroupContext`** (`src/contexts/GroupContext.tsx`) — owns `groupId` (parsed from the URL via `useLocation`), `currentGroup`, `members`, `expenses`, plus a long list of `handle*` mutators that all delegate to `firebaseService`. Subscribes to three `onSnapshot` listeners (group doc, members subcollection, expenses subcollection) and tears them down on `groupId`/`user` change. `currentMemberId` is derived by finding the member whose `userId === user.uid` — this is the binding between a Firebase user and "which member am I in this group."

### Firestore data model

```
/users/{uid}                  — UserSettings (lastGroupId, joinedGroupIds[], login metadata)
/groups/{groupId}             — Group (name, createdBy)
  /members/{memberId}         — Member (name, userId?, isHost?)  — userId binds a member slot to a Firebase user
  /expenses/{expenseId}       — Expense
```

Rules in `firestore.rules`: any authenticated user can read groups (so join-by-link works) but only `createdBy` can update/delete the group; members may be "claimed" by setting `userId` from `null` to `request.auth.uid`. All multi-document writes in `firebaseService` use `writeBatch` to stay atomic.

### Expense model — backward compatibility

`Expense` has both legacy and v2 shape and **the settlement code reads either**:
- `paidBy: string` (legacy single payer) vs `payments: Payment[]` (multiple payers)
- `splitAmong: string[]` (legacy equal split) vs `splits: Payment[]` (custom amounts)

`calculateBalancesAndSettlements` in `src/lib/settlement.ts` prefers `payments`/`splits` when present and falls back to `paidBy`/`splitAmong`. When writing, `firebaseService.updateExpense` uses `deleteField()` to remove `splits` if the caller passes `splits: undefined` (i.e. user toggled off custom split). Equal splits must be penny-accurate — use `calculateEvenSplit` in `src/utils/split.ts`, which distributes remainder cents across the first N participants.

### Settlement algorithm

Greedy debtor/creditor matching (largest first) in `src/lib/settlement.ts`. Balances within ±0.01 are treated as settled. "Leave group" in `GroupContext.handleLeaveGroup` blocks if `|balance| > 0.01`.

### Routing (`src/App.tsx`)

All routes live in one `<Routes>` block. Group routes (`/group/:groupId`, `.../expenses`, `.../settlements`) check `currentMemberId && currentMember` inline and render `<MemberSelectionPage />` instead when the user hasn't claimed a member slot yet — there's no separate router redirect for this. Unauthenticated users at `/` see `LandingPage`; unauthenticated users at any other path see `LoginView` inside the mobile container.

### i18n

`react-i18next` with two locales: `en` and `zh-TW` (`zh` aliases to `zh-TW`). Fallback is `zh-TW`. Detection via `i18next-browser-languagedetector`. Always read the language via `i18n.resolvedLanguage` (not `i18n.language.startsWith(...)` — that was refactored out, see commit `0bd6781`).

## Project conventions (from GEMINI.md — applies to Claude too)

These are hard requirements, not preferences:

- **Pre-commit**: `npm run build` must succeed before any commit. Fix type errors, don't skip.
- **Mobile input font size**: every `<input>` and `<select>` must be ≥16px (`text-base` in Tailwind). Smaller sizes trigger iOS Safari auto-zoom on focus. Never use `text-sm`/`text-xs` on text-entry controls.
- **Design system — "Bold & Crisp × Playful Numbers"**: defined as Tailwind v4 `@theme` tokens in `src/index.css`. Use the named tokens, not raw hex or default grays:
  - Colors: `accent-orange` (#FF6B35), `brand-light` (#FFF0EA), `page-bg` (#F7F7F5 — never `slate-50`/`gray-100`), `main-text` (#1A1A2E), `success-green` (#0A7A4A), `success-light` (#EAFAF3).
  - Fonts: `font-nunito` (800–900) for headings/amounts; `font-plus-jakarta` (400–700) for body/UI.
  - Tactile styling: thick midnight borders (`border-2`/`border-3 border-main-text`) and solid offset shadows (e.g. `shadow-[4px_4px_0px_#1A1A2E]`), not blurred. Interactive elements use `btn-bounce` or `active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E]`.
  - Currency / settlement numbers use the `<CountUp>` component. Lists use `.stagger-item` with 60ms `animationDelay` increments.
  - Modals: `overflow-hidden` + rounded corners (e.g. `rounded-t-[24px]`) to clip child backgrounds.
  - On mobile, stack form fields vertically (`flex-col w-full gap-3`); avoid side-by-side rows for inputs.

## Environment & deployment

- Required env vars: `VITE_FIREBASE_*` (see `.env.example`).
- `.firebaserc` defines two projects: `default` → `slice-b1807` (prod) and `dev` → `easy-split-dev-1cfa3`.
- Hosted on Netlify (`netlify.toml`): build `npm run build`, publish `dist`, SPA rewrite `/* → /index.html`. Firebase hosting config exists (`firebase.json`) but Netlify is the live deployment.
- Vite manual chunks (`vite.config.ts`): `firebase`, `ui-icons` (lucide-react), `vendor`. Keep this split if adding heavy deps.
