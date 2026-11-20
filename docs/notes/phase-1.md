# Phase 1 — quyết định và giả định

## Kiến trúc

Node.js ESM và Three.js; logic thuần trong `src/core/`, browser và CLI gọi cùng `Game`. Tuning đọc trực tiếp `game.contract.json`. Random gameplay dùng Mulberry32 có seed. Hiệu ứng dùng RNG riêng, không tiêu thụ chuỗi của logic. Build là web tĩnh có vendor local, không cần CDN khi chơi.

## Những chỗ PRD để tự quyết

- 300 giây; 3 ngọn lửa; sức chứa 12; cần 6 đom đóm mỗi đèn. Tốc độ, bán kính, cooldown và điểm số khai báo trong contract.
- Mặc định 70 đom đóm và 3 Bóng Mực xuất hiện ngay khi dựng màn. Không tái sinh trong Phase 1. Random false hoặc mảng scenario thay thế tắt danh sách tương ứng.
- Interact nạp tối đa số còn thiếu vào đèn chưa sáng gần nhất trong bán kính. Nạp một phần được; bấm lại phải thả nút trước.
- Tỏa sáng cần 3 đom đóm, tốn ngay cả khi không trúng; đẩy theo hướng ra xa, làm choáng 3 giây. Có thể làm choáng lại sau cooldown; mỗi shade trúng mỗi lần được cộng `per_stun`.
- Va chạm làm mất 1 lửa, làm mất `floor(carried * hit_drop_ratio)` đom đóm. Phần rơi mất khỏi inventory, không sinh lại để tránh nhặt lại ngay; PRD chưa quy định phải nhặt lại được. Miễn thương 1.5 giây tính bằng tick.
- Đèn đã sáng tạo vùng an toàn. Bóng Mực bị đẩy ra ngoài bán kính an toàn; Mây ở đúng biên vùng sáng cũng được bảo vệ.
- Nhảy vận tốc đầu 7 m/s, trọng lực 18 m/s², tiếp đất Y=0. Phím giữ không tự nhảy tiếp. Khoảng cách gameplay luôn đo XZ theo contract, kể cả đang nhảy.
- Đảo tròn bán kính 23m có biên chặn, không có phạt rơi (`fall_enabled:false`). Scenario có thể đặt đối tượng ngoài vùng đảo để kiểm tra; nhân vật bắt đầu ngoài biên vẫn di chuyển được.
- Thứ tự tick: movement/jump → nhặt → nạp → tỏa sáng → kiểm tra đủ đèn → di chuyển/va chạm shade → kiểm tra hết lửa/bình minh. Thắp đèn cuối cùng kết thúc thắng ngay trước va chạm trong cùng tick.
- Điểm: 10/đom đóm nhặt được, 100/đèn thắp, 20/shade làm choáng. Khi thắng cộng `floor(time_left_s)*2 + flames*50`. Setup không được điểm; khi thua không có bonus.
- Tạm dừng là tiện ích UI: không gọi step, đồng hồ không trôi. Không bổ sung nút pause vào contract Phase 1.
- CLI ghi thêm snapshot kết thúc nếu tick cuối không chia hết cho snapshot-every để có thể kiểm tra trạng thái cuối, sau đó end bắt buộc.

## Trạng thái

Chỉ triển khai Phase 1 đã phát hành. Không tạo giả Ticket-02/03/04; không gắn tag phase sau. Kết quả kiểm chứng thật trong `docs/proof/phase-1/`. Review độc lập và test ẩn của giảng viên chưa được chạy bởi bộ test này.
