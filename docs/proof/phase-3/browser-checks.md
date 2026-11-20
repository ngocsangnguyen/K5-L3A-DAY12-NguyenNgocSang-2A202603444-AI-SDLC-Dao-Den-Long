# Browser checks — 20/11/2026

Local `http://localhost:4173`, IAB Chromium157 trên Windows; GUI dùng Game chung với CLI. Không sửa biến gameplay bằng devtools. Tương tác qua nút/phím thật; đọc DOM/FPS report chỉ để quan sát.

|Kiểm tra|Quan sát thực tế|
|---|---|
|Minh họa có nhãn|Intro30s và banner “không tính vào hành trình”; retry mở lại đúng minh họa|
|Châm dầu|E tại L1: dùng2, toast100.0 dầu, điểm10; thanh dầu giảm sau đó|
|Thắp lại/sức chứa|Đi tới L2, E dùng5, thêm65 điểm; tổng75; HUD5/12, hai hàng ô|
|Tắt và dấu hiệu phi màu|L3 hết dầu sau vài tick, hiển thị thắp lại0/5; giấy tối/xẹp, có vết rách|
|Dầu yếu|L4 có⚠, thanh dầu yếu; computed animation fuel-warning duration1s; mất vòng an toàn, sau đó tắt|
|Bảng màu dễ phân biệt|Bật trong Cài đặt, reload rồi mở lại vẫn checked; Bóng Mực mắt/viền xanh, timer/dầu cảnh báo trắng⚠. Ảnh settings.jpg|
|Hành trình thường|Intro Đêm1/2/3 lần lượt4/4.5/5phút, ngưỡng3/5,4/6,5/7; vào được cả3 màn. Không nhầm tutorial thành màn thường|
|Pause/retry/menu|Mở pause/settings, resume, retry minh họa và về menu qua UI; core test riêng xác nhận timer/dầu đứng yên|
|Responsive|390×844: home và HUD12 ô/các nút cảm ứng; chỉnh hint lên cao để tách khỏi túi/dash. 1280×720 chụp lại sau chỉnh|
|Console|Đọc warn/error trên mẫu kiểm thử: mảng rỗng|

[browser-fps.json](browser-fps.json): số đo mới Phase3, viewport1280×720, pixel ratio1, bật bảng màu dễ phân biệt. Mỗi Đêm thường đo cảnh đầu với2s warmup và10s lấy mẫu, giữ Shift khi đứng yên; số liệu từ bộ đếm render trong UI:

|Đêm|Frames|Thời gian mẫu|FPS trung bình|Draw calls|
|---|---|---|---|---|
|1|473|10.0084s|47.26|38|
|2|376|10.0252s|37.51|41|
|3|501|10.0085s|50.06|39|

Đây là mẫu local tại thời điểm đo; tải máy thay đổi, không phải bảo đảm mọi cảnh/máy. Benchmark CPU là phép đo riêng. Không tuyên bố chơi thắng ba Đêm mặc định hoặc kiểm tra toàn bộ âm thanh chỉ từ các mẫu này. Sau kiểm tra đã trả viewport mặc định và về menu.
