# Đảo Đèn Lồng

- Read `docs/spec/phase-3.md`, `docs/adr/003-fuel-and-dawn.md`, retained Ticket-02 and `game.contract.json` before changing gameplay.
- Current scope: Phase4, Contract1.3. Read docs/spec/phase-4.md and TICKET-04.txt.
- Latest user instruction forbids staging/commit/tag/push/publication for Phase4. Prepare release artifacts/proof locally; preserve tags phase1/2/3 and HEAD5f50297.
- Node >=22. Install: `npm ci`. Run: `npm start`. Build: `npm run build`.
- Required check: `npm run verify`; it runs unit/contract tests, deterministic replay, and a static build. A failing check blocks completion.
- `src/core/` owns gameplay, fixed 60 Hz ticks, seeded RNG, scoring, and input edges. It must not import DOM, Three.js, wall clock, or Math.random.
- Browser and headless must use the same `Game` class. Import tuning from `game.contract.json`; never duplicate gameplay values in UI code.
- Headless stdout is not evidence: save actual JSONL and commands. No edited outputs, fixed pass responses, or unexplained disabled tests.
- Tick0 is pre-input. Wall tick increases while paused; sim_tick and all gameplay counters freeze. Actions use rising edges.
- Follow the ticket's exact tick order. Pickup/hit use XZ+height; pulse uses 3D from feet+.8. Never reuse Phase1's XZ-only pulse.
- Ground/collision/spawn coordinates belong to `src/core/levels.js`. Wind, scheduled spawns and TTL use sim_tick, never wall tick.
- Fuel uses integer1/60 units; decisions never read rounded output. Phase2 applies natural/drain decay before extinguishing; relight/refuel happens later in the tick.
- Scenario setup gives no points/events/capacity bonus. Capacity derives from successful_lights, not currently lit count. Share lantern helpers between UI and core.
- No early win. At dawn, precedence: no_flames, enough current lamps→dawn_survived, otherwise dawn. Score no longer rewards time.
- Preserve docs/proof/phase-1/2/3 and their fixtures; new evidence goes in phase-4. Never overwrite historical proof with a new verification run.
- Keep UI effects out of headless. Document all assumptions and contract changes.
- Preserve existing lab documents under `docs/lab/`; keep harness and useful history.
- Before delivery, review diff and record actual checks and limitations. Do not create phase tags without verified phase completion or backdate tags.
