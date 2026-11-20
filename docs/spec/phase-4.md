# Phase 4 — Contract1.3

Latest instruction: implement locally only. NO staging, commit, tags, push or GitHub Release. This overrides prior authorization for phases1–3. Prepare a reviewable release archive and video locally; publication/committing proof remain pending by user instruction.

- Keep all v1.0–1.2 gameplay. Browser and CLI share Game. Preserve historical proof and fixtures1–3.
- Graphical bench: seed42, Night1, 200 wander shades,100 motes, L1–3 fuel100. No spawning/damage/pickup/fuel/end. Player origin; camera (30cosθ,15,-30sinθ), θ=2πt/15, CCW viewed from above. Window1280×720 content,3s warmup then duration30s. Compute mean, slowest ceil(1%) mean and p95 from actual frame deltas. Record process-start-to-first-frame load, null web RSS and explain vsync limitations. Grading thresholds60/30FPS,10s load on instructor machine; report actual local failures honestly.
- Soak:10 sequential games1→2→3 cyclic in ONE process, seeds7+i (i starts0). Every30ticks seeded direction, independent per-tick jump.05/dash.03/pulse.02/interact.10. Until end/standard duration. RSS after first load and after final reset; crashes0 and ratio≤1.2. No creative extras in benchmarks/soak.
- Leaderboard on terminal campaign loss or Night3 victory: name3–12 ASCII alphanumeric/underscore; score only won nights, nights_won0–3, ISO8601 UTC, seed. Top10, score desc/time asc stable. Disk persistence, menu and run_cmd --export-leaderboard file.
- Rebind all9 actions, detect duplicate keys, reset defaults, persist. Visual spawn arrow, wind warning, last10s, fuel<30. Saved reduced motion and large text1.25; all rendered UI text≥18px at1280×720.
- Clean install≤3commands, offline static assets in runnable release archive, README/changelog4phases/credits/license; honest1–2page retro and actualMP4<5min gameplay+test/headless/bench evidence.
- Bench/soak JSON and proof stay unstaged locally. No claim of hidden tests, instructor performance or GitHub submission without evidence.
