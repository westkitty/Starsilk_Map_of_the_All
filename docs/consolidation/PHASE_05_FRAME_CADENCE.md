# Phase 05 — Honest Frame Cadence and Resource Lifecycle Proof

**Branch:** `feature/phase05-frame-observability`, stacked on Phase 5 batching PR #7 commit `c4f94ac0bd159df55a3e2ba7d06595b1467a3d90`.
**Target:** `westkitty/Starsilk_Map_of_the_All`, never the independent orbital Planner or read-only canonical Dossier.
**Scope:** One reversible instrumentation/QA slice supporting consolidation Phase 5; **not the completed reference-fidelity campaign**. No production Pages deployment, main merge, legacy redirect, or actual user draft migration.

## Defect and corrected measurement contract

The prior `AtlasEngine.info().fps` divided **1000 by average frame callback wall time**, which is *not the frame interval*. A renderer taking 4 ms of CPU/WebGL submission can still deliver frames only every 200 ms. That formula produced misleading throughput estimates.

`frame-timing.js` now collects the timestamps passed to the existing `WebGLRenderer.setAnimationLoop` callback. Its bounded 120-frame circular window derives:

- `fps`: observed delivered frame count divided by total recorded interval duration in the window (not GPU time and not a theoretical refresh rate)
- `medianFps`: reciprocal of the median frame interval, useful alongside average `fps` when large hitches occurred
- `frameP50Ms`, `frameP95Ms`, `frameP99Ms`: actual inter-frame intervals
- `callbackP95Ms`, `callbackLastMs`, `callbackAvgMs`, `callbackMaxMs`: wall-clock time inside the JavaScript render callback, **not pure CPU cycles or GPU duration**
- `slowFramePct`: percentage of recorded frame intervals slower than 30 FPS equivalent (33.33 ms)
- `sampleCount`, `resumeCount`: sample validity and genuine `visibilitychange` suspensions; no invented 60 FPS before initial samples
- Existing `renderer.info` geometries, textures, triangles and draw calls remain separate; historical `lastFrameMs`, `avgFrameMs`, `maxFrameMs` aliases remain compatible and measure callback time.

The first experimental version **incorrectly treated any visible inter-frame gap of at least 1000 ms as a page resume** and thereby dropped expensive real software-renderer stalls. The bug was repaired *before the PR*: only an actual `document.hidden` visibility transition calls `suspend()`. Visible long stalls remain in frame metrics, even if severe. The engine removes its visibility listener on `dispose()`; no second render loop was created.

## Opt-in diagnostics and privacy

When the URL includes **`?atlasDiagnostics=1`**, the Atlas exposes a **read-only numeric function** `window.__atlasDiagnostics()`. It returns current frame/resource aggregates, quality tier, era identifier, view kind, and viewport dimensions. It does not expose complete draft JSON, contents, labels, canon records or any browser storage operation. The default Atlas UI and production serialization remain unchanged.

`scripts/phase5-cadence-browser-ci.mjs` uses a fresh Chromium/Playwright context to visit the built Atlas with that query parameter, proves positive and ordered frame-time percentiles, and navigates **All → galaxy → stellar system → All → War → Locking → Post** before inspecting renderer resource-count return. It requires fresh actual renderer frames after each view/era transition rather than reading the old scene's counters.

The browser test prints `CADENCE_SAMPLE` labels with the host, viewport, quality tier, observed sample count, median/mean cadence, percentiles, callback time, draw calls, geometry/texture counts and explicit `physicalDevice:false`. It enforces that restored All/Post geometry counts are within 12 of the initial matching view, but does **not** infer long-session leak absence from this short loop.

## Evidence and limitations

| Gate | Evidence | State |
|---|---|---|
| Parent Phase 5 batching | [PR #7](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/7), hosted run [#39541339651](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39541339651) at `c4f94ac0` | **PASS**: 262/262 tests, 10/10 browser suites, isolated recovery, 221367/225000 gzip |
| Current source checks | `node --check` new/revised modules | LOCAL PASS |
| Current pure frame-timing tests | Covers real frame cadence independent of callback cost, nearest-rank percentiles, circular buffer, severe visible stall, actual document suspension, invalid timestamps | **6/6 PASS** |
| Local complete Node/build | `npm ci`, `npm run check` | **268/268 Node tests, Vite build PASS** |
| Local compressed payload | Big Mac Node 26, Terser 5.51.2 and separate Three.js vendor chunk | **221123 / 225000 gzip bytes PASS** |
| Current dedicated browser journey | Headless SwiftShader desktop 1536×864, 412×915 emulated touch; All → galaxy → system → All and three eras | **LOCAL PASS**: `PHASE5_CADENCE_BROWSER_PASS`, exit 0; no JS exceptions; baseline All/Post 189 geometries, returned All/Post 191 after scene and era roundtrips |
| Full 11-suite browser chain + 3-era recovery | GitHub Ubuntu Node 22 exact PR head | PENDING |
| Hardware GPU / physical Galaxy Tab S9 Ultra | Neither proved by headless SwiftShader; no FPS or thermal improvement claim | UNKNOWN |

**Observed headless software-run limits:** The final disposable profile reported about **294 draw calls** in the All view and **163** in mobile emulation, matching the approved batching baseline. The median inter-frame interval in one desktop All sample was much shorter than its mean after a cold-start stall; mean FPS and median FPS therefore intentionally disagree. A visible gap of more than **11 seconds** was retained rather than mislabeled as page inactivity. The 189 → 191 geometry roundtrip is *only* a bounded short-session observation; it is not full GPU lifetime proof. Renderer.info may briefly show transient counters during an era rebuild, so neither an intermediate sample nor a single frame is treated as settled memory.

**Local diagnostic receipt:** `/tmp/map-phase5-final-cadence-browser-20261020.log` (transient Big Mac file) ends with `PHASE5_CADENCE_BROWSER_PASS` and `PHASE5_FINAL_CADENCE_BROWSER_EXIT:0`. The protected original branch and production were not modified.

**Interpretation restraint:** Big Mac headless Chromium with forced SwiftShader may have extremely long startup/shader-compilation/host scheduling stalls. A frame-cadence number measured under that configuration describes *that software-rendered test*, not a physical device FPS. Short benchmark segments can mix cold starts and transitions; do not claim steady-state FPS, GPU duration, input latency, memory recovery beyond observed `renderer.info`, or target-device thermals from these tests alone. Source images for prior Phase 5 planned visual-fidelity Phases 15–20 still require verified user-approved reference bytes.

**Protected:** one Three.js engine; 11 layers; six owner tools; three eras; Undo/Redo, import/export and JSON v1 key `starsilk.map-of-the-all.draft.v1`; source topology and 170-year Blood Eclipse War causality; no real saved drafts inspected or touched, no Planner/Dossier edits. Shared-origin legacy writer remains **release blocking**; a stacked draft PR is safe to review but not automatically eligible for production.
