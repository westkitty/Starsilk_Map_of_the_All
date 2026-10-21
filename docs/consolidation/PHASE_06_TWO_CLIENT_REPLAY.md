# Phase 6 — Two Compiled Atlas Clients, One Disposable Origin

**Date:** 2026-10-21
**Owning repository:** `westkitty/Starsilk_Map_of_the_All`
**Candidate branch:** `feature/phase06-two-client-browser-replay`, stacked on [release-safety PR #12](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/12) commit `134fbf5424e70742e5bc2df086bc4f0c06ceea9b`.

## Purpose and scope

Phase 6's highest-risk open data question is not whether a standalone JSON v1 backup can pass its own validator; that already passed in isolated browser tests. It is whether the legacy Atlas embedded in the independent orbital Planner and the new dedicated Atlas can safely edit the **same-origin, same-key draft**. Their paths differ, but both browser clients store `starsilk.map-of-the-all.draft.v1`.

This work creates a **real dual-built-client browser witness**, not a mocked legacy `captureEra`. It does **not** publish, merge, rename a key, modify the Planner's source, access a real user browser, or establish a new canonical coordinate.

## Reproducible, no-production-contact architecture

The dedicated Atlas GitHub PR workflow has a separate read-only `legacy-same-origin` job:

1. `actions/checkout@v4` checks out the current dedicated Atlas PR into `atlas/` (no persisted credentials).
2. A second read-only checkout fetches `westkitty/Star_System_Planner` at immutable SHA `dc3c742743838757aaafed9e637d95a5aa814596` into `planner/` (no persisted credentials).
3. Ubuntu Node 22 runs `npm ci && npm run build` on the Atlas and **`npm ci && npm run check` on the actual Planner**, including its native TypeScript tests, production build and bundle audit. This verifies the independent simulator as built rather than copying its physics into the Atlas.
4. `scripts/phase6-two-client-browser-ci.mjs` serves **both actual `dist` trees** via a single ephemeral `http://127.0.0.1:<random-port>` static server, with exactly their GitHub Pages prefixes: `/Starsilk_Map_of_the_All/` and `/Star_System_Planner/map-of-the-all/`. This makes the localStorage origin truly identical. No code uses the real production Pages URLs.
5. A fresh Playwright Chromium **newContext** uses blocked service workers, so neither the user's profile nor a previous PWA cache participates. It seeds only one synthetic JSON v1 Atlas draft containing a unique named galaxy and a Post-era `network:all` suppression.
6. The compiled standalone app loads that synthetic modern draft and confirms the exact storage bytes are intact. The compiled legacy editor opens in a **second tab of the same disposable context**, then executes its actual **ALL / NONE** layer action, triggering its real debounced persistence writer.
7. The test observes the **same exact storage key** changing, then checks whether the original synthetic galaxy name or era-specific suppression was lost. A marked `PHASE6_TWO_CLIENT_WRITER_COLLISION` line records only booleans, no contents. The test succeeds at documenting the known hazard only if a genuine older-writer loss is reproduced. A separate `PHASE6_TWO_CLIENT_BROWSER_PASS disposable_profiles_only=true pinned_legacy=true` marker identifies an observed test success, **not compatibility approval**.

The static server only reads its temporary compiled app files. Both tabs and the synthetic shared-origin localStorage are destroyed with the Playwright context. It never visits the user's personal browser or writes to either production GitHub Pages site.

## Evidence status

| Gate | Current status |
|---|---|
| Parent release-safety PR #12 | **Hosted PASS** at exact `134fbf54`, run [#39556024014](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39556024014): 280/280 Node, 14 Chromium suites, disposable v1 recovery, 223529/225000 gzip |
| Original Planner `main` immutable source | `dc3c742743838757aaafed9e637d95a5aa814596`, deployment [#39082756057](https://github.com/westkitty/Star_System_Planner/actions/runs/39082756057): TypeScript, 239/239 tests, bundled Planner and embedded Atlas browser acceptance **PASS** (historical run on same current SHA) |
| New combined local-origin browser witness | Actions [run #39557325046](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39557325046), parallel read-only two-distribution replay | **PASS**: actual legacy UI wrote same key; synthetic galaxy name **LOST**, Post-era `network:all` **LOST**, new standalone `readDraft` **ACCEPTED** the overwritten v1 (no recovery warning), both client JS error checks passed, disposable profile only |
| Fresh independent Planner native verification | Same run #39557325046, independent immutable Planner checkout `dc3c7427` | **PASS**: TypeScript, 239/239 tests, Vite production build and bundle/PWA gate |
| Actual owner JSON backup/restorability | **NOT VERIFIED**; cannot inspect or overwrite a user's real saved draft |
| Legacy editor decommissioned or made read-only | **NO** — known cutover blocker |
| Production Atlas published | **NO**; only stacked draft branches, production main untouched |
| Physical Galaxy Tab S9 Ultra / S Pen | **NOT VERIFIED** |

## Observed synthetic data-loss mechanism

The exact hosted `PHASE6_TWO_CLIENT_WRITER_COLLISION` receipt reported:

```json
{"sharedOrigin":true,"storageKey":"starsilk.map-of-the-all.draft.v1","legacyWrote":true,"lostNamedDraft":true,"lostEraSuppression":true,"currentReaderRejected":false,"source":"pinned compiled Planner, built candidate Atlas","realUserData":false}
```

This is more serious than the earlier pure legacy `captureEra` mismatch. The old client can **fallback to its seed state and overwrite a newer synthetic draft with a JSON v1 file that passes the new reader**; no schema rejection or original-byte recovery prompt is necessarily triggered. An existing standalone tab's in-memory state is not an independent durable user backup. A real owner's independent export and legacy one-writer shutdown are mandatory. Do not reframe the test's PASS marker as compatibility success.

## Release verdict and next proof

**The expected detected collision is a PASS for hazard reproduction but a FAIL for production safety.** The release manifest in `docs/consolidation/RELEASE_READINESS.json` intentionally remains blocked, and the default-deny Pages gate still refuses all unapproved publication. Completing this synthetic replay does **not** authorize changing the independent Planner, automatically transferring real browser drafts, or merging any PR.

Phase 6 still requires an independently restorable owner backup, separately authorized retirement of the legacy writer, a second **post-retirement** genuine two-client browser test proving there is only one writable Atlas, intact v1 import/export with distinct War/Locking/Post snapshots, a tested rollback, and exact-release-SHA approval. Preserve the 170-year Blood Eclipse War and canonical Dossier boundaries throughout.
