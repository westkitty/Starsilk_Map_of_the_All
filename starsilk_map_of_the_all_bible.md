# Starsilk Map of the All — Project Bible

## Purpose / constraints

Independent Three.js 4X-style *editable draft* Atlas, never canon authoring. User-set coordinates, borders, corridors and planetary orbits are not actual measured geometry. WorldsVault relationship graph and Starsilk Character Dossier are read-only source evidence. Blood Eclipse War lasted 170 years. The Siege Wall is cosmic absence/containment rather than ordinary masonry.

The mature `Star_System_Planner` owns physics. Atlas can export explicitly hypothetical `.ssp.json` for manual import; it must never access or change the Planner saves or canon source.

## Lineage and artifact identity

- Local root: `/Users/andrew/Starsilk_Map_of_the_All`.
- Intended GitHub: `westkitty/Starsilk_Map_of_the_All` (not yet created or pushed).
- Extracted with `git subtree split --prefix=map-of-the-all` from the Planner at source SHA `05bf20257dca7d51d8a2531c633cdbf8d5ccdadd`; retained Atlas history tip `93dbc3bcaf1606153ddd1ac2f41c393f09aeb4aa`.
- Initial standalone commit: `1d821b25202a3f5f3d83d39162eee78f55196342`.
- The older Planner app and embedded Atlas URL remain unchanged; future changes here are not auto-synced.

## 2026-10-17 — five-pass uplift

Baseline: clean standalone `main`, 76 Node tests and independent Vite build. Five passes added invalid JSON recovery with download/explicit replacement, pagehide autosave flush, correct all-layer logic and protected browser shortcut behavior, identity-aware pointer picking and reused label vectors, separate Three.js vendor output and objective compressed bundle budget.

Observed proof: **81/81 Node model tests, production build/budget, five browser suites PASS** with desktop and emulated tablet/phone, including corrupt-save recovery. Physical S Pen hardware and real mobile thermal/frame timing not tested. See `UPLIFT_X5_2026-10-17.md`.

Remote blocker: GH CLI stored token invalid (HTTP 401); new GitHub repository and Pages deployment remain unverified. Never claim publication without GitHub remote SHA and successful deployed public URL GET. Keep local Git and evidence intact until remote credentials are repaired. The original Planner and Dossier have no writes in this session.

Start every future uplift with `OPERATIONAL_STATE.md`, this Bible and `docs/EXTRACTION_PROVENANCE.md`. Do not use `/Users/andrew/Star_System_Planner` without verifying its actual remote.

Implementation commit: e8ba3499731cd1d042c7aa7471e25cd07c8ae4ab (five uplift passes, 81 model tests, five passing Chromium suites, vendor split, 186099 gzip bytes).

## 2026-10-20 — Consolidation Phase 01: current ownership and baseline (additive supersession)

- **Current authoritative Atlas repository:** `westkitty/Starsilk_Map_of_the_All`. The earlier paragraph saying the remote is "not yet created" is historical as of 2026-10-17, **not current**. Standalone `main` was verified at `ba95b1e9e3ff0aafe480e90b07573cad670e76f9` and [Pages workflow 39105968854](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39105968854) completed successfully. Standalone published URL, Planner root and legacy embedded Atlas returned HTTP 200.
- **Governing document:** [Master Plan on open PR #2](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/2), commit `c4e1ea3c2a037c6087222df3661062de7ff3ee92` is deliberately **not copied/merged** by Phase 1. Current development target is solely this dedicated Atlas repository; Planner remains an independent physics simulator; Dossier is read-only.
- **Refs/safety:** clean isolated Big Mac clone of dedicated `main` at `ba95b1e9`, Phase 1 branch `consolidation/phase-01-baseline-20261020`. MacBook checkout `/Users/andrew/Starsilk_Map_of_the_All` was **clean on unmerged `feature/omni-uplift-100`** and left untouched. The OMNI branch is 16 ahead / 1 behind; do not merge, cherry-pick or overwrite it in Phase 1.
- **Reproducible baseline:** `npm ci` passed; `npm run check` passed with **216/216 Node tests** and build; bundle 218,268 gzip bytes under 225,000; `npm audit` found one high pinned-Vite dev-server advisory. Full `npm run test:browser` passed all **5/5** Chromium suites with explicit terminal PASS markers and wrapper exit 0; the isolated synthetic draft-recovery suite also passed. These are emulator/headless results, not physical stylus acceptance. See `docs/consolidation/PHASE_01_BASELINE.md` for per-suite dispositions and known UX defects.
- **Draft guardrails:** schema v1 and `starsilk.map-of-the-all.draft.v1` unchanged; independent war/locking/post snapshots, source demotion and real user storage untouched. Disposable-profile restore procedure and outcomes: `docs/consolidation/DRAFT_RECOVERY_RUNBOOK.md` and `scripts/phase1-draft-recovery-browser-ci.mjs`.
- **Still open:** fix outdated external ChatGPT Project directives, assess shared-origin last-writer conflict and optional-field cross-version round trips, address audited Vite advisory separately. **No production deployment, branch merge, feature work or Planner/Dossier writes were performed.**

## 2026-10-20 — Phase 1 PR integration verification (non-deploying)

- Corrected 83 malformed Markdown inline-code closers on plan PR #2 (`bcf5520`); verified a conflict-free combined tree with Phase 1 PR #3 at `c921f20` (pre-review snapshot `01dbea13`). Two branch-dependent plan links were replaced with durable repository-relative links in PR #3.
- Standalone combined-tree Node tests **216/216**, build and gzip budget passed. The first chained Chromium run failed once on a 5-second Spatial route-localStorage wait; unchanged Spatial alone and the bounded full browser rerun passed, 5/5 suites. The independent three-era disposable-profile draft recovery also passed. **Flake root cause remains unverified**; do not erase it from the Baseline ledger.
- This is a documentation/CI/QA review only. No changes to application runtime, canon, JSON v1, real user drafts, Planner, `main`, Pages routing or deployment. Merge remains an explicit release boundary.

## 2026-10-20 — Phase 1 Spatial browser witness (non-runtime QA)

- Corrected a weak browser acceptance assertion that only counted saved routes. The test now requires the exact `north-reach` → `southern-territories` draft edge and real DOM clicks on both labels, with detailed timeout diagnostics and a failure screenshot.
- Isolated `ef4f913`-based PR #3 Big Mac clone: syntax and 216/216 Node/build checks passed, bundle unchanged; **2 consecutive headless Chromium Spatial journeys passed** with true draft route persistence. **Historical intermittent five-second timeout remains root-cause unknown**, not claimed fixed; new evidence is in `docs/consolidation/PHASE_01_BASELINE.md`.
- No change to the application's behavior, source authority, drafts, independent Planner, Dossier, `main`, Pages or Phase 2. Branch-only QA addition must receive GitHub CI proof before release consideration.

## 2026-10-20 — Phase 2 selective OMNI candidate (draft PR #4)

- **Governing repository:** `westkitty/Starsilk_Map_of_the_All`; Phase 1 PRs #2 and #3 were merged into `main` (`71667286`, `38d78bce`), both Pages publication workflows succeeded without modifying root Planner. New Phase 2 work is isolated in [PR #4](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/4), and the original OMNI feature branch remains untouched.
- **Recovered code:** eight renderer commits and four deletion/recovery/suppression commits as selective patches, not a divergent branch merge. All selected code/test/CI paths match source blobs; five reference PNGs and four historical docs commits are excluded pending real source provenance proof.
- **Known good:** 256/256 Node checks, isolated compatibility fixtures, Vite build, 8 dedicated browser suite scripts present. Actual mixed-version writer interaction remains uncertain; synthetic old capture simulation demonstrates rejection with exact corrupt-original preservation, so no silent migration or real-user data operation is permitted.
- **First hosted CI found a real portability bug:** Ubuntu Node 22 gzip 226370 bytes breached 225000 bytes although Mac Node 26 gave 224979. A constrained build-target adjustment (ES2022/native modulepreload, vendor chunk retained) measured 223091 on Mac. Fresh hosted result must be checked and any browser failures reported, not hidden. No production merge yet.
- **Protected:** JSON v1 key, independent War/Locking/Post, canonical source locks and 170-year War, actual Planner simulator and Dossier; no real drafts opened. Record and exit requirements in `docs/consolidation/PHASE_02_RECONCILIATION.md`.

- **Hosted Phase 2 gate closed (run #39529008922 on `a6dc21f`):** Ubuntu Node 22 tests/build and immutable gzip budget, all 8 real Chromium acceptance suites and isolated three-era draft recovery **PASS**. The shared-origin older Atlas writer hazard remains the **release gate**, so no PR merge or real-user migration is implied.

## 2026-10-20 — Phase 3: semantic stellar navigation (stacked implementation)

- **Branch lineage:** a dedicated Phase 3 worktree based on standalone Atlas Phase 2 draft `7244d58`; do not confuse this with historic campaign Phase 3. All changes are to the Atlas repository, never the independent Planner or canonical Dossier.
- **New experience:** discover systems at galaxy level and enter through selected-system HUD or deliberate inward zoom. View planetary bodies and preexisting comet/moon/ring/asteroid dressing; back through an inspected planet into system overview, then galaxy. Wheel input received by a 3D world label forwards into the existing OrbitControls canvas. Edit/mode/dialog guards prevent unintended entry. All screen coordinates and camera thresholds remain explicitly provisional.
- **Observed evidence:** 260/260 Node checks and Vite build passed, local gzip 224298/225000; first dedicated desktop/touch Chromium test passed after source-level wheel bridge correction. Remaining nine-suite and hosted packaging results must be checked. Synthetic wheel forwarding is intentionally tested separately from real wheel navigation; emulated touch is not physical pinch proof.
- **Preservation:** no saved schema/key change; three eras, v1 draft import/export, source-linked Dossier/WorldsVault locks, Undo/Redo, user draft recovery and separate orbital .ssp.json Planner handoff are untouched. Full technical ledger: `docs/consolidation/PHASE_03_STELLAR_NAVIGATION.md`. Phase 2 and Phase 3 remain unmerged pending data-safety release proof.

## 2026-10-20 — Phase 3 Node 22 bundle portability repair (draft PR #5)

- The first hosted Node 22 PR check **failed** the unchanged 225000-byte compressed limit at **225708 bytes**, despite 260/260 passing Node tests. Big Mac Node 26's 224298 bytes did not predict hosted outcome.
- Rejected removing separate Three.js vendor caching for a negligible 247-byte improvement. Adopted pinned free open-source `terser@5.51.2` as a dev-only dependency, two compression passes; local gzip now **219605 bytes** (5395 bytes headroom), with a clean `npm ci` rebuild and 260/260 Node tests. Fresh hosted and browser evidence still required.
- No change to renderer architecture, JSON v1, user drafts, exact storage key, the independent Planner or canonical Dossier. Phase 3 remains stacked on unmerged Phase 2 and must not be published until the multi-writer cutover gate is proven.

## 2026-10-20 — Phase 4 zero-loss discovery candidate

- Implemented within dedicated Atlas repository on Phase 3 PR #5 head `2e83f337`: `/` opens Explore before focus; six responsive pull-tabs all visible/tappable at 360–412px without sideways swipe; real existing Undo/Redo/Export/Import controls moved near the top of Explore; Escape/focus restoration and context-aware Inspector tab.
- Automated disposable browser tests exercise six panels, 44px touch targets, focus/search, selected context, actual JSON download and synthetic Undo/Redo, preserving existing editors. Big Mac Node 26 260/260 Node/build and compressed payload 220141/225000 passed. All three dedicated widths (360/412/1280) passed local Playwright; full tenth-suite GitHub CI and physical S Pen remain gates.
- No duplicate button listeners, duplicate data model, replacement physics or edits to canonical Dossier/independent Planner. JSON v1, source locks, three eras, import/export and user drafts are protected. Parent Phase 2 legacy multi-writer cutover remains blocked; no main merge or deploy.
- See `docs/consolidation/PHASE_04_DISCOVERABILITY.md` for precise tests, partial evidence, remaining blockers and rollback.

## 2026-10-20 — Phase 5 network batching, matched draw-call reduction

- Atlas Phase 4 draft PR #6 at `0e5f0a6e` is now **fully GitHub CI-green**: 260 Node tests, ten browser acceptance suites, three-era disposable recovery, and 221170/225000-byte Node 22 gzip payload (run #39539841999). Still unmerged, with Phase 6 multi-writer release protection.
- Phase 5 dedicated worktree `feature/phase05-network-batching` selectively batches radial/perimeter/bridge network guide edges as three `LineSegments` while preserving style, endpoints, topology suppression, bead ornamentation, source-draft boundaries and original renderer lifecycle. Per-edge dash phase must reset to zero; the initial cumulative-phase fixture failed, and the implementation was repaired before reporting success.
- **Matched Big Mac headless Chromium results:** Balanced All-view desktop/tablet **368→294** draw calls (20.1% less); 412px emulated phone **194→163** (16% less). Pure Node **262/262**, build **220332/225000** gzip. Dedicated Network Editor and full procedural-suppression Chromium suites **PASS**; suppression/Undo/Redo confirmed **294→221→294→221**, plus reload/era/canon/mobile protections. The default-seed focus acceptance gains 320/180 draw-call ceilings, **verified PASS** on the rebuilt local candidate; no GPU-time claims. No measured FPS, GPU time or real tablet device proof.
- Continue phased visual fidelity, frame-time/lifecycle experiments, and final backup-first one-writer cutover. Source of truth: `docs/consolidation/PHASE_05_NETWORK_BATCHING.md`; no production release, original Planner or Dossier edits.

## 2026-10-20 — Phase 5 truthful frame-time instrumentation

- Parent `feature/phase05-network-batching` PR #7 at `c4f94ac0` was independently GitHub CI-green (262 tests, ten Chromium suites, synthetic three-era recovery, Node 22 gzip 221367/225000); no production merge/deploy.
- New isolated frame-cadence slice fixes a bogus `fps=1000/CPU-callback-duration` estimate. Measure real render-loop timestamp gaps, bounded 120 samples, mean and median cadence, p50/p95/p99 intervals and callback wall time without any second render loop. A source-level error that discarded severe visible >1s GPU stalls as fake resumes was caught and corrected; only actual `visibilitychange` suspends/restarts the window.
- Read-only numerical `?atlasDiagnostics=1` probe is opt-in for disposable browser QA, never saved JSON. New headless Chromium desktop/touch and three-era test `PHASE5_CADENCE_BROWSER_PASS`, with bounded GPU geometry counts 189→191 after returning to All/Post. Local 268/268 Node tests and 221123/225000 gzip. Software SwiftShader FPS is **not a physical-device FPS claim**.
- A stacked PR, fresh Node 22 CI and full 11-suite/recovery remain required. Source of truth: `docs/consolidation/PHASE_05_FRAME_CADENCE.md`. Real v1 draft storage, canonical topology, independent orbital Planner, 170-year War and release/cutover protections remain unchanged.

## 2026-10-21 — Phase 15 connected provisional survey sectors

- Verified current dedicated Atlas visual reference Drive folder original PNG bytes against exact five historical Git blobs for references 01–05. These are image-identity proof, **not** approved canonical cartography.
- Phase 15 first bounded slice changes legacy circle-based decorative territories to deterministic bounded proximity cells (one per draft galaxy in the default All view), faint chromatic survey fills and dashed outlines under unchanged `layers.territories` JSON key. No persistent/generated border data or invented faction claim. Existing independently editable `StrategicStudio` region polygons remain visibly stronger and are owned by the same editor; old circles are retained as robust >32/ambiguous-site fallback.
- Local 273/273 Node and Vite build **221990/225000 gzip**; desktop/tablet All-view **294** draw calls unchanged, emulated 412px phone **163→172** (under the 180 budget). Existing fullscreen and strategic acceptance suites **PASS**. Disposable browser `PHASE15_BROWSER_PASS`: toggle, authored polygon with editor closed, Undo/Redo, reload, War/Post independent drafts and 412px emulated touch. Hosted CI and physical tablet still pending.
- PR #8 frame cadence remains hosted green; Phase 15 is a **stacked draft** and does not release until Phase 6 backup-first one-writer proof. See `docs/consolidation/PHASE_15_SURVEY_CELLS.md` for exact hashes, bounded code, local evidence and future visual acceptance.
