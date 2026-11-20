# Phase 2 — thay đổi yêu cầu và quyết định

## Luật cũ được thay theo Ticket-02

- Túi 12→10; chi phí đèn6→10; pickup1.2→1 kèm chênh cao≤1.5; interact2.4→2.
- Pulse XZ/tức thời→bán kính3D từ chân+.8, choáng120 tick, đẩy4m trong15 tick; cooldown72→180 tick.
- 70 motes rải ngẫu nhiên/3 shade ban đầu→20 motes tại điểm chuẩn và spawn theo lịch; shade bắt đầu sinh tick300.
- Đảo23m có biên chặn→đảo40m có rơi; thêm Đảo Cau/Đảo Chuông.
- Điểm pickup→điểm deposit; per_stun20→5. Hết lửa ưu tiên hơn thắng cùng tick.
- Motes bị hit biến mất→rơi thành thực thể có TTL480 và nhặt từ tick sau.
- Pause chỉ UI→pause ở simulation với wall tick và sim_tick riêng.
- Test cho các luật này được cập nhật thay thế; bản test Phase1 nguyên gốc vẫn có trong commit80da52e.

## Giả định khi ticket không nói rõ

- Tick tạo scenario không phát event/điểm; `night_start` ở bước gameplay đầu tiên.
- Spawn shade có state `spawning` 1 tick, chỉ hoạt động ở tick sau; scenario shade mặc định chase ngay.
- Wander shade tốc độ1.2m/s, hướng seeded; Gió Lạc idle2m/s. Không thêm luật sát thương mới.
- Bùa scenario nhận respawn_ticks hoặc respawn_s. Drifter scenario nhận state_ticks_left. Motes nhận vị trí triple như v1.0; hỗ trợ object id/pos/kind/ttl_s cho thử TTL.
- Mỗi frame pause chỉ kích hoạt theo cạnh. Khi resume bước đó tiếp tục gameplay; các frame trong pause vẫn cập nhật trạng thái nút.
- Biên tầng là vật rắn: không bước xuyên dưới một tầng cao hơn; rơi từ mép tầng xuống thấp hơn được phép. Nhân vật không leo tháp chuông.
- Không thêm API/network/CDN. Settings chỉ lưu trong localStorage của trình duyệt này.
- Ticket không nêu điểm xuất phát Đêm 3. Chọn (0,0,-30) ở tầng0, tránh đặt Mây ở trong khối tầng2/tháp tại gốc. Đêm1/2 giữ (0,0,0); scenario luôn ghi đè được. Đây là giả định cần đối chiếu với Coach nếu có giải thích khác; không nhận là tọa độ chính thức của ticket.
- Người dùng đã xác nhận Coach không có bổ sung về điểm xuất phát. Tiếp tục dùng giả định trên và giữ nguyên ghi chú để đối chiếu nếu ticket sau thay đổi.

Kết quả thực thi và các giới hạn sẽ được cập nhật sau kiểm chứng, không coi kế hoạch là kết quả.

## Kết quả Phase 2 hiện có

- Unit/CLI/campaign/settings và scenario headless đã có; kết quả cuối xem verification.json.
- Night1 default bot gửi input công khai đã thắng, có CLI replay; terminal thắng các đêm2/3 có fixture. Chưa chơi tay thắng cả chuỗi GUI.
- GUI đã quan sát ba map, intro, thua/retry đúng đêm3, đi tới pad và đáp đảo B, settings persist và mobile. FPS10s đầu đêm1280×720 vượt30 ở cả ba lượt đo sau tối ưu.
- `player.invuln` trong snapshot là boolean; thêm invuln_s chỉ để người đọc biết thời gian. Motes random TTL null vì không tự biến mất.
- Spawn Đêm3 và trạng thái/duration không được mô tả đầy đủ trong ticket vẫn là giả định, không giả làm thông tin giảng viên.
