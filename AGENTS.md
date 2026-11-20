# Đảo Đèn Lồng

- Read `docs/spec/phase-1.md` and `game.contract.json` before changing gameplay.
- Only Phase 1 is currently released. Do not invent later tickets or claim their completion.
- Node >=22. Install: `npm ci`. Run: `npm start`. Build: `npm run build`.
- Required check: `npm run verify`; it runs unit/contract tests, deterministic replay, and a static build. A failing check blocks completion.
- `src/core/` owns gameplay, fixed 60 Hz ticks, seeded RNG, scoring, and input edges. It must not import DOM, Three.js, wall clock, or Math.random.
- Browser and headless must use the same `Game` class. Import tuning from `game.contract.json`; never duplicate gameplay values in UI code.
- Headless stdout is not evidence: save actual JSONL and commands. No edited outputs, fixed pass responses, or unexplained disabled tests.
- Tick 0 is pre-input. Step k consumes input k and emits tick k+1. Distances use XZ and inclusive radii.
- Keep UI effects out of headless. Document all assumptions and contract changes.
- Preserve existing lab documents under `docs/lab/`; keep harness and useful history.
- Before delivery, review diff and record actual checks and limitations. Do not create phase tags without verified phase completion or backdate tags.
