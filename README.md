# Đảo Đèn Lồng — Ba hòn đảo

Bài cá nhân Nguyễn Ngọc Sáng — 2A202603444. Bản hiện tại **Phase 2 / Ticket-02 / Test Contract v1.1**.

**Video demo cuối:** chưa quay; `.mp4` dưới 5 phút sẽ bổ sung trước bàn giao Phase 4. Hiện có [ảnh, replay và số đo Phase 2](docs/proof/phase-2/README.md).

## Chạy game

Cần Node.js 22+, npm, trình duyệt WebGL2. Trong repo chạy2 lệnh:

```sh
npm ci
npm start
```

Mở **http://localhost:4173** bằng Edge/Chrome/Firefox của bạn. Chọn **Bắt đầu hành trình → Vào đảo**. Giữ terminal đang chạy. Nếu đang mở bản cũ, nhấn Ctrl+F5. Trong Git Bash/PowerShell Windows có thể dùng `npm.cmd ci` và `npm.cmd start`, không cần đổi execution policy. Đổi cổng: `npm start -- --port 4174`.

Bắt đầu ở Đảo Bến để đi theo chuỗi 3 đêm. Các nút Đảo Cau/Đảo Chuông cho phép bắt đầu luyện tập từ đêm đó; tổng điểm chỉ tính những đêm đã thắng trong lượt hiện tại.

## Hành trình

| Đêm | Màn | Mục tiêu | Thời lượng |
|---|---|---|---|
|1|Đảo Bến|5 đèn, đảo tròn40m|300s|
|2|Đảo Cau|6 đèn, hai đảo28m, cầu tre và bục nhảy|330s|
|3|Đảo Chuông|7 đèn,3 tầng, dốc, bục nhảy và gió|360s|

Mỗi đèn cần10 đom đóm, nạp nhiều lần được; túi10 ô. Tỏa sáng tốn3 đom đóm; Bóng Mực choáng2s và bị đẩy4m trong15 tick. Đèn sáng có vòng an toàn6m. Có3 ngọn lửa, hồi đầy đầu đêm. Rơi khỏi đảo mất1 lửa và toàn bộ đom đóm, hồi sinh sau1s nếu còn sống. Gió Lạc cướp đom đóm; Bùa Gió tăng tốc và bỏ cooldown lướt10s.

| Phím | Hành động |
|---|---|
|WASD / mũi tên|Di chuyển theo camera|
|Space|Nhảy|
|Shift / R|Lướt14m/s trong0.2s, hồi1.5s|
|E|Nạp vào đèn chưa sáng gần nhất|
|Q|Tỏa sáng, hồi3s|
|Esc / P|Tạm dừng|
|Kéo chuột / cuộn|Xoay camera / thu phóng|

Điện thoại có nút cảm ứng. Menu pause có Tiếp tục, Chơi lại Đêm, Cài đặt, Về menu. Âm lượng và độ nhạy lưu ở localStorage; nút loa bật/tắt nhạc/SFX. Âm thanh mặc định tắt.

**Điểm:**10 mỗi đom đóm **nạp**,100 mỗi đèn thắp,5 mỗi Bóng Mực trúng pulse. Nhặt không cộng điểm. Khi thắng: `floor(giây còn lại)×2 + lửa còn lại×50`. Tổng điểm là tổng các đêm đã thắng, không cộng đêm thua hoặc cộng hai lần cùng kết quả.

## Test và bằng chứng

```sh
npm run verify
```

Chạy unit/CLI/campaign/settings, build,12 scenario mới hai lần so byte, replay thắng Đêm 1 mặc định và benchmark CLI ba đêm. Bất kỳ bước lỗi sẽ exit khác0; log và hash nguồn ở [verification.json](docs/proof/phase-2/verification.json). Chạy riêng `npm test`, `npm run benchmark`.

FPS đã đo tại1280×720 qua cửa sổ10s sau warm-up: khoảng59.0/48.9/30.8 cho Đêm 1/2/3. Đây là số đo local ở cảnh đầu đêm, không bảo đảm mọi máy/cảnh. Lượt trước tối ưu25.7FPS cũng được giữ lại. Xem [browser checks](docs/proof/phase-2/browser-checks.md) và [browser-fps.json](docs/proof/phase-2/browser-fps.json). Headless chạy đủ các đêm dưới30s; không dùng số đo này để suy ra GPU FPS.

CI Linux/macOS đã cấu hình, chưa nhận là chạy thành công cho tới khi có kết quả GitHub. Bật hook local nếu muốn: `git config core.hooksPath .githooks`.

## Headless — Contract1.1

```sh
node scripts/headless.mjs --seed 42 --night 2 --ticks 600 --out artifacts/night2.jsonl
```

Scenario ví dụ sau lần chạy verify:

```sh
node scripts/headless.mjs --seed 42 --night 2 --scenario tests/scenarios/phase-2/drifter.scenario.json --inputs tests/scenarios/phase-2/drifter.inputs.json --ticks 160 --snapshot-every 10 --out artifacts/drifter.jsonl
```

CLI nhận `--night 1/2/3`. Fixed 60 Hz, không GPU/cửa sổ; tick0 trước input, tick k đọc input k tạo trạng thái k+1. Pause: wall tick tăng, sim_tick/time/timer/spawn/TTL đứng yên. Frame thiếu field giữ giá trị cũ, nút kích hoạt ở cạnh false→true. Scenario không tạo event/điểm; `night_start` ở bước gameplay đầu tiên. End luôn là dòng cuối; thêm snapshot cuối nếu ngoài khoảng định kỳ. File inputs/scenario sai exit2 và stderr; lỗi I/O output exit1. `player.invuln` là boolean, kèm `invuln_s` để xem thời gian còn lại. Motes random có `ttl_s:null`, dropped có TTL giây.

Thông số đúng nguồn duy nhất ở [game.contract.json](game.contract.json); bản đồ/collision ở `src/core/levels.js`. Browser và headless gọi cùng `Game`.

## Build

```sh
npm run build
```

`dist/` là bản web tĩnh kèm Three.js local và giấy phép, không cần CDN/âm thanh/font/model bên ngoài. Dùng static HTTP server, không mở file://. Thử build bằng `npm start -- --dist`. Game web và CLI dùng cùng lệnh trên Windows/macOS/Linux.

## Sáng tạo của tôi

Tất cả model, nón lá/đèn nhỏ của Mây, cây, biển mây, vòng sáng và lá gió được dựng bằng code. Nhạc/SFX tổng hợp Web Audio. Giữ phong cách và màu ticket; trang trí/âm thanh không thêm thực thể vào headless. Instancing là tối ưu hiển thị, không thay luật. Lời Ông Đăng là đoạn dẫn sáng tác cho bản này, không trích nguyên văn một nội dung chưa được cung cấp.

## Quyết định và giới hạn

- [Ticket gốc](docs/spec/TICKET-02.txt), [acceptance criteria](docs/spec/phase-2.md), [giả định/delta](docs/notes/phase-2.md), [nhật ký AI](docs/notes/ai-log.md), [retro](docs/notes/retro.md).
- **Đêm 3 chưa được ticket cho điểm xuất phát:** tạm chọn(0,0,-30) ở tầng0, tránh khối tháp tại gốc. Đây là giả định cần đối chiếu Coach nếu có bổ sung; scenario luôn override được.
- Chưa có test ẩn; chưa chơi thủ công thắng cả3 đêm trong GUI, chưa đánh giá chất lượng nghe toàn bộ âm thanh. Phạm vi bằng chứng được ghi rõ trong proof.
- Phase 1 source/test/harness được giữ ở commit local `80da52e`, proof cũ giữ nguyên. Commit local không thay cho tag nộp trên GitHub; không tạo tag lùi ngày.
- Phase 3/4 chờ ticket; tag/push/review học viên, video và Release cuối vẫn theo [TODO](docs/TODO.md) và lịch Coach.

[Tài liệu lab gốc](docs/lab/README.md) · [SUBMISSION](SUBMISSION.md) · [RULES](RULES.md) · [RUBRIC](RUBRIC.md) · [CREDITS](CREDITS.md) · [LICENSE](LICENSE).
