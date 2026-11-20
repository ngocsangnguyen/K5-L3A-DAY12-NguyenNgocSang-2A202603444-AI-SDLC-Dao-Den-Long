# Phase 1 — PRD-0 và Test Contract v1.0

Nguồn: https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW ; nội dung Phase 1 được người dùng cung cấp trực tiếp trong chat ngày 20/11/2026, đồng thời đã đối chiếu nội dung hiển thị trên lab board. Phase 2–4 đang khóa tại lần đọc. Đây là bản ghi yêu cầu phục vụ triển khai, không thay thế tài liệu của giảng viên.

## Sản phẩm

- Game 3D, một màn **Đêm 1 – Đảo Bến**, đảo tròn có **5 Đèn Lồng Lớn**.
- Mây đi lại, nhảy, có camera 3D; đội nón lá treo một chiếc đèn nhỏ.
- Nhặt đom đóm rải rác, mang về nạp vào đèn.
- Bóng Mực xuất hiện, đuổi Mây, chạm làm mất máu; sợ đèn. Mây tỏa sáng tốn ánh sáng để xua Bóng Mực.
- Thắp hết đèn: thắng. Hết máu: thua. Có điểm, HUD, chơi lại.
- Đêm ấm áp cổ tích; vàng cam là tốt, tím đen là nguy hiểm; đảo sáng dần khi thắp đèn; không máu me.
- Chạy trên macOS/Linux bằng bản web. Cài và chạy tối đa 3 lệnh.

## Contract bắt buộc

- Có `game.contract.json` ở gốc: `contract_version`, `team`, `build_cmd`, `run_cmd`, `headless_cmd`, toàn bộ `tuning` trong đề. Khai báo đúng số game thực sự sử dụng; mục không có dùng null/false và giải thích.
- CLI: `<headless_cmd> --seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]`; mặc định snapshot mỗi 10 tick.
- Fixed step 60 Hz, không cửa sổ/GPU, chạy nhanh nhất có thể. Dừng đủ N bước hoặc kết thúc game; thành công exit 0. File scenario/inputs sai định dạng exit 2 và stderr. Lỗi khác exit khác 0.
- Đơn vị mét, Y hướng lên, đất Y=0, chân người chơi mặc định [0,0,0]. Khoảng cách đo XZ, bao gồm biên `distance <= radius`; không cộng kích thước nhân vật.
- Snapshot 0 là sau setup trước input. Bước k nhận input k, tạo trạng thái và sự kiện tick k+1. `sim_tick = tick`. `time_left_s = thời lượng ban đầu - số bước / 60`.
- Inputs `{frames:[{tick,move,cam_yaw_deg,jump,interact,pulse,dash?}]}`: tick tăng nghiêm ngặt; move mỗi thành phần [-1,1], chuẩn hóa nếu độ dài >1; mặc định move [0,0], yaw 0, nút false. Field vắng giữ giá trị cũ. Nút chỉ kích hoạt ở cạnh false→true.
- Với θ = yaw: `x'=x*cosθ+z*sinθ`, `z'=-x*sinθ+z*cosθ`.
- Scenario có thể override `player.pos/carried/flames`, `time_left_s`, `random_motes/random_shades`, `motes`, `shades`, `lanterns`.
- `motes` và `shades` thay thế danh sách, kể cả []; shade được đặt hoạt động ngay, có thể mang id. random false tắt sinh mặc định. Field thiếu dùng mặc định.
- `lanterns` cập nhật theo id L1…L5, không thay toàn bộ danh sách; có thể đổi pos/deposited/lit. Setup không phát event, không cộng điểm.
- JSONL gồm snapshot, event và bắt buộc một end cuối. Snapshot: type/tick/sim_tick/state/time_left_s/score/player/lanterns/shades/motes_active; bổ sung motes (khuyến nghị). Tọa độ làm tròn 3 chữ số. state playing/won/lost; shade tối thiểu có stunned.
- Event bắt buộc khi xảy ra:
  - `mote_picked`: `{carried}`
  - `deposit`: `{lantern_id,amount,deposited}`
  - `lantern_lit`: `{lantern_id}`
  - `pulse`: `{stunned_ids}`
  - `player_hit`: `{by:"shade"|"fall",flames,dropped}`
  - `shade_spawned`: `{id}` (nếu spawn xảy ra trong gameplay)
  - `game_over`: `{result:"won"|"lost",reason:"all_lit"|"dawn"|"no_flames"}`
- End: `{type:"end",ticks,state,score}`. Cùng seed/scenario/inputs phải byte-identical, kể cả id.
- Bóng Mực ban đầu thuộc setup nên không có `shade_spawned` tại tick 0. Phase 1 của bản này không sinh thêm Bóng Mực giữa đêm và không có phạt rơi.

## Nghiệm thu và bàn giao

Chơi được từ đầu tới thắng/thua và chơi lại; đúng contract; bằng chứng thật; giả định và nhật ký AI; harness còn trong repo; tag `phase-1` trỏ đúng bản đã kiểm chứng trên GitHub trước mốc 1 giờ theo lịch Coach.
