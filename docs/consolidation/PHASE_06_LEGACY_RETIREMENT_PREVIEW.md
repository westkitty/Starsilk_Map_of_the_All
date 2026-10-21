# Phase 6 — Legacy Atlas Read-Only Retirement Preview

**Scope:** Candidate HTML replacement for `westkitty/Star_System_Planner/map-of-the-all/index.html`, stored **only** in the dedicated Atlas repository. The independent Planner repository is **not modified** by this PR, and no production website, real browser profile, or user draft is touched.

## Why this exists

The legacy embedded Atlas and the dedicated Atlas share the GitHub Pages origin and JSON-v1 localStorage key `starsilk.map-of-the-all.draft.v1`. The original compiled legacy client has been proven to overwrite a modern draft while leaving parseable JSON that hides the loss. Read-only retirement is a required component of a safe one-writer cutover, but merely redirecting the URL cannot stop stale tabs or offline caches.

## Candidate behavior

`docs/consolidation/LEGACY_RETIREMENT_PREVIEW.html` is a standalone, accessible, non-writing replacement entry. It:

1. Does **not** load the legacy Three.js/editor JavaScript or controls.
2. Reads `localStorage.getItem('starsilk.map-of-the-all.draft.v1')` to detect whether the current browser profile holds raw saved draft bytes.
3. Provides a user-triggered **exact-byte** download with no JSON parse, normalization, mutation, or external transmission. Malformed saved JSON remains exportable.
4. Links clearly to the standalone dedicated Atlas and independent root orbital Planner.
5. Warns users that already-open and offline-cached old tabs can still write the shared key; no automatic redirect or background import occurs.
6. Leaves the independent Planner, canon sources, backup originals, and JSON-v1 schema untouched.

**A download is not verified restoration.** A real owner must preserve the original export, verify a separate restore on an isolated browser profile/device, and close old editor tabs before authorizing an actual production cutover.

## CI preview proof

The dedicated Atlas PR workflow uses a disposable checkout of **immutable original Planner source**, compiles both real clients, and first reruns the known-writer-collision witness. It then copies the retirement HTML into **only the disposable Planner checkout**, rebuilds the Planner, and runs the same-origin browser replay with `--retired`. No commit, push, or mutation targets the independent Planner repository.

The dual-client tests are designed to prove, when exact-head CI passes:
- The original pinned legacy editor **still reproduces** its proven shared-key overwrite (deliberately retained witness).
- Genuine JSON-v1 output from that legacy writer can be imported through the new Atlas's real confirmation UI, validated, and reloaded in a fresh disposable browser profile.
- The retirement entry shows only read-only controls, not `#allLayersBtn`.
- The exact shared JSON bytes remain unchanged when the retirement page opens.
- Clicking the backup button produces an **exact byte-for-byte raw download**.
- A second, independent dedicated Atlas profile can import those exact downloaded bytes, preserve three eras and Post-era suppression, and reload successfully.
- An empty browser profile does not expose an active export button or create storage.
- Malformed JSON still downloads with exactly the original bytes, without parsing or overwriting them.
- The independent orbital Planner's root React application mounts after the candidate legacy HTML rebuild.
- The expected dedicated Atlas link exists and the disposable browser reports no page exceptions.

CI success does **not** prove old tabs are neutralized, a personal backup has been recovered, a live change was published, or a rollback has been rehearsed. A fresh exact-head receipt is required; until then status is **NOT VERIFIED**.

## Gated production cutover (NOT DONE)

1. Have the owner export and independently restore actual drafts from the browser profiles involved (do not collect them into public CI).
2. Obtain separate authorization for modifying the Planner's legacy route. Keep the root orbital simulation and its PWA behavior intact.
3. Apply the reviewed HTML to the actual Planner repository on an isolated branch; rerun its native TypeScript, 239-test baseline, PWA bundle, and browser journeys against the exact change.
4. Stage a controlled legacy-route retirement release, with clear handling for already-open tabs and service-worker caches.
5. Repeat real dual-built-client tests against the exact candidate Planner SHA, prove only the standalone Atlas is a fresh-visit writer, and rehearse rollback without relying on the old editor to read new drafts.
6. Confirm all seven `RELEASE_READINESS.json` proofs independently. Require exact-SHA approval before Atlas merge/deploy. After publication verify both URLs and the independent Planner.

**Do not mark the release gate ready solely because a read-only preview passes.**
