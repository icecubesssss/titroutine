# Kế hoạch Siêu Nâng Cấp Titroutine thành Ứng Dụng Chăm Sóc Bản Thân Đẳng Cấp (Finch Level)

Dự án **Titroutine** hiện đã có nền tảng vững chắc với cơ chế theo dõi thói quen, chuỗi ngày (streak), cửa hàng nội thất/hình nền cơ bản, nuôi dưỡng pet qua chỉ số no (satiety) và độ thân thiết (affection). Tuy nhiên, để đạt tới đẳng cấp của **Finch** — một trong những app self-care thành công nhất thế giới, chúng ta cần biến việc hoàn thành thói quen thành nhiên liệu thúc đẩy sự phát triển độc lập của bé thỏ, đồng thời tích hợp thêm các công cụ chăm sóc sức khỏe tinh thần, kết nối cộng đồng và **tối ưu hóa toàn diện giao diện UX/UI mang phong cách cao cấp, sống động (Cozy Premium).**

Bản kế hoạch này đề xuất các trụ cột nâng cấp lớn, biến Titroutine thành một **Cozy Self-Care Companion** mà bất kỳ ai muốn rèn luyện thói quen đều yêu thích.

---

## 1. Trụ Cột Tính Năng Nâng Cấp (Finch Style)

### Trụ Cột 1: Hệ Thống Thám Hiểm & Định Hình Tính Cách (Pet Adventure & Personality)
*Thay vì thỏ chỉ ngồi thụ động trong phòng, các thói quen hoàn thành sẽ tiếp năng lượng để bé thỏ tự mình đi khám phá thế giới bên ngoài.*
* **Năng lượng Khám phá (Adventure Energy)**: Mỗi khi check thói quen, người dùng tích lũy năng lượng (10 energy / thói quen). Khi đạt 30/30, thỏ sẽ rời phòng và bắt đầu chuyến "Thám hiểm" (Adventure) ngoài trời (đồi cỏ, rừng thông, bờ biển...).
* **Trạng thái Thám hiểm**: Màn hình chính đổi sang giao diện thỏ đang đi bộ trên nền động ngoài trời với thanh trạng thái "Đang thám hiểm...". Sau 1 khoảng thời gian (hoặc kết thúc nhanh bằng xu/năng lượng nếu muốn test nhanh), thỏ sẽ quay về.
* **Hội thoại Khám phá & Định hình Tính cách**: Khi thỏ về, nút "Xem thu hoạch!" xuất hiện. Bấm vào sẽ mở ra cuộc trò chuyện giữa thỏ và chủ nhân:
  * Thỏ kể về một trải nghiệm (ví dụ: *"Hôm nay tớ nhặt được một chiếc vỏ ốc lạ tai trên cát. Tớ thắc mắc không biết có phải biển cả đang gửi tin nhắn cho tớ không?"*).
  * Người dùng được chọn 1 trong 2 câu trả lời ứng xử (ví dụ: **A: "Mỗi chiếc vỏ ốc đều giữ tiếng nói của đại dương đấy!"** hoặc **B: "Đó là tiếng gió luồn qua khe ốc thôi, nhưng nó rất thư giãn đúng không?"**).
  * Lựa chọn của người dùng sẽ cộng điểm vào 4 chỉ số tính cách của Thỏ: **Tò mò (Curiosity)**, **Thấu cảm (Compassion)**, **Kiên cường (Resilience)**, và **Năng động (Energy)**. Các chỉ số này được hiển thị trực quan trong Tab Profile của Thỏ.
* **Ghi chép Kỷ niệm**: Câu chuyện khám phá đó sẽ tự động được ghi lại trong **Memory Album** như một nhật ký hành trình.

### Trụ Cột 2: Bộ Công Cụ Chăm Sóc Bản Thân & Nhật Ký Cảm Xúc (Self-Care Toolkit)
*Tích hợp trực tiếp các công cụ chánh niệm giúp người dùng xoa dịu tâm trạng ngay trên ứng dụng.*
* **Mood Check-in Hàng Ngày**: Khi mở app lần đầu trong ngày (hoặc chủ động kích hoạt), người dùng chọn cảm xúc hiện tại (Vui, Bình yên, Lo âu, Buồn, Mệt mỏi), tick các yếu tố ảnh hưởng (Công việc, Gia đình, Sức khỏe, Giấc ngủ) và viết nhanh 1 câu biết ơn (Gratitude prompt). Hoàn thành check-in thưởng 15 xu và +10 No (satiety) cho thỏ.
* **Interactive Breathing Timer (Luyện thở Box Breathing)**: Một mini-timer luyện thở thư giãn 2 phút (Hít vào 4s -> Giữ 4s -> Thở ra 4s -> Giữ 4s) với vòng tròn phập phồng ấm áp. Hoàn thành luyện thở thưởng xu và chuyển thỏ sang trạng thái thiền (spirit_meditate / study).

### Trụ Cột 3: Nâng Cấp Cửa Hàng & Flash Sales Hàng Ngày (Daily Shop Rotation)
*Tăng tính hấp dẫn và giữ chân người dùng thông qua cơ chế mua sắm dynamic.*
* **Cửa hàng xoay tua (Daily Shop Rotation)**: Cửa hàng sẽ không liệt kê toàn bộ sản phẩm nữa. Thay vào đó, mỗi ngày vào lúc nửa đêm, hệ thống sẽ tự động chọn ngẫu nhiên **4 món nội thất/outfit** để bán (Flash Sale). Tạo động lực đăng nhập mỗi ngày để săn đồ hiếm.
* **Xem trước phòng (Room Preview)**: Khi chọn đồ trong Shop, hiển thị một khung preview phòng nhỏ để người dùng ướm thử nội thất hoặc outfit lên bé thỏ trước khi nhấn mua.

### Trụ Cột 4: Khu Phố Thỏ - Kết Nối Bạn Bè (Tree Town & Good Vibes)
*Mang đến trải nghiệm xã hội kết nối nhẹ nhàng, không áp lực.*
* **Hệ thống Mã Bạn Bè (Friend Code)**: Mỗi tài khoản có một Friend Code duy nhất. Người dùng có thể nhập code của bạn bè để đưa họ vào danh sách "Hàng xóm" của mình.
* **Gửi Rung Cảm Tích Cực (Good Vibes)**: Ở màn hình Hàng xóm (Tree Town), người dùng thấy thỏ của bạn bè xếp hàng. Bấm vào một bạn để gửi "Rung cảm" (Good Vibes): *"Gửi cái ôm ấm áp" 🫂*, *"Nhắc nhở uống nước" 💧*, hoặc *"Chúc một ngày năng lượng" ✨*.
* **Hộp thư Rung Cảm**: Khi bạn bè đăng nhập, họ nhận được pop-up đáng yêu: *"[Tên bạn] đã gửi cho bạn một cái ôm ấm áp! Thỏ của bạn cảm thấy rất vui và được cộng +5 Độ thân thiết."*

### Trụ Cột 5: Nâng Cấp Hẹn Giờ Tập Trung Đồng Hành (Cozy Focus Timer + Soundscapes)
*Kết hợp việc rèn luyện sự tập trung nghiêm ngặt với sự hiện diện đồng hành của thú cưng.*
* **Thú cưng đồng hành học tập**: Trong suốt thời gian đếm ước của Timer, bé thỏ của bạn sẽ được hiển thị trực tiếp trên màn hình Timer với hoạt cảnh **Đang học bài chăm chú (Study/Writing)** hoặc **Dùng laptop dễ thương (Teen/Woman Laptop)**. Người dùng cảm thấy như có một người bạn nhỏ đang cùng nỗ lực với mình.
* **Soundscapes - Âm thanh thư giãn**: Tích hợp các tùy chọn phát nhạc nền chánh niệm trực tiếp trong Timer: **Nhạc Lofi học tập 🎧**, **Tiếng mưa rơi rào nhẹ 🌧️**, hoặc **Tiếng chim hót trong rừng thông 🌲**. Người dùng có thể bật/tắt hoặc điều chỉnh âm lượng dễ dàng.

### Trụ Cột 6: Hộp Sơ Cứu Tâm Lý - Chống Hoảng Loạn (Psychological First Aid Kit)
*Khi người dùng cảm thấy hoảng loạn, cực kỳ căng thẳng, chán nản hoặc lo âu quá độ, họ có thể kích hoạt nút Cứu Hộ để mở nhanh các công cụ sơ cứu tâm lý khẩn cấp:*
* **Căn đất 5-4-3-2-1 (Grounding Method)**: Trải nghiệm tương tác từng bước hướng dẫn người dùng nhận diện:
  * 5 vật thể xung quanh mắt có thể nhìn thấy.
  * 4 thứ có thể sờ chạm vật lý.
  * 3 âm thanh đang nghe rõ.
  * 2 mùi hương có thể cảm nhận.
  * 1 hương vị trong miệng.
* **Giải Tỏa Căng Thẳng (Shake Off Stress)**: Màn hình hiển thị một bong bóng thạch (jelly bubble) lớn, đàn hồi. Người dùng gõ/chạm thật nhanh liên tục vào bong bóng để "giải phóng vật lý" sự ức chế. Sau mỗi lần gõ, bong bóng méo mó đàn hồi và bắn ra các hạt ánh sáng lấp lánh nhẹ nhàng.
* **Thẻ xoa dịu (Affirmations)**: Vuốt qua lại các tấm thẻ gỗ vẽ hình thỏ ôm gối với thông điệp tích cực: *"Mọi chuyện rồi sẽ ổn thôi"*, *"Hãy hít thở thật sâu, bạn đang làm rất tốt rồi"*.

### Trụ Cột 7: Hồ Sơ Tính Cách & Sở Thích của Thỏ (Pet Profile Screen)
*Nơi quản lý toàn bộ quá trình phát triển của Thỏ cưng giống hệt Finch.*
* **Bảng chỉ số tính cách**: Hiển thị 4 thanh tiến trình tương ứng:
  * **Tò Mò (Curiosity)** 🌟
  * **Thấu Cảm (Compassion)** ❤️
  * **Kiên Cường (Resilience)** 🛡️
  * **Năng Động (Energy)** ⚡
* **Khám phá đã mở khóa (Likes & Dislikes)**: Danh sách tổng hợp những gì bé thỏ Thích và Ghét được tích lũy từ các lựa chọn đối thoại phiêu lưu của người dùng (Ví dụ: Thích trà matcha, ghét tiếng sấm sét).

---

## 2. Thiết Kế & Tối Ưu UX/UI Cao Cấp (Cozy Premium Aesthetics - Finch Clone)

Để biến web app này đạt tới độ lôi cuốn, mượt mà và dễ thương như Finch, chúng ta sẽ xây dựng các Layout UI chi tiết như sau:

### A. Giao diện Thỏ đi Thám hiểm (Adventure Screen Layout)
* Khi Thỏ đang thám hiểm (`adventure_status === 'adventuring'`), nửa trên màn hình chính (Pet Room) sẽ chuyển đổi toàn bộ sang một hoạt cảnh ngoài trời:
  ```
  +---------------------------------------------------+
  |  [🔥 5 Ngày]                           [💰 120 Xu] |
  |                                                   |
  |  Bé thỏ đang thám hiểm tại Vườn Thông Cozy... 🌲   |
  |  +---------------------------------------------+  |
  |  | [=========== Thanh Tiến Trình 62% ==========] |  |
  |  +---------------------------------------------+  |
  |                                                   |
  |                   * Mây trôi lơ lửng *            |
  |                                                   |
  |               🐰   🐰   🐰 (Thỏ đang chạy lon ton) |
  |        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ (Nền cỏ động) |
  +---------------------------------------------------+
  ```
  * **UI/UX Details**:
    * Sử dụng **Parallax CSS Background**: Nền mây trôi rất chậm ở xa, đồi núi chạy vừa, và thảm cỏ dưới chân chạy nhanh hơn để tạo ảo giác chuyển động 3D sâu sắc.
    * Thỏ chuyển sang Sprite chạy/đi bộ (`happy` hoặc `walk` loop).
    * Thỉnh thoảng nhả ra các suy nghĩ dễ thương trong bong bóng hội thoại: *"Gió hôm nay thơm mùi đất quá..."*, *"Không biết có gặp bạn bướm nào không nhỉ?"*.

### B. Popup Hội Thoại Thám Hiểm Trở Về (Story Dialog Card Layout)
* Giao diện đối thoại kể chuyện của Thỏ được thiết kế theo đúng triết lý của Finch:
  ```
  +---------------------------------------------------+
  |                 XEM THU HOẠCH                     |
  |                                                   |
  |                 +---------------+                 |
  |                 |               |                 |
  |                 |  Minh hoạ Thỏ |                 |
  |                 |  & Vật phẩm   |                 |
  |                 |               |                 |
  |                 +---------------+                 |
  |                                                   |
  |  🐰 "Hôm nay tớ nhặt được chiếc vỏ ốc lạ tai trên  |
  |  cát. Tớ thắc mắc không biết có phải biển cả      |
  |  đang gửi tin nhắn cho tớ không?"                 |
  |                                                   |
  |  +---------------------------------------------+  |
  |  |  A. "Mỗi chiếc vỏ ốc giữ tiếng nói đại dương" |  |
  |  |  (Nurtures: Thấu Cảm ❤️)                       |  |
  |  +---------------------------------------------+  |
  |  |  B. "Đó chỉ là tiếng gió lùa thôi, nhưng      |  |
  |  |  nó rất thư giãn đấy chứ!"                    |  |
  |  |  (Nurtures: Logic/Tò Mò 🌟)                   |  |
  |  +---------------------------------------------+  |
  +---------------------------------------------------+
  ```
  * **UI/UX Details**:
    * Giao diện **Glassmorphic Card** đặt trên một lớp overlay tối mờ (`bg-black/50 backdrop-blur-md`).
    * Phần nội dung câu hỏi được đặt trong một bong bóng hội thoại bo tròn to, có đuôi chĩa về phía thỏ.
    * Các phương án lựa chọn được thiết kế như những chiếc **nút 3D dày dặn**, bo tròn mạnh (`rounded-2xl`), có màu pastel dịu (xanh lá nhạt, hồng sữa nhạt) kèm biểu tượng chỉ số tính cách nhỏ (ví dụ: ❤️, 🌟).

### C. Nhật Ký Cảm Xúc Hàng Ngày (Mood Check-in UI Layout)
* Bảng Mood Check-in được thiết kế để hạn chế sự căng thẳng, tăng tính khích lệ:
  ```
  +---------------------------------------------------+
  |               Hôm nay bạn thế nào?                |
  |                                                   |
  |    😭        🙁        😐        🙂        😆     |
  |  Rất tệ  Không tốt Bình thường Khá tốt  Tuyệt vời |
  |                                                   |
  |  Cảm xúc này liên quan đến điều gì? (Chọn tags)   |
  |  [Công việc 💼] [Gia đình 🏠] [Giấc ngủ 😴] [Bạn bè 👥] |
  |  [Sức khỏe 🩺]  [Ăn uống 🍎]  [Thời tiết ⛅]           |
  |                                                   |
  |  Ghi chép nhanh điều bạn biết ơn hôm nay:         |
  |  +---------------------------------------------+  |
  |  | Gõ 1 điều nhỏ bé làm bạn cười...            |  |
  |  +---------------------------------------------+  |
  |                                                   |
  |             [ HOÀN THÀNH - NHẬN 💰15 ]            |
  +---------------------------------------------------+
  ```
  * **UI/UX Details**:
    * 5 nút Mood có kích thước lớn, màu sắc pastel khác nhau (xám, xanh dương nhạt, vàng nhạt, cam nhạt, hồng nhạt).
    * Khi di chuột hoặc chạm vào icon mood, icon sẽ thực hiện **bouncy hover animation** (nhún nhảy nhẹ).
    * Các pill badges tag có trạng thái Active rõ ràng (chuyển từ nền xám nhẹ sang nền màu pastel có viền sáng).

### D. Đồng Hồ Luyện Thở Chánh Niệm (Box Breathing Guide Layout)
* Thiết kế tối giản, dịu mắt giúp giảm stress:
  ```
  +---------------------------------------------------+
  |                LUYỆN THỞ BOX BREATHING            |
  |                                                   |
  |                      HÍT VÀO                      |
  |                                                   |
  |                     /---------\                   |
  |                    /           \                  |
  |                   |     4s      |                 |
  |                    \           /                  |
  |                     \---------/                   |
  |                                                   |
  |               (Vòng tròn đang nở to...)           |
  |                                                   |
  |               [======= 01:24 =======]             |
  +---------------------------------------------------+
  ```
  * **UI/UX Details**:
    * Sử dụng **background màu xanh rừng thông trầm / xanh ngọc bích tối** (`bg-[#1c2e24]`) để tạo cảm giác tĩnh tâm.
    * Vòng tròn ở trung tâm sử dụng CSS Keyframe/Transition để **phồng to ra trong 4s (Hít vào), đứng yên 4s (Nín giữ), co nhỏ lại trong 4s (Thở ra), đứng yên 4s (Nín giữ)**.
    * Văn bản hướng dẫn hiển thị to, rõ ràng và thay đổi mượt mà theo nhịp thở.
    * Bổ sung âm thanh nhịp thở nhẹ nhàng hoặc nhạc nền sóng biển êm dịu (có nút tắt tiếng).

### E. Khu Phố Thỏ Bạn Bè (Tree Town Layout)
* Hiển thị danh sách bạn bè trực quan và đáng yêu:
  ```
  +---------------------------------------------------+
  |               KHU PHỐ THỎ (TREE TOWN)             |
  |                                                   |
  |  Mã bạn bè của bạn: [  ABC-123  ] [Copy]           |
  |  [ + Thêm hàng xóm bằng mã ]                       |
  |                                                   |
  |  Hàng xóm của bạn:                                |
  |  +----------------+ +----------------+ +--------+ |
  |  |    🍡 Mochi     | |    🍪 Biscuit   | | ...    | |
  |  |    (Stage 2)   | |    (Stage 6)   | |        | |
  |  |      🐰🐰      | |      🐰🐰      | |        | |
  |  |  [ Gửi Vibe 🫂] | |  [ Gửi Vibe 💧] | |        | |
  |  +----------------+ +----------------+ +--------+ |
  +---------------------------------------------------+
  ```
  * **UI/UX Details**:
    * Danh sách bạn bè hiển thị dưới dạng các **Card vuông góc tròn bo mềm** nằm cạnh nhau.
    * Mỗi card hiển thị tên người bạn, emoji đại diện, stage hiện tại của thỏ bạn bè, và một canvas nhỏ vẽ bé thỏ đó đang nhảy múa mừng rỡ.
    * Bấm vào nút "Gửi Vibe" sẽ hiển thị một menu lướt nhẹ từ dưới lên (Bottom Sheet) cho phép chọn nhanh các biểu tượng cảm xúc gửi đi.

### F. Shop Xoay Tua & Live Preview (Shop Shelf Layout)
* Giao diện quầy hàng gỗ sinh động:
  ```
  +---------------------------------------------------+
  |  CỬA HÀNG QUẦY GỖ                     ⏰ 08:24:12  |
  |                                                   |
  |  +---------------------------------------------+  |
  |  |               PREVIEW PHÒNG                 |  |
  |  |   (Xem thử đồ nội thất/trang phục đã chọn)   |  |
  |  +---------------------------------------------+  |
  |                                                   |
  |     Món Đồ Hôm Nay (Flash Sale):                  |
  |  +----------------+  +----------------+           |
  |  | [Ảnh vật phẩm] |  | [Ảnh vật phẩm] |           |
  |  | Giường Sồi 🪵  |  | Áo Đầu Bếp 👨‍🍳  |           |
  |  | 💰 120 Xu      |  | 💰 200 Xu      |           |
  |  +----------------+  +----------------+           |
  +---------------------------------------------------+
  ```
  * **UI/UX Details**:
    * Bộ khung **Preview Phòng** tích hợp trực tiếp ở nửa trên của Shop Modal. Khi người dùng click vào một món đồ trên kệ bán, món đồ đó sẽ tạm thời xuất hiện trên khung Preview (bố trí đúng slot rug/wallpaper/outfit) để người dùng thấy ngay hiệu quả hình ảnh trước khi mua.
    * Countdown Timer chạy trực quan đếm ngược đến 00:00:00 (reset shop) được đặt ở góc trên phải với thiết kế đồng hồ cổ điển.

### G. Giao diện Đếm Giờ Đồng Hành (Focus Timer UI Layout)
* Giao diện Timer tập trung nhưng không hề đơn điệu nhờ sự đồng hành của Thỏ:
  ```
  +---------------------------------------------------+
  |              ĐANG TẬP TRUNG...                    |
  |                                                   |
  |                  +-------------+                  |
  |                  |    🐰📝     |                  |
  |                  | (Thỏ viết)  |                  |
  |                  +-------------+                  |
  |                                                   |
  |                      24:59                        |
  |  +---------------------------------------------+  |
  |  | [=========== Thanh Tiến Trình ============] |  |
  |  +---------------------------------------------+  |
  |                                                   |
  |     🔊 Nhạc: [ Lofi Học Tập 🎧 ] (Có thể đổi)     |
  |                                                   |
  |                 [ BỎ CUỘC 🚩 ]                    |
  +---------------------------------------------------+
  ```

### H. Giao diện Hồ Sơ Pet & Tính Cách (Pet Profile Dashboard Layout)
* Nơi lưu trữ thông tin và cá nhân hóa chú thỏ:
  ```
  +---------------------------------------------------+
  |                 HỒ SƠ BÉ THỎ                      |
  |                                                   |
  |              🐰 Bé Thỏ Con (Cấp 12)               |
  |                                                   |
  |  Tính Cách của Thỏ:                               |
  |  🌟 Tò Mò:    [======= 42% =======]               |
  |  ❤️ Thấu Cảm:  [============ 65% =======]          |
  |  🛡️ Kiên Cường:[====== 35% =======]               |
  |  ⚡ Năng Động: [==== 20% =======]                 |
  |                                                   |
  |  Sở Thích đã Khám phá:                            |
  |  💚 Thích: Bánh ngọt 🍰, Nhạc Lofi 🎧, Đọc sách    |
  |  💔 Ghét:  Trời sấm sét ⛈️, Bị đói bụng 😿          |
  +---------------------------------------------------+
  ```

---

## 3. Tái Cấu Trúc Quản Lý Giao Diện (UI State Refactoring - CRITICAL)

Hiện tại, màn hình chính `HomeView.tsx` đang quản lý các hộp thoại (modal) bằng rất nhiều biến boolean độc lập (`isSettingsOpen`, `isShopOpen`, `isAlbumOpen`, `isNeighborOpen`, v.v.). Khi tích hợp thêm 4-5 modal tính năng mới của Finch, cách tiếp cận cũ sẽ bộc lộ điểm yếu chết người: **nguy cơ xung đột chồng chéo UI (chồng modal lên nhau), khó quản lý luồng chuyển cảnh (transition), và làm phình to mã nguồn.**

Chúng ta sẽ thực hiện **refactor kiến trúc hoạt động của giao diện** như sau:

### A. Quản lý trạng thái hộp thoại tập trung (Centralized Active Overlay State)
Thay thế toàn bộ các biến cờ boolean độc lập bằng một biến state duy nhất quản lý bằng kiểu dữ liệu Enum:
```typescript
type ActiveOverlay =
  | null            // Không mở gì (Màn hình chính thói quen + phòng Pet)
  | "settings"      // Cài đặt hệ thống
  | "shop"          // Cửa hàng nội thất/outfit
  | "album"         // Sổ tay kỷ niệm
  | "neighbor"      // Thăm hàng xóm NPC
  | "habit_form"    // Form thêm/sửa thói quen
  | "timer"         // Bộ đếm giờ tập trung
  | "mood_checkin"  // Báo cáo cảm xúc hằng ngày
  | "breathing"     // Luyện thở chánh niệm
  | "first_aid"     // Hộp cứu hộ tâm lý khẩn cấp
  | "pet_profile"   // Hồ sơ tính cách/sở thích của pet
  | "celebration";  // Màn hình ăn mừng thành tựu/checkin
```

### B. Thiết kế bộ phân phối phủ màn hình (Overlay Coordinator Pattern)
Trong `HomeView.tsx`, thay vì render đống modal song song trực tiếp, chúng ta sẽ gom chúng vào một bộ điều phối duy nhất:
```tsx
{/* Centralized Modals & Overlays Coordinator */}
{activeOverlay && (
  <div className="overlay-container">
    {activeOverlay === "settings" && <SettingsModal ... onClose={closeOverlay} />}
    {activeOverlay === "shop" && <ShopModal ... onClose={closeOverlay} />}
    {activeOverlay === "album" && <MemoryAlbumModal ... onClose={closeOverlay} />}
    {activeOverlay === "timer" && <TimerModal ... onClose={closeOverlay} />}
    {activeOverlay === "mood_checkin" && <MoodCheckinModal ... onClose={closeOverlay} />}
    {activeOverlay === "breathing" && <BreathingModal ... onClose={closeOverlay} />}
    {activeOverlay === "first_aid" && <FirstAidModal ... onClose={closeOverlay} />}
    {activeOverlay === "pet_profile" && <PetProfileModal ... onClose={closeOverlay} />}
    {/* ... */}
  </div>
)}
```

### C. Đánh giá ưu nhược điểm (Trade-offs)
*   **Ưu điểm (Pros):**
    *   **Tuyệt đối không chồng chéo:** Đảm bảo tại một thời điểm chỉ có tối đa 1 màn hình overlay hoặc modal được mở. Tránh hiện tượng 2 modal mở đè lên nhau gây lỗi che lấp/crash UI.
    *   **Quản lý luồng chuyển cảnh mượt mà:** Chuyển đổi giữa các màn hình (ví dụ từ Đóng cửa hàng -> Mở Pet Profile) diễn ra tuần tự, dễ dàng tích hợp hiệu ứng CSS animation (Fade out -> Fade in).
    *   **Dễ bảo trì & mở rộng:** Khi thêm tính năng mới, chỉ cần khai báo thêm một case vào Enum `ActiveOverlay` thay vì tạo thêm 3-4 biến state độc lập.
*   **Nhược điểm (Cons):**
    *   Cần chỉnh sửa lại toàn bộ sự kiện click mở modal trong `HomeView.tsx` và callbacks của `BottomNav.tsx`. Tuy nhiên, đây là chi phí kỹ thuật hoàn toàn xứng đáng để đảm bảo dự án chạy ổn định lâu dài.

---

## 4. Thiết Kế Cơ Sở Dữ Liệu (DB Schema Changes)

Để hỗ trợ các tính năng trên, chúng ta cần chạy một script migration bổ sung các cột và bảng mới vào database Supabase hiện tại.

### Cập nhật bảng `public.profiles`:
```sql
-- Chỉ số tính cách của Pet
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_curiosity INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_compassion INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_resilience INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_energy INTEGER DEFAULT 10;

-- Lưu trữ kịch bản Thích/Ghét dạng Array Text
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pet_likes TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pet_dislikes TEXT[] DEFAULT '{}';

-- Trạng thái phiêu lưu thám hiểm
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_energy INTEGER DEFAULT 0; -- Tích lũy từ thói quen (0-30)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_status TEXT DEFAULT 'idle'; -- 'idle', 'adventuring', 'returned'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_start_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_story_id TEXT; -- Lưu ID câu chuyện hiện tại khi thỏ quay về
```

### Bảng mới `public.friendships` (Kết nối bạn bè):
```sql
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own friendships" ON public.friendships FOR ALL USING (auth.uid() = user_id);
```

### Bảng mới `public.social_vibes` (Hộp thư gửi vibes tích cực):
```sql
CREATE TABLE IF NOT EXISTS public.social_vibes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vibe_type TEXT NOT NULL, -- 'hug', 'water', 'cheer'
  claimed_at TIMESTAMPTZ, -- Lưu thời điểm đã đọc để ẩn hoặc nhận quà
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.social_vibes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own received vibes" ON public.social_vibes FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Users can send vibes" ON public.social_vibes FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own received vibes" ON public.social_vibes FOR UPDATE USING (auth.uid() = receiver_id);
```

---

## 5. Kiến Trúc Kỹ Thuật & Cấu Trúc File Mới

Để tránh làm xáo trộn cấu trúc hiện tại và duy trì tính ổn định của dự án (theo **Rule #4: Preserve Existing Architecture**), chúng ta sẽ tổ chức các tính năng mới thành các module rõ ràng:

```
apps/web/src/
├── app/[locale]/
│   └── actions.ts               <-- Cập nhật Server Actions: thám hiểm, gửi vibe, check-in tâm trạng, sở thích thỏ
├── components/
│   ├── adventure/               <-- [NEW] Thư mục chứa UI thám hiểm
│   │   ├── AdventureView.tsx    <-- UI thỏ đi bộ ngoài trời + thanh tiến trình + Parallax background
│   │   └── StoryDialogModal.tsx <-- Pop-up đối thoại khi thỏ mang quà về
│   ├── mindfulness/             <-- [NEW] Thư mục chứa bài tập chánh niệm
│   │   ├── BreathingModal.tsx   <-- Giao diện luyện thở Box Breathing
│   │   ├── MoodCheckinModal.tsx <-- Giao diện check-in cảm xúc buổi sáng
│   │   └── FirstAidModal.tsx    <-- [NEW] Giao diện Hộp Sơ Cứu Tâm Lý (Grounding, Shake tension)
│   ├── social/                  <-- [NEW] Nâng cấp mục Hàng xóm
│   │   └── TreeTownModal.tsx    <-- Pop-up Tree Town thêm bạn bè bằng code + gửi vibes
│   └── home/
│       ├── ShopModal.tsx        <-- [MODIFY] Tích hợp xoay tua sản phẩm ngày + Preview phòng
│       ├── PetProfileModal.tsx  <-- [NEW] Pop-up hiển thị tính cách, cấp độ và danh sách Likes/Dislikes
│       └── HomeView.tsx         <-- [MODIFY] Ráp các mảnh ghép (Adventure, Mood, Breathing, FirstAid) vào luồng chính
└── lib/
    ├── adventure_stories.ts     <-- [NEW] Thư viện kịch bản đối thoại, lựa chọn, điểm tính cách và Likes/Dislikes
    └── social.ts                <-- [NEW] Helpers xử lý kết bạn, gửi/nhận rung cảm
```

---

## 6. Kịch Bản Thám Hiểm Mẫu & Định Hình Sở Thích (Adventure Stories & Likes)
Chúng ta sẽ định nghĩa một danh sách các câu chuyện khám phá dễ thương có tác dụng định hình cả tính cách lẫn sở thích trong [adventure_stories.ts](file:///Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/titroutine/apps/web/src/lib/adventure_stories.ts):

* **Story 1: Hạt mầm dũng cảm**
  * *Lời kể*: "Tớ tìm thấy một hạt mầm nhỏ đang cố nứt ra giữa khe đá cằn cỗi. Tớ có nên đem nó về trồng trong chậu không?"
  * *Lựa chọn A*: "Đem về chăm sóc nhé, bé cần tình yêu thương!" -> **Thấu cảm +3**. Thỏ cưng mở khóa sở thích: **Thích: Chăm sóc cây xanh 🌱**.
  * *Lựa chọn B*: "Hãy để hạt mầm tự chiến đấu với sỏi đá, nó sẽ kiên cường hơn!" -> **Kiên cường +3**. Thỏ mở khóa sở thích: **Thích: Phiêu lưu mạo hiểm ⛰️**.
* **Story 2: Trà Match Latte**
  * *Lời kể*: "Tớ ngửi thấy hương vị thơm lừng tỏa ra từ quán cà phê bên đường. Bạn nhân viên đã tặng tớ một ly Trà sữa Matcha nóng hổi nhưng vị hơi đắng đắng..."
  * *Lựa chọn A*: "Tuyệt vời, uống trà nóng sẽ giữ ấm bụng cho cậu!" -> **Năng động +3**. Thỏ mở khóa: **Thích: Trà sữa Matcha 🍵**.
  * *Lựa chọn B*: "Vị đắng đó khó uống lắm đúng không? Trả lại bạn ấy đi." -> **Curiosity +2**. Thỏ mở khóa: **Ghét: Đồ ăn đắng 🤮**.
* **Story 3: Cơn mưa rào bất chợt**
  * *Lời kể*: "Cơn mưa rào đổ ập xuống khi tớ chưa kịp tìm chỗ trú. Tớ đã dùng chiếc lá sen to để che đầu và cùng nghe tiếng mưa."
  * *Lựa chọn A*: "Biết cách tận hưởng cả những lúc bão bùng, cậu giỏi lắm!" -> **Kiên cường +3**. Thỏ mở khóa: **Thích: Tiếng mưa rơi 🌧️**.
  * *Lựa chọn B*: "Lần sau nhớ xem dự báo thời tiết trước khi đi nha!" -> **Năng động +3**. Thỏ mở khóa: **Ghét: Bị ướt mưa ☔**.

---

## 7. Kế Hoạch Kiểm Thử & Xác Minh (Verification Plan)

### Kiểm thử Tự Động (Automated Verification)
1. **Kiểm tra biên dịch & Typecheck**:
   ```bash
   cd apps/web && npm run build
   ```
2. **Kiểm tra Logic thuần**:
   * Viết test unit cho hàm tính toán tích lũy năng lượng khám phá, tích lũy điểm tính cách, và cơ chế tính toán shop xoay tua theo ngày (sử dụng seed dựa trên ngày hiện tại).

### Kiểm thử Thủ Công (Manual Verification)
1. Đăng nhập hệ thống, nhấn hoàn thành thói quen để xem thanh năng lượng khám phá chạy lên.
2. Kiểm tra khi năng lượng đạt 30/30, giao diện thỏ chuyển thành đang đi bộ ngoài trời (Adventure View) cùng âm thanh xào xạc hoặc hiệu ứng động dễ thương.
3. Chờ hết thời gian (hoặc nhấn nút tua nhanh trên Settings DevTools) để thỏ quay về -> Mở StoryDialogModal -> Lựa chọn phương án -> Xác minh điểm tính cách tăng lên trong phần Thông tin Pet.
4. Mở Cửa hàng, xác minh hôm nay chỉ hiển thị ngẫu nhiên 4 món đồ, và sang ngày hôm sau các món đồ tự động thay đổi.
5. Tạo hai tài khoản thử nghiệm trên local, lấy Friend Code của tài khoản A nhập vào tài khoản B. Từ tài khoản B, gửi "Vibe tích cực" sang A. Đăng nhập tài khoản A và xem pop-up chúc mừng nhận vibe nhảy lên sinh động.

---

## 8. Câu Hỏi Khảo Sát & Lựa Chọn Thiết Kế (User Review Required)

> [!IMPORTANT]
> Vui lòng phản hồi các điểm thiết kế dưới đây để tôi có thể tinh chỉnh chi tiết code:
> 1. **Thời gian thám hiểm lý tưởng**: Bạn muốn thỏ thám hiểm trong bao lâu? (Ví dụ: **1 giờ** giống Finch để kích thích tính kiên nhẫn, hay chỉ **30 giây - 1 phút** để người dùng trải nghiệm tức thì trên web app?).
> 2. **Cơ chế Bạn bè thực sự**: Bạn muốn kết nối bạn bè bằng cách lưu trữ dữ liệu thật trên Supabase (như bảng `friendships` đề xuất ở trên), hay chỉ muốn giả lập danh sách hàng xóm NPC thông minh có sẵn để tối giản hóa bảo trì?
> 3. **Hộp thoại chúc mừng check-in**: Mood Check-in có nên tự động hiện lên ngay khi người dùng vừa mở app vào buổi sáng không?
