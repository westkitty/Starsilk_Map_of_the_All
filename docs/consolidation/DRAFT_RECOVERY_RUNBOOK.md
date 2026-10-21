# Draft Recovery Runbook — Map of the All

**Date:** 2026-10-20
**Classification:** backup-first, user-controlled, **non-destructive**.
**Application:** `westkitty/Starsilk_Map_of_the_All` and the legacy embedded Atlas.
**Evidence:** Phase 1 isolated fixture at standalone `ba95b1e9`; not a statement that a user's personal draft has been recovered.

## Fixed invariants

- Browser key **`starsilk.map-of-the-all.draft.v1`** and JSON **`version: 1`** must not change. Old valid schema-v1 drafts must remain importable.
- Keep **all three eras**: `war` / `locking` / `post`. Each era has its own nodes, routes, regions and layers; notes and labels must survive. The active top-level state mirrors its selected snapshot.
- WorldsVault and the Dossier are source authorities only. An imported `status: "reference"` node is **demoted to `"draft"`** and its `sourceUrl` cleared. This is an intentional trust boundary, not a loss of user-edited draft content.
- Atlas coordinates are **display units**, not canonical distances. War lasted **170 years**; Drakken Starsilk → Tiger heliocide → Siege Wall. Restore must not elevate invented facts to canon.
- The old and new published Atlas paths use the **same origin** (`https://westkitty.github.io`). Their different URL paths **do not isolate localStorage**. Simultaneous tabs/versions can write the same key without conflict resolution.
- This runbook **does not authorize touching any real user's browser storage**. Test only with disposable Playwright contexts and synthetic fixtures unless the owner explicitly performs a personal backup.

## A. Back up a real draft — owner-operated only

1. **Do not open the legacy and dedicated editors side by side.** If both are open, stop making edits; choose the tab with the desired latest draft and make a manual backup. Avoid switching sites until downloaded backup is safely copied.
2. At either [dedicated Atlas](https://westkitty.github.io/Starsilk_Map_of_the_All/) or [legacy Atlas](https://westkitty.github.io/Star_System_Planner/map-of-the-all/), open **EXPLORE**, choose **EXPORT**, and save the JSON file. Repeat for the other client *only if it still holds different work* and you can isolate the browser profile/device; do not assume switching URLs will preserve two independent copies.
3. Name the download outside the app, for example `atlas-standalone-YYYYMMDD-HHMM-original.json` or `atlas-legacy-YYYYMMDD-HHMM-original.json`. Preserve an **untouched original** plus a working copy on durable storage. Optional checksum: `shasum -a 256 filename.json`.
4. If a saved draft cannot be loaded, the standalone Atlas offers **DOWNLOAD ORIGINAL JSON** in Explore's recovery panel. This file contains **exact rejected bytes** and may be invalid JSON; retain it without “fixing” it in place. **Do not choose REPLACE WITH NEW DRAFT** until the exact bytes have been saved and independently inspected.
5. If the application is stuck or export is unavailable, **do not clear browser site data**. Capture the application URL, browser/profile, message and date. A forensic localStorage export, if required, must use an owner-approved read-only workflow; no automated contact with the owner's actual profile occurs in Phase 1.

A ZIP, cloud sync, copied path, successful download event or valid JSON *alone* is **not** full restore proof. Protect originals until a repeatable round-trip has actually succeeded.

## B. Validate the offline backup without writing to a browser

Work from a **copy** in a controlled local directory. Validate UTF-8 JSON parse, size under the app's **1.2 MB import limit**, schema version, bounded objects and three snapshots (when present). Never paste private draft contents into online validators.

Read-only example using installed Node.js:

~~~sh
node -e 'const fs=require("node:fs"); const p=process.argv[1]; const d=JSON.parse(fs.readFileSync(p,"utf8")); if(d.version!==1||!Array.isArray(d.nodes)||!Array.isArray(d.routes))throw Error("Invalid Atlas v1 envelope"); const snaps=d.timeline?.snapshots; if(snaps && ["war","locking","post"].some(k=>!snaps[k]))throw Error("Incomplete eras"); console.log(JSON.stringify({version:d.version,activeEra:d.epoch,nodes:d.nodes.length,routes:d.routes.length,regions:d.regions?.length??0,eras:snaps?Object.keys(snaps):"legacy-v1"}))' ./copied-backup.json
~~~

This is **only an envelope check**, not complete application validation. For old saves with no timeline, the current standalone Atlas may expand them into three identical initially independent snapshots; verify this on a **disposable profile**, not by overwriting the original file. If parsing fails or shape is wrong, stop before import and retain raw bytes.

## C. Prove recovery in disposable browser storage

The reproducible automated fixture uses Playwright's **new browser contexts** with temporary isolated browser profiles. It does **not** launch the owner's Brave/Chrome user-data directory. Its test files are synthetic, generated from `seedAtlas()`, not copied from a personal browser. The script is intentionally a Phase 1 regression witness rather than application behavior change.

From a clean verified dedicated Atlas checkout:

~~~sh
npm ci
npm run check
node scripts/phase1-draft-recovery-browser-ci.mjs
~~~

The fixture covers the actual UI and storage:

1. Create a **schema-v1 synthetic draft** with distinct galaxy names, annotations, region polygons and route kinds in **war**, **locking** and **post**. Validate it through `validateAtlas`.
2. In isolated profile A, seed **only that fixture** under the exact storage key; open standalone preview, click **EXPLORE → EXPORT**, capture the downloaded JSON, parse it, check each era and prove exporting did not mutate profile A.
3. In independent empty profile B, open **EXPLORE → IMPORT** and select that downloaded JSON using the real file input. Observe the **GUARDED DRAFT IMPORT** summary, including **3 ERAS**. Choose **CANCEL** and verify original B storage did not change.
4. Try an unsupported-schema file. The app must reject it **without reaching confirmation** and without replacing B storage.
5. Re-import the valid backup. From confirmation, click **DOWNLOAD BACKUP FIRST**; preserve that file, then choose **PROCEED WITH IMPORT**. Reload in a **new tab in the same disposable context** and validate all three eras, region/route/annotation content, active draft state and imported source-status demotion.
6. In disposable profile C, supply malformed stored bytes; verify recovery panel exists, **DOWNLOAD ORIGINAL JSON** returns **byte-identical text**, and the underlying invalid stored bytes remain until an explicit replacement decision.
7. In disposable mobile profile D, record the six-tab geometry and `/` search/drawer/focus behavior as **observations**. Do not silently treat known UX defects as passed acceptance.

**Expected explicit terminal marker:** `PHASE1_RECOVERY_BROWSER_PASS disposable_profiles_only=true`. If any test fails or times out, record exact stage/error and mark the proof **partial or blocked**. Tests that only inspect JavaScript text or print partial stages are not a full restore witness.

### What successful isolated proof does and does not establish

**Can establish:** JSON-v1 fixture accepted, browser-generated backup downloadable and valid, cancel/reject preserving isolated storage, three distinct eras/regions/routes/annotations round-tripped, source identity demoted on import, reload and corrupt-raw preservation.

**Does not establish:** the user's particular real backup is valid or backed up; legacy-to-current optional-field forward compatibility; all older exports; simultaneous tab conflict resolution; physical mobile stylus; production code now contains a migration; actual data safely copied between devices. These remain separate gates.

## D. Manual cross-version compatibility matrix (future gated execution)

| Source → target | What to verify, in a disposable profile | Phase 1 proof |
|---|---|---|
| Standalone `main` → same standalone ref | Export, import cancel/reject, restore three eras and source demotion | Automated fixture, report actual terminal result |
| Legacy embedded Atlas → standalone `main` | Own copy of genuine legacy-generated sample; normalize optional fields and notes; source demotion; all regions/routes/labels | **Not certified** by standalone-only fixture |
| Standalone `main` → legacy embedded Atlas | Legacy parser must not truncate newer draft fields or overwrite shared origin | **Not certified**; do not recommend backwards opening |
| Standalone `main` → unmerged OMNI branch | Optional suppression/deletion/recovery fields, three-era round trips | **Phase 2 only**, branch must stay unmerged |
| Two live tabs, same origin | Concurrent-write replay with intentionally conflicting synthetic drafts; detect last-writer loss | **Unresolved hazard**, not safe to assume conflict merge |

Do not perform a real-user cutover until every relevant direction is proven and the user has independently restorable backups.

## E. Failure handling and rollback

- **Corrupt JSON / invalid schema / malformed coordinates:** keep original download; refuse import; avoid clearing application storage. Attach only sanitized error counts/fixture identifiers to bug reports.
- **Import confirmation canceled:** retain current draft; do not treat file selection as consent to replace data.
- **Import succeeds but region/route/era data differs:** **STOP**. Save the new output and original separately, compare exact nodes/routes/regions/labels/three snapshots; never overwrite the sole original.
- **Source reference appears canonical after import:** **STOP**. Expected import behavior demotes untrusted reference identities. Investigate a provenance/authority regression without editing Dossier.
- **Legacy site unexpectedly reads the new site's draft:** this is expected same-origin localStorage. Close conflicting tabs. **Do not** try to solve by renaming the production storage key in Phase 1.
- **Storage quota/full/browser-disabled localStorage:** app may fall back to session storage; export the current draft immediately, verify the downloaded copy, and do not assume reload or another browser will preserve it.
- **Development test crashes or WebGL unavailable:** save exact error, browser binary, ref and test command; mark blocked. Node model tests cannot replace interactive restore proof.

## F. Phase 1 evidence record / ownership

| Item | Evidence |
|---|---|
| Application source baseline | `westkitty/Starsilk_Map_of_the_All` `ba95b1e9e3ff0aafe480e90b07573cad670e76f9` |
| Isolated test execution | DEX//REACH `bigmac`, independent clone, `node scripts/phase1-draft-recovery-browser-ci.mjs` |
| Observed result | **PASS**: explicit `PHASE1_RECOVERY_BROWSER_PASS disposable_profiles_only=true`; export, cancel, invalid rejection, imported reload/source demotion, rejected bytes preserved |
| Data classes accessed | Synthetic fixture, new-context temporary localStorage, downloaded synthetic/invalid samples |
| Real browser/storage/user drafts | **NOT OPENED, NOT MODIFIED, NOT MIGRATED** |
| Recovery scope | **Current standalone browser restore proven in isolated contexts**. Legacy cross-version compatibility, concurrent tabs and real-user backups remain **UNVERIFIED** |
| Governing plan | [PR #2](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/2), unmerged at Phase 1 execution |
| Mobile defect witness | 412 px: 1/6 tabs fully visible, 126 px client vs 561 px scroll; `/` leaves drawer `none` and focus `null`; deferred to Phase 4 |

**Owner action outside repository:** Correct external ChatGPT Project instructions still pointing to the embedded Atlas. **Phase 2 prerequisite:** review current branch state, optional-field migration fixtures and the feature-branch browser suites before taking any code.
