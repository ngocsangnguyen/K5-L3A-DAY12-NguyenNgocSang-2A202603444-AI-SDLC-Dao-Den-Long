# Bằng chứng Phase 2 — Contract v1.1

Chạy `npm run verify`. Chỉ các kết quả chương trình thực sự chạy mới được ghi vào `verification.json`.

| Yêu cầu | Bằng chứng | Kết quả / giới hạn |
|---|---|---|
| Tuning, movement/yaw, pickup, deposit, pulse/hit, input/JSONL | `tests/core.test.mjs`, `tests/cli.test.mjs` và log trong `verification.json` | Regression đã cập nhật theo luật thay thế của Ticket-02 |
| Dash, charm, drifter, pause, fall | Scenario/inputs trong `tests/scenarios/phase-2/`; JSONL cùng tên trong thư mục này | Mỗi tính năng có scenario riêng; chạy hai lần so byte |
| Bridge/pad, upper-pad, ramp, wind | `bridge-pad.jsonl`, `upper-pad.jsonl`, `ramp.jsonl`, `wind.jsonl` | Logic map, landing và gió được chạy thật |
| Thắng từng Đêm và event/điểm | `win-night-1/2/3.jsonl` | Scenario đặt sẵn các đèn trừ đèn cuối, không nhận là chơi mặc định toàn màn |
| Màn Đêm1 mặc định có thể thắng | `default-playthrough.json`, inputs và JSONL | Bot chỉ gửi input công khai, seed2026, không override scenario; CLI phát lại thật |
| Chuỗi đêm, reset máu, tổng điểm | `tests/campaign.test.mjs` | Test điều phối; chưa chơi thủ công thắng cả chuỗi trong GUI |
| Ba map/HUD/intro/pause/retry/settings/cảm ứng | Các JPG và `browser-checks.md` | Browser thực tế, không dùng unit test thay cho ảnh |
| FPS≥30 ở1280×720 | `browser-fps.json` | Cửa sổ10s sau warm-up2s: Đêm1≈58.95, Đêm2≈48.86, Đêm3≈30.77; không phải đo toàn bộ đêm |
| Headless≤30s | `benchmark.json`, `benchmark-night-*.jsonl` | Đủ18000/19800/21600 bước; scenario tăng lửa để không dừng sớm do hit; có cả I/O CLI |
| AI/harness/history | AGENTS.md, skill verify-game, GitHub workflow, notes | Phase1 giữ ở commit80da52e; không giả tag/nộp muộn |

Chưa có test ẩn của giảng viên, chưa có CI GitHub macOS/Linux trong phiên local, chưa có review độc lập. Bằng chứng Phase1 được giữ nguyên, không dùng để khẳng định luật cũ còn đúng sau Ticket-02.
