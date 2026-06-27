# Titroutine — Kế hoạch tạo Asset cho Gemini (Nano Banana)

> File giao việc cho Gemini. Mỗi mục có: **tên file**, **kích thước/layout**, và **prompt** (tiếng Anh — model vẽ tốt hơn). Cứ copy `STYLE ANCHOR` + prompt riêng của từng item.
>
> Thư mục đích:
>
> - Sprite thỏ (nhân vật): `apps/web/public/assets/`
> - Vật phẩm phòng (shop): `apps/web/public/assets/items/`

---

## 0. STYLE ANCHOR (dán kèm MỌI prompt)

```
Cozy 2D game asset, hand-drawn cartoon illustration, soft pastel earthy palette
(cream, warm beige, soft brown, muted pastels), gentle soft shadows, clean rounded
shapes, Animal Crossing / Stardew Valley cozy aesthetic, fully transparent
background (PNG), no text, no watermark, high resolution.
```

Wallpaper là ảnh nền full-bleed nên dùng anchor riêng (ghi ở mục E).

> ⚠️ **KHÓA PHONG CÁCH — đọc kỹ, đừng đổi:** vẽ **minh hoạ cozy vẽ tay** (cozy
> hand-drawn). **TUYỆT ĐỐI KHÔNG pixel-art.** 7 sprite thỏ đang có đều là minh hoạ
> mềm; nếu trộn pixel-art sẽ lệch hẳn phong cách. Quan trọng hơn: với sprite nhân
> vật phải vẽ **đúng kích thước frame ghi ở mục B** — nếu vẽ "128×128 chung chung"
> thì code cắt frame sẽ sai và animation vỡ. Tôn trọng số đo từng stage.

---

## 1. PHÂN LOẠI HIỆU ỨNG (đọc trước khi vẽ)

App có **3 nhóm hiệu ứng khác nhau** — đừng trộn lẫn:

### Nhóm A — Hiệu ứng HÀNH ĐỘNG (Action animations)

Animation ngắn, lặp lại, thể hiện _trạng thái hiện tại_ của thỏ: `idle`, `sleep`,
`happy`, `sad`, `eat`, `study`, `welcome`. Kích hoạt bởi giờ trong ngày, hoàn thành
habit, hoặc chạm vào thỏ. **Đây là hiệu ứng "tự nhiên" — giữ nguyên cơ chế.**

⚠️ **Vấn đề hiện tại:** chỉ **stage 1 (Thỏ Con)** và **stage 4 (Bé Gái Thỏ)** có đủ
bộ action. Các stage 0, 2, 3, 5, 6 **chỉ có 1 animation idle** → khi hoàn thành habit
chúng không "vui/buồn". Cần vẽ bổ sung sheet action (mục B).

### Nhóm B — Hiệu ứng TIẾN HOÁ (Evolution transitions) ⭐ trọng tâm đợt này

Khoảnh khắc _cột mốc_ khi thỏ đổi hình thái (trứng → thỏ con → ...). Trước đây bị
đổi sprite tức thì + diễn ra quá nhanh (3 ngày đã nở) nên rất "thiếu tự nhiên".

✅ **Phần code đã xử lý:** giãn nhịp độ (nở ở **ngày 7**, hình thái cuối ~**120 ngày**),
tiến hoá **không bao giờ tụt hạng** (đứt streak không về lại trứng), và có **popup
"Tiến Hoá!"** khi lên hình thái mới.

🎨 **Phần Gemini cần vẽ:** hiệu ứng _chuyển cảnh_ để cú tiến hoá ra dáng sự kiện
(mục A của bảng art bên dưới): chuỗi trứng nứt dần + khoảnh khắc nở, và một hiệu
ứng "hào quang" dùng chung khi lên cấp.

### Nhóm C — Hiệu ứng MÔI TRƯỜNG / TRANG TRÍ (Room & cosmetic)

Vật phẩm tĩnh người dùng tự trang bị: `wallpaper`, `rug`, `object`, `outfit`.
Không animation (trừ outfit gắn theo sprite thỏ).

---

## 2. KIỂM KÊ ASSET ĐÃ CÓ (không vẽ lại)

- ✅ 7 sprite hình thái thỏ: egg, baby_rabbit, young_rabbit, spirit_rabbit, bunny_child, bunny_teen, bunny_woman
- ✅ 5 ảnh kỷ niệm: `memory_day_{1,30,100,365,1000}.png`
- ✅ 5 vật phẩm shop: `wallpaper_{floral,stars,forest}.png`, `rug_{cloud,rainbow}.png`

---

## A. HIỆU ỨNG TIẾN HOÁ — cần vẽ mới (ưu tiên 1)

| File                     | Layout                                                                | Prompt riêng (nối sau STYLE ANCHOR)                                                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `egg_hatch_sprite.png`   | Sprite sheet **6 frame ngang**, mỗi frame **256×256**                 | `a cute speckled egg hatching step by step across 6 frames: frame 1 intact egg, frames 2-4 progressively bigger cracks with light leaking out, frame 5 egg bursting open with a sparkle flash, frame 6 empty cracked shell halves; warm soft lighting, same cream-and-brown egg as a cozy pet game` |
| `fx_evolution_burst.png` | Sprite sheet **6 frame ngang**, mỗi frame **300×300**, nền trong suốt | `a magical evolution light burst effect animation, 6 frames: a soft white-and-gold radial glow growing then bursting into sparkles and star particles, fuchsia and purple accents, centered, no character, transparent background — an overlay effect to play when a pet evolves`                   |

> Ghi chú: 2 asset này là _overlay_ phát 1 lần khi tiến hoá. Sau khi có file, tôi sẽ
> ráp vào React (chơi khi `pet_stage` tăng). Trước mắt popup "Tiến Hoá!" đã chạy.

---

## B. BỘ ACTION CHO CÁC STAGE CÒN THIẾU (ưu tiên 2)

Mục tiêu: mọi hình thái đều biết vui/buồn/ngủ/học như stage 1 & 4.

**Quy ước layout:** grid **4 cột × 5 hàng** (đúng _hình dạng grid_ của 2 sheet đã có
ở stage 1 & 4; riêng _thứ tự hàng_ dưới đây là quy ước mới, tôi sẽ map offsetY trong
code cho khớp — Gemini cứ vẽ đúng thứ tự này).

- 4 cột = 4 frame của 1 action (chạy trái→phải).
- 5 hàng theo đúng thứ tự: **idle, happy, sad, sleep, study**.
- Mỗi ô **KHÔNG cần vuông** — dùng đúng số đo `ô` ở cột giữa bảng. Thỏ đứng giữa ô,
  cùng tỉ lệ và cùng vị trí chân giữa các hàng để animation không bị "nhảy".

| File                        | Ô / Tổng sheet              | Prompt riêng (nối sau STYLE ANCHOR)                                                                                                                                                               |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `young_rabbit_actions.png`  | ô 236×345 → sheet 944×1725  | `a small fluffy young rabbit character sprite sheet, 4 columns x 5 rows, rows = idle, happy, sad, sleeping, studying; consistent character, side-friendly cozy style`                             |
| `spirit_rabbit_actions.png` | ô 245×474 → sheet 980×2370  | `an ethereal glowing spirit rabbit character sprite sheet, 4 columns x 5 rows, rows = idle, happy, sad, sleeping, studying; soft magical glow, indigo-purple night palette, consistent character` |
| `bunny_teen_actions.png`    | ô 222×385 → sheet 888×1925  | `a cute teen bunny girl character sprite sheet, 4 columns x 5 rows, rows = idle, happy, sad, sleeping, studying; consistent character, cozy pastel style`                                         |
| `bunny_woman_actions.png`   | ô 299×516 → sheet 1196×2580 | `an elegant young woman bunny character sprite sheet, 4 columns x 5 rows, rows = idle, happy, sad, sleeping, studying; consistent character, warm cozy palette`                                   |

> (Stage 0 trứng dùng `egg_hatch_sprite.png` ở mục A, không cần bộ action.)

---

## C. ĐỒ NỘI THẤT — slot `object` (ưu tiên 2, phòng đang trống)

File: `apps/web/public/assets/items/object_*.png` — vật thể đơn, nền trong suốt, ~**512×512**.

| ID                   | Tên (VI)     | Prompt riêng                                                                                                           |
| -------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `object_bed_cozy`    | Giường êm    | `a small cozy pet bed, round cushion with a fluffy blanket and tiny pillow, pastel peach and cream, 3/4 top-down view` |
| `object_lamp_warm`   | Đèn ấm       | `a cute floor lamp with a warm glowing yellow light, soft beige lampshade, slim wooden stand`                          |
| `object_plant_pot`   | Chậu cây     | `a potted houseplant, monstera leaves in a terracotta pot, fresh green`                                                |
| `object_bookshelf`   | Kệ sách      | `a small wooden bookshelf with colorful pastel books and a tiny plant on top, front view`                              |
| `object_window_day`  | Cửa sổ ngày  | `a cozy arched window with warm daylight, white frame, flower box with pastel flowers`                                 |
| `object_bowl_carrot` | Bát cà rốt   | `a cream ceramic food bowl filled with fresh orange carrots, top-down 3/4 view`                                        |
| `object_frame_photo` | Khung ảnh    | `a cute hanging picture frame with a tiny pastel landscape inside, wooden frame`                                       |
| `object_clock_wall`  | Đồng hồ      | `a round wall clock with a cream face and soft brown rim, minimal cute numbers`                                        |
| `object_tea_table`   | Bàn trà      | `a small round wooden tea table with a steaming cup of tea and cookies, 3/4 view`                                      |
| `object_toy_ball`    | Bóng đồ chơi | `a cute striped pastel toy ball, soft rubber texture`                                                                  |

> Cần tôi thêm code render `object` trong phòng (giống cách rug đang vẽ) + thêm entry vào `lib/items.ts`. Báo khi bạn muốn.

---

## D. TRANG PHỤC — slot `outfit` (ưu tiên 3, phức tạp)

Outfit phải là **sprite sheet khớp đúng frame của hình thái** đang mặc (hiện code chỉ
hỗ trợ stage 6). Mỗi outfit = 1 sheet vẽ lại thỏ **đang mặc đồ đó**, cùng layout với
`bunny_woman` (ô 299×516).

File: `apps/web/public/assets/outfit_<id>_sprite.png`

| ID                    | Prompt riêng                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `outfit_summer_dress` | `the same young woman bunny wearing a light summer floral dress, idle animation frames, consistent character and proportions` |
| `outfit_winter_coat`  | `the same young woman bunny wearing a cozy knitted winter coat and scarf, idle animation frames`                              |
| `outfit_chef`         | `the same young woman bunny wearing a white chef outfit and hat, idle animation frames`                                       |

> Khuyến nghị làm sau cùng — cần chốt số frame/animation cho từng stage trước khi mở rộng outfit ra nhiều hình thái.

---

## E. WALLPAPER & RUG BỔ SUNG (ưu tiên 4)

**Wallpaper** — nền full-bleed, **dùng anchor riêng:**

```
Seamless cozy room wallpaper background, soft pastel, full-bleed, NO characters,
NO furniture, NO text, gentle gradient, tileable room backdrop. ~1024x1024.
```

File: `apps/web/public/assets/items/wallpaper_*.png`

| ID                 | Prompt riêng                                                              |
| ------------------ | ------------------------------------------------------------------------- |
| `wallpaper_beach`  | `pastel beach at sunset, soft pink-orange sky, calm sea, palm silhouette` |
| `wallpaper_cafe`   | `cozy warm cafe wall, soft brown wood tones, hanging string-light bokeh`  |
| `wallpaper_rainy`  | `soft rainy window mood, muted blue-grey, gentle rain streaks`            |
| `wallpaper_winter` | `cozy snowy night, soft deep blue, falling snowflakes, warm glow`         |

**Rug** — object nền trong suốt, góc nhìn hơi nghiêng (dùng STYLE ANCHOR), ~**512×512**.
File: `apps/web/public/assets/items/rug_*.png`

| ID                | Prompt riêng                                                              |
| ----------------- | ------------------------------------------------------------------------- |
| `rug_round_cream` | `a round fluffy cream rug, soft fur texture, slight top-down perspective` |
| `rug_grass`       | `an oval grass patch rug, fresh green with tiny flowers`                  |
| `rug_heart`       | `a heart-shaped pink fluffy rug, cozy and cute`                           |

---

## Thứ tự đề xuất giao Gemini

1. **A** (hatch + evolution burst) — để cú tiến hoá ra dáng production.
2. **B** (action cho stage 2,3,5,6) — để mọi hình thái biết phản ứng.
3. **C** (object) — lấp phòng trống.
4. **E** (wallpaper/rug) — nhiều lựa chọn cho shop.
5. **D** (outfit) — sau cùng.
