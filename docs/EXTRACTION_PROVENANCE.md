# Standalone ownership and migration record

## Authority

- New primary repository: https://github.com/westkitty/Starsilk_Map_of_the_All
- Original repository: https://github.com/westkitty/Star_System_Planner
- Source commit: `05bf20257dca7d51d8a2531c633cdbf8d5ccdadd`
- Subtree-extracted historical tip: `93dbc3bcaf1606153ddd1ac2f41c393f09aeb4aa`
- Technique: `git subtree split --prefix=map-of-the-all`, then a fresh Git checkout using that branch. History follows only the Map of the All path.
- New project path: `/Starsilk_Map_of_the_All/`
- Legacy project path: `/Star_System_Planner/map-of-the-all/`

This is a **non-destructive extraction**, not a GitHub fork of the complete Planner. The standalone repository contains the Atlas code and the map-specific Git history, not a second copy of orbital-system physics or the Dossier.

## Contract

The new repository owns its own `package.json`, reproducible `package-lock.json`, Vite configuration, root page, seven Node test suites, five real-browser journeys and Pages workflow. No relative `../` dependency on the Planner survives at runtime; the OPEN PLANNER link opens the canonical sibling website. JSON export/import remains a manual user action.

The former embedded version has deliberately not been deleted or redirected. This prevents breaking existing bookmarks and existing users before any transition. **New source changes are not synchronized between these independent repositories.** If the legacy route is later retired, audit old storage, user bookmarks and GitHub Pages behavior before replacing it with a forwarding page.

Canon source: `westkitty/Starsilk_Character_Dossier` remains read-only. Its node identities and exact relationships are source-backed, but no authored cosmic coordinates exist. The editable map is an editorial proposal, not a canon source.

## User data and recovery

The draft key `starsilk.map-of-the-all.draft.v1` and JSON schema version 1 are unchanged. Both GitHub Pages project paths on `westkitty.github.io` share the browser origin, so drafts can remain accessible in the same browser profile and origin. A different browser, device or local development host will **not** automatically have those data. Export the draft JSON before switching, and import it in the new Atlas to confirm recovery.

## Proof and rollback

A valid release requires: 76/76 model tests, syntax validation, standalone Vite build with correct base URLs, real Chromium WebGL draw calls and editor journeys, independent GitHub Pages publication, successful HTTP GET for HTML/CSS/JS and the external Planner link.

If the new deployment fails, the old Planner and embedded route remain published and unchanged; fix the new repo without deleting the old one. Do not promote this Atlas draft to canonical lore as a side effect of the repository migration.
