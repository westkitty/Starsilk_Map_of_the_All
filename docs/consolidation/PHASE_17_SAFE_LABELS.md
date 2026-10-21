# Phase 17 — Source-Aware, Safe Cartographic Labels

**Date:** 2026-10-21
**Owning repository:** `westkitty/Starsilk_Map_of_the_All`
**Branch:** `feature/phase17-safe-cartography-labels`, based exactly on hosted-green Phase 16 [PR #10](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/10) commit `eb89557e0de1822f457a46379b33258fb95a1028`.
**Scope:** One bounded map-label and touch legibility improvement within the planned Phase 17 "Reference Cartography & Typography" campaign; **not completion** of remaining canonical cartography, source-image fidelity, final accessibility or performance work.

## Defects confirmed against real code

The existing `AtlasEngine.updateLabels()` directly interpolated `node.name` into a `button.innerHTML` template. The JSON v1 validator intentionally accepts names containing markup-like characters so an author can use arbitrary creative names; unescaped imported strings could therefore be interpreted as DOM nodes instead of displayed text. No exploit or affected real user draft is claimed. This is a confirmed parser-boundary defect in the code, corrected without restricting valid naming or changing draft data.

Label collision calculations previously reserved only `fontSize+18` vertical pixels even when the reference subtitle displayed a second text line. In testing, reserving this larger height at **all** zoom levels temporarily hid a planet label, so the final fix restricts expanded collision reserves to the All view; galaxy and system tiers retain their previously verified tight label placement. On coarse-touch devices, a label could be materially smaller than the application's established 44px target criterion and the compact UI forced 10px lettering. Final touch sizing is a measured 12px minimum type, 44×44px hit box, and 0.82 opacity floor on visible map labels. The map also places some pale text directly over intense stellar cores.

## Implementation

- Replace unsafe string-derived `innerHTML` label generation with `document.createElement`, `textContent` and `replaceChildren`. Preserve original pip, label-name, badge, selection/hover classes, canvas wheel forwarding, click/double-click actions, attribute caching, per-label typography controls and same localStorage content. Existing DOM updates remain content-key gated; no per-frame reconstruction.
- Add an explicit **accessible authority distinction** to the same button: source reference identifiers use "source reference, illustrative map position"; editor-owned map nodes use "editable atlas draft". This prevents an unplaced canonical identity from accidentally appearing to possess official 3D coordinates.
- Measure badge-text lengths and touch hit targets at the All scale, while **preserving the original tight collision geometry for galaxy and stellar-system interiors**, so planets remain directly pickable. Existing priority ordering (selected first, then read-only source, then distance) and per-viewport node-count budgets remain in place.
- Apply a restrained dark-blue ink wash **behind the label-name only**, preserving luminous space and the established typographic palette. Compact mobile labels now use at least **12px** font rather than forced 10px, slightly wider caption envelopes, and a minimum **0.82** unselected opacity; coarse-pointer map-label buttons have a 44×44 CSS px minimum. Desktop still retains its prior sizing and alpha range.
- Keep the browser's original quality tiers, per-viewport world-label budget, frame loop, source/canon/draft status, camera, navigation, and zoom functionality. No new renderer or library.

## Evidence and gates

| Gate | Evidence | Status |
|---|---|---|
| Parent Phase 16 [PR #10](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/10) | Hosted GitHub Ubuntu Node 22 [run #39551313496](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39551313496), exact commit `eb89557e0` | **PASS**: 273/273 Node, 13/13 Chromium suites, synthetic three-era recovery, **223256/225000 gzip** |
| Pure Node + build | Big Mac `npm ci`, `npm run check` after final collision and mobile-contrast correction | **273/273 Node + Vite PASS**, gzip **222434/225000** on Node26 |
| Dedicated label browser | `scripts/phase17-labels-browser-ci.mjs`, disposable Chromium at 1536x864 and emulated touch 412×915 | **PASS** final: imported markup-shaped draft name literal, no DOM or event-code injection, click/inspect and source authority intact; six visible mobile labels each **≥44px high**, **12px font**, **≥0.82 opacity**, no overflow or browser errors; process exit 0 |
| Visual ink wash | Modified name-only dark contrast gradient over intense galaxy cores; latest screenshot `atlas-qa-evidence/phase17-labels-phone.png` | Captured in disposable browser after final 12px/opacity changes; reference fidelity still requires human visual sign-off |
| Existing stellar zoom/touch acceptance | `scripts/stellar-zoom-browser-ci.mjs` after correcting too-large collision boxes at system view | **PASS**, exit 0: galaxy → system → planet, wheel forwarding, Hud/Back, label focus, emulated mobile touch. First overly broad spacing attempt **failed** the planet-label visibility test; corrected and retested |\n| Existing fullscreen/navigation acceptance | `scripts/atlas-focus-browser-ci.mjs` after final mobile font/opacity and collision correction | **PASS** exit 0; 1536, 1280, 412px navigation, all six panels, graphics/draft recovery, no overflow and original draw-budget checks |
| New exact-head hosted GitHub CI | **14 Chromium suites** and synthetic v1 recovery, Node22 compressed bundle | PENDING |
| Physical Galaxy Tab S9 Ultra/S Pen | No physical device access | UNVERIFIED |

The synthetic malicious-looking string exists **only inside a disposable Playwright browser profile** and deliberately exercises how a permissive *valid* imported JSON v1 name renders. Browser tests assert absence of DOM injection and event-code execution; no real profile is read or changed.

## Governance and release

The Dossier's canonical identities and chronology remain **read-only**. No coordinates, borders, historical dates, routes, literal Starsilk references, or image approvals are invented; the Blood Eclipse War is 170 years. The Atlas continues to support all three independent eras, every authoring studio and network feature, JSON v1, `starsilk.map-of-the-all.draft.v1`, Undo/Redo and Planner handoff. The independent `Star_System_Planner` orbital simulator is untouched.

The previous five reference PNGs are historically byte-verified, **not confirmed canon geography or formal art approval**. Phase 17 needs continued art-direction matching and human acceptance. Phases 18–20 (depth/shaders, stellar/planetary continuity, final convergence) and hardware QA remain open.

**Do not merge/deploy this or upstream stacked draft PRs** before completing a backup-first single-writer legacy Atlas cutover in Phase 6, including proof that real v1 drafts will not be overwritten or coerced by a stale legacy client. No production branch or Pages route changes were made for this slice.
