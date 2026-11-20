# ADR-003 — Dầu đèn và thắng tại bình minh

Ngày 20/11/2026. Trạng thái: áp dụng theo Ticket-03 do người dùng cung cấp. Giai đoạn triển khai giữ working tree theo yêu cầu không commit; sau kiểm chứng, người dùng đã cho phép commit/push và gắn các tag phase1/2/3. Quyết định gameplay dưới đây không đổi.

## Vấn đề và quyết định

Luật cũ xem `lit` là trạng thái vĩnh viễn và thắng ngay khi đủ đèn. Ticket-03 thay cả hai. Giữ `lit` để tương thích các trường cũ, bổ sung `fuelUnits`, `everLit`, `relitCount`; `fuelUnits` là số nguyên theo đơn vị1/60. Mọi quyết định (đầy dầu, yếu, hết dầu, bonus) dùng số nguyên, chỉ snapshot/event mới làm tròn1 chữ số.

- Bước2 giảm dầu tự nhiên và dầu bị hút theo trạng thái drain từ đầu bước; cộng dồn tất cả shade, sau đó phát lantern_out và reset deposited. Đèn tắt ngay trước movement/pickup/interact.
- Tương tác dùng cùng hàm acceptsLight ở core/UI: chọn đèn nhận được gần nhất, hòa thì ID; đèn sáng nhận refuel, đèn tắt nhận deposit và có thể relight với5 thay vì10.
- `successfulLights` nằm trong state người chơi của mỗi Game, chỉ tăng do sự kiện thắp trong gameplay; scenario không tự tăng. Capacity được suy ra từ count, không lưu bản sao dễ lệch.
- Safe zone phụ thuộc fuelUnits≥30×60. Đẩy shade ra mép ngay ở bước cập nhật an toàn; tức0 tick, đáp ứng tối đa30 tick và tránh gây hit trong lúc đẩy.
- Wander chọn đèn yếu trước đèn tắt; chase không bị đổi mục tiêu; drain đứng yên. Hết choáng chuyển wander, cho một bước chuyển trạng thái rõ ràng trước lần quyết định AI tiếp theo.
- Chỉ xét thắng khi hết giờ, sau spawn/contact/tất cả cập nhật. Ưu tiên no_flames; sau đó thắng dawn_survived nếu đạt ceil(0.6×N), còn lại dawn. Không còn all_lit.
- Điểm chỉ phát ở deposit/refuel/light/pulse/dawn; không có thưởng thời gian. Thiết lập scenario không cho điểm hoặc tăng sức chứa.
- Colorblind là state cài đặt browser, không chạm RNG hoặc output headless. Đèn tắt xẹp20% và có vết rách ngay cả ở chế độ màu thường.

## Quy ước cần ghi rõ

`fuel_drain` được ghi sau mỗi60 bước thực sự hút liên tiếp của từng shade/target, theo sim_tick; pause không tăng counter. Tại cùng bước, sự kiện của các shade báo mức dầu cuối pha trừ dầu (đã cộng dồn), rồi mới có lantern_out nếu cạn. Đèn bắt đầu drain ở bước8 sẽ trừ dầu từ bước2 của tick sau. Điều kiện target hợp lệ dùng fuel thật, không dùng số đã làm tròn. Nếu target tắt/được châm≥30 hoặc shade ra ngoài2m, drain chuyển wander trước khi xét một quyết định AI khác ở bước sau.

## Test cũ bị thay và hệ quả

- Thay assertion thắng all_lit/bonus thời gian bằng sống đến bình minh/ngưỡng3-4-5/bonus dầu.
- Đổi điểm nạp10→5, tăng capacity sau thắp; test cũ dùng fuel100 phải tính phần hao trước tương tác.
- Thay giả định safe zone mọi đèn sáng bằng safe zone chỉ khi fuel≥30.
- Giữ regression input, movement/jump/dash, fall, drifter/charm, map, pause, JSONL, determinism. Không skip test.
- Giữ nguyên bằng chứng Phase1/2; ghi kết quả mới vào docs/proof/phase-3. Các replay Phase2 được lưu như lịch sử, không được nhận là đạt luật mới.
- Xóa bot playtest cũ: chiến lược chỉ nhắm thắp hết đèn sớm, không chứng minh duy trì dầu và còn ghi vào proof Phase2. Bằng chứng mới dùng input/scenario công khai, có nhãn tình huống dựng sẵn, không giả là chơi mặc định.
