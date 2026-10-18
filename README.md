# Starsilk Map of the All

**The Map of the All** is a standalone Three.js, 4X-inspired, source-aware, editable survey of the Starsilk universe.

- **Standalone repository:** https://github.com/westkitty/Starsilk_Map_of_the_All
- **Published Atlas:** https://westkitty.github.io/Starsilk_Map_of_the_All/
- **Orbital laboratory:** https://westkitty.github.io/Star_System_Planner/
- **Lore authority (read-only):** https://github.com/westkitty/Starsilk_Character_Dossier

All generated galaxy positions, coordinates, routes, regions and example world locations remain **provisional drafts**, not canon. The published WorldsVault identity and relationship graph has no confirmed map coordinates.

## Run independently

Requires Node.js 22 or newer.

~~~sh
git clone https://github.com/westkitty/Starsilk_Map_of_the_All.git
cd Starsilk_Map_of_the_All
npm ci
npm run dev
~~~

Open the local Vite URL ending in `/Starsilk_Map_of_the_All/`. The development root, bundle, tests, published website and Git history are owned by **this repository**; nothing needs to be run from Star System Planner.

~~~sh
npm run check
npm run test:browser  # Chrome/Chromium with working WebGL
~~~

`npm run build` creates the static deployment in `dist/`. GitHub Actions tests and deploys this repository to its own GitHub Pages project path, independently from the Planner.

## Project separation

The Git history was extracted from `westkitty/Star_System_Planner/map-of-the-all/` with `git subtree split`, preserving the development lineage without importing the Planner's React app or physics runtime. The historical embedded Atlas URL remains available as a **compatibility snapshot**, but **future Atlas changes belong in this repository**.

From the Atlas, select a draft stellar system and choose **EXPORT SYSTEM .SSP**, then **OPEN PLANNER**. This navigates to the separate orbital simulator; you manually import the generated `.ssp.json` file. The bridge creates hypothetical physics with source status unknown. Neither app changes the other's repository or upgrades drafts to official canon.

Browser storage remains local under the existing key `starsilk.map-of-the-all.draft.v1`. Project paths on the same `westkitty.github.io` origin can read the same draft key, but different browsers, profiles or hosts do not automatically share drafts. **Export a JSON backup before switching sites or devices.**\n\n**Deletion recovery:** draft deletions, Undo/Redo, confirmed imports and era switches are saved immediately before they are accepted. If a local write fails, the Atlas retains a newer same-tab sessionStorage copy, favors it over stale local data on reload, and offers **SAVE RECOVERED DRAFT LOCALLY** / **EXPORT RECOVERED JSON** in Explore. If both storage locations fail, destructive edits are rejected rather than displayed as saved. Unreadable JSON is never silently overwritten; the recovery drawer can download its exact bytes. Session storage is not permanent: export a backup before closing the browser.

Historical phase notes below still describe some work performed when the Atlas was embedded under the Planner. Those are archival evidence, not current setup instructions; see `docs/EXTRACTION_PROVENANCE.md`.

## Interactions

- Drag / pointer orbit, wheel or pinch zoom, two-finger pan, hover-free selection, double-click to dive; 3D hit testing and clickable DOM-projected labels.
- All → galaxy → stellar system → labelled planets and editable annotations. Breadcrumbs, Home/Escape, search, focus, top-down and reset cameras.
- Eleven independently switchable layers: galactic structure, stellar detail, Hookshot corridors, azure Starsilk filaments, territory overlays, the Siege Wall absence, Blood Rings, WorldsVault references, annotations, typography and coordinate guides.
- Three temporal lenses: Blood Eclipse War, Siege Wall locking, post-Siege. **Visual filters only**, not computed historical census or epoch-specific correct positions.
- Inspect and edit provisional object names, descriptive annotations, X/Y/Z *display* coordinates, colors, size, label colors, typeface and font size.
- Create galaxies, systems, planets, and annotations. Select CONNECT ROUTE then select another object on the same tier to make a corridor; change corridor type between provisional Hookshot and azure via `H`/`S` and remove with `×` in the route list.
- **Safe draft deletion:** use the inspector DELETE SELECTED DRAFT control for one node, or Strategic Studio GROUP then Shift-click/marquee/ALL VISIBLE and DELETE SELECTED DRAFTS for a group. Preview the dependents before confirming; one Undo restores all removed nodes, connected corridors and dependent regions. Delete/Backspace guards text inputs and dialogs. Canonical source records cannot be deleted. Provisional sectors and routes have their own delete controls.
- Auto-save to browser-local `localStorage`; JSON export/import, bounded schema validation, 30-step Undo (`Ctrl/Cmd+Z`). Import demotes incoming canon claims, rather than granting source authority.
- Tablet-aware layout, optional cinematic quality, reduced-motion respect, capped DPR, bounded star particle counts, one render loop, DOM label reuse and GPU resource disposal during view changes.

## Preservation and integration

This is an independent Vite app, not a refactor of the mature per-system simulator. Avoid copying the existing planner's physics engine into the cosmological rendering scale. The integration seam is the named child system: future deep dives may use a stable export/bridge into the mature `Star_System_Planner` system simulator instead of re-implementing n-body mechanics.

`map-of-the-all/atlas-data.js` owns draft state + validation; `atlas-engine.js` owns Three.js WebGL scene, controls, level-of-detail, picking and animation; `main.js` owns semantic DOM + editing + persistence; `atlas.css` owns presentation. All objects are in display coordinates, not light years/AU or actual physical measurements. No root Dossier writes and no canon approval paths exist.

## Source hierarchy

1. `westkitty/Starsilk_Character_Dossier/src/content/` and `src/canon/invariants.json` own lore.
2. The published `/worldsvault/worldsvault.json` contains direct-authored topological relationships, without authored numeric coordinates.
3. Planner read-only snapshot + display models can cite that source, not override it.
4. Five user-supplied images establish distinct **visual presentation variants**, not a guaranteed final official map.
5. This prototype's generated graph is explicitly a draft and may not be promoted to canon by edit, import, or export.

See `docs/CANON_AND_IMAGE_AUDIT.md` and `docs/COMPARATIVE_RECON.md`.

## Checks

```bash
node --test tests/atlas-data.node-check.mjs
node --check atlas-data.js
node --check atlas-engine.js
node --check main.js
# From the standalone repository root:
npm run check
npm run test:browser
npm run bundle:report
```

The Node checks prove the data model, editor markup and source integrity boundaries. Desktop Brave automation has exercised WebGL startup, layer toggles, full three-tier navigation, edits, persistence, export and the parent route. Tablet (1280×800) and phone (412×915) touch emulation have also passed. Physical Galaxy Tab S9/S Pen behavior, GPU frame rates, long sessions and GitHub Pages deployment remain unverified. See [QA evidence](docs/QA_EVIDENCE.md). The temporal lens remains editorial rather than a historical simulator.


## Phase 2: source topology and orbital laboratory

The header's **SOURCE GRAPH** opens an offline, read-only relationship projection of the Dossier's 11 WorldsVault identity nodes and 6 direct-authored relations, pinned to Dossier blob `862bc476fb8165784704151eed35c915cbf31bf4`. It is a conceptual graph without coordinates or route metrics, and its evidence links open the Dossier.

Select a **draft stellar system** (or enter it), then choose **EXPORT SYSTEM .SSP** and **OPEN PLANNER**. Use the planner's existing **IMPORT** control to load the downloaded `.ssp.json`. The bridge generates explicitly hypothetical physical initial conditions with source status `unknown`; no atlas display distances become physical measurements, and no project is auto-imported or overwritten.

See [Phase 2 design and risk boundary](docs/PHASE2_SOURCE_GRAPH_AND_HANDOFF.md). The standalone `npm run test` suite verifies the Atlas model and safe JSON handoff. The separate Planner once ran an importer compatibility test; this repository does not build that other app. Cross-repository compatibility requires verification against the deployed Planner.

## Future expansion roadmap

1. Canon read-only sync with stable entities/edges and explicit missing-coordinate records, version/hash conflict indicator, topology versus metric view.
2. Import/export world schema bridge to Star System Planner's mature gravity/orbit simulator, with no duplicate physics ownership.
3. Per-system data-driven Starsilk macros, Drakken containment and Blood Rings, tied only to source-confirmed eras and loci.
4. Tablet S Pen drag/reposition gizmos, undoable gestures, multi-select and lasso, resizable labels with collision editing.
5. Lazy-loaded star catalog chunks, instancing/impostors, camera-relative render frame, worker generation, adaptive quality/FPS overlay.
6. 4X survey infrastructure: exploration visibility, noncanonical named factions, causal event atlas, logistics routes and timeline forks as user-authored proposals.
7. Source-ledger and contradiction review UI with explicit canon-promotion approval outside the editor.

This is a prototype, not an asserted complete cosmos.

## Phase 3: Spatial Studio (draft editing)

The top editing rail supplies **ORBIT**, **MOVE**, **ROUTE** and **TYPE**. Move: select a draft and drag the glowing handle in its XZ plane or Y axis; optional snap is in **display units**, never real measurements. Route: select two draft objects of the same tier and parent. TYPE: drag an editable label; offset is normalized to viewport size and survives JSON export, local autosave, and import. Escape cancels an active gesture. All gestures are undoable with Ctrl/Cmd+Z.

Three **presentation-only** lenses—Survey, Signal and Cartographer—change appearance without altering coordinates, canon or the current draft state. Overall type scale is adjustable. Published source identities are read-only in every editing mode.

Design limits and regression contract: [Phase 3 Spatial Studio](docs/PHASE3_SPATIAL_STUDIO.md). Node checks: `npm run test` from the repository root; real browser acceptance: `node scripts/spatial-studio-browser-ci.mjs` after install and build on a Chromium-capable runner.


## Phase 4: Strategic Atlas Laboratory

Open **REGIONS** in the six-tab Atlas rail. In **GROUP**, Shift-select any two or more draft markers of the visible tier, marquee-select a collection, or choose **ALL VISIBLE**; drag the projected centroid handle or use accessible X/Z/Y nudge buttons. Group movement is bounded, snaps a single shared translation rather than distorting the constellation, and creates **one Undo entry** on release. Reference landmarks cannot be selected or moved.

In **REGIONS**, create a provisional sector from the current selection or draw a 3–24-point polygon with the pointer. Drag individual vertex handles, edit numeric X/Z coordinates, add/remove vertices, name and recolor the draft sector, and inspect its enclosed nodes plus internal/frontier corridor counts. Regions cannot overlap their way into canon: membership is strictly editorial, measured only in **display units**. Region data remains optional in the original JSON v1 save format, preserving old drafts; it can be imported, exported, undone or deleted without modifying source topology.

The original orbital laboratory, Phase 3 tools, WorldsVault source graph and original planner app remain isolated. No official faction ownership, star metric, territorial border or travel-time claim is made. See [Phase 4 scope, safeguards and QA](docs/PHASE4_STRATEGIC_ATLAS.md). Run `npm run test`; dedicated Chromium QA is `node scripts/phase4-browser-ci.mjs` once the browser driver is installed in a disposable QA environment.

## Phase 5: Network Intelligence (draft connectivity)

Open **ROUTES** in the Atlas rail at the All, galaxy or system tier. Select a corridor filter, two draft objects and **TRACE FEWEST HOPS** to highlight a route in the existing Three.js camera. A hop is *one proposed connection*, never light-years, transit time or travel permission. See the number of components, isolated nodes and cut corridors; toggle hypothetical outages to explore connectivity without modifying saved routes. **CLEAR OUTAGES** restores the view.

The **COMMIT ONE DRAFT CORRIDOR** button is optional and writes **only a new draft** route through the existing editor validation/Undo ledger. Canonical WorldsVault relationships cannot be navigated or edited as transport corridors. No new saved data fields, metric weights, servers, dependencies or second render loop.

See [Phase 5 architecture, comparison and acceptance criteria](docs/PHASE5_NETWORK_INTELLIGENCE.md). Model tests: `npm run test`. The real Chromium route journey is checked by `scripts/phase5-browser-ci.mjs` on feature-branch CI.

## Phase 6: Independent era snapshots, comparison, and Pages launch

The **ERAS** pull-down tab opens the **Temporal Atlas**. It provides three independently editable editorial eras, an accessible three-position scrubber, per-era notes, draft snapshot comparison and 3D-projected change trails. Existing node positions, star systems, corridors, regions, layer toggles and saved labels are preserved independently per era. A named historical category is **not** a source-authored cosmic coordinate or timestamp.

The `version:1` JSON and existing storage key remain compatible. Old saves without a timeline are expanded to separate equal draft snapshots. Snapshot copy into another era requires an explicit confirmation and creates one Undo step; comparison never changes saved data. On importing JSON, source-identity claims are demoted across every era.

See [Phase 6 design, safeguards and release checks](docs/PHASE6_TEMPORAL_CARTOGRAPHY.md). Run all Atlas tests with `npm run test`. Browser acceptance lives in `scripts/phase6-browser-ci.mjs`.

**Publication:** [System Planner](https://westkitty.github.io/Star_System_Planner/) is a separate live project. [Map of the All](https://westkitty.github.io/Starsilk_Map_of_the_All/) is the intended new URL but is **not yet published**. See [Uplift ×5 evidence](UPLIFT_X5_2026-10-17.md).

## Fullscreen-first visual repair

The All is the default full-screen view. Six closed pull-down tabs provide EXPLORE, INSPECT, EDIT, REGIONS, ROUTES and ERAS. Existing controls remain connected in their respective drawers, including save/export, camera, timeline and source graph. Escape closes the active drawer. A minimal return-to-All control stays available.

Published regression reproduced: WebGL initialized, but a negative first-frame curve parameter caused a getPointAt TypeError and prevented rendered draw calls. A clamped animation delta, wrapped curve phases and exception isolation for decorative particles fix this; new real Chromium CI asserts nonzero draw calls on desktop, tablet and phone layouts.


## Uplift ×5 (2026-10-17)

Five bounded repairs add corrupt-JSON recovery, page-exit autosave durability, master-layer and modifier-key fixes, safer pointer picking with reduced label-vector allocation, and a self-contained build with a separated Three.js vendor bundle and 225 KB JS/CSS compressed delivery budget.

**Local proof:** 81 Node model tests, a full production build and five end-to-end Chromium journeys (desktop, emulated tablet/phone) passed. GitHub creation is blocked by an invalid CLI credential; neither new Pages publication nor actual Tab S9 S Pen operation has been verified.
