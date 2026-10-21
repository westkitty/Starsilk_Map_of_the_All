# THE MAP OF THE ALL — Repository Consolidation Master Plan

**Date:** 2026-10-20

**Status:** APPROVED DIRECTION / IMPLEMENTATION NOT YET EXECUTED

**Dated execution update (2026-10-20, America/Detroit):** Phase 1 has now been implemented in [PR #3](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/3) with independent Node/Chromium tests and isolated draft-recovery proof, and a separate read-only PR check. PR #2 (this governing plan) and PR #3 remain **unmerged** at this update. Phases 2–6, real-user draft migration, and any production merge/deployment remain outside the current authorization. Historical findings and dated audit refs below are preserved.


**Canonical Atlas repository:** [westkitty/Starsilk_Map_of_the_All](https://github.com/westkitty/Starsilk_Map_of_the_All)

**Production Atlas:** https://westkitty.github.io/Starsilk_Map_of_the_All/

**Purpose:** Recover the best nonduplicative work across existing Atlas codebases into **one** maintained Map of the All, preserving user drafts, proven functionality, and the independent Star System Planner.

> **Controlling ownership decision:** All *Atlas application* development belongs to **`westkitty/Starsilk_Map_of_the_All`**. `westkitty/Star_System_Planner` owns only its independent root orbital physics simulator after consolidation, and its embedded `map-of-the-all/` is a compatibility source pending safe retirement. `westkitty/starsilk_map_lmarena` is currently a README-only placeholder. The [Starsilk Character Dossier](https://github.com/westkitty/Starsilk_Character_Dossier) governs canon and must remain **read-only**.
>
> **External-instruction conflict:** Older ChatGPT Project instructions still identify `Star_System_Planner/map-of-the-all/` as the permanent Atlas target. This document records the user's newer contrary decision but **cannot edit external ChatGPT Project instructions**. The owner must correct those settings separately to prevent agents targeting the wrong repository.

This is a release plan, not permission to delete branches, migrate actual user storage, overwrite code, merge, or deploy. Every later phase must pass its own authorization and proof gate.

---

## 1. Evidence, references, and current-state snapshot

The following values are **dated audit evidence**, not permanent HEADs. At the start of every phase, query GitHub for fresh refs, PRs, and branches; verify the actual local Git origin before using any directory.

| Repository / application | Audit ref (2026-10-20) | Established state |
|---|---|---|
| `westkitty/Starsilk_Map_of_the_All` `main` | `ba95b1e9e3ff0aafe480e90b07573cad670e76f9` | Published and functioning at the standalone URL; [Pages workflow #39105968854](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39105968854) succeeded |
| Standalone `feature/omni-uplift-100` | `a322a244677117441375fdb04d484015a540fc00` | Diverged: **16 commits ahead, 1 main-only merge commit behind**. Additional fidelity, delete/recovery, suppression code is not published on `main` |
| `westkitty/Star_System_Planner` `main` | `dc3c742743838757aaafed9e637d95a5aa814596` | Independent root Planner remains live; older embedded Atlas also live and differently implemented |
| `westkitty/starsilk_map_lmarena` `main` | `9ec1b72a0ff308faf24d3be8528bdd4a212f51bf` | One README, no application code or deployable artifact |
| Canon | `Starsilk_Character_Dossier` and published WorldsVault | Lore/source topology, **not** numeric 3D positions or physical orbits |

**Evidence labels used throughout:** **OBSERVED** = directly seen in inspected current source/browser; **TESTED** = a specific check executed against an identified ref; **REPORTED** = an earlier agent or Operational State claim not freshly rerun; **UNKNOWN** = not proved. Tests that inspect string literals are not substitutes for browser interaction tests.

### Concrete cross-repository findings

- The standalone published Atlas rendered 3D All → Galaxy → System views and provided the spatial, strategic, network, temporal, source-graph, editor, JSON and Planner-handoff surfaces (**OBSERVED / source inspected**). Its live `main` had a matched All-view sample of **156 WebGL draw calls**.
- The Planner's embedded Atlas separately implemented **wheel/pinch semantic star-system entry** and contextual floating **enter/back/overview** controls; in its matched All view it showed **97 draw calls** (**OBSERVED / code inspected**). Those specific interfaces do not exist equivalently in standalone `main`.
- The standalone feature branch rendered in an isolated local Vite preview and passed **253/253 Node tests** on its clean MacBook checkout (**TESTED**). Its All-view sample showed **368 draw calls**. Its ledger **REPORTED** eight browser suites passed; the complete eight suites were **not independently rerun** in the audit.
- Matched draw-call counts were one headless Chromium/SwiftShader, Balanced-quality observation—not measured FPS, latency, memory use, or Galaxy Tab S9 Ultra/S Pen performance.
- Standalone production mobile navigation at 412 px: roughly **126 px visible tabs versus 513 px scrollable content**, concealing most destinations; pressing `/` with drawers closed failed to reveal and focus usable search (**OBSERVED defects**).
- Both published Atlas paths share the same browser origin and localStorage key `starsilk.map-of-the-all.draft.v1`. A *fresh disposable-profile* check created a draft galaxy in each site and proved the other site loaded the change. This confirms **two writable clients of the same draft**, **not** that all newer draft fields or simultaneous tabs are safely compatible.
- Local path trap: `/Users/andrew/Star_System_Planner` was discovered pointing at Git remote `westkitty/Starsilk_PWA_Mapper`, despite its directory name. Always verify `git remote -v`, current branch, HEAD, and clean status. `/Users/andrew/Starsilk_Map_of_the_All` was checked out on the unmerged feature branch.
- Historical README, project Bible and Operational State entries contain stale claims that the standalone Pages site is not published. Preserve those archival records, but prominently supersede them with current facts.

**Source pointers:** [Extraction provenance](docs/EXTRACTION_PROVENANCE.md), [Operational State](OPERATIONAL_STATE.md), [Project Bible](starsilk_map_of_the_all_bible.md), [outstanding branch diff](https://github.com/westkitty/Starsilk_Map_of_the_All/compare/main...feature/omni-uplift-100), [third campaign ledger](https://github.com/westkitty/Starsilk_Map_of_the_All/blob/feature/omni-uplift-100/docs/antigravity-runs/run-reference-fidelity-20261018.md), [Planner system zoom PR #7](https://github.com/westkitty/Star_System_Planner/pull/7).

---

## 2. Permanent boundaries and source of truth

| Owner | Owns | Must not own |
|---|---|---|
| **Starsilk_Map_of_the_All** | Cosmos and stellar 3D views, source-aware map, all Atlas drafts, labs, 4X features, navigation, UX, tests, assets, documentation, CI and Atlas deployment | Separate physics engine, invented canon |
| **Star_System_Planner** | Mature root orbital physics simulator, per-system states/saves, Planner build/tests and root deployment | New Atlas features or a competing live editable Atlas after safe cutover |
| **Starsilk_Character_Dossier** | Canon invariants, chronology, authored lore and relationships | Atlas UI/editor coordinates or draft route creation |
| **Published WorldsVault** | Read-only identities and direct-authored topology | Travel time, numeric distance, political borders or cartographic positions |
| **starsilk_map_lmarena** | Historical placeholder | Any presumed uninspected app or missing feature |

**Canon locks:** Blood Eclipse War lasts **170 years, not 17**; preserve Drakken Starsilk → Tiger heliocide → Siege Wall locking. Siege Wall is black-hole containment/absence, not a conventional glowing wall. Do not promote illustrative star maps, proposed Hookshot routes, draft territories or hypothetical orbital measurements to canonical truth. Canon-approved character art has separate approval gates; visual map references are not character-art approval.

**Data locks:** Preserve `starsilk.map-of-the-all.draft.v1`, JSON `version: 1`, old valid drafts, independent War/Locking/Post eras, user-edited coordinates/labels/nodes/routes/regions, source identity demotion on imports, explicit user backups, Undo/Redo and all safe cancellation paths. Shared browser-origin storage and concurrent-tab writes are migration hazards. No destructive storage rename, schema migration, reset, automatic Planner import, or silent canonical status elevation.

**Experience locks:** Retain a real Three.js animated scene, All/Galaxy/System/Planet navigation, spatial authoring, strategic regions, network intelligence, temporal comparisons, source evidence, import/export, camera actions, keyboard and touch editing. Avoid flat-image replacement, generic workspace dashboards, indiscriminate new dependencies, duplicate render loops and a second n-body simulator.

---

## 3. Cross-repository capability reconciliation

| ID | Existing capability | Evidence / gap | Consolidation target |
|---|---|---|---|
| NAV-01 | All/Galaxy/System/Planet, picking, labels, camera memory | Standalone published; both descendants navigate | Preserve standalone view/state hierarchy |
| NAV-02 | Scroll/pinch into selected star system | Distinct legacy `system-zoom.js` / `onDollyEnter` | Recover and integrate without accidental touch entry |
| NAV-03 | System ENTER / ← GALAXY / OVERVIEW floating HUD | Legacy `stellarHud`, `stellarDive`, `stellarOverviewButton` | Port contextual controls without replacing camera ownership |
| STEL-01 | Star, editable planets, moons/orbits/asteroids/comet/rings | Both implementations contain distinct 3D code | Audit effect-by-effect; preserve true user-draft objects; adapt missing quality-aware visuals only |
| STEL-02 | Clouds/atmospheres/optional stellar companion/detail | Legacy `system-orbit-details.js`, `visual-fidelity.js` leads | Verify actual behavior before porting; no duplicated physics |
| CAN-01 | 127 indexed Dossier identities and protected source inspector | Dedicated `main` | Preserve provenance and unplaced status |
| CAN-02 | WorldsVault 11 identities / 6 sourced relations | Dedicated and legacy | Read-only topology, not chartable distance |
| EDIT-01 | Create/edit draft bodies, labels, coordinates, route links | Dedicated `main` and legacy | Preserve all editor operations and undoable results |
| EDIT-02 | Single, grouped and dependency-cascade deletion | Feature branch `deletion-engine.js` and tests | Review and integrate as atomic source-safe commands |
| EDIT-03 | Hide vs suppress vs delete generated detail | Feature branch `visual-suppression.js` and UI | Preserve era-specific optional fields, avoid erasing user draft objects |
| SPAT-01 | Move, route, label, snap, gesture cancellation | Dedicated `main` | Preserve keyboard/mouse/touch/stylus parity |
| STR-01 | Multi-select, group moves, sectors and vertices | Dedicated; branch adds grouped deletion | Preserve 4X editing and additive/draft semantics |
| NET-01 | Path/hop trace, graph cuts, chokepoints, bypass/outages | Dedicated `main` is more developed | Avoid regressing network analysis or confusing hops with real distances |
| TIME-01 | Three independent eras and compare/copy | Dedicated; feature branch adds suppression/deletion safeguards | Preserve each era in all imports, exports and mutations |
| SAFE-01 | Autosave, guarded import, Undo/Redo, legacy recovery | Dedicated; feature branch adds fail-closed deletion/session recovery | Adopt stronger storage safety only after version-round-trip proof |
| UI-01 | Global `/` search from closed drawers | **Reproduced failure** on dedicated production | Fix with a browser test |
| UI-02 | All six navigation destinations discoverable on mobile | **Reproduced failure** at 412 px | Visible mobile navigation, keyboard/screen-reader access |
| VIS-01 | Reference-matched cosmic silhouette, Wall, braided flow, hub triangulation | Third campaign Phases 1–14 partly implemented on branch | Validate real geometry, source status and performance before integration |
| VIS-02 | Reference-based sectors, chromatic regions, typography, GPU/deep stellar convergence | Third campaign Phases **15–20 still PLANNED** | Finish only after earlier phase gates |
| PLAN-01 | Explicit hypothetical `.ssp.json` download and manual Planner import | Dedicated + separate Planner | Verify importer compatibility; keep Planner independent |
| RELEASE-01 | One current Atlas publishing and editing destination | **Not yet true:** both URLs editable | Safe migration, owner-approved legacy redirect and regression proof |

**Do not bulk-copy files.** The names `map-of-the-all/system-zoom.js`, `system-orbit-details.js`, `visual-fidelity.js`, `label-layout.js`, and `canon-chronology.js` are legacy comparison leads. The five reference PNGs on the feature branch guide visual presentation only; verify original asset provenance before treating them as controlling visual input.

---

## 4. Critical risks and order of operations

| Risk | Priority | No-go threshold |
|---|---|---|
| Both Atlas sites write the same key on `westkitty.github.io` | **CRITICAL** | No legacy redirect or real-user migration until export/restore and cross-version round-trip are proven |
| Outdated Project instructions and misleading local checkout names | **CRITICAL** | No changes until exact origin/target are verified |
| Branch `feature/omni-uplift-100` diverged; source assets and draft fields differ | HIGH | No blind merge, force push, reset or wholesale source replacement |
| Draft importer or era mutation could overwrite protected data | HIGH | No destructive change without fail-closed handling and a tested recovery copy |
| More visual effects may exhaust rendering/bundle budgets | HIGH | Branch ledger reports **224,979 / 225,000 gzip bytes** after Phase 14: **21 bytes headroom**; remeasure before adding effects |
| Source/canon classification and invented numeric routes | HIGH | Any authority promotion or invented physical map fact blocks release |
| Unverified stylus and accessibility journeys | HIGH | Emulation alone never certifies physical Tab S9 Ultra/S Pen or screen reader behavior |
| `main` push auto-publishes GitHub Pages | HIGH | Staging PR is not deployment authorization |

---

## 5. Phased implementation roadmap

Each phase must finish with one coherent PR, a changed-file ledger, target-bound test evidence, rollback strategy, and a clearly defined next phase. **Only Phase 1 is authorized by the fresh-chat starter packet below.**

| Phase | Work | Exit gate |
|---|---|---|
| **1 — Authority, baseline, recoverability** | Establish sole Atlas owner; prove exact local/remote refs; repair current docs; inventory all code/data owners; design and test isolated backup/restore procedure; baseline Node/browser/build evidence | Verified branch/PR; current docs; usable recovery runbook and isolated smoke; no app migration, no production change |
| **2 — Reconcile 16 outstanding feature commits** | Review full diff and dependency chain; selectively integrate advanced deletes, group cascades, fail-closed storage, procedural suppression, braided flow, triangulation and reference work; validate branch assets | Reconciled PR + unit/browser regressions including 8 branch suites and migration fixtures; no unproven claim |
| **3 — Recover stellar advantages from embedded Atlas** | Port/adapt intentional wheel/pinch semantic zoom, floating stellar navigation and useful orbital visuals while preserving standalone engine/editor state | All/Galaxy/System/Planet navigation, cancel/return/overview, quality rules, explicit Planner handoff and test parity |
| **4 — Repair discoverability without feature loss** | Fix `/`, narrow-screen tabs, contextual selection actions, layer/era/route access, Undo/Export visibility and edit-mode cancellation | Complete old-to-new feature parity; accessible desktop/mobile/tablet test journeys |
| **5 — Finish reference-fidelity campaign** | Complete Phases 15–20 (strategic/chromatic regions, cartographic typography, GPU and depth optimization, stellar continuity, visual acceptance); free bundle headroom first | Reference comparison, bounded CPU/GPU memory, measured FPS/frame time and no feature/data regression |
| **6 — Consolidated release and legacy transition** | Full adversarial QA; backup-first origin/storage strategy; preserve Planner importer and root app; user-authorized dedicated Atlas publication/legacy embedded redirect; verify both live apps | One Atlas editing destination, recoverable user drafts, exact release evidence and rollback route; real S Pen remains separately gated |

### Phase 1 — exact first-execution contract

**Goal:** Make it impossible for a future agent to mistake the repository, lose draft work through a migration, or mistake prior claims for verified implementation.

1. **Fingerprint the environment.** Read this plan, `README.md`, `OPERATIONAL_STATE.md`, `starsilk_map_of_the_all_bible.md`, `docs/EXTRACTION_PROVENANCE.md`, `package.json` and `.github/workflows/deploy.yml`. Refresh standalone `main`, `feature/omni-uplift-100`, branches, PRs, deployed URLs and targeted Planner paths. Verify `git remote -v`, `git status`, branch and HEAD on any local checkout before running commands. Work only from a clean, correct standalone `main` baseline in a new, isolated Phase 1 branch.
2. **Measure a reproducible baseline.** Run `npm ci`, `npm run check` and `npm run test:browser` for standalone if environment supports Chrome/WebGL. Record actual suite results, SHA, gzip budget, headless/physical distinction and any block. Reproduce the mobile tabs and global search problems in a disposable browser profile to establish future regression criteria.
3. **Create `docs/consolidation/PHASE_01_BASELINE.md`.** Include the fresh ref-bound capability matrix, exact unique modules/feature owners (standalone published, dedicated unmerged, legacy embedded, LM Arena), historical claims vs observed behavior, feature status and remaining proof. Note both stale external Project directives and misnamed local checkout risks.
4. **Create `docs/consolidation/DRAFT_RECOVERY_RUNBOOK.md`.** Explain a user-initiated JSON download from each legacy/current Atlas as needed; safe offline file validation; disposable-profile import/restore and confirmation of all three eras/regions/routes/annotations; source-status demotion; failed import and corrupt original recovery; fresh-tab conflicts. Exercise the **disposable** backup/restore flow where possible. Never read, modify, clear or replace personal browser drafts as part of Phase 1.
5. **Prominently correct current docs**, without erasing history. Update the standalone README's first screen to show the live standalone URL, current Atlas authority, separate Planner root, and this plan. Add a dated superseding entry to `OPERATIONAL_STATE.md` and the project Bible; label old "not published" notes historical. Explicitly flag the **external ChatGPT Project instruction change** as an owner action, not a repository edit.
6. **Review and deliver.** Show exact diff scope, tests, backups verified or blocked, open risks and Phase 2 prerequisites. Open a **Phase 1 PR** against the dedicated repository, without merging or deploying. If this plan is still in a separate docs-only PR, use it as a read-only source and sequence the PRs explicitly; do not duplicate the plan or silently force it onto `main`.

**Phase 1 must NOT:** transfer feature code, modify Planner/Dossier/LM Arena, delete or rename existing Atlas paths, touch real user localStorage, change `starsilk.map-of-the-all.draft.v1` or JSON v1, redirect Pages, overwrite independent era data, force-push, merge, or deploy.

**Definition of done:** A new agent can identify one authoritative repository, its actual published vs unmerged feature coverage, precise pending work, reproducible test baseline, and a proven/clearly blocked draft-recovery route using these documents alone. A PR and test evidence exist; production and user's real draft data are unchanged.

### Phase 2 — integration safeguards

Start from a **new** integration branch. Review the exact GitHub comparison at current refs, including third campaign source/image provenance, tests and API/DOM differences. Preserve the standalone engine's more developed systems. Revalidate all deletion, recovery and suppression paths, era independence, JSON v1 import/export, source locks, route editing, network and strategic labs, and bundle budget. The reported eight browser suites are required as real executable checks, not simply cited from the ledger. **No merge until the implementation PR has a clean scope review, real tests, and separately given authority.**

### Phase 3 — legacy recovery safeguards

Treat `system-zoom.js`, `system-orbit-details.js`, `visual-fidelity.js`, `label-layout.js` and related legacy callsites as comparative references, not blindly copyable code. Confirm both authored renderers and camera ownership. Recover zoom and star-system UX deliberately while ensuring the actual Planner physics remains entirely separate, and the SSP bridge still yields hypothetical, manually imported initial conditions.

### Phase 4 — zero-loss UX minimum acceptance

From all drawers closed, pressing `/` opens Explore and focuses search. All destinations must be discoverable at 360–412 px without a hidden horizontal swipe. Preserve six feature owners, 11 layers, 3 eras, source graph, mouse/touch/keyboard controls, Cancel/Escape, import review, Undo/Redo, camera reset, region editing and network path analysis. Test same behavior from a selected object and after returning from an inner system.

### Phase 5 — visual target and GPU acceptance

Complete prior reference-fidelity campaign's *planned* Phases 15–20, not fabricated "100 loops." Maintain obsidian cosmic absence, azure Starsilk, meaningful 3D depth and clear 4X hierarchy. Verify screen-space composition with author-approved visual references; match render quality to actual device budgets. Report draw calls, FPS/frame times and disposal independently; do not turn a larger number of meshes into proof of improvement.

### Phase 6 — release and cutover gate

Use established standalone commands from its actual `package.json`: `npm ci`, `npm run test`, `npm run build`, `npm run bundle:report`, `npm run test:browser`. Validate legacy JSON v1, three era snapshots, real import/export recovery, optional fields, no-WebGL fallback, editing cancellation and manual Planner-importer compatibility. Run the Planner's own native build/tests independently. Publish/redirect **only with separate authorization**, a tested backup and rollback, and evidence both deployed applications work afterward.

---

## 6. Agent governance, verification and stop rules

1. **Current ownership overrides old notes:** Atlas coding target = `westkitty/Starsilk_Map_of_the_All` only; Planner root remains independent. External Project settings must be updated by the owner.
2. **Never trust a path name:** verify origin, branch, HEAD, clean status and current GitHub refs. Avoid unexpected local branch mutation; use a dedicated worktree/checkout.
3. **Preserve real user data:** tests operate in disposable profiles; user-provided JSON is not overwritten; safe recovery proven before migration; never delete unknown drafts as "stale."
4. **One source of functionality:** preserve existing Three.js renderer and state machine rather than creating a parallel map/editor or duplicating Planner orbital physics.
5. **Evidence before completion:** source-code existence is not usability; CI from old SHA is not current CI; emulation is not physical hardware proof; draw calls are not FPS.
6. **Least-authority execution:** this plan does not authorize merges, deployments, redirects, deletions, destructive migrations, unbounded cleanup or writes to another repository.
7. **Preserve canon:** 170-year Blood Eclipse War, locked causal sequence, WorldsVault direct-authored topology, no new official spatial or orbital measurements, no silent source-identity promotion.
8. **Review and repair within phase:** inspect diff, run focused then necessary full checks, perform one bounded fix pass for failures, stop and report blockers rather than escalating scope invisibly.
9. **Append current verified state only after proof:** new Operational State entries must cite exact ref, commands, outcomes, deviations and next gate; do not rewrite historical evidence.
10. **Completion report:** target repo/branch, PR/commit, files, tests and browser checks, observed vs claimed, data safety, unresolved gaps, next authorized phase.

**STOP** if Git origin mismatches, required draft backup/restorability is absent before a destructive operation, a canon write would be required, a proposed merge silently changes JSON v1 or source authority, the root Planner would be harmed, or a required test cannot be run without inventing evidence.

**NEXT ACTION:** **Phase 1 only** — verify canonical repo and fresh state; baseline existing tests in isolation; write current-state and recovery evidence; correct prominent docs; deliver a reviewable PR. **Do not start Phase 2 until Phase 1 is reviewed.**
