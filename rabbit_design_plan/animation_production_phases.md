# Animation Production Phases

Tài liệu này chia nhỏ lộ trình vẽ toàn bộ các hoạt cảnh (animations) của Rabbit Companion thành từng giai đoạn (Phase). Việc này giúp ưu tiên những hoạt cảnh thiết yếu nhất để đưa app vào hoạt động (MVP), tránh tình trạng ngợp khối lượng công việc.

Mỗi hoạt cảnh yêu cầu:
- Kích thước: 64x64 pixel
- Số khung hình (Frames): 4~8 frames
- Background: Transparent (Trong suốt)

---

## Phase 1: MVP Core (Phiên bản đầu tiên)
*Mục tiêu: Đủ các trạng thái cơ bản nhất để app không bị nhàm chán khi user mới tải về. Tập trung vào 2 độ tuổi chính là Baby (Stage 1) và Bunny Child (Stage 4).*

### Stage 1: Baby Rabbit
- [x] `idle_breathe`: Thở nhẹ, chớp mắt, động đậy tai.
- [x] `sleep_normal`: Cuộn tròn ngủ.
- [x] `happy_jump`: Nhảy lên vui vẻ (khi user hoàn thành task).
- [x] `sad_sit`: Ngồi buồn thiu (khi user trễ task).
- [x] `eat_carrot`: Ngồi gặm cà rốt.

### Stage 4: Bunny Girl Child
- [x] `idle_breathe`: Thở nhẹ, chớp mắt.
- [x] `study_write`: Viết ghi chú chăm chỉ (Dùng khi user đang dùng focus timer).
- [x] `sleep_pillow`: Ôm gối ngủ bình yên.
- [x] `happy_clap`: Vỗ tay mỉm cười (Khi user hoàn thành task).
- [x] `welcome_back`: Vẫy tay chào khi user mở app.

---

## Phase 2: Daily Routine Expansion (Mở rộng hoạt động hàng ngày)
*Mục tiêu: Tăng độ phong phú cho các hoạt động hàng ngày của Stage 4 (Bunny Child) để user thấy thỏ có "cuộc sống riêng".*

### Buổi sáng & Thức dậy
- [ ] `wake_up_stretch`: Vươn vai ngái ngủ.
- [ ] `morning_tea`: Uống trà / sữa buổi sáng.
- [ ] `exercise_stretch`: Vươn vai tập thể dục.

### Học tập & Làm việc
- [ ] `study_laptop`: Gõ laptop tập trung.
- [ ] `read_floor`: Ngồi bệt đọc sách lật trang.
- [ ] `read_window`: Đọc sách bên cửa sổ.

### Thư giãn
- [ ] `relax_music`: Đeo tai nghe nhắm mắt nghe nhạc.
- [ ] `brush_hair`: Chải tóc.

### Cảm xúc bổ sung
- [ ] `proud_smile`: Chắp tay sau lưng cười tự hào.
- [ ] `embarrassed_blush`: Đỏ mặt quay đi.
- [ ] `sleepy_yawn`: Ngáp buồn ngủ.

---

## Phase 3: Evolution Stages Completion (Hoàn thiện các độ tuổi)
*Mục tiêu: Vẽ nốt các giai đoạn trưởng thành còn lại của thỏ.*

### Stage 0: Egg
- [ ] `egg_idle`: Trứng nằm yên.
- [ ] `egg_shake`: Trứng rung lắc.
- [ ] `egg_crack`: Nứt vỏ nở ra.

### Stage 2 & 3: Young & Spirit Rabbit
- [ ] `young_play`: Chơi đồ chơi / nhảy múa.
- [ ] `spirit_meditate`: Ngồi thiền tỏa hào quang.
- [ ] `spirit_read`: Đọc sách cổ.

### Stage 5: Teen Bunny Girl
- [ ] `teen_laptop`: Gõ laptop (dáng ngồi người lớn hơn).
- [ ] `teen_yoga`: Tập yoga.
- [ ] `teen_coffee`: Uống cà phê.

### Stage 6: Young Woman
- [ ] `woman_plan`: Ghi chép sổ kế hoạch.
- [ ] `woman_tea`: Thưởng trà thanh lịch.
- [ ] `woman_wave`: Mỉm cười vẫy tay nhẹ nhàng.

---

## Phase 4: Relationship & Streaks (Gắn kết & Kỷ niệm)
*Mục tiêu: Các hoạt cảnh đặc biệt xuất hiện khi đạt mốc chuỗi ngày (Streaks) hoặc phản ứng với sự vắng mặt của user.*

### Tương tác User
- [ ] `task_celebrate`: Tung hoa, nhảy cẫng lên.
- [ ] `inactive_alone`: Ngồi lủi thủi tưới hoa một mình.
- [ ] `return_cry`: Chạy tới khóc vì vui (khi user bỏ app lâu ngày quay lại).

### Mốc Streaks (Chỉ dùng cho Stage 4/5/6)
- [ ] `streak_30`: Ôm bó hoa.
- [ ] `streak_100`: Lật xem album ảnh kỷ niệm.
- [ ] `streak_365`: Bánh sinh nhật, thổi nến.
- [ ] `streak_1000`: Mặc váy lộng lẫy, pháo hoa phía sau.

---

## Phase 5: Seasons & Weather (Thời tiết & Lễ hội)
*Mục tiêu: Tạo cảm giác thời gian trôi qua thực tế.*

### Thời tiết
- [ ] `weather_rain`: Ngắm mưa bên cửa sổ.
- [ ] `weather_snow`: Đắp người tuyết.

### Lễ hội (Chỉ hiện trong ngày cụ thể)
- [ ] `season_spring`: Mặc váy hồng, hoa anh đào rơi.
- [ ] `season_autumn`: Khăn choàng, lá vàng rơi.
- [ ] `event_christmas`: Đội mũ Santa, ôm quà.
- [ ] `event_lunar_new_year`: Mặc trang phục truyền thống, cầm lì xì/lồng đèn.

---

## Phase 6: Rare Events (Easter Eggs)
*Mục tiêu: Các hoạt cảnh siêu hiếm (<1%) tạo bất ngờ cho user.*

- [ ] `rare_sleep_drool`: Ngủ chảy nước dãi.
- [ ] `rare_read_sleep`: Ngủ gục trên đống sách, kính xếch lên.
- [ ] `rare_cat`: Bị mèo ngồi ụp lên đầu.
- [ ] `rare_star`: Quấn chăn ngắm sao rơi.
- [ ] `rare_sing`: Hát nhảy một mình (khi bị user bấm vào thì đỏ mặt dừng lại).
- [ ] `rare_cook_burn`: Cầm miếng bánh mì cháy đen, cười ngượng.
