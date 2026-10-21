# Phase 15 — Contiguous, Non-Canonical Survey Cells

**Date:** 2026-10-21 (local authoring window)
**Repository:** `westkitty/Starsilk_Map_of_the_All`
**Branch:** `feature/phase15-provisional-survey-cells`, based exactly on Phase 5 cadence [PR #8](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/8) commit `94293c8ababaa8d1ce2b0d92734f65b684da8619`.
**Scope:** First bounded implementation slice of the historical reference-fidelity Phase 15 (planned loops 71–75), **not completion of Phases 15–20**, not a production release.

## Verified prior-art image input, without inventing approval

All five original PNG bytes were retrieved from the historic dedicated Drive folder `1adaYrAEB7_--Jsmyu9KIMCTCuRTgZozO`. Local hash verification confirms the complete original bytes match the feature-branch Git blobs recorded in the Phase 2 reconciliation ledger. These **verify identity and provenance of reference bytes**, not rights, user approval, canon or geographical accuracy.

| Reference | Git blob SHA-1 verified from actual Drive pixels | Size |
|---|---|---:|
| 01 labeled master | `01363abafcb86452b7a717f4d255a5656134a910` | 2,678,706 |
| 02 unlabeled | `b0c9d104bcd3eafe685f5cb049065cd78d4642ac` | 2,464,814 |
| 03 network detail | `039e9c76ea598c1bc0cf8e6d063f74712526888d` | 2,423,363 |
| 04 sectors | `6e5642342d32c95b424bf4cbbbb153f19eaf6c52` | 2,414,694 |
| 05 colored regions | `c3a3bcf423bb936b6817805ac96b189d29eae828` | 2,472,928 |

Visual comparison against references 04 and 05 informed one restrained change: replace disconnected circular per-galaxy display halos with **connected, very low-opacity provisional proximity survey cells**, leaving the real author's sector polygons editable. No pixel-perfect recreation, art approval or sector ownership is claimed.

## Authority and shape contract

- **Source of positions:** the existing editable `state.nodes` of kind `galaxy`; no new static border coordinates, route data or auto-generated factions.
- **Ephemeral generation:** `provisionalSurveyCells()` computes a deterministic expanded convex footprint and clips one nearest-site cell per galaxy with perpendicular bisectors. Output is an **illustrative CPU render representation**, not a persistent region, boundary, sovereign polity or lore statement.
- **Data ownership:** `state.regions`, its existing `StrategicStudio.renderRegions()` owner, and v1 localStorage are unchanged. The authored region meshes appear **above** these faint survey cells; closing the editor retains authored polygons. The engine renders cells only under the preexisting `layers.territories` switch, now labeled **Provisional sectors**.
- **Safety:** 32-site guard; duplicate positions, unsafe/invalid coordinates, oversized sets and invalid padding return `null`, so `AtlasEngine` retains the original bounded circular-halo fallback for the **full** node collection. Empty site list draws nothing; duplicate galaxy IDs do not assert separate invented border ownership.
- **GPU ownership:** same `AtlasEngine.rebuild()`/`disposeTree()` lifecycle as old halo meshes. Seven seeded cells each create one translucent planar fill and one faint dashed border (14 submissions, replacing the previous 14). No second renderer, physics copy, state owner or geometry registry.
- **Inspectable evidence:** `?atlasDiagnostics=1` adds counts only, `provisionalCells` and `authoredSectors`, to the existing ephemeral read-only diagnostic. No draft nodes, polygons, identities, URLs, or route contents are exposed by this function.

## Validation

| Gate | Evidence | Result |
|---|---|---|
| Parent Phase 5 PR #8 | GitHub [run #39543720934](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39543720934): 268/268 Node; 11/11 browser suites; synthetic three-era restore; Node 22 gzip 222206/225000 | **PASS; still draft/unmerged** |
| Pure geometry tests | 5 new tests: seeded coverage/non-overlap, positive area, deterministic order, moving sites, v1 untouched, 0/1/2 inputs, duplicates and >32-site fallback | **PASS** |
| Local Node 26 build | `npm ci`, `npm run check` | **273/273 tests, build PASS** |
| Local gzip payload | unchanged 225000-byte limit, pinned vendor | **221990/225000 bytes PASS** |
| Default screenshot | `atlas-qa-evidence/phase15-survey-cells-desktop.png`, headless Big Mac SwiftShader at 1536×864; seven faint connected cells | Captured in disposable profile; style remains **illustrative** |
| Default Balanced GPU submissions | Same seeded All view, headless SwiftShader: desktop 1536×864 and tablet 1280×800 remain 294. Phone 412×915 changes **163 → 172** because larger sector surfaces become visible | **294/320 desktop/tablet, 172/180 mobile acceptance PASS**; nine extra mobile draw submissions, not an FPS improvement |
| Integration browser gate | `scripts/phase15-survey-browser-ci.mjs`: real layer toggle, draft region creation while cells remain, editor close, Undo/Redo, reload, war/post era boundaries, 412px touch emulator | **PASS** on disposable Brave/Chromium contexts, `PHASE15_BROWSER_PASS`, process exit 0; synthetic author sector retained across editor-close, Undo/Redo, reload and isolated Post/War |
| Existing fullscreen and Strategic Studio suites | Re-ran `scripts/atlas-focus-browser-ci.mjs` and `scripts/phase4-browser-ci.mjs` against rebuilt candidate, including 412px touch, source handoff, group move, Undo, authored sector vertices | **BOTH LOCAL PASS**, process exit 0 |\n| Full 12-suite Ubuntu Node 22 CI + v1 recovery | Required on exact new PR SHA | **PENDING** |
| Physical Tab S9 Ultra / S Pen and hardware GPU | Never simulated as hardware evidence | **UNVERIFIED** |

A browser-fixture timing bug was caught and repaired: `change()` updates renderer state immediately but persists to localStorage with a 250 ms debounce. The first test assumed synchronous durable storage; the corrected test waits for actual saved bytes before continuing.

## Release, rollback and future fidelity

This is **not an authored map of canonical territory**. Reference images show illustrative colors and soft-bordered cosmic sectors. No official coordinate, border, route or faction governance claim can be inferred. Remaining full Phase 15–20 work includes finer sector shapes/typography and user approval of visual references, region strategy legibility, shader/depth tuning, lifecycle and frame-time on real GPU, star-system visual continuity, accessibility, touch/stylus tests, and final acceptance.

The existing **Phase 6 single-writer release gate** remains necessary: the legacy and dedicated Atlas currently coexist and may share `starsilk.map-of-the-all.draft.v1` on the same browser origin. Do not merge or deploy a stacked draft while source/draft recovery and one-writer cutover remain unresolved. Production `main`, GitHub Pages, standalone Planner, Dossier, real user profiles, three eras, saved JSON v1 and the 170-year Blood Eclipse War causality remain untouched.
