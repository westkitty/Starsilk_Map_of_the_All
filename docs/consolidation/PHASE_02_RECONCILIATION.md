# Phase 02 — OMNI Feature Reconciliation and Integration Evidence

**Date:** 2026-10-20 (America/Detroit; GitHub run timestamps can be 2026-10-21 UTC)
**Status:** Draft implementation PR; **hosted build/browser/recovery validation PASS**, but **no Phase 2 production merge** because two-writer localStorage cutover remains unproved. Validation recorded below is ref-bound, not a claim about physical mobile hardware.
**Authority:** [CONSOLIDATION_MASTER_PLAN.md](../../CONSOLIDATION_MASTER_PLAN.md), Phase 2.
**Candidate PR:** [#4](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/4)
**Exact source of previous campaign:** `feature/omni-uplift-100` at `a322a244677117441375fdb04d484015a540fc00`
**Starting authoritative Atlas main:** `38d78bcec686cd3edfdd24d47300e776c521e9a3` (Phase 1 PR #2 and #3 integrated and GitHub Pages workflow succeeded).
**Initial Phase 2 code candidate:** `78395d794832a1723dc64b5d002ede7017184eca` (21 paths; all 20 recovered code/test paths byte-identical to source branch, plus new compatibility fixture).
**Cross-runtime bundle repair commit:** `a6dc21fbf8add4061ea3cff30c84b97bdf68869d` (modern-browser ES2022 target and native module preload).

## 1. Scope and ownership

Preserve one vanilla Three.js renderer and the existing spatial, strategic, network, temporal and source-graph editing surfaces. The Atlas remains the only development target. No changes to `westkitty/Star_System_Planner`, `Starsilk_Character_Dossier`, the LM Arena placeholder, live drafts, or production routing. `main` is unchanged by this candidate PR.

The prior branch contained **16 unique commits**: eight ordered rendering commits, four ordered editor/data-safety implementation commits, and four documentation-only reports. We **replayed selective source patches in historical dependency order**, rather than bulk-merging the divergent branch. We verified the resulting 20 application/test/CI paths against the actual remote feature Git blobs: every selected file is byte-identical to its source. Phase 1 governance, test harness, README and project Bible were retained from the new authoritative `main`.

### Selected implementation groups

| Slice | Source commit SHAs (short) | Resulting feature ownership |
|---|---|---|
| Cosmic visuals, depth, cartographic flow | `ceb6c8d`, `a63c3ff`, `674bde7`, `efe030c`, `55793e6`, `dc9cce4`, `8311bb1`, `761b426` | Continental mapping, pitch-black Wall absence, nebula massing, galaxy ornaments, diamond navigation, braided cyan Starsilk shaders, tier-specific triangulation and Hookshot detail; existing renderer retains ownership |
| Draft deletion and atomic cascading group operations | `c869b48`, `885d38c` | New pure `deletion-engine.js`, source-lock protections, dependency-preview confirmation, undoable node/region/route and group deletion, guarded UI and keyboard paths |
| Fail-closed browser persistence and recovery | `d09befc` | `draft-recovery.js`, immediate destructive storage commits, session fallback and raw-byte recovery; no storage key or JSON major-version migration |
| Per-era visual subtraction | `6731409` | `visual-suppression.js`, era-isolated optional `suppressedVisuals`, genuine Three.js generated-detail suppression, restore/Undo, 8th browser suite |

Four historical docs commits `c461c1a`, `7528367`, `933f01b`, `a322a24` remain in the original branch's immutable Git history and were not copied as competing current governance. The selective port preserves the current PR-only CI. The production Pages workflow gains three new browser acceptance steps and remains scoped to the Atlas repository alone.

### Reference-asset evidence and exclusion

The original branch contains five PNGs of 1536×864 presentation targets. Their **actual remote Git blobs** are readable and have valid eight-byte PNG signatures, sizes approximately 2.4–2.7 MB each:

| Source path | Git blob SHA | Bytes |
|---|---|---:|
| `references/01_map-of-the-all_labeled.png` | `01363abafcb86452b7a717f4d255a5656134a910` | 2,678,706 |
| `references/02_map-of-the-all_unlabeled.png` | `b0c9d104bcd3eafe685f5cb049065cd78d4642ac` | 2,464,814 |
| `references/03_map-of-the-all_detail.png` | `039e9c76ea598c1bc0cf8e6d063f74712526888d` | 2,423,363 |
| `references/04_map-of-the-all_sectors.png` | `6e5642342d32c95b424bf4cbbbb153f19eaf6c52` | 2,414,694 |
| `references/05_map-of-the-all_colored-regions.png` | `c3a3bcf423bb936b6817805ac96b189d29eae828` | 2,472,928 |

Branch documentation claims they originated in Google Drive folder `1adaYrAEB7_--Jsmyu9KIMCTCuRTgZozO`; this session has **not** matched live Drive-original hashes, approval/status or rights against those blobs. They are **not imported into the production candidate** and **not declared authoritative**. Future reference-fidelity work can prove provenance and use them without pretending a commit filename constitutes approval. These assets are not required at runtime by the selected procedural code.

## 2. Current measured proof

| Command / test | Observation | Evidence state |
|---|---|---|
| `npm ci` | PASS on clean isolated Big Mac worktree | VERIFIED |
| `npm run check` | **256/256 Node tests pass**, Vite production build passes | VERIFIED |
| Original bundle on Big Mac Node 26 | **224,979 / 225,000 gzip bytes** (21 bytes spare) | VERIFIED **but failed cross-runtime check** |
| First GitHub Node 22 build on `78395d7` | **226,370 / 225,000 gzip bytes** — exceeds limit; all 256 Node tests passed | **FAILED hosted build**, blocked deployment |
| Optimized build on Big Mac Node 26 at `a6dc21f` | **223,091 / 225,000 gzip bytes** with ES2022 output/native module preload, Three.js vendor still separately cached | VERIFIED locally |
| Current head GitHub Ubuntu Node 22, [run #39529008922](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39529008922) | **PASS**: 256 Node tests, production build/budget, all **8 Chromium suites**, isolated Phase 1 draft export/restore | **HOSTED VERIFIED**, no physical-device proof |
| `tests/consolidation-compat.node-check.mjs` | 3/3 synthetic v1, era suppression and simulated old-writer failclosed cases pass | VERIFIED **simulation only** |
| Original 37 branch Node tests | deletion, fail-closed storage and suppression test groups pass | VERIFIED |
| Rendering-only `atlas-focus-browser-ci.mjs` | Initial Big Mac timeout on second All/None click; unchanged focused rerun PASS, 368 desktop/tablet and 194 phone draw calls | **Intermittent acceptance issue**, not proven repaired |
| Chained 8 browser suites | First Big Mac run passed FOCUS; Spatial label-offset assertion failed; separately rerun Spatial suite PASS | **Full-chain first attempt FAILED**, one bounded independent rerun passed; no full local 8/8 pass claimed yet |
| Hosted PR #4 CI, `a6dc21f` | **PASS**, [run #39529008922](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39529008922): install, 256 tests, build, 8 browser suites, isolated recovery | VERIFIED ON HOSTED NODE 22 |
| `phase1-draft-recovery-browser-ci.mjs` on new version | Included in the successful GitHub Actions check #39529008922: synthetic three-era export/import, cancel/reject, corrupt raw-byte recovery | VERIFIED hosted (synthetic only) |

The developer workstation is Big Mac macOS arm64 with Node v26 and Brave Chromium/SwiftShader. Test contexts are disposable; they do not open the user's personal browser profile, localStorage or real drafts. Desktop and emulated tablet/mobile runs are not physical Galaxy Tab S9 Ultra/S Pen certification.

## 3. Cross-version writer hazard — explicit synthetic regression

The Atlas's exact storage key is **`starsilk.map-of-the-all.draft.v1`** and schema **`version: 1`**. Old valid v1 snapshots without `suppressedVisuals` normalize into the new version without losing editable nodes or routes. A new-version three-era suppression fixture round-trips with independent war/locking/post categories. But an **older captureEra-style writer** can discard an optional `suppressedVisuals` field from a snapshot while leaving top-level state, yielding a mismatched active era. The new importer rejects this inconsistent JSON, and the recovery flow preserves the exact original bytes rather than silently accepting or overwriting.

The regression proves that **older-writer field loss is possible in a simulated input shape**; it does not claim the live Planner-embedded UI was replayed under the same origin. Both deployed URLs still use the same origin/key, so **do not assert cross-version compatibility, concurrency safety, or safe real-user migration**. A verified one-writer transition and owner backup remain required for Phase 6.

## 4. Release and regression boundaries

- **Critical:** The new shader/network visual work raises Balanced All-view draw calls from the Phase 1 sampled 156 to **368** desktop/tablet; mobile from 93 to **194**. These are counts on headless SwiftShader, not measured frame-time or physical performance. Phase 5 must budget GPU and prove quality scaling.
- **Bundle portability:** original 21-byte margin was unacceptable: GitHub Node 22 build breached budget by **1,370 bytes**. A bounded build-target change preserves vendor caching and native browser semantics and reduces local gzip from 224,979 to **223,091** (1,909-byte local margin). Hosted CI MUST confirm the fix. **Do not increase the 225,000-byte cap** or start Phase 3/5 feature growth without additional measured headroom.
- **Known UX failures:** Six mobile pull tabs remain largely hidden at 412 px; global `/` search from closed drawers does not focus. Phase 4.
- **Data safety:** Never use a real browser profile in automated tests. Never silently alter the versioned key, schema, canonical references, original recovery JSON, root Planner or Dossier. Keep any merge/deploy gated on current-head PR CI, original app behavior and an explicit data cutover strategy.
- **Intermittent browser assertions:** Preserve first-attempt failures and attach diagnostic evidence instead of substituting retry success for clean reliability. The strengthened Phase 1 Spatial test checks exact corridor endpoint identities.
- **Old OMNI branch:** Remains untouched at `a322a244`. Historical source assets/notes remain recoverable there.

## 5. Cross-runtime packaging decision

Vite's prior default target and modulepreload polyfill produced **different level-9 zlib gzip totals** on Big Mac Node 26 vs GitHub Ubuntu Node 22 for identical output source content. First hosted PR check [#39528326259](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39528326259) passed the 256 Node tests but failed `scripts/bundle-budget.mjs` with **226,370 bytes**. Raising the budget or changing the gzip level would conceal the regression. Instead, build config commit `a6dc21f` explicitly targets **ES2022 and native modulepreload**, with the existing separate cacheable Three.js vendor chunk. This is appropriate for modern Brave/Chromium/Samsung Internet and recent Safari; it does not certify older browsers without native modulepreload. The Node 26 local payload is **223,091 bytes**. GitHub Actions #39529008922 subsequently passed the **Node 22 build and unchanged bundle-budget gate** as well as all browser/recovery steps. Do not infer this proves every browser version or physical GPU.

## 6. Rollback and next gate

**Before any main merge:** PR #4 remains independently reviewable; closing the PR or reverting its isolated candidate commit restores prior release behavior. Source tests and optional fields remain on this branch. No real user draft migration occurred.

**For Phase 2 closure:** current-head hosted Node/build/8 Chromium/recovery tests **passed**. Remaining gate is a proven backup-first one-writer cutover strategy for the two shared-origin Atlas clients, plus independent real-device performance and test-flake evidence where applicable. No production merge until safety is justified. If those cannot be proved, maintain the PR as a draft rather than exposing users to a half-verified data change.

**After Phase 2:** Stage Phase 3 semantic star-system zoom and stellar detail deliberately, without importing the Planner's physics engine. Phase 4 zero-loss navigation repairs; Phase 5 reference-fidelity and GPU budget; Phase 6 one-editor transition, recovery and release. All later phases must preserve the same feature and data evidence trail.
