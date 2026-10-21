# Phase 04 — Zero-loss Atlas discoverability

**Date:** 2026-10-20 (America/Detroit)
**Branch:** `feature/phase04-zero-loss-ux` stacked on Phase 3 draft PR #5 `2e83f3372c853eb00dc7cfeba72dc1b4dae7d58a`.
**Repository:** `westkitty/Starsilk_Map_of_the_All`.
**Authority:** [Consolidation Master Plan](../../CONSOLIDATION_MASTER_PLAN.md), Phase 4.
**State:** All three dedicated disposable-profile desktop/touch browser journeys PASS locally; PR/current-head hosted Node 22 ten-suite CI required. No merge or production Pages deployment.

## Existing UX defects and repairs

| Severity | Before | Repair | Proof |
|---|---|---|---|
| Major | `/` focused hidden input while Explore drawer remained closed | `focusSearch` opens the same authoritative drawer through `drawerController.open('nav')` before focusing search | Browser checks on 360 and 412px from fully collapsed state |
| Major | Six feature tabs required a hidden horizontal swipe at 360–412px | Responsive header is two rows: title/source badge then six evenly sized exposed tabs, each at least 44 CSS px, no horizontal rail or viewport overflow | 360 and 412px real browser geometry + tap journeys PASS; desktop acceptance pending |
| Major | Undo/Redo controls remained in `display:none` header and Export/Import were buried at the bottom of Explore | Move the **existing** live controls into one `role=group` quick-action strip below search; preserve original event listeners, disabled state and file input | Browser 360px checks export download and Undo/Redo by making/undoing/recreating a synthetic draft; 412px accessibility checks |
| Minor | Escape from an expanded drawer could strand keyboard focus inside hidden panel | Restore focus to the invoking tab, clear transient search input/results on search Escape, preserve existing close-feature/edit cleanup behavior | Browser keyboard journey and focus oracle |
| Minor | Inspector tab did not signal that the current draft is selected | Update Inspector tab aria label and selected-state dot from existing `state.selected`, without creating duplicate state | Browser selected draft + contextual aria assertions |

Six retained feature destinations are Explore, Inspect, Edit, Regions, Routes and Eras. The route/region/era modules, preview/commit semantics, cancel and Undo remain the same objects and procedures. All 11 layer toggles, source graph, independent three eras and import/export controls retain their existing ownership. The responsive change does not create a dashboard, navigation fork, or replacement editor.

## Source change envelope

- `main.js`: open Explore before focus; update Inspector affordance from selected source object.
- `atlas-focus.js`: preserve one drawer owner; move existing Undo, Redo, Export, Import elements into the Explore quick strip; maintain Escape and explicit-close focus restoration.
- `atlas-focus.css`: 360–620px responsive six-column rail; 44px touch targets; relocated drawer top offset; quick controls and selection indicator.
- `scripts/phase4-discovery-browser-ci.mjs`: disposable Chromium journeys at widths 360, 412 and 1280 covering all six controls, focus/keyboard/Escape, accessible name, export download, Undo/Redo and cancellation; screenshots only in `atlas-qa-evidence`.
- `package.json`, PR and Pages workflows: include **tenth** independent browser acceptance suite without bypassing any existing suite.
- Operational State and project Bible: additive state/evidence.

**No saved-data schema, key, version, real draft, independent Planner, Dossier, source/canon status, physics, graphics quality setting, or Pages route is modified.** Key remains `starsilk.map-of-the-all.draft.v1`, schema JSON v1.

## Verification state

| Gate | Evidence | State |
|---|---|---|
| Immutable source tree | Phase 3 PR #5 exact head `2e83f337` cloned into clean isolated Big Mac worktree before changes | VERIFIED |
| Node/build on local Node 26 | `npm ci`, `npm run check` **260/260 tests**, gzip **220,141 / 225,000 bytes**, Terser vendor split | PASS for initial quickbar implementation |
| Browser 360px | Six exposed 44px tabs, no horizontal overflow, all six drawer paths, slash focus, Escape focus, synthetic draft add + Undo/Redo and local export | PASS in disposable Playwright profile |
| Browser 412px | Six exposed 44px tabs, no horizontal overflow, all six drawer paths, slash/keyboard and selection context | PASS in disposable Playwright profile |
| Browser desktop 1280px | Six visible tabs, 40px pointer targets, keyboard search, Escape focus and selected context | PASS in disposable Playwright profile |
| Full ten browser suites + three-era recovery | Must run against exact Phase 4 PR head in GitHub Ubuntu Node 22 and disposable Chromium profiles | PENDING |
| Physical Galaxy Tab S9 Ultra/S Pen | Touch emulation cannot prove actual stylus access or thermal behavior | NOT VERIFIED |

The earlier test expectation that desktop mouse-only tabs must reach 44px was corrected to the existing desktop pointer minimum of 40px. On touch profiles the stronger 44px minimum is mandatory; the test refuses off-screen or scroll-only destinations.

## Release and rollback

This work is a **stacked draft feature branch**, not a production deployment. Parent Phase 3 PR #5 is still a draft on Phase 2 PR #4. The legacy embedded Atlas and dedicated Atlas continue sharing a browser origin and draft key. **Phase 6 still requires a proven one-writer cutover and backup/restore evidence before publishing these changes on main.**

While unmerged, rollback means closing the Phase 4 PR; current production is unaffected. Do not promote any illustrative coordinates, suppress source authority, change the Blood Eclipse War 170-year chronology, or alter the independent orbital simulator.
