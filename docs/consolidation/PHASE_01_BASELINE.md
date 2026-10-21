# Consolidation Phase 01 — Authority, Ownership and Baseline

**Evidence date:** 2026-10-20 (America/Detroit; tool timestamps on 2026-10-21 UTC)
**Status:** Phase 1 review candidate. The outstanding PR #2 remains unmerged; no Atlas feature integration or deployment is authorized.
**Governance source:** [CONSOLIDATION_MASTER_PLAN.md on PR #2's documentation branch](../../CONSOLIDATION_MASTER_PLAN.md) (commit `c4e1ea3c2a037c6087222df3661062de7ff3ee92`).
**Scope:** Inventory, reproducible validation, isolated draft-recovery proof, and superseding documentation ONLY. Not Phase 2.

## 1. Exact authority and live repository identity

| Surface | Observed ref / state | Authority / risk |
|---|---|---|
| **Atlas** `westkitty/Starsilk_Map_of_the_All` | `main`: `ba95b1e9e3ff0aafe480e90b07573cad670e76f9` | **Only permitted Atlas development/release owner** |
| Atlas plan branch | `docs/atlas-consolidation-master-plan-20261020`: `c4e1ea3c2a037c6087222df3661062de7ff3ee92` | [PR #2](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/2) **OPEN, unmerged**, read-only governing specification for this PR |
| Atlas feature branch | `feature/omni-uplift-100`: `a322a244677117441375fdb04d484015a540fc00` | **16 commits ahead, 1 main-only commit behind; must not merge in Phase 1** |
| Independent Planner | `westkitty/Star_System_Planner` `main`: `dc3c742743838757aaafed9e637d95a5aa814596` | Root orbital simulator and saves independently owned; embedded Atlas is legacy comparison source |
| LM Arena placeholder | `westkitty/starsilk_map_lmarena` `main`: `9ec1b72a0ff308faf24d3be8528bdd4a212f51bf` | README-only, **no app code** |
| Dossier + WorldsVault | Separate read-only authority | Canon identities/topology; no numeric cosmic coordinates, orbits, borders or distances |

GitHub repository metadata confirms the standalone repository is public, default branch `main`, with connected write permission. Three standalone refs listed above were refreshed; PR #2 is the sole current open plan PR. Only the `main` push triggers `.github/workflows/deploy.yml`: feature/docs PR creation does **not** publish Pages. The most recent observed Pages run is [39105968854](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39105968854): `main` at `ba95b1e9`, **success**, 2026-10-18. This is deployment evidence for that SHA, not fresh Phase 1 branch CI.

At inspection all three HTTPS routes returned **HTTP 200**: [dedicated Atlas](https://westkitty.github.io/Starsilk_Map_of_the_All/), [root Planner](https://westkitty.github.io/Star_System_Planner/), and [legacy embedded Atlas](https://westkitty.github.io/Star_System_Planner/map-of-the-all/). A 200 verifies publication, not WebGL or every control.

### Machine fingerprint and local-path trap

DEX//REACH `macbook-air.local`: `/Users/andrew/Starsilk_Map_of_the_All` remote `git@github.com:westkitty/Starsilk_Map_of_the_All.git`, **clean** checkout of `feature/omni-uplift-100` at `a322a244`. This feature checkout was **not edited**. Earlier reports identified a misleading `/Users/andrew/Star_System_Planner` path whose origin was a different repository; **never trust directory names**.

DEX//REACH `bigmac`: created a **new, isolated clone** at `/Users/bigmac/Starsilk_Map_of_the_All_phase1_20261020`. Verified `origin https://github.com/westkitty/Starsilk_Map_of_the_All.git`, original clean `main` at `ba95b1e9`; created local branch `consolidation/phase-01-baseline-20261020` from that exact commit. Node `v26.12.0`, npm `11.20.0`, Git `2.56.0`, macOS arm64. Browser scripts select installed Brave Chromium with SwiftShader/headless flags. This clone is isolated from real browser profiles and from the MacBook feature checkout.

**External authority correction still required:** older ChatGPT Project directives claim `Star_System_Planner/map-of-the-all/` is the permanent development target. The user has superseded that decision. Repository docs cannot alter external Project instructions; the owner must update them.

## 2. Fresh reproducible baseline — dedicated main

All results in this section are **ref-bound to standalone `ba95b1e9`**, not to the unmerged feature branch. Checks were run from the isolated Big Mac clone. Commands do not access the user's browser profile.

| Command / evidence | Result |
|---|---|
| `npm ci` | **PASS**, 13 packages added; npm reported one high-severity advisory and install-script policy warnings |
| `npm run check` | **PASS**: `npm run test` and `npm run build` completed |
| `npm run test` summary rerun | **216 tests, 216 pass, 0 fail, 0 skipped** |
| `npm run bundle:report` | **PASS**: gzip 218,268 / 225,000 bytes; 6,732 bytes headroom |
| npm audit (read-only) | **OPEN:** one high-severity advisory affecting pinned Vite/dev-server dependency; dependency repair outside Phase 1 |
| `node scripts/spatial-studio-browser-ci.mjs` | **PASS**: explicit `PHASE3_BROWSER_PASS`, move/Undo, label persistence, route and mobile; independently and within full suite |
| `node scripts/phase4-browser-ci.mjs` | **PASS** on full browser rerun: explicit `PHASE4_BROWSER_PASS`, group transform/Undo, region editing, external Planner link, mobile |
| `node scripts/atlas-focus-browser-ci.mjs` | **PASS** in subsequent full browser rerun, explicit `FOCUS_BROWSER_PASS`, WebGL draw calls desktop/tablet 156 and phone 93; initial direct RPC timed out at 60 seconds before final marker |
| `node scripts/phase5-browser-ci.mjs` | **PASS** in full `npm run test:browser`: explicit `PHASE5_BROWSER_PASS`, trace, closure recovery, draft commit/Undo, tier and Planner link, mobile |
| `node scripts/phase6-browser-ci.mjs` | **PASS** in full `npm run test:browser`: explicit `PHASE6_BROWSER_PASS`, three era independence, comparison, clone/Undo, export/reload, legacy import demotion, mobile |
| `npm run test:browser` | **PASS**: all **5/5 browser suites** emitted explicit PASS markers (`FOCUS`, `PHASE3`, `PHASE4`, `PHASE5`, `PHASE6`) and wrapper printed `PHASE1_BROWSER_RUN_EXIT:0` on isolated main clone; simulated desktop, tablet and phone. The first direct focus attempt timed out at RPC boundary, superseded by the full successful rerun |
| `node scripts/phase1-draft-recovery-browser-ci.mjs` | **PASS**: explicit `PHASE1_RECOVERY_BROWSER_PASS`, three-era synthetic JSON export, cancel, invalid rejection, confirmed import/reload/source demotion, corrupt original exact-byte preservation; all in disposable Playwright browser contexts |

No claims of physical Galaxy Tab S9 Ultra/S Pen proof, live-user draft recovery, sustained FPS, or feature-branch browser verification. SwiftShader screenshots/draw calls are not representative physical GPU performance.

### Browser-risk acceptance targets

- At width 360–412 px, all six EXPLORE/INSPECT/EDIT/REGIONS/ROUTES/ERAS destinations must be discoverable **without requiring undisclosed horizontal swiping**. **Freshly reproduced in disposable 412 px Chromium context:** 1 of 6 tabs fully visible; tab rail client width 126 px, scrollWidth 561 px. **Known UI defect**; no Phase 1 fix.
- With all drawers closed, pressing `/` must open Explore and put keyboard focus in search. **Fresh 412 px repro:** after `/`, `data-active-drawer="none"`, `document.activeElement.id=null`. **Known UI defect**; do not fix this in Phase 1.
- For import/export: an isolated synthetic draft must survive download → guarded import → cancellation/retry → reload, with three independent eras, annotations, regions, route variants, and source-status demotion.
- Existing Chromium suites may themselves have incomplete-reporting defects; do not treat process exit 0 alone as journey proof.

## 3. Cross-repository capability and module ownership ledger

Evidence states: **PRESENT** = inspected file/function/verified current source; **TESTED** = a named check executed on this ref; **REPORTED** = prior audit evidence not freshly rerun; **PENDING** = port/repair outside Phase 1. These are **ownership decisions**, not claims that every interaction has been physically retested.

| ID / capability | Sole destination / module ownership | Current divergence and Phase 1 disposition |
|---|---|---|
| NAV-01 All → Galaxy → System/Planet, picking, camera memory, labels | Standalone `atlas-engine.js`, `main.js`, `atlas-focus.js` | **PRESENT; preserve** standalone hierarchy and one renderer; legacy is not its replacement |
| NAV-02 Semantic inward wheel/pinch zoom | Legacy `map-of-the-all/system-zoom.js` and `onDollyEnter` | **Legacy-specific; PENDING Phase 3**; must guard accidental entry |
| NAV-03 Floating ENTER/BACK/OVERVIEW HUD | Legacy `main.js` stellar HUD | **Legacy-specific; PENDING Phase 3**; do not make competing navigation |
| STEL-01 Stars/planets/moons, orbital scene, rings, asteroids | Standalone `atlas-engine.js`, `stellar-telemetry.js` | **PRESENT**; compare legacy orbital dressing object by object |
| STEL-02 Comet, optional companion, quality-tuned dressing | Legacy `system-orbit-details.js`, `visual-fidelity.js` | **Legacy leads; PENDING Phase 3**, not physical orbits/canon |
| STEL-03 Label constraints & source chronology details | Legacy `label-layout.js`, `canon-chronology.js` | **Legacy-only files**; compare against standalone `canon-registry.js` and chronology safeguards; avoid duplication |
| CAN-01 127 Dossier identity index, search, protected inspector | Standalone `canon-registry.js`, `source-assets.js` | **PRESENT; protected**; official entries remain unplaced |
| CAN-02 WorldsVault 11 IDs / 6 direct relations | Standalone `source-topology.js`, `source-graph-ui.js` | **PRESENT; protected**; no coordinate or travel claims |
| EDIT-01 CRUD drafts, labels, nodes, corridors; Undo/Redo | Standalone `atlas-data.js`, `main.js`, `studio-math.js` | **PRESENT; protect schema v1 and old imports** |
| EDIT-02 Multi/group/cascade deletion | Feature `deletion-engine.js`, `main.js`, 2 new Node suites | **Unmerged branch-only; PENDING Phase 2**, no blind merge |
| EDIT-03 Hide/suppress vs delete generated visuals | Feature `visual-suppression.js`, UI and tests | **Unmerged branch-only; PENDING Phase 2**; differentiate user draft objects |
| SAFE-01 Corrupt draft bytes, guarded import, backup, autosave, Undo/Redo | Standalone `draft-recovery.js`, `main.js`, `tests/user-data-recoverability...` | **PRESENT; TESTED Node**; isolated browser round trip separately recorded |
| SAFE-02 Fail-closed write/recovery | Feature `draft-recovery.js`, `deletion-recovery-browser-ci.mjs` | **Unmerged; PENDING Phase 2** |
| SPAT-01 Move, label, route gesture, snap/cancel | Standalone `spatial-studio.js`, `studio-math.js` | **PRESENT; TESTED browser**; preserve touch/stylus parity |
| STR-01 Multi-select, group translation, sectors/vertices | Standalone `strategic-model.js`, `strategic-studio.js` | **PRESENT; browser proof incomplete marker** |
| NET-01 Hop trace, graph components, chokepoints, cut/outage, bypass | Standalone `network-analysis.js`, `network-lab.js` | **PRESENT; Node tests pass**; no route lengths claimed |
| TIME-01 Independent war/locking/post snapshots, compare/clone | Standalone `temporal-model.js`, `temporal-lab.js` | **PRESENT; Node tests pass**; each era's draft independently owned |
| VIS-01 Braided flow, triangulation/Hookshot, procedural subtraction | Feature `atlas-engine.js`, `visual-suppression.js`, 5 reference PNGs | **Unmerged; PENDING Phase 2** and licensed/reference evidence |
| VIS-02 Reference-fidelity planned phases 15–20 | Feature `docs/antigravity-runs/run-reference-fidelity-20261018.md` | **PLANNED, NOT IMPLEMENTED**; later Phase 5 |
| UI-01 Closed-drawer `/` search focus | Standalone `main.js` + Explore UI | **Reported defective**, Phase 4 repair only |
| UI-02 Discoverable six destinations at narrow widths | Standalone `atlas-focus.css`, `atlas-focus.js` | **Reported defective**, Phase 4 repair only |
| PLAN-01 Hypothetical manual `.ssp.json` export + OPEN PLANNER | Standalone `planner-handoff.js`, separate Planner import UI | **PRESENT; Node tests**; Planner owns physical simulation, never duplicate |
| RELEASE-01 One Atlas editing destination | Dedicated Pages vs legacy embedded Pages | **NOT ACHIEVED**; both deployed on same origin, both can write same key; Phase 6 gate |
| LM-01 Claimed LM Arena variant | `starsilk_map_lmarena` | **README ONLY**; no portable code found |

### Exact divergence boundaries

**Dedicated `main`** is the governing implementation baseline for spatial, strategic, network, temporal, source evidence, storage, UI and camera. Current root modules include `atlas-engine.js`, `atlas-data.js`, `main.js`, `draft-recovery.js`, `network-analysis.js`, `strategic-model.js`, `temporal-model.js`, `source-topology.js`, `planner-handoff.js`, and the root Node/Chromium suites.

**Outstanding OMNI feature** differs in 29 paths as returned by GitHub compare: `.github/workflows/deploy.yml`, `README.md`, `OPERATIONAL_STATE.md`, `atlas-data.js`, `atlas-engine.js`, `atlas-focus.js`, `atlas.css`, `draft-recovery.js`, `index.html`, `main.js`, `package.json`, `strategic-studio.js`, `strategic.css`, `temporal-model.js`; new `deletion-engine.js`, `visual-suppression.js`, dedicated Node/browser regression scripts, 5 reference PNGs, and run ledgers. GitHub comparison reports **16 ahead / 1 behind**. Feature behavior must be tested on its own ref in Phase 2; no direct merge, cherry-pick or file replacement in Phase 1.

**Planner embedded** has dedicated `system-zoom.js`, `system-orbit-details.js`, `visual-fidelity.js`, `label-layout.js`, `canon-chronology.js` and corresponding tests/notes absent from dedicated `main`. Planner root `package.json` defines React/Vite/TypeScript/Vitest and its own `typecheck`, `test`, `build`; its `map-of-the-all/` is reference material, not an Atlas development target. Planner root files, Git refs, and deployment were not modified.


### Exact 29-path OMNI divergence inventory (GitHub `main...feature/omni-uplift-100`)

**Modified (14):** `.github/workflows/deploy.yml`, `OPERATIONAL_STATE.md`, `README.md`, `atlas-data.js`, `atlas-engine.js`, `atlas-focus.js`, `atlas.css`, `draft-recovery.js`, `index.html`, `main.js`, `package.json`, `strategic-studio.js`, `strategic.css`, `temporal-model.js`.

**Added (15):** `deletion-engine.js`, `visual-suppression.js`, `docs/REFERENCE_FIDELITY_AUDIT.md`, `docs/antigravity-runs/run-reference-fidelity-20261018.md`, `references/01_map-of-the-all_labeled.png`, `references/02_map-of-the-all_unlabeled.png`, `references/03_map-of-the-all_detail.png`, `references/04_map-of-the-all_sectors.png`, `references/05_map-of-the-all_colored-regions.png`, `scripts/delete-browser-ci.mjs`, `scripts/deletion-recovery-browser-ci.mjs`, `scripts/procedural-suppression-browser-ci.mjs`, `tests/deletion-engine.node-check.mjs`, `tests/deletion-recovery.node-check.mjs`, `tests/visual-suppression.node-check.mjs`.

This listing is a GitHub file-diff inventory, not proof of passing unmerged code or canonical asset provenance.

## 4. Conflicts, safety and Phase 2 prerequisites

1. **Shared draft origin:** Both GitHub Pages routes share `westkitty.github.io` and `starsilk.map-of-the-all.draft.v1`. They are not isolated by URL path. Local tabs can overwrite the same draft; no assumption of a conflict resolver or field-forward compatibility. No real profile, stored draft, production deployment, or old route has been modified.
2. **Schema:** Exact key `starsilk.map-of-the-all.draft.v1`, JSON `version: 1`, three era snapshots, bounded region/route/annotation state, source demotion, guarded import and recovery are protected. See [DRAFT_RECOVERY_RUNBOOK.md](DRAFT_RECOVERY_RUNBOOK.md).
3. **Canon:** Blood Eclipse War **170 years**, Drakken Starsilk → Tiger heliocide → Siege Wall, black-hole containment/absence, no fabricated coordinates, real distances, territories or historical sky positions.
4. **Branch sequencing:** [PR #2](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/2) owns the governing plan and edits README. Phase 1 PR is based separately on `main`, references (does not copy) that plan, and also touches README. Review/merge **PR #2 first** when separately authorized, then reconcile any README conflict in Phase 1. No automatic or forced merge.
5. **Before Phase 2:** finish and prove draft-recovery smoke, correctly classify browser suite results, review this Phase 1 diff; then separately authorize Phase 2, compare current refs, inspect reference asset provenance, budget headroom, and validate 8 feature-branch browser suites including destructive-operation isolation. Phase 1 itself must not begin feature reconciliation.
6. **Open defect:** `npm audit` reports one high Vite advisory at pinned dependency; do not run `npm audit fix --force` under this phase. Reassess dependency and dev-server exposure in a separately scoped repair.
7. **Physical device proof:** Real Galaxy Tab S9 Ultra / S Pen input, screen readers, long-session GPU memory/FPS, and concurrent-tab data safety remain **UNVERIFIED**.

**Disallowed in this PR:** application feature merges, schema/storage migrations, deletion of paths, Planner/Dossier changes, real browser profile access, release/deploy or GitHub Pages routing changes.

## 5. Phase 1 evidence record

- Governing plan: documentation PR #2, `c4e1ea3c`.
- Baseline repository: `ba95b1e9` on isolated branch `consolidation/phase-01-baseline-20261020`.
- Node/browser test commands and output: DEX//REACH Big Mac process/task receipts, `npm run check`, `npm run bundle:report`, `node scripts/*-browser-ci.mjs`.
- Isolated backup/restore fixture: [scripts/phase1-draft-recovery-browser-ci.mjs](../../scripts/phase1-draft-recovery-browser-ci.mjs); test creates new Playwright browser contexts only, never connects to the user's saved profile. Outcomes are qualified in the runbook.
- Complete checks after editing: `npm run check` **216/216 PASS**, unchanged 218268-byte gzip, JS syntax `node --check` PASS, `git diff --cached --check` PASS, isolated `npm run test:browser` **5/5 PASS**, recovery suite **PASS**. The initial Phase 1 review included six documentation/test paths; a PR-only validation workflow was added in a later Phase 1 commit. No runtime feature files were modified.


## 6. Non-deploying integration review — 2026-10-20 (America/Detroit)

- **Inputs:** governing plan [PR #2](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/2), repaired Markdown head `bcf5520ac01f670f73fe7d5d09e4cea0a10e268e`; Phase 1 [PR #3](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/3) head `c921f206085ca47d3b11bc3a830e55374d3e8805` **before this review addendum**. PR #2 contained **83 malformed closing inline-code delimiters** (`»` for closing backtick); all were corrected on its documentation branch, with no canon or runtime edits.
- **Conflict check:** `git merge-tree --write-tree` returned **exit 0**, combined tree `01dbea13e7ea8205ee2266a5a82a2aae17685ec2`. An independent `git archive` of this tree populated disposable Big Mac QA path `/Users/bigmac/Atlas_Phase01_Combined_QA_20261020`. Its diff against original standalone `main` contained **8 paths, 627 additions, 6 deletions**, limited to Markdown, read-only PR CI, and the synthetic recovery test. `git diff --check` and all **15 originally inspected local Markdown links** passed.
- **Combined build proof:** `npm ci` **PASS**, `npm run check` **216/216 tests PASS** and Vite production build PASS; gzip bundle **218,268 / 225,000 bytes**, unchanged. Recovery script syntax and corrected plan inline-code delimiter check passed. No application JavaScript, schema, storage key, Planner, Dossier or Pages workflow files were changed.
- **Known intermittent QA failure, not concealed:** first combined `npm run test:browser` emitted `FOCUS_BROWSER_PASS`, then `PHASE3_BROWSER_FAIL page.waitForFunction: Timeout 5000ms exceeded` at `scripts/spatial-studio-browser-ci.mjs:72`, waiting for a newly created route count in localStorage after label selection. The original browser chain exited **1**. This was **not** shown to be a new application regression or resolved root cause. The unchanged Spatial Studio suite on its own then **passed**.
- **Bounded retry:** the full unchanged combined browser chain emitted explicit **5/5 PASS** markers (`FOCUS`, `PHASE3`, `PHASE4`, `PHASE5`, `PHASE6`) with exit **0**. The separate disposable-profile recovery acceptance then emitted `PHASE1_RECOVERY_BROWSER_PASS disposable_profiles_only=true`, exit **0**, covering all three independent eras, import cancel/reject, saved-state reload, source-status demotion and corrupt original byte recovery.
- **Status:** Phase 1 integration evidence **verified with an unresolved intermittent CI/browser timing finding**; no physical device proof. The linked master plan references now use repository-relative paths to survive documentation-branch deletion after any future merge. There has been **no real-draft access, main merge, production deploy, legacy redirect, Planner/Dossier write or Phase 2 execution**. Because any push to `main` triggers Pages, PR merge/release remains a separate authorization gate.
