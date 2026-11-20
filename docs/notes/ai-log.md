# Nhật ký dùng AI

## Phase 1 — 20/11/2026

- Công cụ: OpenAI Codex; thư viện đồ họa Three.js. Không dùng repo của học viên khác.
- Yêu cầu: đọc sáu tài liệu lab, lập việc cần làm; người dùng tiếp tục yêu cầu triển khai và cung cấp đầy đủ PRD-0/Test Contract v1.0 trong chat.
- Đã đọc lab board bằng trình duyệt. Nội dung iframe có đọc được dù trang ngoài hiện thông báo đăng nhập. Phase 2–4 đang khóa tại lần đọc.
- Trước khi có spec, chỉ dựng kế hoạch; gameplay thực tế triển khai theo PRD-0 và contract đã đọc.
- Quyết định tiết kiệm: một module logic dùng chung; không engine build nặng; asset tạo bằng geometry/code; một dependency; test logic/CLI trước khi kiểm tra giao diện.
- Lỗi đã phát hiện: sandbox không truy cập npm; dùng quyền mạng cho cài dependency. Server Windows trả 403 do root có dấu phân cách cuối; chuẩn hóa đường dẫn trước khi so prefix. Three.js 0.187 cảnh báo PCFSoftShadowMap bị bỏ; đổi sang PCFShadowMap. Ground bị tối do nhân màu material với vertex colors hai lần; đổi base material thành trắng.
- Cách phát hiện: chạy npm thật, mở bản web thật, đọc console, kiểm tra ảnh; không dựa vào nhận xét của agent.
- Harness: AGENTS.md + skill verify-game + npm verify + GitHub Actions Linux/macOS + hook pre-commit có thể bật bằng `git config core.hooksPath .githooks`.
- Token/chi phí: giao diện phiên làm việc không cung cấp số usage hoặc hóa đơn kiểm chứng được. Chưa có số liệu để báo cáo; không tự bịa ước tính chính xác. Học viên cần bổ sung ước tính từ thống kê tài khoản trước khi nộp, kèm ghi rõ đây là ước tính.

## Phase 2–4

Chưa có ticket được phát hành/cung cấp, chưa có usage hay kết quả để ghi.

## Phase 2 — 20/11/2026

- Người dùng cung cấp Ticket-02 đầy đủ trong file đính kèm; giữ nguyên tại docs/spec/TICKET-02.txt.
- Lưu bản Phase1 vào commit local80da52e trước khi thay luật; không tag giả hoặc đẩy GitHub trước review.
- Viết acceptance criteria và delta trước thay đổi; mở rộng module logic dùng chung, levels, campaign và settings; cập nhật AGENTS/skill/CI.
- Lỗi phát hiện qua test: shade trùng vị trí chọn hướng mặc định khiến đi lệch và gây hit ở mép đèn; bảo vệ điểm người chơi nằm trong safe area, chặn overshoot. Test bước khỏi tầng ban đầu vô tình đứng trên bục nhảy; chuyển fixture khỏi pad để kiểm tra đúng hành vi rơi.
- Kiểm tra lại recoil cho thấy timer giảm trước movement làm thiếu1 bước đẩy; sửa bước hết timer và thêm test đo đúng2m/60tick.
- GUI đo rolling trước tối ưu xuống25.72FPS. Gom core/quầng motes và cấu kiện khung đèn bằng instancing, còn38–41 drawcalls trong mẫu; ba cửa sổ10s đạt58.95/48.86/30.77FPS. Giữ cả số đo lỗi ban đầu.
- Bot mặc định cũ thua vì không dùng dash và tiêu pulse quá sớm. Sửa chiến lược input, không sửa luật game: bot thắng Đêm1 với5 đèn,2 lửa, không override scenario. Lưu input và replay CLI, không nhận là đã chơi thủ công thắng GUI.
- Bằng chứng scope rõ: UI pad sang đảo B, retry đúng Đêm3, settings persist, mobile, console; nhiều tính năng khác có scenario/unit thay vì tuyên bố đã xem mọi tình huống bằng mắt.
- Token/chi phí: chưa có thống kê usage kiểm chứng được từ phiên desktop. Học viên cần bổ sung ước tính từ tài khoản trước nộp; không tự bịa số. Giữ1 dependency, không gọi dịch vụ tài sản/media ngoài và không spawn subagent.
