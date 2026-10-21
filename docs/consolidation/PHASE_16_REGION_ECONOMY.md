# Phase 16 — Chromatic Region Clarity and Renderer Economy

**Date:** 2026-10-21
**Repository:** `westkitty/Starsilk_Map_of_the_All`
**Branch:** `feature/phase16-region-render-economy`, stacked on hosted-green Phase 15 [PR #9](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/9) commit `1e7d83af76620ae3818a3f6c7dfffabe4c757054`.
**Scope:** One bounded Phase 16 implementation slice for user-authored provisional sectors, not final chromatic visual fidelity or canonical map approval. No Pages production release.

## Existing defect, and what remains authored

`StrategicStudio.renderRegions()` previously regenerated all sector fill/border/anchor meshes whenever `updateUI()` called `strategy.sync()`, even when the region data and selection were unchanged. Worse, it created a 3D line stem **and** ring mesh for every region vertex even with the editor closed and those pins non-interactive. Each data-valid v1 draft may contain as many as 48 regions with up to 24 vertices: at maximum that could mean **2,304 vertex-decoration objects**, before fill and outline. These objects add draw submissions and clutter the cosmic survey even outside authoring.

The same `StrategicStudio` remains the **only** renderer/owner of user-authored polygon meshes. `AtlasEngine` retains its render loop and disposal ownership; Phase 15 procedural survey cells remain distinct, weaker, transient guides. Nothing is stored, removed or migrated from `state.regions` or `starsilk.map-of-the-all.draft.v1`.

## Bounded renderer correction

- Store a render-only deterministic signature of the active view, layer visibility, current editable region selection and the actual per-sector IDs/colors/vertex arrays. If the existing GPU group is still attached to the current Atlas engine group and the signature is unchanged, **reuse the existing meshes**. A scene rebuild detaches the group and automatically invalidates reuse.
- Preserve each authored region's translucent chromatic fill and border **at all times** when the region layer is enabled, whether Strategic Studio is open or closed.
- Draw decorative vertical pins and ground rings **only for the selected region when Strategic Studio is open in Region edit mode**. All actual HTML vertex editing handles remain available in this mode; all other regions are still colored and selectable from the Region list.
- Closing Strategic Studio explicitly clears the edit selection and redraws the stable 3D presentation *without* the now-useless pin objects. Mode switch to PAN/GROUP also removes pins.
- The existing opt-in numeric `?atlasDiagnostics=1` adds three bounded counts: `regionObjects`, `regionPins`, `regionRebuilds`. No draft point arrays, notes, identities or routes are exposed.

## Evidence

| Gate | Result |
|---|---|
| Phase 15 parent PR #9 | **Hosted PASS**: 273/273 Node tests, 12 Chromium suites and synthetic three-era recovery, Node22 gzip 223097/225000; run [#39548749689](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39548749689) |
| Local source and build | `node --check`; `npm ci`; `npm run check` initially **273/273 Node tests, Vite build PASS**, gzip **222148 / 225000** on Big Mac Node26 |
| Independent browser suite | `scripts/phase16-region-browser-ci.mjs` **PASS**, disposable headless Brave desktop 1536×864 + mobile 412×915 |
| Synthetic seven authored polygons, editor closed | **14 meshes/lines and 0 pin artifacts**: exactly one fill and one border per polygon |
| Editing one quadrilateral | **23 objects**: 14 base + 1 selected white outline + **8** pins; real HTML vertex handles remain |
| Leave edit mode and close | **14 objects, 0 pins**; all seven authored regions persist through reload as JSON v1 drafts |
| UI selection-only update | `regionRebuilds` counter did **not** increase; no GPU geometry reallocation on unchanged selection |
| Matched before/after draw submissions | `scripts/phase16-matched-draw-benchmark.mjs` executed from Phase 15 PR #9 source and Phase 16 candidate dist with the identical seven-quad synthetic v1 draft, viewport 1536×864, Balanced, Post, All, headless Brave/SwiftShader | **399 → 315**, **84 fewer WebGL draws (21.1%)**; geometry counters **259 → 203**, 56 fewer, both process exits 0 |
| Existing Strategic Studio and Phase 15 browser regressions | `scripts/phase4-browser-ci.mjs` and `scripts/phase15-survey-browser-ci.mjs` rerun on candidate in disposable Chromium profiles | **BOTH LOCAL PASS**, exit 0: real group/draft/Undo editor, era-local sectors, reload and emulated 412px touch |
| Current full hosted acceptance | 13 Chromium suites and three-era disposable recovery on exact Phase 16 PR head **PENDING** |
| Physical Galaxy Tab S9 Ultra/S Pen, GPU duration, thermal | **NOT VERIFIED** |

The comparison scenario is *not* a claim of frame-time/FPS improvement. Matched camera, viewport, quality tier, synthetic state and SwiftShader environment permit a draw-call comparison; software rendering and short-session GPU counters cannot establish physical device performance.

**Matched resource receipts:** `/tmp/map-phase16-baseline-draw.log` (Phase 15 PR #9 baseline; `PHASE16_MATCHED_DRAW` 399 draws, 259 geometries, exit 0) and `/tmp/map-phase16-candidate-draw.log` (current candidate; 315 draws, 203 geometries, exit 0) are ephemeral Big Mac logs. The committed benchmark script is the reproducible procedure. This comparison excludes camera action, selection and active edit pins; it measures specifically the closed-editor All-view at a fixed viewport. An independent editor journey verifies that the pin handles still appear correctly when actually needed.

## Preservation and release

Preserved: source identity locks, the Dossier read-only contract, original orbital Planner, three independent eras, the 170-year Blood Eclipse War, graph topology, user-authored v1 region metadata and colors, exact sector polygons, keyboard/pointer/touch tools, Undo/Redo, import/export, procedural Phase 15 cells and all twelve earlier browser suites. Browser fixtures always use disposable profiles. No canonical borders, positions, faction claims or routes are created.

Do not merge or publish the stacked PR sequence until **Phase 6's backup-first one-editor cutover** and its separately authorized Pages transition pass. Visual-fidelity Phase 16 reference-05 acceptance, remaining phases 17–20, physical stylus evidence and actual human visual review remain open.
