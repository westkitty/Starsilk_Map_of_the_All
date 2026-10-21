# Starsilk Map of the All — Project Bible

## Purpose / constraints

Independent Three.js 4X-style *editable draft* Atlas, never canon authoring. User-set coordinates, borders, corridors and planetary orbits are not actual measured geometry. WorldsVault relationship graph and Starsilk Character Dossier are read-only source evidence. Blood Eclipse War lasted 170 years. The Siege Wall is cosmic absence/containment rather than ordinary masonry.

The mature `Star_System_Planner` owns physics. Atlas can export explicitly hypothetical `.ssp.json` for manual import; it must never access or change the Planner saves or canon source.

## Lineage and artifact identity

- Local root: `/Users/andrew/Starsilk_Map_of_the_All`.
- Intended GitHub: `westkitty/Starsilk_Map_of_the_All` (not yet created or pushed).
- Extracted with `git subtree split --prefix=map-of-the-all` from the Planner at source SHA `05bf20257dca7d51d8a2531c633cdbf8d5ccdadd`; retained Atlas history tip `93dbc3bcaf1606153ddd1ac2f41c393f09aeb4aa`.
- Initial standalone commit: `1d821b25202a3f5f3d83d39162eee78f55196342`.
- The older Planner app and embedded Atlas URL remain unchanged; future changes here are not auto-synced.

## 2026-10-17 — five-pass uplift

Baseline: clean standalone `main`, 76 Node tests and independent Vite build. Five passes added invalid JSON recovery with download/explicit replacement, pagehide autosave flush, correct all-layer logic and protected browser shortcut behavior, identity-aware pointer picking and reused label vectors, separate Three.js vendor output and objective compressed bundle budget.

Observed proof: **81/81 Node model tests, production build/budget, five browser suites PASS** with desktop and emulated tablet/phone, including corrupt-save recovery. Physical S Pen hardware and real mobile thermal/frame timing not tested. See `UPLIFT_X5_2026-10-17.md`.

Remote blocker: GH CLI stored token invalid (HTTP 401); new GitHub repository and Pages deployment remain unverified. Never claim publication without GitHub remote SHA and successful deployed public URL GET. Keep local Git and evidence intact until remote credentials are repaired. The original Planner and Dossier have no writes in this session.

Start every future uplift with `OPERATIONAL_STATE.md`, this Bible and `docs/EXTRACTION_PROVENANCE.md`. Do not use `/Users/andrew/Star_System_Planner` without verifying its actual remote.

Implementation commit: e8ba3499731cd1d042c7aa7471e25cd07c8ae4ab (five uplift passes, 81 model tests, five passing Chromium suites, vendor split, 186099 gzip bytes).

## 2026-10-20 — Consolidation Phase 01: current ownership and baseline (additive supersession)

- **Current authoritative Atlas repository:** `westkitty/Starsilk_Map_of_the_All`. The earlier paragraph saying the remote is "not yet created" is historical as of 2026-10-17, **not current**. Standalone `main` was verified at `ba95b1e9e3ff0aafe480e90b07573cad670e76f9` and [Pages workflow 39105968854](https://github.com/westkitty/Starsilk_Map_of_the_All/actions/runs/39105968854) completed successfully. Standalone published URL, Planner root and legacy embedded Atlas returned HTTP 200.
- **Governing document:** [Master Plan on open PR #2](https://github.com/westkitty/Starsilk_Map_of_the_All/pull/2), commit `c4e1ea3c2a037c6087222df3661062de7ff3ee92` is deliberately **not copied/merged** by Phase 1. Current development target is solely this dedicated Atlas repository; Planner remains an independent physics simulator; Dossier is read-only.
- **Refs/safety:** clean isolated Big Mac clone of dedicated `main` at `ba95b1e9`, Phase 1 branch `consolidation/phase-01-baseline-20261020`. MacBook checkout `/Users/andrew/Starsilk_Map_of_the_All` was **clean on unmerged `feature/omni-uplift-100`** and left untouched. The OMNI branch is 16 ahead / 1 behind; do not merge, cherry-pick or overwrite it in Phase 1.
- **Reproducible baseline:** `npm ci` passed; `npm run check` passed with **216/216 Node tests** and build; bundle 218,268 gzip bytes under 225,000; `npm audit` found one high pinned-Vite dev-server advisory. Full `npm run test:browser` passed all **5/5** Chromium suites with explicit terminal PASS markers and wrapper exit 0; the isolated synthetic draft-recovery suite also passed. These are emulator/headless results, not physical stylus acceptance. See `docs/consolidation/PHASE_01_BASELINE.md` for per-suite dispositions and known UX defects.
- **Draft guardrails:** schema v1 and `starsilk.map-of-the-all.draft.v1` unchanged; independent war/locking/post snapshots, source demotion and real user storage untouched. Disposable-profile restore procedure and outcomes: `docs/consolidation/DRAFT_RECOVERY_RUNBOOK.md` and `scripts/phase1-draft-recovery-browser-ci.mjs`.
- **Still open:** fix outdated external ChatGPT Project directives, assess shared-origin last-writer conflict and optional-field cross-version round trips, address audited Vite advisory separately. **No production deployment, branch merge, feature work or Planner/Dossier writes were performed.**
