# Atlas Operational State

project_id: starsilk-map-of-the-all
project_name: The Map of the All — 3D Prototype
revision: 13

## Current baseline

- Current primary repository: `westkitty/Starsilk_Map_of_the_All` on branch `feature/omni-uplift-100`.
- The Atlas is at this repository root. The earlier embedded Planner map and the mature orbital simulator remain protected and unchanged.
- Local canvas/page code and versioned JSON schema v1 exist.
- 7 starting galaxies, 35 starting systems, 105 starting planets, 2 labeled source-identity landmarks, 10 proposed corridors. Every numeric coordinate is generated/editorial.
- 127 authoritative stable identities from the Character Dossier are indexed in read-only `canon-registry.js` with unauthored coordinates.
- No physical distance/ephemeris or canonical territory is asserted.
- The UI separates read-only source-linked landmarks from editable drafts; imports demote any source-identity claim.
- The advanced planet simulator is not coupled or replaced.

## Verification states

- VERIFIED (2026-10-17 / Campaign Phase 01): Circular point shader starfield, label truncation fixed, drawer shortcuts [1]-[6], All-framing optimization, 125 draw calls, 81/81 tests pass. Commit SHA: `a2d442781f1871b3b6023401051c920417edea60`.
- VERIFIED (2026-10-17 / Campaign Phase 02): 127 stable Dossier identities indexed, canon search across Principal, Peripheral, Drakken and Foundational groups, unplaced canonical inspector UI with Dossier links, repair alerts (AT-001, AT-010), source revision footer (`862bc476`), 86/86 Node tests pass, Playwright browser test pass (125 desktop / 125 tablet / 77 phone draw calls, 0 console errors), production build within budget. Commit SHA: `069835ad32090c4d55b9b4c53910653e69049fa8`.
- VERIFIED (2026-10-17 / Campaign Phase 03): Smooth cinematic camera transitions with cubic ease-in-out interpolation (`easeInOutCubic`), spatial memory (`viewMemory`) restoring previous inspection angles, interactive WebGL selection reticle with rotating brackets/diamond ticks, raycast hover detection (`pointermove`), `.world-label.hovered` styling, contextual tier messages, 87/87 Node tests pass, Playwright browser test pass (125 desktop / 125 tablet / 77 phone draw calls, 0 console errors), production build within budget.
- NOT VERIFIED: Galaxy Tab S9/S Pen physical behavior, hardware frame rates and thermals, long-session reliability, production GitHub Pages publication, canonical map coordinates.

See docs/QA_EVIDENCE.md for observed browser paths and evidence limits.

## Protected invariants

- `Starsilk_Character_Dossier` has no write route from atlas code.
- Exact source-first nature of the WorldsVault topology; non-canonical coordinates must not be presented as authoritative.
- Blood Eclipse War length is 170 years. Starsilk is cyan/azure.
- Siege Wall visually signals a black-hole containment lattice and absence, not a solid mundane wall.
- The source concepts may not be deleted or modified; fork into drafts.
- Keep portal path `map-of-the-all/` isolated from parent root behavior.

## Pending / unknown

- Physical Tab S9 S Pen gesture latency and performance, real-device visual QA and public deployment.
- Source-live update path and authoritative spatial coordinate authoring (none published).
- Future 4X strategic simulation and timeline snapshots (not included in this prototype).
- Source-linked WorldsVault constellation graph, independent of illustrative galactic geometry.

## Phase 2 scope, 2026-10-17

- New read-only WorldsVault conceptual topology module: exact 11 published identities and 6 directed, source-cited relations, provenance pinned to Dossier Git blob `862bc476fb8165784704151eed35c915cbf31bf4`; no authored distance/position/route is inferred.
- New opt-in orbital laboratory export with explicit `NON-CANON SANDBOX` classification and unknown canon status. Exports compatible `.ssp.json` files for manual user import into existing System Planner. No parent autosave, simulation, or source canon write routes.
- Added focused Node source/bridge tests and a test that invokes the actual System Planner importer, plus branch/PR GitHub Actions validation workflow.
- **Verified locally in this phase:** 21 Atlas Node tests pass and JavaScript syntax checks pass against the isolated project source.
- **Awaiting CI/runtime proof:** parent Vitest importer compatibility, TypeScript, multi-page production bundle, new graph UI interaction, actual import journey, and mobile hardware behavior. Prior Phase 1 browser evidence remains valid only for the earlier version.
- Preserve external source identity priority and never promote the source's `canon_status: unknown` to canonical.

## Phase 3 state, 2026-10-17

- Isolated Spatial Studio (Orbit / Move / Route / Label), controlled pointer interactions, bounded normalized label offsets and 3 visual lenses. Works with schema-v1 legacy drafts without migration.
- Move and label drag produce preview-only pointer updates; one release = one Undo entry. ESC/cancel makes no draft edit. No extra Three.js frame owner added. Source-linked concepts are not draggable.
- Route authoring checks same parent/kind, forbids source links and duplicate corridors. Snap units are display units only.
- Local pure regression run: **29 Atlas Node tests passed** including Phase 2 and new Phase 3 fixtures; JS syntax checked locally.
- CI workflow augmented with Playwright/Chromium interaction check; verify actual run status after push. Physical Tab S9 stylus hover, thermals, target FPS, accessibility walk and deployed Pages remain unverified.
- Protected: Dossier, original parent src, simulator physics, visual canon identity and topology source graph.

## Phase 4 candidate, 2026-10-17

- Added optional `regions` to legacy Atlas v1 draft schema, with safe polygon topology limits and no import elevation of canon identity. Region data remains editorial only, separate from read-only Dossier WorldsVault relations.
- Group selection (up to 32 draft nodes), atomic rigid translations with snap/clamping, accessible nudge and drag, selection marquee. Region creation from group hull or pointer-drawn points, vertex edit and 4X-style member/route reports. Only Atlas app files and the CI script/workflow have changed.
- **Locally verified:** 11 Phase 4 pure Node tests passing, JS syntax checks, and full DOM editor-control ID coverage. Earlier Phase 3 verification is a baseline, not Phase 4 browser proof.
- **Awaiting fresh CI and runtime proof:** full parent tests, build/budgets, group move and vertex browser interactions, physical Galaxy Tab S9/S Pen tests. Do not claim a final Phase 4 pass until CI finishes.

## Phase 5 candidate, 2026-10-17

- The Network Intelligence Lab derives the active-tier draft graph, minimum-hop paths, disconnected components and cut-edge bottlenecks; it offers temporary hypothetical lane closures and read-only before/after reports.
- A projected SVG overlay reuses the existing 3D engine camera/controls without owning another frame loop. One explicit proposed-link action uses the existing route validation, draft mutation, Undo and persistence path.
- No changes to saved schema v1, physical distances, source identity canon, Dossier, protected original parent simulation, or external services.
- **Verified locally:** 13 new pure Node tests (path BFS, filters, undirected multigraph bridges, closures, tier bounds and source protection) and JavaScript syntax/DOM wiring checks. Full CI and browser journey need evidence from this commit's workflow run.
- Phase 4 actually passed its full Actions QA at https://github.com/westkitty/Star_System_Planner/actions/runs/39028632301, including Phase 3/4 Chromium testing, 42 Atlas Node tests, original planner tests, TypeScript and bundle gates.
- **Unverified:** physical Galaxy Tab S9 stylus/touch thermals; platform-wide frame times, user approval of actual canonical layout, merge and Pages deployment.

## Phase 6 / release candidate (2026-10-17)

- Added optional `timeline.version=1` with `war`, `locking`, `post` editorial snapshots. Each snapshot owns draft nodes, routes, regions, and layer visibility; animation quality and typography scale stay global.
- Current top-level state mirrors the selected snapshot for backward compatibility. All mutating editor paths sync the active era before validation; switches and explicit copies are undoable. No generated real dates, mathematical ephemerides, canonical travel times, or sovereign borders.
- New temporal model validates every nested snapshot through the parent Atlas validator, rejects incoherent mirrors and incomplete manifests, and demotes all imported reference identities across all eras.
- Separate comparison panel, discrete scrubber, per-era notes, and read-only SVG camera-projected change trails. Three.js still owns one render loop.
- **Verified locally:** 14 Phase 6 Node tests and JavaScript syntax checks. **Full feature CI, browser interaction and public deployment remain unverified until successful run evidence is captured**.
- Release scope explicitly authorized: stage/commit/push feature; PR merge all prior phases into main; main branch GitHub Actions Pages deployment with live root and Atlas HTTP verification. The original planner app remains the root entry.
- New `.github/workflows/deploy.yml` gates Atlas model tests, all four browser journeys, root bundle gates, and post-deploy public URL proof. Do not claim deployed until actual Pages run and HTTP evidence exist.

## User-visible render and HUD repair

- Public Pages browser reproduction: HTML 200 and WebGL context available, but route particle exception in first animation frame caused zero GPU draw calls. Fixed nonnegative bounded frame delta and curve phase normalization; decorated particles cannot crash render loop.
- Atlas now starts fullscreen with six closed pull-down control tabs. Removed permanently visible large opaque inspector, navigator, timeline, and editing tool bars. Existing content/draft schema/source canon unchanged.
- Added direct render/drawer browser acceptance suite and updated previous editor smoke paths for new collapsed UI. Physical Galaxy Tab S Pen validation remains outstanding.


## Standalone repository migration — 2026-10-17

- New canonical code owner: `westkitty/Starsilk_Map_of_the_All`, initialized from path-filtered Git history of `map-of-the-all/` in `westkitty/Star_System_Planner`. Extraction source commit: `05bf20257dca7d51d8a2531c633cdbf8d5ccdadd`; extracted tip: `93dbc3bcaf1606153ddd1ac2f41c393f09aeb4aa`.
- Own Vite base `/Starsilk_Map_of_the_All/`, package lock, standalone Node tests, adapted desktop/tablet/phone browser journeys and GitHub Pages workflow.
- Original `/Star_System_Planner/` and legacy embedded `/Star_System_Planner/map-of-the-all/` stay intact; no deletion, rewrite or silent sync. The new repo is authoritative for NEW Atlas changes; historical Planner route can remain as compatibility.
- Source-linked Dossier topology remains read-only; coordinates, era lenses, corridor lengths and political boundaries are noncanonical drafts. Existing `.ssp.json` handoff targets the sibling Planner URL explicitly, with manual import.
- Preserve the original localStorage key; both GitHub Pages project URLs share the `westkitty.github.io` web origin. Browser profiles, devices and alternate hosts do not share local drafts automatically.
- The legacy validation and release claims above refer to their dated origin in the parent project. New independent CI/deploy and physical S Pen checks require separate evidence, not inference from source.


## UPLIFT x5 — 2026-10-17

- Loop 1 DATA RECOVERY: new read-only bootstrap evaluator, preserved original malformed localStorage bytes, visible original-JSON download and explicit replacement control. New Node and live-browser fixtures; never silently overwrite invalid stored work.
- Loop 2 AUTOSAVE DURABILITY: pending writes are synchronously flushed on pagehide and hidden visibility; local save failure remains explicitly export-required. User-triggered draft import respects pending corrupt-data recovery.
- Loop 3 EDITOR UX: master layer control now derives its action from actual layer state, instead of stale session-only toggle; Ctrl/Meta/Alt browser shortcuts do not activate map hotkeys, with intended Undo preserved.
- Loop 4 POINTER/PERFORMANCE: disambiguate primary pointer identity, clear stale picks on pointer cancel/lost capture, reuse scratch vectors during frequent DOM-label projection updates.
- Loop 5 RELEASE GATES: self-contained Three.js vendor chunk and compressed-asset delivery budget, preserved independent Planner link, enhanced real-browser regression tests. Build/runtime evidence must be recorded from actual executions.
- The existing GitHub CLI credential is invalid (GitHub API returned HTTP 401 from the authorized MacBook SSH environment); creation and Pages publication remain BLOCKED until valid machine or provider authorization is available. The earlier GitHub 404 for the destination proves the remote had not been created at that check.
- Source governance remains unchanged: numerical geometry/route lengths/territories are provisional, Dossier and WorldsVault are read-only, Blood Eclipse War lasted 170 years. The old Planner site is unchanged.

## Phase 01: Cosmic Overview and First Impression (Loops 001–005) — 2026-10-17

- **Loop 001 COSMIC DEPTH**: Replaced untextured `PointsMaterial` with smooth circular shader points (`ShaderMaterial` with `gl_PointCoord` radial falloff and clamped pixel-ratio scaling), eliminating near-camera square pixel artifacts while respecting the starless Siege Wall absence (`z < -110`).
- **Loop 002 FULLSCREEN TYPOGRAPHY**: Fixed desktop label ellipsis truncation (`max-width: min(380px, 85vw)` in `atlas.css` and `atlas-focus.css`), preventing names like "THE SIEGE WALL", "MOTHER / AUREAL NEBULA", and "SOUTHERN TERRITORIES" from being clipped. Added numeric keyboard shortcut toggles (`1`–`6`) for the pull-down drawers with tooltips.
- **Loop 003 CANONICAL CARTOGRAPHY BADGES**: Added explicit cartographic badges (`[SOURCE TOPOLOGY]`, `[BLACK-HOLE LATTICE / ABSENCE]`) to DOM labels so readers immediately understand provenance and topology vs. provisional drafts without opening the inspector.
- **Loop 004 CAMERA BOUNDING & FRAMING**: Optimized initial All-scale camera position to `[0, 215, 280]` and target `[0, -4, -12]` so the entire northern Siege Wall boundary and southern territories render comfortably inside the viewport without edge clipping.
- **Loop 005 QQQ VISUAL VERIFICATION**: Captured fresh Chromium screenshots across desktop, tablet, and mobile; verified 125 active GPU draw calls; 81/81 pure Node tests passing (258ms); zero uncaught page errors.

