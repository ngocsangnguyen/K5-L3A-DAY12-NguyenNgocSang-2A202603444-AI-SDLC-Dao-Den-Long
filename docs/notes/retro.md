# Retro tạm thời — sau bản Phase 1

- Hiệu quả: đọc contract trước, tách logic/hiển thị, dùng test CLI để kiểm tra tick và format giúp phát hiện lỗi sớm. Các quy tắc mơ hồ được ghi trong notes thay vì ngầm quyết định.
- Điều chưa hiệu quả: lần thử đọc lab board ban đầu chỉ xem AX ngoài iframe nên tưởng bị chặn đăng nhập. Đọc DOM snapshot mở rộng iframe lấy được spec. Cần kiểm tra nội dung iframe trước khi kết luận thiếu yêu cầu.
- Lỗi implementation và cách phát hiện được ghi tại `ai-log.md`; sửa code ở nguồn thay vì chỉ thêm prompt.
- Số liệu thực thi: xem `docs/proof/phase-1/verification.json` và `benchmark.json`; không chép số test/hiệu năng vào đây để tránh cũ khi code thay đổi.
- Nếu làm lại: kiểm tra quyền mạng ngay đầu buổi, dành thêm thời gian chơi thử và điều chỉnh cảm giác camera; giữ nguyên một nguồn tuning.
- Giới hạn: chưa thể đánh giá thay đổi yêu cầu giữa bốn phase khi các ticket sau chưa được công bố. CI macOS/Linux chưa có kết quả GitHub trong phiên này; test ẩn chưa biết; usage token chưa có thống kê.

## Sau Phase 2

- Lưu baseline trước khi thay luật giúp giữ bằng chứng Phase1 đúng mã cũ; thay test mâu thuẫn với ticket kèm lý do, không cố giữ assertion lỗi thời.
- Cùng Game dùng cho browser/CLI giúp test được pause, timers, spawn, terrain, drifter/charm mà không cần GPU; có12 feature cases deterministic và replay màn mặc định.
- Số đo GUI thực tế quan trọng: test CPU xanh không phát hiện drawcall overhead. Instancing cải thiện FPS; mẫu Đêm3 sát ngưỡng hơn nên còn cần stress test dài khi Phase4 yêu cầu.
- Bot không phải người chơi: lần bot thua phản ánh cả chiến lược input yếu; cải thiện input thay vì đổi thông số chuẩn để làm test đạt.
- Cần review độc lập và bổ sung usage, CI trên OS đích, video/Release/tag đúng hạn. Không tự coi các việc đó hoàn thành từ kết quả local.

## Sau Phase 3

- Khi đổi luật cốt lõi, giữ test cũ có hiệu lực và thay assertion lỗi thời có lý do cụ thể; không skip để làm bộ test xanh. ADR/changelog giúp thấy rõ early-win, điểm và safe-zone đã bị thay.
- Dùng fuel nguyên và helper chung tránh sai biên30, ceil châm dầu, hoặc UI chọn khác core. Capacity suy ra count tránh lẫn số đèn đang sáng với số lần thắp.
- Tình huống minh họa30s giúp kiểm tra trực quan nhanh, nhưng phải tách điểm hành trình và ghi nhãn. Replay duy trì đủ Đêm dựng sẵn không thay cho kiểm chứng khả năng chơi thắng mặc định.
- Tăng túi ảnh hưởng bố cục dù chỉ là thay luật: screenshot thực tế phát hiện hint sát túi/dash; sửa rồi kiểm tra lại desktop/mobile. Hiệu năng cần đo lại, không sao chép số Phase2.
- Tôn trọng yêu cầu không commit trong giai đoạn triển khai; khi người dùng chỉ thị commit/push/tag sau đó, cập nhật chỉ dẫn và công bố đúng các commit phase đã kiểm chứng, không tự coi đã nộp LMS.
