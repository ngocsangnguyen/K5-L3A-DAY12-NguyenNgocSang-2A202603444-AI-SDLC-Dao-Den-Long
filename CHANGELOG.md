# Changelog

## 0.3.0 — Phase 3 / Contract 1.2

### Breaking changes

- Bỏ thắng ngay khi thắp hết đèn. Tại bình minh cần còn sống và sáng3/5,4/6,5/7 đèn. `all_lit` thay bằng `dawn_survived`; `no_flames` ưu tiên kể cả tick cuối.
- Thời lượng300/330/360 đổi thành240/270/300 giây.
- Đèn có dầu100, hao1/s, châm10/đom đóm. Cạn dầu tắt/reset deposited; thắp lại tốn5, thắp mới10. Snapshot/scenario thêm fuel, ever_lit, relit_count; lantern_lit thêm relight. Thêm refuel, lantern_out, fuel_drain.
- Safe zone chỉ khi dầu≥30. Wander ưu tiên đèn yếu, drain hút5/s/con. Pulse lên drain cho tổng15 điểm.
- Túi10 tăng2 mỗi lần thắp thành công, tối đa20. Snapshot thêm capacity, scenario thêm successful_lights.
- Điểm: nạp/châm5/con, thắp100/thắp lại40, pulse5 hoặc15; thắng thưởng mỗi đèn50+floor(dầu), mỗi lửa50. Bỏ thưởng thời gian.
- Cập nhật test mâu thuẫn có lý do trong ADR; không skip. Xóa bot `scripts/playtest.mjs` vì chỉ nhắm thắng sớm và có thể ghi đè proof Phase2. Thay bằng28 replay mới, gồm3 tình huống dựng sẵn duy trì đủ Đêm. Giữ nguyên proof/replay lịch sử.

### Giao diện và bàn giao

- Thanh dầu/cảnh báo1Hz, đèn tắt xẹp20%/rách giấy, HUD sức chứa động.
- Cài đặt lưu “Bảng màu dễ phân biệt”: mắt/viền xanh#00B3FF, cảnh báo trắng kèm⚠.
- Minh họa30s riêng, không tính vào hành trình hoặc thay headless mặc định.
- ADR: `docs/adr/003-fuel-and-dawn.md`; proof mới: `docs/proof/phase-3/`.
- Ban đầu giữ working tree theo yêu cầu không commit; sau kiểm chứng người dùng cho phép commit/push và gắn ba tag phase tương ứng. Không đổi lịch sử Phase1/2 hoặc backdate tag.

## 0.2.0 — Phase 2 / Ticket-02

- Contract1.1 và bộ thông số chuẩn, thứ tự tick, pause wall/sim, spawn/TTL, scoring mới.
- Ba bản đồ; dash; rơi/hồi sinh; dốc/vách/bục nhảy; gió; Gió Lạc và Bùa Gió.
- Hành trình ba đêm, lời Ông Đăng, retry đúng đêm, settings lưu local, HUD chuẩn, âm thanh tổng hợp.
- Instanced rendering giảm draw calls; có đo FPS1280×720 và benchmark headless.
- Giữ bằng chứng/source Phase1; cập nhật harness và test thay luật có lý do.

## 0.1.0 — Phase 1 / PRD-0

- Màn Đảo Bến3D, gameplay5 đèn và Contract1.0; kiểm chứng và bằng chứng ban đầu.
- Bản lưu local tại commit80da52e, không phải tag nộp trên GitHub.
