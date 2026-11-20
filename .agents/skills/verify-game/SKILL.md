---
name: verify-game
description: Verify the shared game simulation, deterministic Test Contract runner, and release build; retain actual evidence.
---

1. Read `game.contract.json` and the current phase spec.
2. Run `npm run verify`. Stop and fix failures; never mark a failing requirement as passed.
3. Inspect `docs/proof/phase-2/verification.json` and feature JSONL replays. Do not overwrite phase-1 evidence. Verify all three nights and run `npm run benchmark` against the 30s headless limit.
4. Start `npm start`, inspect all three maps, introductions, HUD, jumping/dash, depositing, pulse, pause/restart/menu and persisted settings. Check browser console. Capture screenshots and measure actual mean FPS at1280×720; target≥30, never infer it from CPU tests.
5. Update the requirement/evidence table and notes with observed results. Browser checks and Linux checks must not be claimed solely from unit tests.
6. A human reviews the implementation and limitations before final phase submission. Stage changes/tags only within the user's authorized scope and actual deadline.
