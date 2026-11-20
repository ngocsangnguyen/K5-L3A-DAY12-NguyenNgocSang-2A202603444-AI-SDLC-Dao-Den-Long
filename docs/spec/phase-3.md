# Phase3 — Ticket-03 “Đèn cạn dầu” / Contract1.2

Nguồn: toàn bộ ticket người dùng dán trong chat ngày20/11/2026. Bản trích triển khai này ghi các yêu cầu bắt buộc và cách nghiệm thu; xem ADR-003 cho quyết định/giả định.

| Phạm vi | Tiêu chí nghiệm thu | Kiểm chứng |
|---|---|---|
| Dầu | Max100, sáng/relight nạp100; hao1/s; refuel mỗi mote10, làm tròn ceil số cần; đầy thì không được chọn | Unit biên0/30/100, scenario refuel/expiry |
| Tắt/thắp lại | Fuel≤0 tắt ngay sau bước2, deposited0, ever_lit giữ true; relight cần5; event relight boolean, out đúng1 lần | Unit+CLI |
| Drain | Chỉ wander chọn weak<30 gần nhất theo ID; chase giữ hành vi; drain trong2m hút5/s cộng dồn, thoát theo6m/target/stun | Unit+scenario drain, multi-drain, pulse |
| Safe zone | Fuel=30 có, dưới30 mất; refuel≥30 đẩy ra trong≤30tick, không hit trong lúc đẩy | Exact-units unit+scenario |
| Thắng | Thời lượng240/270/300; không thắng sớm; tại bình minh sống và đủ3/5,4/6,5/7; no_flames ưu tiên | Dawn-boundary unit+CLI cả3 đêm |
| Capacity | 10+2×successful_lights, max20; cả relight, reset mỗi đêm; setup không tính | Unit+campaign+HUD |
| Điểm | Mote nạp/refuel5; first100/relight40; pulse5 hoặc tổng15 nếu drain trước pulse; thắng:50+floor(fuel) mỗi đèn sáng,50/lửa; không thời gian | Unit exact totals |
| Mù màu | Lưu setting; rim/eyes #00B3FF; cảnh báo trắng và⚠; đèn tắt xẹp20%+rách, weak nhấp nháy1Hz và fuel bar | Browser+settings unit |
| Contract | v1.2/tuning mới; fuel1decimal/ever_lit/relit_count/capacity/drain; scenario fields; events mới | CLI validation+determinism |
| Bàn giao | ADR, breaking changelog, regression còn hiệu lực, evidence thật | npm run verify, browser, review diff |

Ban đầu người dùng yêu cầu giữ thay đổi không commit. Sau bàn giao local, người dùng chỉ thị commit/push ba phase và gắn tag tương ứng; đây là ủy quyền hiện tại thay thế yêu cầu trước. Phase4 chưa được cung cấp.
