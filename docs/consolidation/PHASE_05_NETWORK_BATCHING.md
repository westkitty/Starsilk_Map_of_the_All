# Phase 05 — Network Geometry Batching and Measured Renderer Economy

**Date:** 2026-10-20 (America/Detroit; GitHub run dates may be October 21 UTC)
**Owning repository:** `westkitty/Starsilk_Map_of_the_All`
**Branch:** `feature/phase05-network-batching`, stacked on Phase 4 draft PR #6 at `0e5f0a6e95e52806ba999724a13d3135c2f90ead`.
**Scope:** One reversible performance intervention in the existing 3D Atlas; **not the entirety of master-plan Phase 5's visual-fidelity work.** No merge or release.

## 1. Problem and bounded change

The recovered OMNI secondary-network topology used one independent `THREE.Line` object per radial, intra-galaxy perimeter and inter-galaxy bridge segment. Those guide edges collectively created about 74 unnecessary WebGL submissions at Balanced quality. The visual purpose remains a three-tier non-canonical network of proposed relationships; editing and source-linked graph authority are separate state.

`atlas-engine.js` now collects same-style endpoints into three `THREE.LineSegments` groups built by the new pure `network-geometry.js` function. Radials retain azure #38bdf8 at 0.25 opacity, perimeters darker blue #0284c7 at 0.18, bridges #0ea5e9 at 0.22. All three remain dashed with the original dash/gap lengths. The shader inputs explicitly reset `lineDistance` for **each** endpoint pair (0 → segment length), matching prior independent `THREE.Line` behavior rather than stretching the dash phase across unrelated routes.

The code still checks each original `network:system:<id>`, `network:bridge:<from>:<to>`, `network:bridges`, `network:beads` and `network:all` suppression condition before collecting segments. Every topology endpoint, source route, visualization category, light, bead, galaxy ring, network-path overlay and editable corridor is retained. Resource ownership stays with existing `AtlasEngine.rebuild()` and `disposeTree()` (no second render loop or persistent GPU registry).

## 2. Matched browser evidence

Same Big Mac, same repository state apart from the above code and two new focused pure tests, same `npm ci` pinned dependencies, same Brave/Chromium headless SwiftShader settings, same Balanced All-view screen and `scripts/atlas-focus-browser-ci.mjs` acceptance script. The baseline and candidate each completed the full focus-browser suite with `FOCUS_BROWSER_PASS` and process exit 0.

| Balanced viewport | Original Phase 4 PR #6 | Batched implementation | Reduction |
|---|---:|---:|---:|
| Desktop 1536×864 | 368 draw calls | 294 draw calls | 74 (20.1%) |
| Emulated tablet 1280×800 | 368 | 294 | 74 (20.1%) |
| Emulated mobile 412×915 | 194 | 163 | 31 (16.0%) |

Measured unit is `renderer.info.render.calls` reported through the application's existing `#drawCalls` instrumentation. These are **draw submissions only**, not FPS, GPU wall time, mobile thermals, or complete memory allocation. No causal claim about frame-time improvement is justified without matched frame-time capture.

**Recorded source logs on Big Mac:** `/tmp/map-phase5-baseline-browser-20261020.log` and `/tmp/map-phase5-batch-browser-20261020.log`. These local `/tmp` logs are **transient**, not permanent archived QA receipts. This Markdown preserves the measured values and test contract.

## 3. Validation, regression budgets and failure correction

- Baseline `npm run check`: **260/260 Node tests**, gzip **220141 / 225000** bytes, PASS.
- Initial test of native `LineSegments.computeLineDistances()` demonstrated an unintended cumulative dash phase `[0,5,5,12]` across independent edges. Corrected by explicit per-edge distances `[0,5,0,7]` and retained the failure as evidence of an actual material/geometry correction, not a pass on first attempt.
- Candidate `node --test tests/network-batching.node-check.mjs`: **2/2 PASS**; tests single batched object with two edges, exact dash resets, material settings, empty input and odd-length rejection.
- Candidate `npm run check`: **262/262 Node tests + Vite build PASS**, gzip **220332 / 225000** bytes on Big Mac Node 26 (increase of 191 compressed bytes for the additional helper).
- Candidate `scripts/atlas-focus-browser-ci.mjs`: **PASS**, matching fullscreen view, three device viewport emulations, no first-frame runtime errors or viewport overflow, and the draw-call reductions above. A new **test-only default Balanced scene draw ceiling** of 320 desktop/tablet and 180 emulated phone prevents reverting to the old 368/194-call topology without an explicit new benchmark; this is *not* an FPS target. The amended script **PASSED locally** on the rebuilt candidate: desktop 294/320, emulated tablet 294/320, phone 163/180, `FOCUS_BROWSER_PASS`, exit 0.
- Independent `scripts/phase5-browser-ci.mjs` **PASS** (exit 0): draft route tracing, hypothetical closure/recovery, commit/Undo, tier isolation, source and Planner handoff and mobile viewport. `scripts/procedural-suppression-browser-ci.mjs` **PASS** (exit 0): actual suppression of all secondary network details reduced draw calls **294→221**, Undo restored **221→294**, Redo hid them again, and reload, era independence, source protection and mobile persistent subtraction passed. Both used disposable Brave contexts, no real saved user profiles.
- GitHub Ubuntu Node 22 pinned installation, build, bundle, full ten-suite Chromium acceptance and three-era draft-recovery **not yet run for Phase 5**.

## 4. Release boundaries and next improvements

This is an isolated stacked PR on Phase 4 PR #6, which itself depends on Phase 3 PR #5 and Phase 2 PR #4. **Do not merge/deploy** until their exact-head tests and Phase 6 **backup-first single-writer cutover** prove no loss of shared-origin v1 drafts. The embedded legacy editor may discard newer optional per-era fields.

The canonical Starsilk Character Dossier, `Star_System_Planner` orbital simulator, read-only source topology, 170-year Blood Eclipse War chronology, editorial/non-canon geometry status, JSON v1 and key `starsilk.map-of-the-all.draft.v1` remain unchanged. Physical Galaxy Tab S9 Ultra/S Pen performance remains **unverified**.

**This closes one bounded renderer-economy opportunity, not the whole visual-fidelity campaign.** Outstanding Phase 5 work: verify supplied target images against their actual Drive originals; assess cartographic legibility and strategic color without promoting illustrative positions to canon; capture p50/p95/p99 frame timing and geometry/texture lifecycle on an agreed runtime; avoid expensive glow inflation; rerun matched visual acceptance and actual mobile device testing when accessible. Do not equate lower draw calls to proven FPS gains.
