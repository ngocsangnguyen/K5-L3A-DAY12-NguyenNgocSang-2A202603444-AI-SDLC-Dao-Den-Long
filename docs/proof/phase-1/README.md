# Bằng chứng Phase 1

Chạy lại: `npm run verify` và `npm run benchmark`.

| Yêu cầu | Bằng chứng | Phạm vi |
|---|---|---|
| Tick 0, 60 Hz, movement/yaw, input giữ trạng thái/cạnh nút | `tests/core.test.mjs`, `tests/cli.test.mjs`, log trong `verification.json` | Tự động, chạy thực tế |
| Pickup/capacity, nạp từng phần, thắp đèn, pulse/cost/stun/push/cooldown | `tests/core.test.mjs`, `replay.jsonl` | Logic dùng chung GUI/headless |
| Hit/drop/invulnerability, safe zone, thắng/thua, điểm, jump | `tests/core.test.mjs` | Logic, không thay thế ảnh GUI |
| CLI đúng JSONL/end, số bước, dừng sớm, exit 2 cho file sai | `tests/cli.test.mjs` | Chạy tiến trình CLI thực tế |
| Cùng seed/scenario/input cho output giống hệt | SHA-256 và so byte trong `verification.json` | Hai lượt CLI độc lập |
| Màn mặc định có thể thắp cả 5 đèn và thắng | `default-playthrough.json`, inputs + JSONL tương ứng | Seed 2026, không override scenario; bot chỉ dùng input công khai |
| Game 3D, HUD và điều khiển | `browser-checks.md`, ảnh JPG nếu đã lưu | Kiểm tra trình duyệt riêng |
| Hiệu năng cơ sở | `benchmark.json` | Chỉ CPU simulation, không khẳng định FPS đồ họa hoặc đạt Phase 4 |
| macOS/Linux | `.github/workflows/verify.yml` | Đã cấu hình CI; chỉ được coi là đã chạy khi GitHub có kết quả |

File output do chương trình tạo, không sửa tay. `verification.json` lưu kết quả trên máy local; bằng chứng chỉ khớp tag sau khi commit/tag bản tương ứng. Chưa có test ẩn của giảng viên và review độc lập trong các kết quả tự động này.
