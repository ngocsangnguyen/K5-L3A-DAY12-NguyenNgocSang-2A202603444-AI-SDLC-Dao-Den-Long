---
name: verify-game
description: Verify the shared game simulation, deterministic Test Contract runner, and release build; retain actual evidence.
---

1. Read `game.contract.json` and the current phase spec.
2. Run `npm run verify`. Stop and fix failures; never mark a failing requirement as passed.
3. Inspect `docs/proof/phase-4/verification.json` and JSONL replays; preserve proof1–3. Verify all still-valid regressions, v1.3 bench metrics/scene, soak RSS, disk leaderboard/export and controls/settings. Run actual graphical bench and soak, save outputs, report failed local thresholds honestly.
4. Start `npm start`, inspect fuel bars/1Hz low-fuel warning, deflated/torn unlit lamps, growing capacity, saved colorblind mode (blue eyes/rim, white warnings+⚠), pause/restart and ordinary campaigns. The labelled tutorial is a constructed scenario, never claim it as a default playthrough. Check console and capture actual screenshots. Measure FPS when rendering changes, rather than infer from CPU tests.
5. Update the requirement/evidence table and notes with observed results. Browser checks and Linux checks must not be claimed solely from unit tests.
6. Latest instruction forbids staging/commit/tags/push/Release for Phase4. Prepare archive/video/proof locally. Do not turn publication requirements into permission to publish or ask again about already-forbidden actions.
