# GEMINI — Danh sách việc vẽ asset (chia phase)

> File giao việc **thực thi** cho Gemini (Nano Banana). Bản mô tả tổng thể + prompt gốc
> nằm ở [GEMINI_ASSETS_PLAN.md](GEMINI_ASSETS_PLAN.md); file này là **checklist đã cập
> nhật theo hiện trạng** — chỉ liệt kê thứ **CÒN THIẾU / VẼ SAI cần vẽ lại**.
>
> Phần code (cắt sprite, ráp animation, shop, scheduler) là việc của Claude. **Gemini
> chỉ vẽ ảnh.** Vẽ xong 1 phase thì báo lại để Claude chạy script + ráp vào app.

---

## ⚠️ LUẬT BẮT BUỘC — đọc trước, áp dụng cho MỌI phase

1. **Mỗi lần chỉ làm ĐÚNG 1 phase.** Không nhảy phase, không gộp. Làm xong G1 mới tới G2.
2. **KHÔNG pixel-art.** Vẽ **cozy hand-drawn** (Animal Crossing / Stardew) giống 7 sprite thỏ đang có. Trộn pixel-art là hỏng cả bộ.
3. **Nền phẳng một màu.** Vẽ nhân vật trên **nền MỘT MÀU đồng nhất, phủ kín toàn khung kể cả 4 góc**, và **khác hẳn** mọi màu trên thân thỏ (ví dụ nền xanh lá neon `#00FF66` hoặc hồng cánh sen `#FF3EA5`). **KHÔNG tự tách nền, KHÔNG dùng nền gradient/hoạ tiết** — script Python sẽ tự tách nền bằng màu ở pixel góc trên-trái.
   - ⚠️ Riêng **spirit_rabbit** phát sáng: hào quang là **một phần nhân vật** (giữ lại), nhưng nền khung vẫn phải là màu phẳng tương phản (đừng lấy nền indigo trùng màu hào quang, kẻo bị tách mất).
4. **Đúng lưới (grid).** Vẽ đúng **số hàng × số cột** ghi trong phase. **4 cột = 4 khung hình của CÙNG một hành động** chạy trái→phải (khung 1→2→3→4 là 1 vòng animation).
5. **Nhất quán tuyệt đối.** Cùng một con thỏ (cùng dáng, màu lông, trang phục) xuyên suốt sheet. Mọi ô **cùng tỉ lệ** và **cùng đường chân (foot line)** — chân thỏ chạm cùng một mức so với đáy ô — để animation không bị giật/nhảy.
6. **Chừa lề.** Nhân vật không chạm mép ô (chừa khoảng trống quanh mỗi ô) để script cắt gọn được.
7. **Kích thước:** vẽ **lớn, nét** — canvas tối thiểu ~1024px mỗi chiều. **Không cần canh số pixel/khung chính xác** (script tự cắt & chuẩn hoá kích thước); chỉ cần **đúng grid + đều foot line**.
8. **Xuất PNG**, 1 file / 1 nhiệm vụ, **đúng tên & đúng thư mục** ghi trong phase.

### ✅ DEFINITION OF DONE (chống trốn việc — bắt buộc báo cáo cuối mỗi phase)

Kết thúc phase, liệt kê lại theo mẫu để tự kiểm không sót:

```
Phase: G?
- <tên_file.png> — canvas <WxH>, grid <hàng>×<cột>, thứ tự hàng: <...>
- <tên_file.png> — ...
Tổng: đã tạo N/N file của phase.
```

Nếu chưa đủ N/N thì **chưa được coi là xong phase.**

---

## STYLE ANCHOR (dán kèm mọi prompt)

```
Cozy 2D game asset, hand-drawn cartoon illustration, soft pastel earthy palette
(cream, warm beige, soft brown, muted pastels), gentle soft shadows, clean rounded
shapes, Animal Crossing / Stardew Valley cozy aesthetic, no text, no watermark,
high resolution. Character drawn on a FLAT SOLID neon-green background that fills
the whole frame (background will be removed by script).
```

---

## Phase G1 — Cảm xúc cho Thỏ Non & Thỏ Linh ⭐ ƯU TIÊN 1

**Vì sao gấp nhất:** stage 2 (Thỏ Non, ~ngày 21–41) và stage 3 (Thỏ Linh, ~ngày 42–69)
là 2 giai đoạn **user ở lại LÂU NHẤT** trong những tháng đầu, nhưng hiện **chỉ có 1–2 tư
thế** → hoàn thành habit thỏ không biết vui, ban đêm không ngủ, bỏ habit không buồn.

**2 file cần vẽ** (ghi đè bản cũ sai kích thước cùng tên):

| File | Thư mục | Grid | Thứ tự hàng (trên→dưới) |
|---|---|---|---|
| `young_rabbit_actions.png` | `apps/web/public/assets/` | **4 cột × 5 hàng** | idle · happy · sad · sleep · study |
| `spirit_rabbit_actions.png` | `apps/web/public/assets/` | **4 cột × 5 hàng** | idle · happy · sad · sleep · study |

Ý nghĩa 5 hàng: **idle** = đứng thở/chớp mắt; **happy** = nhảy/cười mừng; **sad** = ngồi ủ rũ; **sleep** = cuộn tròn/nhắm mắt ngủ; **study** = ngồi viết/đọc chăm chú.

Prompt (nối sau STYLE ANCHOR):
- `young_rabbit_actions.png`: `a small fluffy young rabbit character, 4-column x 5-row sprite sheet, each row is a 4-frame looping animation, rows top to bottom = idle breathing, happy jump, sad sitting, sleeping curled up, studying/writing; same character every cell, same scale, feet on the same baseline`
- `spirit_rabbit_actions.png`: `an ethereal glowing spirit rabbit with a soft magical aura, indigo-purple palette, 4-column x 5-row sprite sheet, each row a 4-frame loop, rows = idle, happy, sad, sleeping, meditating/studying; keep the glow as part of the character, same character every cell, feet on the same baseline`

---

## Phase G2 — Cảm xúc cho Thỏ Teen & Thiếu Nữ ⚡ ƯU TIÊN 2

Stage 5 (Teen, ~ngày 105+) và stage 6 (Thiếu Nữ, ~ngày 120+) cũng chỉ có vài tư thế
chuyên đề, thiếu happy/sad/sleep. Cùng quy ước lưới như G1.

| File | Thư mục | Grid | Thứ tự hàng |
|---|---|---|---|
| `bunny_teen_actions.png` | `apps/web/public/assets/` | **4 cột × 5 hàng** | idle · happy · sad · sleep · study |
| `bunny_woman_actions.png` | `apps/web/public/assets/` | **4 cột × 5 hàng** | idle · happy · sad · sleep · study |

Prompt:
- `bunny_teen_actions.png`: `a cute teen bunny girl (older, taller than a child), cozy pastel style, 4-column x 5-row sprite sheet, each row a 4-frame loop, rows = idle, happy, sad, sleeping, studying; same character every cell, feet on the same baseline`
- `bunny_woman_actions.png`: `an elegant young woman bunny, warm cozy palette, 4-column x 5-row sprite sheet, each row a 4-frame loop, rows = idle, happy, sad, sleeping, studying/planning; same character every cell, feet on the same baseline`

---

## Phase G3 — Trang trí phòng bổ sung 🛋️ ✅ ĐÃ XONG (đã ráp vào shop)

> Cả 6 file dưới đây **đã có** trong `apps/web/public/assets/items/` và **đã được ráp
> vào shop** (`lib/items.ts` + i18n vi/en/zh). Không cần vẽ lại. Giữ mục này để tham chiếu.

Thêm lựa chọn cho shop. **Không phải sprite sheet** — mỗi file 1 ảnh tĩnh.

**Wallpaper** (nền phòng full-bleed): **1024×1024, KHÔNG nền trong suốt, KHÔNG nhân vật, KHÔNG chữ.** Dùng anchor riêng:
```
Seamless cozy room wallpaper background, soft pastel, full-bleed, no characters,
no furniture, no text, gentle gradient, tileable room backdrop.
```

| File | Thư mục | Prompt riêng |
|---|---|---|
| `wallpaper_cafe.png` | `apps/web/public/assets/items/` | `cozy warm cafe wall, soft brown wood tones, hanging string-light bokeh` |
| `wallpaper_rainy.png` | `apps/web/public/assets/items/` | `soft rainy window mood, muted blue-grey, gentle rain streaks` |
| `wallpaper_winter.png` | `apps/web/public/assets/items/` | `cozy snowy night, soft deep blue, falling snowflakes, warm glow` |

**Rug** (thảm): **1 vật thể, nền phẳng một màu (script tách)**, góc nhìn hơi nghiêng top-down, ~1024². Dùng STYLE ANCHOR chuẩn.

| File | Thư mục | Prompt riêng |
|---|---|---|
| `rug_round_cream.png` | `apps/web/public/assets/items/` | `a round fluffy cream rug, soft fur texture, slight top-down perspective` |
| `rug_grass.png` | `apps/web/public/assets/items/` | `an oval grass patch rug, fresh green with tiny flowers` |
| `rug_heart.png` | `apps/web/public/assets/items/` | `a heart-shaped pink fluffy rug, cozy and cute` |

---

## Phase G5 — SỬA LỖI phát hiện khi tích hợp ✅ ĐÃ XONG

> Gemini đã vẽ lại 13 file trên nền neon phẳng. Đã xử lý: `bunny_teen_actions` lưới
> chuẩn → cắt sạch, stage 5 giờ có đủ cảm xúc; 12 item phòng đã tách nền trong suốt.
> Giữ mục dưới để tham chiếu.

Khi ráp G1/G2/G4 vào app, phát hiện 2 lỗi cần vẽ lại:

1. **`bunny_teen_actions.png` — lưới KHÔNG đều → cắt frame bị vỡ.** Hàng 5 (study) có ~5
   khung thay vì 4; hàng 4–5 lệch cột và nhân vật nhỏ hơn 3 hàng trên. Hiện code **tạm
   bỏ sheet này** (stage 5 chưa có đủ cảm xúc). Vẽ lại đúng **4 cột × 5 hàng đều tăm tắp**,
   **cùng tỉ lệ & cùng đường chân ở CẢ 5 hàng** (mỗi hàng đúng 4 khung, không thêm props
   làm lệch cỡ). Thứ tự hàng: idle · happy · sad · sleep · study.

2. **Item phòng cũ (`object_*`, `rug_cloud`, `rug_rainbow`) — nền xám/gradient không tách
   được.** Chúng đang có nền đặc (không trong suốt) nên hiện ra ô nền trong phòng. Vẽ lại
   MỖI item trên **nền phẳng một màu neon (như 3 rug mới)** để script tách sạch. Danh sách:
   `object_bed_cozy, object_lamp_warm, object_plant_pot, object_bookshelf, object_window_day,
   object_bowl_carrot, object_frame_photo, object_clock_wall, object_tea_table, object_toy_ball,
   rug_cloud, rug_rainbow`. (3 rug mới `rug_round_cream/grass/heart` đã OK.)

Lưu ý chung: **spirit_rabbit** lần này bị dính vì hào quang vẽ bằng đúng màu xanh nền —
lần sau vẽ hào quang bằng **màu khác nền** (vd trắng/vàng) để tách không mất glow.

---

## Phase G4 — Trang phục cho Thiếu Nữ Thỏ 👗 ✅ ĐÃ XONG (đã ráp shop)

> 3 file outfit đã có, đã xử lý `_clean` và ráp vào shop (slot outfit, stage 6). Giữ mục
> tham chiếu bên dưới. (Lưu ý cũ: "làm sau cùng".)

⚠️ **Làm SAU khi G2 xong** — outfit phải vẽ **cùng con thỏ, cùng lưới, cùng foot line**
với `bunny_woman_actions.png` (chỉ khác bộ đồ) để code hoán sprite khớp từng khung.

Grid **4 cột × 5 hàng** giống G2, cùng thứ tự hàng (idle · happy · sad · sleep · study).

| File | Thư mục | Prompt riêng |
|---|---|---|
| `outfit_summer_dress_sprite.png` | `apps/web/public/assets/` | `the same young woman bunny wearing a light summer floral dress` |
| `outfit_winter_coat_sprite.png` | `apps/web/public/assets/` | `the same young woman bunny wearing a cozy knitted winter coat and scarf` |
| `outfit_chef_sprite.png` | `apps/web/public/assets/` | `the same young woman bunny wearing a white chef outfit and hat` |

---

## Tóm tắt thứ tự & số lượng

| Phase | Nội dung | Số file | Ưu tiên |
|---|---|---|---|
| **G1** | Action sheet stage 2 & 3 | 2 | ⭐ cao nhất (user gặp nhiều) |
| **G2** | Action sheet stage 5 & 6 | 2 | ⚡ |
| **G3** | 3 wallpaper + 3 rug | 6 | 🛋️ |
| **G4** | 3 outfit (stage 6) | 3 | 👗 làm sau cùng |

Đã đủ (không vẽ lại): 7 sprite hình thái gốc, hiệu ứng nở trứng `egg_hatch_sprite.png`,
hào quang tiến hoá `fx_evolution_burst.png`, 10 vật nội thất `object_*`, 5 ảnh kỷ niệm,
`wallpaper_beach` + các wallpaper/rug cũ.
