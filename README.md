# Đảo Đèn Lồng — Đêm 1 · Đảo Bến

Game web 3D cho Day 12 AI SDLC, bài cá nhân Nguyễn Ngọc Sáng — 2A202603444.

**Video demo:** chưa quay; phải bổ sung video `.mp4` dưới 5 phút trước bàn giao cuối Phase 4. Hiện có [ảnh và bằng chứng Phase 1](docs/proof/phase-1/README.md).

## Chạy game — 2 lệnh

Cần Node.js **22 trở lên**, npm và trình duyệt hỗ trợ WebGL 2. Chạy trong thư mục repo:

```sh
npm ci
npm start
```

Mở **http://localhost:4173**, chọn **Bắt đầu hành trình**. Các lệnh giống nhau trên Windows, macOS và Linux. Lần cài dependency cần mạng; game không tải CDN, font hay model bên ngoài khi chơi. Nếu cổng bận: `npm start -- --port 4174`.

Trong PowerShell nếu `npm.ps1` bị chặn, dùng `npm.cmd ci` và `npm.cmd start`; không cần đổi chính sách bảo mật.

## Cách chơi

Mây thu gom đom đóm, mang đến thắp **5 ngọn đèn** trước bình minh. Mỗi đèn cần **6 đom đóm**, có thể nạp nhiều lần; túi chứa **12**. Đèn đã sáng tạo vùng an toàn. Bóng Mực chạm làm mất một ngọn lửa; hết 3 ngọn lửa hoặc hết 5 phút là thua. Sau thắng/thua có thể chơi lại.

| Điều khiển | Hành động |
|---|---|
| WASD / phím mũi tên | Đi theo hướng camera |
| Space | Nhảy |
| E | Nạp đom đóm vào đèn chưa sáng gần nhất |
| Q | Tỏa sáng: tốn 3 đom đóm, đẩy lùi và làm choáng Bóng Mực |
| Kéo chuột / cuộn | Xoay camera / thu phóng |
| Esc / nút tạm dừng | Tạm dừng, đồng hồ ngừng chạy |
| Nút loa | Bật/tắt âm thanh; mặc định tắt |

Màn hình nhỏ có nút cảm ứng. Bấm dấu hỏi để xem hướng dẫn trong game.

**Điểm:** 10 mỗi đom đóm nhặt được; 100 mỗi đèn thắp; 20 mỗi Bóng Mực trúng một lần tỏa sáng. Khi thắng cộng `floor(số giây còn lại) × 2 + số ngọn lửa còn lại × 50`. Setup scenario không phát sự kiện hoặc cộng điểm.

## Kiểm chứng

```sh
npm run verify
```

Lệnh này chạy unit test, kiểm tra CLI, build web, tạo một lượt thắng trên màn mặc định không override scenario, phát lại bằng CLI, và so hai output byte-identical. Thất bại ở bất kỳ bước nào sẽ thoát khác 0. Kết quả thật được lưu ở [docs/proof/phase-1](docs/proof/phase-1/README.md).

Chạy riêng: `npm test`; đo CPU simulation: `npm run benchmark` (không phải FPS GPU). CI Linux/macOS có sẵn; xem kết quả GitHub sau khi push. Bật hook local nếu muốn: `git config core.hooksPath .githooks`.

## Headless — Test Contract v1.0

Tuning được đọc trực tiếp từ [game.contract.json](game.contract.json) bởi cả game và CLI.

```sh
node scripts/headless.mjs --seed 42 --night 1 --ticks 600 --out artifacts/run.jsonl
```

Với scenario/inputs:

```sh
node scripts/headless.mjs --seed 42 --night 1 --scenario tests/scenarios/pulse.json --inputs tests/scenarios/pulse-inputs.json --ticks 240 --snapshot-every 10 --out artifacts/pulse.jsonl
```

Fixed step 60 Hz, không GPU/cửa sổ. Snapshot từ tick 0, event dùng tick bước vừa thực hiện, end luôn ở dòng cuối. Tọa độ XZ bao gồm biên, vị trí làm tròn 3 chữ số; Y hướng lên. Inputs giữ các field vắng và kích hoạt nút tại cạnh false→true. Exit 0 khi chạy thành công; file sai định dạng exit 2 với stderr; lỗi I/O đầu ra exit 1. Có thêm snapshot terminal nếu ngoài khoảng snapshot-every.

[Spec và contract](docs/spec/phase-1.md) · [Giả định/kiến trúc](docs/notes/phase-1.md) · [Nhật ký AI](docs/notes/ai-log.md) · [Retro](docs/notes/retro.md).

## Build bản web tĩnh

```sh
npm run build
```

Thư mục `dist/` có HTML/CSS/JS, tuning, Three.js local và giấy phép. Phục vụ bằng static HTTP server (không mở file:// trực tiếp vì browser dùng ES modules/fetch). Có thể thử bằng `npm start -- --dist`. Đây là bản web chạy trên macOS/Linux, không cần Docker.

## Sáng tạo của tôi

Đảo giữa biển mây có đường mòn nối năm ngọn đèn, bến gỗ, cây và nấm; tất cả dựng bằng geometry trong code. Đèn lớn có vòng sáng ấm, đảo sáng dần; đom đóm trôi và vòng tỏa sáng; chuông tổng hợp Web Audio, bật theo lựa chọn. Những chi tiết trang trí và âm thanh chỉ có trong `src/world.js`/`src/audio.js`, không được thêm vào simulation/headless. Kiểm chứng tất định và lượt thắng ở `docs/proof/phase-1/` vẫn dùng cùng logic.

## Trạng thái bàn giao

Đã triển khai theo **Phase 1 / PRD-0 / Contract v1.0**. Các Phase 2–4 phải chờ ticket chính thức; không tự suy đoán hoặc nhận là đã hoàn thành. [Danh sách việc còn lại](docs/TODO.md) gồm review của học viên, usage/token, tag/push đúng hạn, CI trên GitHub, video và Release cuối cùng. Tag/Release chỉ được tính là đã nộp khi thực sự có trên GitHub.

**Lịch lab:** phase-1 trước 1h; phase-2 trước 2h; phase-3 trước 2h30; phase-4 + Release v1.0.0 + video trước 4h, tính từ lúc bắt đầu theo Coach. Sau hết giờ lab không commit thêm nội dung sản phẩm.

## Tài liệu, nguồn và giấy phép

[Tài liệu lab ban đầu](docs/lab/README.md) · [GUIDE](GUIDE.md) · [CHECKPOINTS](CHECKPOINTS.md) · [SUBMISSION](SUBMISSION.md) · [RULES](RULES.md) · [RUBRIC](RUBRIC.md) · [Lab board](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW).

[CREDITS](CREDITS.md) và [LICENSE](LICENSE). Giữ nguyên quyền tác giả của đề bài gốc; mã triển khai gốc MIT, Three.js MIT. Không dùng asset của game/phim có sẵn.
