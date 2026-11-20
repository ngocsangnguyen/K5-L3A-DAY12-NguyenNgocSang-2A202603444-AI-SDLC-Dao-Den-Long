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
