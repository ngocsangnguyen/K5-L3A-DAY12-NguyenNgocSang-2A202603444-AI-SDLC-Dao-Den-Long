# Kiểm tra trình duyệt — 20/11/2026

Thực hiện qua trình duyệt in-app trên máy Windows, phục vụ source bằng `node scripts/serve.mjs` tại localhost:4173. Kiểm tra desktop viewport 1440×900, portrait 390×844 và màn preview hẹp. Ảnh là screenshot thật từ trang đang chạy, không dựng lại.

| Kiểm tra | Quan sát thật | Bằng chứng |
|---|---|---|
| Trang đầu và scene 3D | Hiện đảo, 5 đèn, cây/mây/đom đóm, nút bắt đầu; chữ Việt hiển thị đúng sau chuyển sang font hệ thống | `home-desktop.jpg`, `home-mobile.jpg` |
| Bắt đầu, WASD, nhặt đom đóm | Giữ S: HUD tăng từ 0 lên 2 rồi 3 đom đóm; điểm lên 30 | `gameplay-desktop.jpg` và snapshot trình duyệt trong phiên kiểm tra |
| Nhảy | Nhấn Space khi chơi; logic nhảy/tiếp đất được xác minh bằng unit test, thao tác GUI không phát sinh lỗi | `tests/core.test.mjs`; không dùng ảnh tĩnh để khẳng định toàn bộ chuyển động |
| Tỏa sáng | Nhấn Q khi có 3 đom đóm: còn 0, HUD chuyển sang hồi chiêu | `gameplay-desktop.jpg` |
| Tạm dừng bằng nút và Esc | Hiện dialog, timer giữ nguyên `04:56` qua hai lần đọc trước/sau screenshot | `pause-desktop.jpg` |
| Thua do hết lửa | Chơi lại, đứng yên để Bóng Mực đuổi tới, game thật mất lửa và hiện kết thúc thua | `loss-desktop.jpg` |
| Chơi lại sau thua | Bấm Một hành trình nữa: 3 lửa, 0 đèn, 0 đom đóm và thời gian 05:00 | Snapshot trình duyệt; `gameplay-mobile.jpg` chụp ngay sau đó |
| Portrait và hướng dẫn | Nút cảm ứng xuất hiện, HUD và dialog đọc được; mở/đóng hướng dẫn, về trang đầu hoạt động | `gameplay-mobile.jpg`, `help-mobile.jpg`, `home-mobile.jpg` |
| Console | Không có warn/error ở các lượt cuối sau sửa PCFShadowMap | Đọc `tab.dev.logs({levels:['warn','error']})` trả [] |

Giới hạn: chưa chơi thủ công tới thắng trong GUI. Logic thắng được chứng minh bằng unit test và replay màn mặc định qua CLI, không coi đó là bằng chứng đã quan sát dialog thắng bằng mắt. Âm thanh được lập trình opt-in nhưng chưa đánh giá chất lượng nghe. Chưa đo FPS GPU hoặc xác nhận CI macOS/Linux đã chạy.
