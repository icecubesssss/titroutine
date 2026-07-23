# Báo cáo đặc tả (SPEC) đầy đủ: Study Bunny: Focus Timer — Tài liệu tham khảo để clone thành Web App

## TL;DR
- **Study Bunny: Focus Timer** là app học tập gamified miễn phí (có quảng cáo + IAP) do **SuperByte / Justin Patrick Silang** phát triển, xuất bản lần đầu **11/9/2019**, hiện ~phiên bản 60.09 (cập nhật 8/12/2025), hơn 5.000.000 lượt tải trên Google Play. Cơ chế cốt lõi: học đúng giờ → nhận **coin** (1 coin/10 phút) → mua đồ trang trí phòng & trang phục cho chú thỏ pixel + công cụ To-Do/Flashcards/Study Tracker.
- Toàn bộ cơ chế chính đã được xác thực từ tài liệu chính thức của nhà phát triển (trang Tutorial và FAQ tại superbyte.site): tỷ lệ coin, carrot (1 carrot/quảng cáo, tối đa 5/ngày), Happy Meter (giảm ~2 vạch/ngày lúc 4 giờ sáng), Honesty Mode, timer 3 chế độ (Countdown/Stopwatch/Break), giới hạn 5–180 phút, phạt coin khi pause >7 phút, 6 gói IAP.
- Clone web app hoàn toàn khả thi với **React/Vue + Canvas hoặc DOM-sprite + IndexedDB/localStorage + PWA**; lộ trình nên chia giai đoạn MVP (timer + coin + thỏ + shop cơ bản) rồi mở rộng. **Lưu ý bản quyền: phải tự tạo asset gốc (tên, hình thỏ, artwork, nhạc) — không sao chép asset của Study Bunny.**

## Key Findings

1. **Mô hình**: Miễn phí, quảng cáo tĩnh + quảng cáo video opt-in, 6 gói IAP một lần (không phải subscription). Điểm khác biệt lớn nhất so với Forest/Flora: Study Bunny dùng **thú cưng ảo (virtual pet)** + bộ công cụ học tập tích hợp (flashcards, to-do, study tracker) thay vì ẩn dụ trồng cây, và **không khóa tính năng sau paywall** — gần như toàn bộ chức năng miễn phí.
2. **Kinh tế game rõ ràng và cố tình "chậm"**: 1 coin/10 phút học (làm tròn lên từ 5 phút — verbatim FAQ: *"rounding up study minutes (e.g. between 5-10 minutes will now get 1 coin instead of the minimum 10)"*), tối đa 10 coin thưởng/ngày từ x2 quảng cáo, 8 coin miễn phí/ngày (daily check-in), carrot chỉ từ quảng cáo (tối đa 5/ngày). Nhà phát triển cố tình giữ tỷ lệ thấp để người dùng "tích cóp lâu dài".
3. **Nhân vật thỏ**: cơ chế cảm xúc là tùy chọn (Happy Meter Mode) — không bật thì thỏ không có mood decay. Khi bật, Happy Meter giảm ~2 vạch/ngày lúc 4h sáng; có Challenge Mode reset về 0 mỗi ngày.
4. **Chống gian lận**: mô hình **self-accountability** (không chặn app khác). Timer vẫn chạy nền. Tùy chọn Honesty Mode: khi rời app rồi quay lại sẽ hỏi "Bạn có bị phân tâm không?" → vòng quay may rủi (verbatim tutorial: *"You may lose 1 coin, 2 coins, or have to watch an ad"*).
5. **Không có Pomodoro chính thức**: nhà phát triển nói không được cấp phép dùng nhãn hiệu "Pomodoro"; thay bằng nút lặp phiên học / phiên nghỉ trên màn hình "Great Work".
6. **Xã hội**: có tính năng **Study with Friends** (ra mắt 5/2022, vẫn còn năm 2025–2026) dùng reference code để kết bạn/học cùng, nhưng người dùng phản ánh khá hạn chế (không xem được stats bạn bè).

## Details

### 1. TỔNG QUAN APP

- **Tên đầy đủ**: Study Bunny: Focus Timer.
- **Nhà phát triển**: SuperByte (đứng tên cá nhân Justin Patrick Silang trên App Store); là nhóm 2 người theo lời họ trong FAQ. Website chính thức: superbyte.site. Email hỗ trợ: studybunnyapp@gmail.com. Kênh mạng xã hội: Instagram (@studybunnyapp), YouTube, Facebook, Twitter/X.
- **Nền tảng**: iOS (App Store id1478345385; iOS 12.0+, chạy được trên Mac M1 và Apple Vision), Android (com.superbyte.studybunny; Android 7.0+ Nougat, dung lượng ~145 MB). 
- **Ra mắt lần đầu**: 11/9/2019 (xuất bản bởi Justin Patrick Silang).
- **Phiên bản hiện tại**: khoảng 60.09 (Android cập nhật 8/12/2025; changelog: "Major stability improvements - Content updates coming soon!"). Trước đó 60.06 (16/12/2024, "New item: 2024 Squishie").
- **Quy mô & đánh giá**: hơn 5.000.000 lượt cài trên Google Play. Điểm Google Play **4.52–4.53/5 dựa trên ~82 nghìn lượt đánh giá** (theo AppBrain). Trên iOS **4.77/5 dựa trên ~13,4K đánh giá gần nhất** (theo WorldsApps); một số store vùng hiển thị ~4.8/5 với ~1.402 đánh giá.
- **Mô hình kiếm tiền**:
  - Miễn phí tải.
  - Quảng cáo tĩnh (đặt ở vùng ít gây phân tâm) + quảng cáo video **opt-in** (để x2 coin hoặc nhận carrot).
  - Các gói IAP một lần (giá USD, có thể mua lại nhiều lần, giữ perk cao nhất):
    - **$1.99**: 100 coins + 100 carrots.
    - **$4.99**: 250 coins + 250 carrots; Premium login (dùng email, khôi phục mật khẩu); Gemstone "skin of the month" cho thỏ.
    - **$14.99**: 250 coins + 250 carrots; Premium login; **bỏ quảng cáo bắt buộc**; dùng offline.
    - **$19.99**: 500 coins + 500 carrots; Premium login; bỏ quảng cáo bắt buộc; offline; **Study Buddy** (bạn học cùng, chọn 1 trong 12 màu/kiểu); Gemstone skin.
    - Gói lớn hơn được liệt kê ở một số store vùng: **$69.99 / $79.99**: 2000 coins + 2000 carrots; và gói "1 Gold Crown $0.99". Ở store vùng khác nhau có tên biến thể như "250 coins/carrots & No Ads $17.99", "500 coins/carrots & No Ads $22.99" (giá theo vùng/thời điểm nên có thể khác USD chuẩn).
- **Điểm khác biệt so với Forest/Flora**:
  - Forest/Flora dùng ẩn dụ **trồng cây** (cây chết nếu rời app; Forest/Flora còn hợp tác trồng cây thật). Forest chặn/nhắc khi rời app.
  - Study Bunny dùng **thú cưng ảo Tamagotchi-style** + **bộ công cụ học tập** (flashcards, to-do, study tracker màu theo môn) trong một app, tạo gắn kết cảm xúc qua chăm sóc thỏ.
  - Study Bunny **không chặn** điện thoại (self-accountability), gần như miễn phí toàn bộ; Forest/Focus To-Do/Flora có tier trả phí rõ hơn.
  - App "chị em" cùng nhà phát triển: **Habit Rabbit** (habit tracker), **Fluffle: Bunny Idle Game**.

### 2. TOÀN BỘ TÍNH NĂNG

**A. Focus/Study Timer**
- Mở qua icon quyển sách trong menu drop-down (góc trên phải màn hình chính).
- **3 chế độ** (chọn ở thanh xanh trên cùng):
  1. **Countdown** — đếm ngược từ thời gian đặt về 0.
  2. **Stopwatch** — đếm tiến từ 0, tự dừng khi bấm stop; có nhắc định kỳ phòng quên tắt; nếu quên tắt và nhận coin dư có thể gỡ coin trong Settings hoặc sửa thời gian trong Study Tracker.
  3. **Break (no coins)** — nghỉ, không nhận/mất coin.
- **Thanh trượt thời gian**: kéo icon thỏ xám; tăng theo bước **5 phút**, tối đa **180 phút**. (Tối thiểu thực tế để được coin: phải học liền ≥5 phút.)
- **Color Tag**: icon nhãn cạnh nút Start; chọn màu + gõ tên môn học cho phiên; sửa được sau trong Study Tracker. Có **15 màu môn học** (tăng dần từ 8 → 12 → 15 theo yêu cầu người dùng).
- Khi học: thỏ ngồi học với quyển sách; một số icon menu bị mờ (chỉ truy cập công cụ học thiết yếu).
- **Stop** (nút vuông): xác nhận kết thúc; vẫn nhận coin cho thời gian đã tích lũy kể cả kết thúc sớm.
- **Pause** (nút tạm dừng): dẫn tới trang câu động viên + đồng hồ đếm thời gian pause; **pause >7 phút bắt đầu bị trừ coin** (verbatim FAQ: *"You lose coins if you use the pause button longer than 7 minutes. Remember that pause is for brief emergencies. If you want a real break without penalty, use break timer mode."*). Pause chỉ dành cho gián đoạn khẩn cấp ngắn.
- Kết thúc phiên: có **push notification** (âm/rung tùy cài đặt điện thoại; KHÔNG có chuông trong app do giới hạn game engine) rồi tới màn **"Great Work"** với 4 lựa chọn: (1) xem video quảng cáo để **x2 coin** (tối đa +10 coin bonus/ngày); (2) icon sách+lặp → lặp lại phiên học vừa xong; (3) icon cốc cà phê+đồng hồ → vào thẳng phiên Break; (4) icon nhà → về màn chính. Coin nhận được "bay" vào bộ đếm coin.
- **Chống gian lận thời gian**: self-accountability, timer chạy nền; tùy chọn **Honesty Mode** (hỏi có phân tâm không → vòng quay phạt 1–2 coin hoặc xem quảng cáo). App KHÔNG chặn app khác.
- **Thoát app giữa chừng**: timer vẫn tiếp tục (một số review chỉ ra đây là điểm yếu chống phân tâm). Người dùng phản ánh phiên <1 phút không được ghi nhận, và có trường hợp mất tiến trình khi app đóng đột ngột.

**B. Hệ thống tiền tệ (Coins & Carrots)**
- **Coin**: 
  - Kiếm chính bằng học: **1 coin / 10 phút** (làm tròn lên từ 5 phút; 5–10 phút = 1 coin).
  - **x2 coin** sau phiên qua quảng cáo video, tối đa **+10 coin bonus/ngày**.
  - **8 coin miễn phí/ngày** (daily check-in — verbatim FAQ: *"Ways to gain extra coins: Double coins after study sessions up to 10 bonus coins per day · Eight free daily coins."*; icon menu chuyển tím khi đủ điều kiện; trang check-in hiển thị ngày check-in gần nhất, cho thêm 1 ngày ân hạn).
  - Bonus coin khi Happy Meter đầy (nếu bật Happy Meter Mode).
  - **Mất coin** nếu pause >7 phút, hoặc thua vòng quay Honesty Mode.
  - Nhà phát triển **từ chối tăng tỷ lệ coin** và **từ chối tính năng bán lại (sell back)**.
- **Carrot (cà rốt)**:
  - Chỉ kiếm bằng xem quảng cáo video: **1 carrot/quảng cáo, tối đa 5 carrot/ngày** (verbatim tutorial: *"you will gain 1 carrot for every ad you watch. You can do this a maximum of 5 times a day."*).
  - Dùng để: (1) mua/giảm giá vật phẩm đặc biệt (animated items, award ribbons/trophies, special-event items); (2) cho thỏ ăn để tăng Happy Meter (chỉ trong Happy Meter Mode — kéo carrot từ góc trên trái tới thỏ).
- **Giới hạn**: bonus x2 tối đa 10 coin/ngày; carrot tối đa 5/ngày; daily coin 8/ngày.

**C. Nhân vật thỏ (Bunny)**
- **Happy Meter Mode** (bật/tắt trong Settings) — cơ chế cảm xúc **tùy chọn**:
  - Nếu không bật: thỏ không có chỉ số mood/không suy giảm.
  - Regular mode: Happy Meter **giảm ~2 vạch/ngày lúc 4h sáng**.
  - Tăng happiness bằng: học (nếu đầy khi kết thúc phiên → bonus coin); mua đồ (tăng tỉ lệ theo giá món đồ); nghe nhạc (tăng nhẹ, có cap/ngày); tick to-do (tăng nhẹ, cap/ngày); quiz flashcards (tăng nhẹ, cap/ngày); cho ăn carrot.
  - **Challenge Mode**: Happy Meter reset về rỗng mỗi ngày, khó đầy hơn nhiều.
  - Một số người dùng phản ánh mood giảm quá nhanh (cần học nhiều giờ/ngày để giữ thỏ "khỏe").
- **Đặt tên thỏ**: có, hiển thị trên màn chính; tắt được trong Settings.
- **Di chuyển/xoay/thay đổi kích thước thỏ**: trong Settings có "ghost bunny" để tái định vị; reset được.
- **Giới tính**: app không phân biệt/không có lựa chọn giới tính rõ ràng (thỏ là nhân vật trung tính, tùy biến qua trang phục).
- **Study Buddy** (IAP $19.99): thỏ thứ 2 học cùng, chọn 1 trong 12 màu/kiểu.
- **Gemstone skin of the month** (qua IAP): skin đặc biệt theo tháng mua.

**D. Shop / Cửa hàng** (mở qua icon giỏ hàng; danh mục ở cột trái):
- 🐰 **Bunny cosmetics** (trang phục/phụ kiện cho thỏ).
- 🌳 **Backgrounds** (hình nền phòng / bối cảnh).
- 📎 **Miscellaneous** (linh tinh, nội thất/đồ trang trí).
- 🍕 **Food** (thức ăn — donut, trà sữa/bubble tea, pretzel, grilled cheese, tea cakes…).
- 🐾 **Pets** (thú cưng phụ — duckling, capybara…).
- ⭐ **Animated items** (vật phẩm động — mua bằng **coin HOẶC coin+carrot**).
- 🏆 **Awards** (huy hiệu mở khóa theo mốc giờ học tích lũy: có mốc 10k/15k/20k giờ; mua để trưng bày trên màn chính).
- 📣 **Announcements** (thông báo).
- Thao tác: bấm món → **Buy** (nút xanh) hoặc **Preview 10 giây** (nút tím). Sau khi mua: **Add to room** (nút vàng) / **Remove from room** (nút cam). Preview không phản ánh đúng layering.
- **Đặt/tùy biến vật phẩm trong phòng**: kéo (drag), phóng to/thu nhỏ (pinch 2 ngón), xoay (swivel 2 ngón). Có thể bật/tắt "draggable items", "Hide all items" (ẩn hết, reset về phòng mặc định), reset kích thước/hướng bằng cách remove & re-add.
- **Vật phẩm theo mùa/sự kiện** (từ changelog, KHÔNG kèm giá): Ninja costume, Fairy wings, Shark/Pumpkin/Snowman costume, Flannel shirt, Christmas Wreath, Animated Christmas Snowglobe, Valentine's Card, Heart Sweater/Balloon, Chocolate Box, Rose Bouquet, Flower Crown, Fanny Pack, Duck Float, Picnic Blanket, Tea Set, Wildflower, Animated Butterfly, Cherry blossom (animated), background Meadow/Riverbank, và bộ sinh nhật (Balloons/banner/cake/party hat) mỗi tháng 3; **"Squishie"** phiên bản mỗi tháng 12.

**E. Giá vật phẩm (coin)** — *ước lượng, không có bảng giá chính thức công khai*:
- Không nguồn công khai nào (Reddit, TikTok, wiki, blog, screenshot) liệt kê giá coin từng món. Không tồn tại fandom wiki giá.
- Dữ liệu duy nhất định lượng: một review App Store nói đồ trong shop "tốn khoảng 50 coin trở lên". Nhiều review mô tả đồ "đắt", phải "để dành lâu dài".
- Nhà phát triển xác nhận có chủ ý dải giá rộng: "một số món rất rẻ, số khác cần công sức dài hạn"; và không thêm quá nhiều món rẻ.
- **Khuyến nghị cho clone**: đặt giá từ ~50 coin (món rẻ) tăng dần tới hàng trăm/hàng nghìn coin cho món "đắt"; animated/special item thêm chi phí carrot (carrot cap 5/ngày).

**F. To-Do List** (icon checklist):
- "Add Task" gõ tên task; tick ô bên trái để hoàn thành (làm mờ); xóa (thùng rác); sửa (bấm tên task); sắp xếp lại (icon mũi tên chéo, kéo lên/xuống). Tick task tăng nhẹ Happy Meter (cap/ngày). Không hỗ trợ ngôn ngữ phải-sang-trái.

**G. Flashcards** (icon chồng thẻ):
- Bộ "Default" sẵn; "Add Set"; đổi tên bộ (icon bút chì); mỗi thẻ có Front/Back; "Add Card"; xóa thẻ (thùng rác); **Quiz**: hiện mặt trước → chạm lật → tự chấm đúng (✓ xanh)/sai (✗ đỏ) → hiện % đúng và so sánh với lần quiz trước. Quiz tăng nhẹ Happy Meter (cap/ngày). Không hỗ trợ RTL.

**H. Study Tracker / Thống kê** (icon biểu đồ cột):
- Tự động ghi thời gian học qua timer; thêm/sửa thủ công được (chỉ ở **week view**).
- **Month view**: thanh ngang theo màu/môn (từ color tag); nút "+" thêm môn vào legend; sửa legend (bấm dòng); toggle 8h/16h cho trục ngang; nút biểu đồ hiện thống kê.
- **Week view**: khối dọc theo giờ trong ngày; bấm khối → "Edit Session Block" (sửa màu, giờ bắt đầu/kết thúc, dùng giờ 24h); nút "+" lớn thêm thời gian cho từng ngày; toggle 24:00/12:00; toggle M/D (đổi thứ tự tháng/ngày).
- Awards theo mốc giờ học tích lũy (10k/15k/20k giờ).

**I. Calendar / Streak**:
- Study Tracker đóng vai lịch (month/week view). Có **streak** (chuỗi ngày học liên tiếp) — được nhiều người dùng nhắc là động lực chính; kết hợp daily check-in.

**J. Music Player / Âm thanh**:
- Mua nhạc bằng coin (icon nốt nhạc trong menu). Phát nhạc khi học, kể cả khi tắt màn hình; dừng phải vào lại mục nhạc.
- Thể loại: lofi, piano, và **White Noise (Ambient)** (thêm ở bản 60.03). Có các "ambient timer" như "morning library ambience". Do giới hạn dung lượng, nhạc trong app hạn chế; nhà phát triển bổ sung link nhạc trên YouTube.
- Tên nhạc trong music store để tiếng Anh kể cả khi đổi ngôn ngữ. Có mục **Credits** (Settings) ghi nhận nghệ sĩ.
- Alarm: không có chuông trong app; dùng notification/rung của điện thoại.

**K. Motivational quotes / Thỏ nhắn nhủ**:
- Khi pause hiện trang câu động viên. Có **Study Tips** (icon bóng đèn, thêm từ bản 60.02+, đã có Tip #1/#2/#3).

**L. Gifting / Xã hội**:
- **Study with Friends** (ra mắt 5/2022, còn hoạt động 2025–2026): dùng **reference code** (~6–8 ký tự, ví dụ dạng "5VOL2E"/"SBJQEE9H") để kết bạn/học cùng, chia sẻ phòng. Hạn chế: không xem được stats/mood bạn bè (mặc định). Cùng hệ với Habit Rabbit (code riêng).
- Redeem code (Settings): nhận vật phẩm/coin giới hạn thời gian từ social media hoặc hỗ trợ khách hàng.
- Giveaway trên Instagram: item sinh nhật (tháng 3), Squishie (tháng 12), merchandise.

**M. Notification / Nhắc nhở**:
- Push notification khi kết thúc phiên (âm/rung tùy máy); nhắc định kỳ ở chế độ stopwatch; daily check-in icon đổi màu tím khi đủ điều kiện.

**N. Settings (toàn bộ)**:
- Redeem a code; Bunny name (bật/tắt); Happy Meter (+ Challenge mode); Power Save Mode (tiết kiệm pin, animation giật); Honesty Mode; Remove coins (gỡ coin dư); Move/Rotate/Resize Bunny; Tutorial (xem lại hướng dẫn); Hide all items; Disable/enable draggable items; Language (icon quả địa cầu, **14 ngôn ngữ**, một số text như tên item vẫn tiếng Anh, không hỗ trợ RTL); Credits (nhạc); Account deletion (tự xóa tài khoản — thêm từ bản 60.00/50.02, tuân thủ GDPR).

**O. Backup / Sync dữ liệu**:
- Tạo tài khoản (icon profile): username + password + password hint. **KHÔNG** khôi phục được username/password quên (basic login) — chỉ tạo tài khoản mới rồi Cloud Save.
- **Cloud Save / Cloud Load thủ công** (không tự động, để tránh ghi đè dữ liệu trống). Cần internet.
- Chuyển thiết bị: cài app trắng → đăng nhập → Cloud Load.
- **Premium login** (IAP): dùng email, khôi phục mật khẩu, lưu nhiều dữ liệu hơn (icon profile vàng).
- App yêu cầu internet cho một số tính năng (cloud save, link YouTube/help); dùng offline cần IAP.

**P. Tính năng ẩn / sự kiện đặc biệt**:
- Awards theo mốc giờ học; item sự kiện theo mùa/lễ; "bunny ở địa điểm quốc tế" (ví dụ Paris) theo một số mô tả; giveaway theo tháng.

### 3. GIAO DIỆN (UI/UX) — TỪNG MÀN HÌNH

**Phong cách chung**:
- **Pixel art** hoài cổ kiểu "old Adobe Flash games" (theo review), dễ thương, cozy. 
- Bảng màu chủ đạo (suy ra từ mô tả/screenshot, **ước lượng**): tông pastel — xanh lá/mint cho thanh timer (thanh chuyển tím dần khi kéo thời gian lâu), vàng cho màn "Great Work", cam cho carrot/thỏ, nhiều tông phòng theo background. Mã màu gợi ý clone: mint #A8E6CF, tím #B39DDB, vàng #FFE082, cam #FFB74D, nền kem #FFF8E1.
- Font: kiểu **pixel/retro** cho tiêu đề; nội dung dễ đọc.

**Danh sách màn hình chính**:
1. **Home / Main screen**: thỏ ở trung tâm trong phòng đã trang trí; bộ đếm **coin** (góc trên) và **carrot** (góc trên trái); tên thỏ (nếu bật); **menu drop-down góc trên phải** chứa các icon điều hướng: sách (Timer), giỏ hàng (Shop), biểu đồ (Study Tracker), checklist (To-Do), chồng thẻ (Flashcards), nốt nhạc (Music), profile (Account), coin+carrot (carrot/daily), bóng đèn (Study Tips), profile vàng (Premium login), Settings.
2. **Timer screen**: thanh chế độ (xanh) trên cùng; thanh trượt với icon thỏ xám; color tag cạnh nút Start; nút Start; khi chạy có Pause/Stop.
3. **Pause screen**: câu động viên + đồng hồ đếm pause.
4. **"Great Work" screen** (vàng): hiển thị coin nhận + 4 nút (x2 quảng cáo / lặp học / break / về nhà).
5. **Shop**: cột icon danh mục bên trái; lưới vật phẩm; nút Buy (xanh)/Preview (tím); Add/Remove room (vàng/cam).
6. **Closet/tùy biến phòng**: thao tác drag/resize/rotate ngay trên home.
7. **Study Tracker**: month view (thanh ngang theo màu) / week view (khối dọc theo giờ); legend + nút "+"; toggle 8h/16h, 24:00/12:00, M/D; drop-down góc dưới phải.
8. **To-Do**: danh sách task + Add Task + tick/xóa/sửa/kéo.
9. **Flashcards**: danh sách bộ + Add Set; editor Front/Back + Add Card; chế độ Quiz (lật thẻ, chấm ✓/✗, %).
10. **Music**: danh sách bản nhạc + play/pause.
11. **Carrot/Daily**: nút video xanh nhận carrot; daily check-in 8 coin.
12. **Account/Login**: đăng ký/đăng nhập, Log off, Cloud Save, Cloud Load.
13. **Settings**: danh sách toàn bộ tùy chọn (mục N).
14. **Study with Friends**: nhập/chia sẻ reference code.

**Screenshots/nguồn tham khảo chính thức để người dùng tự xem**:
- App Store (apps.apple.com/us/app/study-bunny-focus-timer/id1478345385) và Google Play (play.google.com/store/apps/details?id=com.superbyte.studybunny) — có ảnh chụp màn hình chính thức.
- Website chính thức: superbyte.site/studybunny, tutorial: superbyte.site/tutorial, faq: superbyte.site/faq.
- MWM (mwm.ai) mô tả các screenshot: shop với donut & bubble tea; biểu đồ cột theo môn; week view; đặt timer 60 phút với color tag; to-do list; **thỏ tím trong phòng chủ đề dưới nước với sinh vật biển**.
- YouTube: kênh chính thức Study Bunny (nhạc "study bunny beats"), và video "HOW TO USE STUDY BUNNY WITH FRIENDS - 2025".

### 4. THÔNG SỐ & CƠ CHẾ GAME (tóm tắt số liệu)

| Thông số | Giá trị | Nguồn |
|---|---|---|
| Coin/thời gian học | 1 coin / 10 phút (làm tròn lên từ 5 phút) | Chính thức (tutorial/FAQ) |
| Tối thiểu để nhận coin | học liền ≥5 phút | Chính thức (FAQ) |
| Bước thời gian timer | 5 phút | Chính thức |
| Timer tối đa | 180 phút | Chính thức |
| x2 coin bonus/ngày | tối đa 10 coin | Chính thức |
| Daily free coins | 8 coin/ngày | Chính thức |
| Carrot | 1/quảng cáo, tối đa 5/ngày | Chính thức |
| Ngưỡng phạt pause | >7 phút bắt đầu trừ coin | Chính thức |
| Happy Meter decay (regular) | ~2 vạch/ngày lúc 4h sáng | Chính thức |
| Challenge Mode | reset về 0 mỗi ngày | Chính thức |
| Số màu môn học | 15 | Chính thức |
| Số ngôn ngữ | 14 | Chính thức |
| Preview vật phẩm | 10 giây | Chính thức |
| Awards mốc giờ | 10k/15k/20k giờ tích lũy | Changelog |
| Giá vật phẩm | ~50 coin trở lên (ước lượng, không có bảng chính thức) | Review (ước lượng) |
| Honesty Mode phạt | 1–2 coin hoặc xem quảng cáo | Chính thức |

### 5. DANH SÁCH ASSETS CẦN TẠO (tự làm gốc, KHÔNG copy Study Bunny)

**Sprite/animation thỏ** (đề xuất 32×32 hoặc 48×48 px, scale lên):
- idle (2–4 frame thở nhẹ); studying/học với sách (2–4 frame); happy/vui (2–4 frame); sad/buồn khi bị bỏ bê (2 frame); eating/ăn carrot (3–4 frame); sleeping/ngủ (2 frame); celebrate khi hoàn thành phiên (3–4 frame). Tổng ~7 trạng thái, ~20–30 frame.
- Layer trang phục (mũ, áo, cánh, phụ kiện) vẽ tách để ghép chồng lên sprite gốc.

**Icon UI**: sách, giỏ hàng, biểu đồ cột, checklist, chồng thẻ, nốt nhạc, profile, coin, carrot, bóng đèn, nhà, cốc cà phê, nút play/pause/stop, nhãn tag, thùng rác, bút chì, mũi tên chéo, cài đặt (bánh răng), quả địa cầu. Kích thước 24–32 px.

**Vật phẩm shop**: 
- Bunny cosmetics (mũ, áo, kính, cánh…); backgrounds (phòng ngủ, đồng cỏ, bờ sông, dưới nước, sân hiên…); food (bánh, trà sữa, cà rốt, pretzel…); pets (vịt con, capybara…); animated items (bươm bướm, cầu vồng, snowglobe…). Vẽ theo lưới 16–64 px tùy loại.

**Âm thanh**:
- Nhạc nền: 3–5 track lofi/piano/ambient tự sản xuất hoặc royalty-free.
- SFX: nhấn nút, nhận coin (ching), cho ăn, hoàn thành phiên (fanfare ngắn), lật thẻ, tick to-do, mua đồ. Định dạng .ogg/.mp3 ngắn.

**Font pixel miễn phí gợi ý**: Press Start 2P (Google Fonts), VT323, Pixeloid, m5x7/m6x11 (Daniel Linssen), Silver, "PixelOperator". Tất cả có giấy phép cho phép dùng — kiểm tra license từng font.

**Nguồn asset/công cụ miễn phí thay thế**:
- Công cụ pixel art: **Aseprite** (trả phí, hoặc build miễn phí từ source), **Piskel** (miễn phí, web), **LibreSprite** (miễn phí), **Pixilart** (web), Krita, GraphicsGale.
- Asset miễn phí/CC: **itch.io** (game assets, nhiều bộ CC0), **OpenGameArt.org**, **Kenney.nl** (UI/asset CC0), **Freesound.org** (SFX), **Pixabay/Incompetech** (nhạc), **Google Fonts** (font).

### 6. GỢI Ý KIẾN TRÚC WEB APP ĐỂ CLONE

**Tech stack đề xuất**:
- **Frontend**: React (hoặc Vue/Svelte) + TypeScript. State: Zustand/Redux hoặc Pinia.
- **Render thỏ & phòng**: có 2 hướng —
  - **DOM/CSS sprite** (đơn giản, dễ layer trang phục, phù hợp UI tĩnh) — khuyến nghị cho MVP.
  - **Canvas** (PixiJS) nếu cần nhiều animation mượt/nhiều sprite động.
- **Lưu dữ liệu**: **IndexedDB** (qua Dexie.js) cho dữ liệu chính (session log, inventory), **localStorage** cho setting nhỏ. 
- **PWA**: service worker + manifest để cài như app, chạy offline, gửi notification (Web Notifications API + Background Sync).
- **Cloud sync (tùy chọn)**: Firebase/Supabase (auth + Firestore/Postgres) cho account + cloud save thủ công, mirror mô hình gốc.
- **Timer nền**: dùng **timestamp-based** (lưu mốc `startTime`, tính `elapsed = Date.now() - startTime`) thay vì đếm bằng setInterval, để không sai khi tab nền/ngủ. Kết hợp Page Visibility API để phát hiện rời tab (làm cơ sở cho Honesty Mode web). Web Worker để giữ tick khi throttle.
- **Chống gian lận web**: dựa timestamp + kiểm tra tính hợp lý (elapsed không vượt quá thời gian đặt + buffer); phát hiện đổi đồng hồ hệ thống bằng cách so với performance.now(); Honesty Mode dùng `visibilitychange`.

**Cấu trúc dữ liệu chính (gợi ý)**:
```
BunnyState { name, happyMeter (0..max), happyMode: 'off'|'regular'|'challenge', equippedItems[], position, scale }
Wallet { coins, carrots, dailyBonusClaimedDate, doubleCoinsBonusToday (0..10), carrotsWatchedToday (0..5) }
Inventory { ownedItemIds[], placedItems[{id, x, y, scale, rotation}] }
Item { id, category, priceCoins, priceCarrots?, name, spriteRef, animated: bool, seasonal?, previewOnly }
StudySession { id, date, startTime, endTime, durationMin, subjectColor, subjectName, coinsEarned }
Subject (legend) { color, name }
Task { id, text, done, order }
FlashcardSet { id, name, cards:[{front, back}], lastQuizScore, prevQuizScore }
Award { id, thresholdHours, unlocked, displayed }
Settings { happyMode, honestyMode, powerSave, language, bunnyNameShown, draggableItems }
```

**Lộ trình xây dựng theo giai đoạn**:
- **MVP (Giai đoạn 1)**: Home + thỏ idle + timer (Countdown/Stopwatch/Break) timestamp-based + coin (1/10 phút) + màn "Great Work" + lưu localStorage/IndexedDB. Không cần quảng cáo/carrot.
- **Giai đoạn 2**: Shop + inventory + đặt/kéo vật phẩm + trang phục thỏ (layer sprite) + color tag môn học + Study Tracker (month/week) + streak/daily check-in (8 coin).
- **Giai đoạn 3**: To-Do + Flashcards (+ Quiz) + Happy Meter Mode (+ decay 2 vạch/ngày, Challenge) + carrot (thay quảng cáo bằng nhiệm vụ/nhật ký) + music player + SFX + notification (PWA).
- **Giai đoạn 4**: Account + cloud sync (Firebase/Supabase) + Honesty Mode + Awards + đa ngôn ngữ + tùy chọn Settings đầy đủ.
- **Giai đoạn 5 (mở rộng riêng)**: bạn bè/social, sự kiện theo mùa, mini-game, tùy biến kinh tế game (bảng giá riêng của bạn).

## Recommendations

1. **Bắt đầu bằng MVP timer + coin + thỏ** (Giai đoạn 1) vì đây là vòng lặp cốt lõi giữ chân người dùng; dùng **timestamp-based timer** ngay từ đầu để tránh nợ kỹ thuật về độ chính xác nền.
2. **Sao chép mô hình kinh tế nhưng tự tinh chỉnh con số**: giữ triết lý "chậm mà đều" (1 coin/10 phút, daily bonus, cap) nhưng vì bạn tự làm, hãy cân nhắc **tỷ lệ hào phóng hơn một chút** nếu không có doanh thu quảng cáo cần bảo vệ. Đặt giá shop từ ~50 coin (rẻ) tới hàng nghìn (đắt) và dùng carrot cho món cao cấp.
3. **Thay quảng cáo bằng cơ chế web-thân thiện**: vì web không nên nhồi quảng cáo, thay "xem quảng cáo nhận carrot/x2 coin" bằng nhiệm vụ nhỏ (viết nhật ký học, đạt streak) để giữ carrot làm tài nguyên khan hiếm.
4. **Ưu tiên self-accountability + Honesty Mode nhẹ** (dựa Page Visibility API) thay vì cố chặn tab — vừa đúng tinh thần gốc vừa khả thi trên web.
5. **Về bản quyền — bắt buộc**: tự đặt tên khác (không dùng "Study Bunny"), tự vẽ nhân vật/artwork/icon, tự làm hoặc dùng nhạc/SFX royalty-free/CC0. Không tái sử dụng sprite, tên vật phẩm, hay nhạc của Study Bunny. Dùng Piskel/Aseprite + itch.io/Kenney/OpenGameArt cho asset gốc.
6. **Benchmark để đổi hướng**: nếu người dùng thử phàn nàn tiến trình quá chậm (giữ chân kém) → tăng tỷ lệ coin hoặc thêm nguồn thưởng; nếu thỏ mood decay gây bực (như phản hồi ở app gốc) → để Happy Meter mặc định TẮT như bản gốc, chỉ bật cho ai muốn thử thách.

## Caveats

- **Giá coin từng vật phẩm không có nguồn chính thức**: không tồn tại bảng giá công khai hay fandom wiki; con số "~50 coin trở lên" chỉ từ một review App Store, mang tính ước lượng. Muốn số chính xác phải chụp trực tiếp trong app hiện hành.
- **Bảng màu và mã màu là ước lượng** suy từ mô tả/screenshot, không phải giá trị hex chính thức từ nhà phát triển.
- **Giá IAP thay đổi theo vùng và thời điểm**; các mức USD nêu trên lấy từ FAQ chính thức và một số store vùng, có thể lệch so với hiện tại.
- **Phiên bản**: các store bên thứ ba báo phiên bản 60.06–60.09 với ngày khác nhau (một số ngày trong tương lai gần do lịch mirror), nên coi "≈60.09, cập nhật cuối 2025" là mốc tham chiếu, không tuyệt đối.
- **Điểm đánh giá lệch giữa nguồn**: Google Play ~4.52/5 (~82K reviews, AppBrain) và iOS 4.77/5 (~13,4K reviews, WorldsApps) — các con số này biến động theo thời gian.
- **Một số cơ chế phụ (cap Happy Meter theo ngày cho music/to-do/flashcards, chi tiết vòng quay Honesty Mode) chỉ mô tả định tính** trong tài liệu chính thức, không có con số cụ thể.
- Báo cáo này chỉ mô tả tính năng/cơ chế/bố cục/thông số để tham khảo thiết kế; không sao chép nội dung có bản quyền. Người đọc tự chịu trách nhiệm tạo asset gốc và tuân thủ luật sở hữu trí tuệ.