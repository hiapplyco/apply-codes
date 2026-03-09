# Plan: LinkedIn Autonomous Candidate Sourcing

## Success Criteria (ALL must be checked)
1. [ ] Dashboard detection routes to correct adapter - Manual: navigate to each URL pattern
2. [ ] Search criteria panel accepts NL + structured input - Manual: fill form on each dashboard
3. [ ] Autonomous navigation fills fields, applies filters, paginates - Manual: observe automation
4. [ ] Candidate data extraction normalizes across dashboards - Manual: inspect collected data
5. [ ] Results table with sort/filter/copy/CSV/share - Manual: test all export modes
6. [ ] Cloud Function integration (boolean gen + candidate analysis) - Manual: verify API calls
7. [ ] Manifest v1.4.0 with new content_scripts entries - Load unpacked, verify injection

## Subtasks

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Create sourcing directory structure | apply-codes-extension/sourcing/ | ⬜ |
| 2 | Build timing.js - human-like delay utilities | sourcing/timing.js | ⬜ |
| 3 | Build candidate-store.js - chrome.storage.local CRUD | sourcing/candidate-store.js | ⬜ |
| 4 | Build dashboard-detector.js - URL/DOM detection | sourcing/dashboard-detector.js | ⬜ |
| 5 | Build base-adapter.js - abstract interface | sourcing/adapters/base-adapter.js | ⬜ |
| 6 | Build regular-search.js adapter (Phase 1 MVP) | sourcing/adapters/regular-search.js | ⬜ |
| 7 | Build automation-engine.js - orchestration | sourcing/automation-engine.js | ⬜ |
| 8 | Build export.js - CSV, clipboard, share | sourcing/ui/export.js | ⬜ |
| 9 | Build results-table.js - sortable/filterable table | sourcing/ui/results-table.js | ⬜ |
| 10 | Build sourcing-panel.js - main UI panel | sourcing/ui/sourcing-panel.js | ⬜ |
| 11 | Build sourcing.css - styles | sourcing/sourcing.css | ⬜ |
| 12 | Build sourcing-content.js - entry point | sourcing/sourcing-content.js | ⬜ |
| 13 | Update background.js - new message handlers | background.js | ⬜ |
| 14 | Update manifest.json - v1.4.0 + new content_scripts | manifest.json | ⬜ |
| 15 | Build recruiter-lite.js adapter (Phase 2) | sourcing/adapters/recruiter-lite.js | ⬜ |
| 16 | Build recruiter.js adapter (Phase 3) | sourcing/adapters/recruiter.js | ⬜ |

## Dependencies
1 → 2,3,4,5 (parallel) → 6 → 7 → 8,9 (parallel) → 10 → 11,12 (parallel) → 13,14 (parallel) → 15 → 16

## Success Mapping
- SC-1: Tasks 4, 12, 14
- SC-2: Tasks 10, 11
- SC-3: Tasks 2, 5, 6, 7
- SC-4: Tasks 3, 6
- SC-5: Tasks 8, 9, 10
- SC-6: Tasks 7, 13
- SC-7: Tasks 14
