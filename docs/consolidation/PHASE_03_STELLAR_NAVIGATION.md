# Consolidation Phase 03 — Semantic Stellar Navigation

**Execution date:** 2026-10-20, America/Detroit
**Implementation:** `feature/phase03-stellar-navigation` stacked on `consolidation/phase-02-omni-recovery-20261020` at `7244d58e32f6582e8c78e92035189c5f92a3f1bc`
**Governing plan:** [CONSOLIDATION_MASTER_PLAN.md](../../CONSOLIDATION_MASTER_PLAN.md), Phase 3
**State:** Functional slice implemented in a dedicated worktree. Not merged to main or deployed; hosted CI and final full browser matrix must verify the current head.

## 1. User-facing behavior

- Galaxy tier: select a **draft stellar system**. A compact context HUD identifies the selected editable system and offers **ENTER SYSTEM**. The existing Enter/double-click/Inspector paths still work.
- A deliberate **inward mouse-wheel or two-touch pinch** can descend into a visible, close-enough stellar system without switching editors. Candidate selection prefers the explicitly selected system when eligible; otherwise chooses the nearest visible system in screen space. The threshold **17 is a camera/display unit**, not a physical distance or a canonical astronomical measurement.
- Automatic descent is disabled outside galaxy tier, while a modal is open, or during active route, move, label, region, network or temporal editing. Outward motion is never a descent trigger.
- Interactive world labels remain selectable. Wheel events originating on a world-label subtree are forwarded to OrbitControls' existing canvas event handler, with a matching listener removed during `AtlasEngine.dispose()`. This closes the defect where a label blocked zoom entirely.
- System tier: floating HUD names the system, displays the number of editorial draft planets, and has **← GALAXY** / **OVERVIEW**. Planet selection is preserved: Back from an inspected planet first clears the planet focus, then a second Back returns to its galaxy.
- Touch target controls are at least 44 CSS px; the HUD is bounded by the viewport. The UI is a contextual scene overlay, not a new workspace, renderer or simulation.

### Existing stellar rendering — protected, not duplicated

The dedicated renderer already draws the system star/corona, draft planets, labels/picks, orbital rings, atmospheric skins, ringed planets, moons, asteroids and a comet. Existing quality tiers and procedural visual-suppression controls remain authoritative. This Phase 3 change does **not** copy `system-orbit-details.js` or `visual-fidelity.js` wholesale, invent a secondary physics model, add canonical masses/orbital periods, or modify the independent Planner's orbit simulator. Legacy `map-of-the-all/system-zoom.js` and navigation HUD behavior were inspected read-only as references and deliberately adapted to the current engine.

The existing `.ssp.json` export remains a hypothetical, user-controlled **manual** handoff to the independent [Star System Planner](https://westkitty.github.io/Star_System_Planner/); Atlas display coordinates never become measured orbital data.

## 2. Code ownership and exact change envelope

| File | Change |
|---|---|
| `system-zoom.js` | Pure, threshold-gated semantic candidate picker |
| `atlas-engine.js` | Reuse one OrbitControls and one render loop; wheel/pinch intent, inward candidate projection, label wheel forwarding and listener disposal |
| `main.js` | Existing navigation state/selected ID, guarded engine callback, contextual HUD and view return controls |
| `index.html`, `atlas-focus.css` | Accessible compact non-canon stellar UI with responsive controls |
| `tests/system-zoom.node-check.mjs` | Four deterministic selection, threshold, guard and visibility checks |
| `scripts/stellar-zoom-browser-ci.mjs` | Real desktop wheel and emulated-touch HUD journey, label-wheel event bridge, edit guard and planet inspection |
| `package.json`, `.github/workflows/atlas-pr-verify.yml`, `.github/workflows/deploy.yml` | Add the ninth Chromium acceptance suite and permit read-only CI on the stacked Phase 2 branch |

**No new saved-data fields, URL route, source permissions, API endpoint, material dependency or Three.js renderer.** Canon identity index, WorldsVault relationships, independent era snapshots, source demotion, Undo/Redo, route and region editing all remain governed by existing modules.

## 3. Verification and limitations

| Check | Evidence | State |
|---|---|---|
| Initial browser test | Incorrect hardcoded `SURVEY 01-1` expectation for Perseus Confluence; authoritative seed node was `SURVEY 03-1` | Test corrected, not an application defect |
| First automatic wheel attempt | Wheel event reached interactive `.label-name`, not canvas; therefore OrbitControls ignored it | Repaired by scoped label-wheel forwarding |
| Standalone stellar desktop/phone acceptance | Enter → system → overview → back; real inward wheel; label bridge; edit guard; 412px emulated touch HUD | PASS on earlier test iteration; planet-specific extension needs latest rerun |
| `npm run check` | **260/260 Node tests**, Vite build, zero failure | PASS on Big Mac Node 26 |
| Bundle budget | **224,298 / 225,000 gzip bytes**, vendor chunk preserved | LOCAL PASS; **hosted Node 22 unknown**, previous phase showed compressor variation |
| Existing eight browser suites | Run through unchanged `npm run test:browser`, followed by new ninth suite and three-era recovery | In progress; record final exact result before release claim |
| Real Galaxy Tab S9 Ultra/S Pen | No physical device run | **NOT VERIFIED** |

**Key limitations:** The current implementation is a semantic zoom transition into existing 3D system views; it is **not** physical Keplerian travel. Mobile test uses Chromium touch emulation, not real-device gesture/thermal proof. The original legacy optional companion star is not ported merely to increase effects; any future orbital dressing must respect the gzip/GPU budget and be explicitly marked illustrative.

## 4. Release and rollback

- This PR is stacked **on the Phase 2 draft PR**, not on current production `main`. Phase 2 and the safe one-editor cutover must be addressed before any release.
- The old writable embedded Atlas and new standalone URL share the same origin and exact `starsilk.map-of-the-all.draft.v1` key. Phase 3 introduces **no** data migration and does **not** solve multi-tab/legacy writer conflicts.
- Never clear, overwrite or sample the owner's saved draft to verify this. Automated tests use **disposable browser profiles** only.
- No Pages production deployment, no Dossier or Planner write, no official coordinates/distances/canon change, and no OMNI feature-branch deletion.
- Rollback while unmerged: close the stacked PR without affecting production. Future merge/release remains subject to independent exact-head checks and the Phase 6 recovery gate.
