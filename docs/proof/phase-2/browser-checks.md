# Kiểm tra browser Phase 2 — 20/11/2026

Thực hiện trên máy Windows hiện tại qua trình duyệt in-app, source phục vụ tại localhost:4173. Desktop1280×720, pixel ratio1; portrait390×844. Không điều khiển hoặc thay đổi state simulation qua console.

- Mở menu; chọn lần lượt Đảo Bến/Cau/Chuông. Intro có tên đêm, lời Ông Đăng và mục tiêu5/6/7 đèn. Timer đầu đêm05:00/05:30/06:00.
- Chơi thật, nhấn Shift: lướt được. HUD có3 lửa trên trái, timer giữa, đèn/điểm phải,10 ô dưới giữa và cooldown dưới phải. Mũi tên tới đèn ngoài màn xuất hiện.
- Đêm2: từ xuất phát di chuyển bằng D/S tới bục(20,0,18); quan sát Mây được phóng và đáp sang đảo B. Ảnh `pad-flight.jpg`, `island-2-arrival.jpg` cho thấy cầu nằm phía sau và Mây trên đảo bên kia. Mô phỏng chính xác còn được kiểm tra bằng scenario.
- Quan sát thua thật khi đứng yên Đêm3; bấm Thử lại Đêm này → intro vẫn là Đảo Chuông, bắt đầu với3 lửa và06:00. Ảnh `loss-night3.jpg`.
- P/nút pause mở đủ Tiếp tục/Chơi lại Đêm/Cài đặt/Về menu. Mở settings, đổi volume100%, sensitivity2.5×, bật âm thanh, lưu; reload và mở lại thấy đúng các giá trị. Sau thử nghiệm tắt âm thanh lại trong tab kiểm chứng. Không nhận là đã đánh giá chất lượng nghe toàn bộ nhạc/SFX.
- Portrait390×844: HUD và10 ô không tràn; bấm nút Lướt trên màn hình làm cooldown chuyển1.3s; xem `mobile.jpg`. Menu và nút chọn đảo vẫn dùng được.
- Các lượt cuối đọc console warn/error trả `[]`.

## FPS

Lượt rolling trước tối ưu xuống25.72FPS, giữ lại trong `browser-fps.json`. Sửa bằng instancing đom đóm/quầng và khung đèn; giảm xuống38–41 draw call trong những cảnh đã đo. Sau warm-up2s, đo mean qua10s thực, khóa kết quả mỗi lượt để không trộn các khoảng ngừng kiểm tra UI:

| Đêm | Frames | Thời gian mẫu | FPS trung bình |
|---|---:|---:|---:|
| 1 |590|10.0084s|58.9505|
| 2 |489|10.0084s|48.8590|
| 3 |308|10.0083s|30.7745|

Đây là các cảnh đầu đêm trong môi trường/máy hiện tại, không phải stress test cả đêm hoặc bảo đảm cùng FPS trên mọi máy. Kết quả đầy đủ chứa user agent, viewport, độ phân giải và draw calls ở `browser-fps.json`.

## Giới hạn

Chưa chơi thủ công từ đầu tới thắng cả3 đêm trong GUI; phần tổng điểm/chuyển đêm có unit test, terminal thắng có CLI scenario. Cảnh gió/cướp/bùa có scenario mô phỏng, không nhận là tất cả đã được quan sát bằng mắt. Điểm xuất phát Đêm3 là giả định đã ghi trong notes, cần đối chiếu Coach nếu có thông báo bổ sung.
