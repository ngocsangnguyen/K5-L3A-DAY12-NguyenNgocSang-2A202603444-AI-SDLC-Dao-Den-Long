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

## Phạm vi ticket

Đã nhận Ticket02 và Ticket03. Chưa có Ticket04; không tự tạo yêu cầu/kết quả Phase4.

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

## Phase 3 — 20/11/2026

- Nhận Ticket03 trực tiếp trong chat. Người dùng yêu cầu không commit file: không stage/commit/tag/push; giữ HEAD31ea99c. Không tạo subagent hoặc dependency mới.
- Áp dụng skill verify-game; viết spec và ADR003, dùng fuel nguyên1/60, capacity suy ra successful_lights, đổi điều kiện cuối Đêm và điểm ở Game dùng chung. UI đọc cùng helper nhận đèn/vùng an toàn.
- Cập nhật test cũ về điểm/thời lượng/thắng với lý do trong ADR; thêm25 test dầu/bình minh. Không skip. Xóa bot thắng sớm cũ để tránh ghi đè proof Phase2; thay bằng replay tình huống rõ nguồn.
- Test phát hiện preset lit bị dùng deposited5 theo giá relight: sửa mặc định deposited10 cho đèn preset lần đầu để giữ regression Phase2 còn hiệu lực. Strengthen test khoảng cách drain đúng biên6m. Dầu không dùng số xuất làm tròn để quyết định biên30.
- Browser thật xác nhận E châm2 con ở đèn85 dầu, điểm10; thắp lại5 con cho thêm65 điểm, túi12. Cài đặt màu giữ sau reload; mắt/viền xanh, cảnh báo trắng⚠. Đèn tắt xẹp/rách; dầu yếu có animation1s. Thấy hint sát túi/dash, chỉnh khoảng cách desktop/mobile và chụp lại.
- Đo FPS lại cả3 cảnh đầu Đêm ở1280×720, cửa sổ10s sau warmup2s, lưu rawreport riêng. Không dùng số CPU để suy FPS. Console mẫu không có warn/error. Có ảnh390×844 và minh họa được ghi rõ không phải default playthrough.
- `npm run verify`:61 test đạt,0 skip;28 scenario CLI mỗi cái chạy hai lần byte-identical, build và benchmark trọn ba Đêm đạt. Bằng chứng ghi riêng phase-3; không chỉnh phase-1/2.
- Usage/token/chi phí chưa có số liệu kiểm chứng được từ tài khoản; không tự bịa. Chưa chạy CI macOS/Linux/test ẩn, chưa chơi thủ công thắng trọn ba Đêm thường.

## Công bố ba phase — chỉ thị tiếp theo

- Người dùng yêu cầu “commit từng tag phase 1, 2, 3 lên”, thay thế yêu cầu không commit trước đó. Cập nhật harness/tài liệu hiện hành theo ủy quyền mới; không thay lịch sử ghi chép giai đoạn triển khai.
- Kiểm tra remote ban đầu: main9818fc1, chưa có tag. Phase1/2 đã có commit80da52e/31ea99c cùng proof passed, giữ nguyên để gắn đúng tag; Phase3 tạo commit mới sau kiểm chứng.
- Chỉ push tiến nhánh main và ba tag rõ tên; không force-push, không backdate. Đối chiếu ref GitHub sau push; không coi việc này là xác nhận hạn Coach hoặc hoàn thành nộp LMS.
