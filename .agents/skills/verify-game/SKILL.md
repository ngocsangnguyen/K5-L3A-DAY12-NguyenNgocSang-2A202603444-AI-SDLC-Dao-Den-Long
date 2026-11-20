---
name: verify-game
description: Verify the shared game simulation, deterministic Test Contract runner, and release build; retain actual evidence.
---

1. Read `game.contract.json` and the current phase spec.
2. Run `npm run verify`. Stop and fix failures; never mark a failing requirement as passed.
3. Inspect `docs/proof/phase-3/verification.json` and JSONL replays; preserve older proof. Verify oil boundaries/refuel/relight/drain, three dawn thresholds, no early win, all still-valid Phase1/2 regressions, deterministic output and headless timing.
4. Start `npm start`, inspect fuel bars/1Hz low-fuel warning, deflated/torn unlit lamps, growing capacity, saved colorblind mode (blue eyes/rim, white warnings+⚠), pause/restart and ordinary campaigns. The labelled tutorial is a constructed scenario, never claim it as a default playthrough. Check console and capture actual screenshots. Measure FPS when rendering changes, rather than infer from CPU tests.
5. Update the requirement/evidence table and notes with observed results. Browser checks and Linux checks must not be claimed solely from unit tests.
6. A human reviews before final submission. The latest explicit user instruction authorizes committing/pushing phases1/2/3 and their tags, superseding the earlier no-commit request. Proceed within that scope after verification, preserve phase history, verify remote refs, and do not backdate or force-push.
