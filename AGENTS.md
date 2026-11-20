# Đảo Đèn Lồng

- Read `docs/spec/TICKET-02.txt`, `docs/spec/phase-2.md` and `game.contract.json` before changing gameplay.
- Current scope: Phase 2, Contract 1.1, nights 1/2/3. Do not invent Phase 3/4 tickets.
- Node >=22. Install: `npm ci`. Run: `npm start`. Build: `npm run build`.
- Required check: `npm run verify`; it runs unit/contract tests, deterministic replay, and a static build. A failing check blocks completion.
- `src/core/` owns gameplay, fixed 60 Hz ticks, seeded RNG, scoring, and input edges. It must not import DOM, Three.js, wall clock, or Math.random.
- Browser and headless must use the same `Game` class. Import tuning from `game.contract.json`; never duplicate gameplay values in UI code.
- Headless stdout is not evidence: save actual JSONL and commands. No edited outputs, fixed pass responses, or unexplained disabled tests.
- Tick0 is pre-input. Wall tick increases while paused; sim_tick and all gameplay counters freeze. Actions use rising edges.
- Follow the ticket's exact tick order. Pickup/hit use XZ+height; pulse uses 3D from feet+.8. Never reuse Phase1's XZ-only pulse.
- Ground/collision/spawn coordinates belong to `src/core/levels.js`. Wind, scheduled spawns and TTL use sim_tick, never wall tick.
- Scenario setup gives no points/events. Points belong to deposit, not pickup. End precedence: no_flames, all_lit, dawn.
- Preserve `docs/proof/phase-1/`; new evidence goes in phase-2. Phase1 source/test history is commit80da52e.
- Keep UI effects out of headless. Document all assumptions and contract changes.
- Preserve existing lab documents under `docs/lab/`; keep harness and useful history.
- Before delivery, review diff and record actual checks and limitations. Do not create phase tags without verified phase completion or backdate tags.
