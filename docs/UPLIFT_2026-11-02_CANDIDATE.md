# Map of the All — November 2, 2026 bounded uplift candidate

## Evidence state

**IMPLEMENTED AND LOCALLY VALIDATED; REMOTE DELIVERY PENDING.**

- Target identity: `westkitty/Starsilk_Map_of_the_All` (`main`, HEAD `c98ff92f98e3c41022711a2804e87aca8e8dee48` at clone time).
- Isolated, clean-before-edit checkout: `/Users/bigmac/Projects/map-of-the-all-uplift-20261102` on Big Mac.
- No edits to parent Planner, Dossier, legacy route, owner storage, production `main`, remote branches or Pages.
- Earlier evidence: [Atlas Pages run #39582475713](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39582475713) passed at `c98ff92` on October 21: 282/282 Node tests, 14 Chromium suites, gzip 223793/225000. This is **baseline-only**; it does not verify this candidate.
- Current local QA: **287/287 Node tests PASS**; Vite production gzip **223735/225000 bytes PASS**; **Phase 5 and Phase 6 Chromium/Brave acceptance PASS** in disposable profiles. The full 14-suite hosted run, physical tablet performance, and Pages publication remain unverified.

## 1 — Release validation separated from publication authorization

Updated `.github/workflows/atlas-pr-verify.yml` to run a **read-only** verification on every push to `main`, normal PRs, and manual dispatch without requiring an Atlas Pages release waiver. It runs the existing model, full browser and disposable-profile recovery checks, and captures screenshots plus frame-cadence JSON evidence. The heavy pinned Planner collision fixture remains PR-only. It has no Pages write permissions or deploy action.

Intentionally leave `.github/workflows/deploy.yml`, `release-cutover-gate.js`, and `RELEASE_READINESS.json` unchanged. The one-time October 21 old-draft waiver expired October 23. Future publication needs a fresh source-backed recovery/rollback/owner-approval decision. A green verification build is **not** publication permission.

## 2 — Observable performance rather than speculative FPS claims

Updated `scripts/phase5-cadence-browser-ci.mjs` to require **at least 30 real renderer callback intervals per sampled view**, rather than only 8, and output `atlas-qa-evidence/frame-cadence-samples.json` with timestamp, scenario, revision label, frame p50/p95/p99, callback p95, draw calls, live geometry/texture counts and explicit software-renderer disclaimer. This does not change runtime Atlas graphics or add another render loop. Compare results only on the **same browser, viewport, render backend and quality tier**.

Physical Galaxy Tab S9 Ultra/S Pen and long-session GPU performance remain unverified. Do not assert speedups from source edits or SwiftShader alone. Any memory/resource regression or bundle overrun blocks promoting this candidate.

## 3 — Three distinct source-aware experiences

### The Unplaced

- `main.js` now locates *source-reference landmarks* by exact ID **and** `status === 'reference'`; no draft name equality can masquerade as canonical placement in search, relation jumps or source-graph 3D handoff.
- `source-graph-ui.js` keeps the source diagram open when a source identity has no 3D placement and announces that absence.
- A separate, explicit `PROJECT HYPOTHETICAL STUDY` action is offered **only for spatially meaningful source kinds** (homeworld, nebula, orbital station, gas giant), not for people, template collections, networks, domains, boundaries, or doctrines. The callback independently checks the exact source ID, label and kind. It creates an **editable draft annotation in the All tier** via the existing `change → addNode → Undo/autosave` path. The user confirms it. Even for a nebula, the annotation denotes an editorial inquiry point, not the nebula's physical extent. Its name and description are visibly hypothetical, `status: 'draft'`, `sourceUrl: null`; original source identity is untouched. The creation is within the active editorial era, not copied across all eras.

### The 170-Year Scar

- `temporal-lab.js` adds an explicit `FOLLOW CONSEQUENCE` control cycling `war → locking → post → war` while setting the immediately preceding era as the comparison baseline and enabling existing ghost trails. Its action only updates comparison state when the existing era switch succeeds; failed persistence cannot show a false success.
- Canon milestones remain authored evidence; **every displayed position remains editorial**. The existing `onSwitch` path handles the actual era selection and Undo.

### The Fracture Experiment

- `network-lab.js` renders hypothetical closed corridors as amber dashed screen-space segments, even if the proposed path becomes disconnected. This reuses the existing temporary SVG overlay, graph and route filters, with no saved route mutation.
- The outage line now includes before/after connected-component counts. The original network remains editable and unchanged; reset restores normal rendering. No real travel, canon route or distance is inferred.

## Regression work prepared

- New pure model/source guard: `tests/nov2026-uplift.node-check.mjs`.
- Augmented `scripts/phase5-browser-ci.mjs` to prove severed edges remain visible after a disconnection; verify source identity fails closed; create/Undo an annotation and check its draft provenance.
- Augmented `scripts/phase6-browser-ci.mjs` to exercise the narrative era step without rewriting an earlier era's snapshot.
- Locally executed `npm ci`, `npm run test`, `npm run build`, `scripts/phase5-browser-ci.mjs`, and `scripts/phase6-browser-ci.mjs` on the isolated Big Mac checkout. All listed final runs passed. Full hosted 14-suite CI and hardware remain pending.

## Required verification before any commit / push / merge

1. Verify exact standalone remote, `main` baseline and clean ownership of all modified paths; inspect `git diff --check` and the complete diff.
2. From a disposable checkout, `npm ci`, `npm run test`, `npm run build`, `npm run bundle:report` and `npm run test:browser`. Investigate and repair one bounded failure before proceeding. The compressed 225000-byte delivery cap is hard; baseline left **1207 bytes** headroom.
3. Run source graph study creation and Undo after a session reload, including each of the three eras. Check a same-name draft never appears as a source landmark. Check search focus and all six drawers at 360–412px.
4. Inspect new 30-sample frame receipts against the same exact prior CI environment. Rebuild/deconstruct views repeatedly, monitor geometry/texture disposal, and test reduced motion and no-WebGL recovery.
5. Re-run the independent root Planner verification without editing its repository. Confirm Dossier read-only status, JSON v1 and storage-key compatibility, 170-year War, and source/geometry distinction.
6. **STOP** if the bundle cap, save fidelity, source authority, main application entry or browser journey fails. No arbitrary budget increase or disabled test is allowed.
7. No production Pages release under the expired one-time waiver. Restore complete readiness receipts and obtain new exact-SHA publication authorization before a production deploy; verify published Atlas and Planner afterward.

## External Project instruction correction required

Replace stale project binding `westkitty/Star_System_Planner/map-of-the-all/` with `westkitty/Starsilk_Map_of_the_All` at repository root for all Atlas changes. Keep `westkitty/Star_System_Planner` exclusively for its independent physics simulator and read-only portal. **This cannot be edited from a GitHub repository file.**

## Delivery and stop state

- **Remote commit:** none. **Push:** none. **PR:** none. **Pages:** unchanged.
- **Current implementation:** local candidate worktree with verified Node/build and targeted Chromium acceptance; **not deployed**.
- **Next smallest action:** review staged diff, commit and push source only as explicitly authorized; confirm exact remote HEAD and hosted 14-suite verification without bypassing the independent release gate.

## 2026-11-02 current-turn validation receipt (pre-commit)

- Environment: Big Mac (macOS arm64, Node v26.13.0, npm v11.20.0), isolated standalone clone at `c98ff92f98e3c41022711a2804e87aca8e8dee48`; browser = headless Brave Chromium / SwiftShader, not a real Galaxy Tab S9 Ultra.
- `npm ci --no-audit --no-fund`: PASS, lockfile install; no new dependencies in Git.
- `npm run test`: **287/287 PASS**, including new source-identity and release-gate expiry regressions. The old waiver's historical positive test now uses an explicit simulated historical time; the actual expired publication gate remains denied.
- `npm run build`: **PASS**, gzip total **223735 / 225000 bytes**, headroom 1265 bytes. Vendor chunk warning remains; no invented FPS improvement.
- `node scripts/phase5-browser-ci.mjs && node scripts/phase6-browser-ci.mjs`: **BOTH PASS** (exit 0), including 412px mobile emulation. The new source-study/Undo fixture was corrected to pass its expected node ID into the browser's function scope, and the new era fixture passes its expected epoch explicitly. The application Undo was separately reproduced and verified across a prior route edit and nested galaxy entry; the earlier assertion failures were fixture defects.
- Remaining: full 14-suite exact-head hosted CI, cadence 30-sample evidence, true physical S Pen/device thermal tests, independent root Planner current-run checks, and production deploy approval. No Pages deployment is authorized by these results.
