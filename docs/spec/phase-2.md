# Phase 2 — kế hoạch nghiệm thu Ticket-02

Nguồn chính thức do người dùng cung cấp: [TICKET-02.txt](TICKET-02.txt). Contract 1.1 thay thế các giả định Phase 1 mâu thuẫn với ticket. Bản Phase 1 được giữ ở commit local `80da52e`, bằng chứng không bị ghi đè; đây không phải tag nộp bài.

| Phạm vi | Acceptance criteria | Kiểm chứng dự kiến |
|---|---|---|
| Chuẩn hóa | Tuning đúng ticket; tick 60 Hz, thứ tự xử lý đúng; pickup có chênh cao; điểm cộng khi nạp; ưu tiên no_flames→all_lit→dawn | Unit + CLI regression |
| Lướt | 14m/s, 12 tick, cooldown 90 tick từ lúc bắt đầu; hướng di chuyển/facing; không đổi Y trên không; không miễn thương | Scenario dash + unit |
| Ba bản đồ | Đúng đảo, cầu, tọa độ đèn/mote/spawn; vách tầng chặn bước lên, dốc và bục nhảy đưa tới tầng/đảo đích; tháp chặn | Surface/physics unit + ảnh mỗi đêm |
| Gió Lạc | Có state machine idle/chase/flee/removed; cướp một lần; pulse đuổi hoặc trả đom đóm; không trừ lửa; spawn mỗi 1200 tick | Scenario drifter + unit |
| Bùa Gió | Pickup/refresh 600 tick; chạy 7.2m/s; dash bỏ cooldown nhưng không re-dash khi đang lướt; hồi sau 2700 tick | Scenario charm + unit |
| Chuỗi ba Đêm | Menu→giới thiệu→chơi→kết quả→đêm tiếp; hồi đầy lửa đầu đêm; thua retry đúng đêm; thắng đêm 3 hiện Bình Minh và tổng điểm | Browser + campaign unit |
| Pause/cài đặt | Esc/P; pause đóng băng sim/time/timer/spawn/TTL nhưng wall tick tăng; menu đủ nút; volume/sensitivity lưu lại | Scenario pause + browser/localStorage |
| Âm thanh | Nhạc nền và đủ âm sự kiện theo ticket; volume/mute sử dụng được | Code + browser; ghi rõ giới hạn nghe nếu chưa kiểm chứng |
| HUD/màu | Vị trí HUD, 10 ô, cooldown, nhắc E, mũi tên đèn ngoài màn; timer đỏ nhấp nháy ≤30s; màu và ambient đúng | Browser 1280×720 + source constants |
| Contract | --night 1/2/3, snapshot/override/event mới; malformed input exit2; deterministic | CLI tests + byte comparison |
| Hiệu năng | Headless 21600 bước ≤30s; GUI FPS trung bình ≥30 ở1280×720 | Chạy đo thật, không suy ra FPS từ unit |

Không tắt test cũ âm thầm: chuyển các assertion mâu thuẫn sang luật ticket, ghi tại `docs/notes/phase-2.md`. Không sửa output bằng tay. Chỉ tag nộp sau review của học viên và xác nhận hạn thực tế.
