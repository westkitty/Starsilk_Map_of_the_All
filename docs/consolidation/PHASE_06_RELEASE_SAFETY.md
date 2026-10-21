# Phase 6 — Legacy Writer Collision and Default-Deny Release Gate

**Prepared:** 2026-10-21
**Atlas development target:** `westkitty/Starsilk_Map_of_the_All`
**Branch:** `feature/phase06-release-cutover-safety`, based on independently CI-green Phase 17 PR #11 commit `2371c91684a8b0e24c7b1dce4d8fe9532128025c`.

**Status:** Safety-gate implementation for review. **NOT a completed cross-site cutover, NOT permission to merge or deploy, and NOT proof of any real owner's saved draft.** The release manifest deliberately blocks production.

## 1. Exact cross-repository source and risk

The original embedded Atlas in `westkitty/Star_System_Planner` is read-only for this work. Source inspected at Planner `main` commit `dc3c742743838757aaafed9e637d95a5aa814596`. Its genuine `map-of-the-all/temporal-model.js` Git blob is `500381536b63b79a74231429a8274d628186d441`. The fixture at `tests/fixtures/legacy-planner-temporal-model.mjs` is **the exact original file bytes** (no source edits), imported solely by Node tests. Original legacy `map-of-the-all/main.js` had blob `478a466e3aa715aee659ccd42e8eddf390be1565`.

Both clients use localStorage key `starsilk.map-of-the-all.draft.v1` with JSON schema `version:1` on the **same web origin**, despite different paths. Legacy `captureEra` records nodes/routes/regions/layers but **does not include** newer optional `suppressedVisuals`. Its timeline validation compares serialized active snapshots against this legacy capture. On a newer state with per-era suppression, legacy validation can reject the full draft as mismatched. An older writer can also rewrite its active snapshot without suppression; the current validator then correctly rejects the resulting mixed-version state and offers raw-byte recovery. This is a real incompatibility of the **actual compared source functions**.

The new source-backed pure regression proves these code-path properties, including recovery of **exact rejected bytes**. It is **not** a real cross-site/browser concurrency replay, and it does **not** prove a real user has an independently restorable backup.

## 2. Release-default-deny fence

The standalone Pages workflow previously triggered on pushes to `main` and manual dispatch without checking whether the separate embedded editor still wrote the same shared-origin storage. This branch adds one early preflight step **after checkout/Node setup but before dependencies, build, artifacts or Pages deployment**:

`node scripts/phase6-release-gate.mjs`

The gate reads `docs/consolidation/RELEASE_READINESS.json` and refuses production unless **all seven independent proofs** are verified and have a human-reviewed evidence receipt. Required categories:

1. Owner-controlled actual draft backup **and independent restore**
2. Legacy embedded Atlas's shared-origin writer genuinely retired or made non-writing
3. Legacy-v1-to-dedicated Atlas import/restore across all three eras
4. Standalone Planner's independent native build and behavior/regression checks
5. Dedicated exact-commit standalone recovery/browser verification
6. Rehearsed backup-first rollback and recoverability
7. Source/canon/data ownership and all-era preservation review

It also requires **two separate out-of-band GitHub repository/environment variables**, **`ATLAS_RELEASE_APPROVED_SHA`** and **`ATLAS_BROWSER_VERIFIED_SHA`**, each matching the actual Pages job's `GITHUB_SHA` exactly. The browser recovery evidence receipt in the checked-in manifest identifies the tested implementation commit, while the external `ATLAS_BROWSER_VERIFIED_SHA` explicitly attests to the final merge/release SHA after that SHA exists. Requiring the checked-in JSON to name its own containing commit's SHA would create an impossible self-referential hash; the out-of-band attestation preserves exact-head verification without that defect. This is a *defense against accidental CI publication*, not cryptographic proof of a human's consent: a repository administrator must verify every receipt rather than blindly flip JSON flags. No credentials, user data or private backup contents belong in this public manifest.

All seven proof states currently read **`blocked`**, with null receipts and no authorization variable. Therefore **the new workflow, if it eventually reaches `main`, will fail the release check by design until evidence and separate release authorization exist**. This branch does not modify the current `main` deployment workflow or automatically change the legacy client.

## 3. Test contract

- `tests/phase6-legacy-writer.node-check.mjs`: imports original pinned legacy temporal source and current standalone model, proves new optional-field loss, legacy active-snapshot rejection, exact rejected-JSON preservation, and independent modern three-era reads.
- `tests/phase6-release-gate.node-check.mjs`: tests wrong key/version, all seven missing proofs individually, SHA mismatch, and deliberately denied subprocess invocation using the committed blocked manifest. The one positive pure-unit fixture uses **obviously synthetic receipts**; it is not release authorization.
- `node scripts/phase6-release-gate.mjs` must return **exit 1** in the present branch. A fail-closed release preflight is an **expected pass of the safety contract**.
- Current Atlas suite: `npm ci`, `npm run check`, `npm run test:browser`, `node scripts/phase1-draft-recovery-browser-ci.mjs`, `npm run bundle:report`, source syntax checks. On this branch, hosted GitHub Actions must verify all checks at **exact PR head**. Never state a test passed before inspecting its output.
- No test visits an actual user browser profile or their real saved data. No test upgrades the draft key, silently rewrites corrupt raw JSON, changes the three independent eras, or transfers orbit physics into the Atlas.

## 4. Outstanding hard stops before Phase 6 completion

**Release is blocked.** Actual shared-origin legacy writer decommissioning requires separately authorized work in the independent Planner repository and verified routing/UX for former Atlas users. The owner must perform real-data export and independent restore privately; this work cannot certify it. Full cross-version browser replay with both genuine deployed clients, original legacy save samples, simultaneous-tab collision, same-origin recovery and return rollback still requires a purpose-built isolated runtime. Current source-level reproduction alone is not enough.

Verify both applications' live behavior **after**, not before, a separately authorized merge and deployment. The independent Planner must keep its orbital simulator; the read-only canonical Dossier stays untouched. No official coordinates, faction borders, routes or event years were invented. The Blood Eclipse War remains **170 years**, including its established causal sequence.

**Operational next action:** green exact-head GitHub test PR, keep it draft, then independently obtain real-owner backup and one-writer proof before planning any published switch. No production merge, Pages rerouting, or hidden approval variable is authorized by this implementation.

## 2026-10-21 exceptional owner-directed release of throwaway drafts

The owner explicitly stated that previous Atlas browser drafts contained no important work and directed publication. The seven historical proof fields in `RELEASE_READINESS.json` remain **blocked** because no owner's personal backup/restore or stale-tab retirement was verified. The user **waived preserving that old data**, not the application's code, canon, independent Planner or future saved work.

A separate short-lived `disposableDraftCutover` authorization path expires on 2026-10-23 UTC, requires a push to this exact repository's `main`, and checks the reviewed Git blobs of both `index.html` and `main.js`. It cannot authorize a different runtime or ordinary later release. Before any publication, GitHub Actions must successfully fetch the **live** independently released Planner legacy URL and verify that it contains only the read-only retirement portal, plus verify the independent orbital Planner root. All normal standalone checks, Chromium suites, build/bundle budgets, Pages artifacts and postpublication URL/assets checks remain mandatory.

An already-loaded or offline-cached old legacy editor cannot be forcibly killed by static hosting; close all such tabs/PWAs following the cutover. This exception may abandon *pre-cutover throwaway browser drafts*, but it does not call for clearing localStorage or overriding data-compatibility/canon code. Failed release tests remain a genuine BLOCK.
