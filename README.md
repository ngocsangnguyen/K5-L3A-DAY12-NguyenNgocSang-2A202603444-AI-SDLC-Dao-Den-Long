# Đảo Đèn Lồng — Giữ đảo sáng tới bình minh

[Video demo](https://github.com/ngocsangnguyen/K5-L3A-DAY12-NguyenNgocSang-2A202603444-AI-SDLC-Dao-Den-Long/releases/download/v1.0.0/demo.mp4) · [Tải bản chơi v1.0.0](https://github.com/ngocsangnguyen/K5-L3A-DAY12-NguyenNgocSang-2A202603444-AI-SDLC-Dao-Den-Long/releases/tag/v1.0.0)

Nguyễn Ngọc Sáng — 2A202603444. Bản phát hành **Phase 4 / Ticket-04 / Test Contract 1.3**.

## Chạy game

Cần Node.js22+, npm, trình duyệt WebGL2. Trong repo chạy:

```sh
npm ci
npm start
```

Windows dùng `npm.cmd ci` và `npm.cmd start`. Mở [http://localhost:4173](http://localhost:4173) bằng Edge/Chrome/Firefox của bạn; giữ terminal chạy. Chọn **Bắt đầu hành trình → Vào đảo**. Nếu đang mở bản cũ, Ctrl+F5. Đổi cổng: `npm start -- --port 4174`.

**Thử giữ đèn sáng** là tình huống minh họa30giây có đèn yếu/đang bị hút dầu, không cộng vào hành trình. Game thường vẫn bắt đầu từ trạng thái mặc định. Chọn Đảo Cau/Đảo Chuông để luyện tập từ Đêm2/3.

## Luật và điều khiển

|Đêm|Màn|Thời lượng|Cần sáng tại bình minh|
|---|---|---|---|
|1|Đảo Bến, đảo tròn40m|240s|3/5|
|2|Đảo Cau, hai đảo/cầu/bục nhảy|270s|4/6|
|3|Đảo Chuông, ba tầng/dốc/gió|300s|5/7|

Không thắng sớm. Hết3 Ngọn Lửa thua ngay, kể cả tick bình minh. Hết giờ mà thiếu đèn sáng cũng thua. Thắng để sang Đêm kế; tổng điểm chỉ cộng các Đêm đã thắng trong lượt hiện tại. Có chơi lại.

Đèn chưa từng sáng cần10 đom đóm, nạp nhiều lần được. Khi sáng có100 dầu, tự hao1/s; cạn dầu tắt và mất lượng đã nạp. Thắp lại cần5. Châm đèn đang sáng: mỗi đom đóm thêm10 dầu, làm tròn lên số cần dùng, không vượt100. E chọn đèn nhận được gần nhất, hòa thì id nhỏ hơn; đèn đầy không nhận.

Túi ban đầu10, mỗi lần thắp thành công tăng2, tối đa20; reset đầu Đêm. Đèn dầu≥30 có vùng an toàn6m; dưới30 nhấp nháy1Hz và mất vùng an toàn. Bóng Mực wander ưu tiên đèn yếu, tới2m thì đứng hút thêm5 dầu/s/con. Châm lên≥30 đẩy chúng khỏi vùng an toàn. Tỏa sáng tốn3, gây choáng2s/đẩy4m. Gió Lạc cướp đom đóm; Bùa Gió tăng tốc và bỏ hồi lướt10s. Rơi mất1 lửa và toàn bộ đom đóm, hồi sinh sau1s nếu còn sống.

|Phím|Hành động|
|---|---|
|WASD / mũi tên|Di chuyển theo camera|
|Space|Nhảy|
|Shift trái|Lướt14m/s trong0.2s, hồi1.5s|
|E|Nạp/thắp lại/châm dầu|
|Q|Tỏa sáng, hồi3s|
|Esc|Tạm dừng|
|Kéo chuột / cuộn|Xoay camera / thu phóng|

Có nút cảm ứng. Cài đặt cho phép đổi phím, tăng cỡ chữ, giảm chuyển động và bật **Bảng màu dễ phân biệt**. Thiết lập lưu trên trình duyệt. Đèn tắt xẹp và rách giấy. Nhạc nền từng Đêm và tiếng nhặt đom đóm mặc định bật ở âm lượng 45%, có thể chỉnh trong Cài đặt.

**Điểm:** mỗi đom đóm nạp/châm+5; thắp lần đầu+100, thắp lại+40; pulse mỗi con+5, tổng+15 nếu nó đang drain. Khi thắng: mỗi đèn còn sáng+50+floor(dầu), mỗi lửa còn lại+50. Không thưởng thời gian; nhặt không cộng điểm. Không cộng lại hai lần cùng kết quả.

## Kiểm chứng

```sh
npm run verify
```

Chạy bộ test, build, so 28 replay với Phase 3 và kiểm tra chạy dài 10 Đêm. Số liệu benchmark đồ họa được ghi riêng. Lần đo local đạt trung bình 82,37 FPS, 1% thấp nhất đạt 28,94 FPS so với ngưỡng 30, tải cảnh khoảng 3,41 giây. [Verify](docs/proof/phase-4/verification.json) · [Benchmark](docs/proof/phase-4/bench.json) · [Soak](docs/proof/phase-4/soak.json)

CI Linux/macOS có cấu hình nhưng chưa có kết quả chạy trong phiên local. Test ẩn chưa được cung cấp. Proof Phase1/2 giữ nguyên và chỉ mô tả phiên bản lịch sử.

## Headless, benchmark và soak — Contract 1.3

```sh
node scripts/headless.mjs --seed 42 --night 1 --scenario tests/scenarios/phase-3/multi-drain.scenario.json --inputs tests/scenarios/phase-3/multi-drain.inputs.json --ticks 60 --snapshot-every 10 --out artifacts/drain.jsonl
npm run benchmark -- --seed 42 --duration 30 --out artifacts/bench.json
npm run soak -- --seed 7 --nights 10 --out artifacts/soak.json
```

CLI nhận `--night 1/2/3`; scenario/inputs không bắt buộc. Fixed60Hz, không GPU. Snapshot0 trước input; bước k đọc input k tạo trạng thái k+1. Pause tăng wall tick nhưng sim_tick/time/dầu/timer/spawn đứng yên. Field input vắng giữ giá trị; nút kích hoạt cạnh false→true. Scenario không cho điểm/sự kiện/bonus sức chứa. `night_start` ở bước đầu. End luôn dòng cuối; có snapshot cuối nếu ngoài chu kỳ. Sai scenario/inputs: exit2 và stderr; lỗi I/O: exit1.

Dầu tính nguyên đơn vị1/60, chỉ làm tròn1chữ số khi xuất. `fuel_drain` mỗi60 bước hút liên tiếp của từng con/đèn, pause không tính. Scenario đèn `lit:true` thiếu fuel mặc định100; off có fuel0. `successful_lights` cho phép dựng sức chứa nhưng việc đặt sẵn đèn không tự tăng nó. Xem [spec](docs/spec/phase-3.md) và ADR. Tuning tại [game.contract.json](game.contract.json); bản đồ tại `src/core/levels.js`. GUI/CLI dùng chung `Game`.

## Build và sáng tạo của tôi

Để chơi từ Release, giải nén ZIP, chạy `node scripts/serve.mjs` với Node.js 22+ và mở `http://localhost:4173`. Gói đã chứa Three.js.

`npm run build` tạo `dist/` với Three.js local/giấy phép, không CDN; thử bằng `npm start -- --dist`. Dùng HTTP, không file://. Lệnh tương tự trên Windows/macOS/Linux; phiên này kiểm chứng Windows.

Model Mây với nón lá/đèn nhỏ, cây, biển mây, vòng sáng và lá gió được dựng bằng code; nhạc/SFX tổng hợp Web Audio. Trang trí/cài đặt không thêm thực thể vào headless. Giữ instancing từ Phase2. Minh họa dầu được đánh dấu rõ và chỉ mở qua nút riêng; regression/byte replay kiểm tra lõi chuẩn. Lời Ông Đăng là đoạn dẫn sáng tác của bản này.

## Ghi chép và giới hạn

- [Nhật ký AI](docs/notes/ai-log.md), [retro](docs/notes/retro.md), [TODO](docs/TODO.md), [Ticket02 gốc](docs/spec/TICKET-02.txt).
- Đêm3 giữ giả định xuất phát(0,0,-30) tầng0; Coach chưa bổ sung tọa độ. Scenario override được.
- Chưa xác minh lượt chơi thủ công thắng cả ba Đêm mặc định hoặc kết quả trên máy chấm.
- [Ticket-04](docs/spec/TICKET-04.txt) · [SUBMISSION](SUBMISSION.md) · [RULES](RULES.md) · [RUBRIC](RUBRIC.md) · [CREDITS](CREDITS.md).
