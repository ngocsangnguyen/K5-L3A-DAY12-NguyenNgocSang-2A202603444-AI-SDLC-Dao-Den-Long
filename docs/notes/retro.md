# Retro tạm thời — sau bản Phase 1

- Hiệu quả: đọc contract trước, tách logic/hiển thị, dùng test CLI để kiểm tra tick và format giúp phát hiện lỗi sớm. Các quy tắc mơ hồ được ghi trong notes thay vì ngầm quyết định.
- Điều chưa hiệu quả: lần thử đọc lab board ban đầu chỉ xem AX ngoài iframe nên tưởng bị chặn đăng nhập. Đọc DOM snapshot mở rộng iframe lấy được spec. Cần kiểm tra nội dung iframe trước khi kết luận thiếu yêu cầu.
- Lỗi implementation và cách phát hiện được ghi tại `ai-log.md`; sửa code ở nguồn thay vì chỉ thêm prompt.
- Số liệu thực thi: xem `docs/proof/phase-1/verification.json` và `benchmark.json`; không chép số test/hiệu năng vào đây để tránh cũ khi code thay đổi.
- Nếu làm lại: kiểm tra quyền mạng ngay đầu buổi, dành thêm thời gian chơi thử và điều chỉnh cảm giác camera; giữ nguyên một nguồn tuning.
- Giới hạn: chưa thể đánh giá thay đổi yêu cầu giữa bốn phase khi các ticket sau chưa được công bố. CI macOS/Linux chưa có kết quả GitHub trong phiên này; test ẩn chưa biết; usage token chưa có thống kê.
