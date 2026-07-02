# GEMINI — Vẽ ICON / NÚT giao diện (UI assets)

> File giao việc **thực thi** cho Gemini (Nano Banana), tách riêng khỏi sprite thỏ
> ([GEMINI_TASKS.md](GEMINI_TASKS.md)). Ở đây chỉ vẽ **icon / nút UI** rời (PNG nền
> trong suốt), để thay các emoji đang dùng tạm trên màn hình chính.
>
> **Gemini chỉ vẽ ảnh.** Cắt/ráp vào app là việc của Claude. Vẽ xong 1 phase → báo lại.

---

## ⚠️ LUẬT BẮT BUỘC — đọc trước, áp dụng cho MỌI phase

1. **Mỗi lần chỉ làm ĐÚNG 1 phase.** Xong U1 mới tới U2. **Không gộp, không nhảy phase.**
   (Làm từng phase nhỏ để **không tràn ngữ cảnh** — mỗi phiên chỉ tập trung 3–4 ảnh.)
2. **KHÔNG pixel-art.** Vẽ **cozy hand-drawn** (Animal Crossing / Stardew), **cùng phong
   cách với sprite thỏ** đang có. Trộn phong cách là hỏng cả bộ.
3. **Nền TRONG SUỐT thật (PNG alpha).** Mỗi file = **1 vật thể duy nhất, căn giữa**, nền
   trong suốt hoàn toàn (khác với sprite thỏ dùng nền phẳng để cắt — icon UI KHÔNG cần cắt).
4. **Canvas VUÔNG**, tối thiểu **512×512** (riêng phase U3 là 256×256). Chừa ~12% lề quanh
   vật thể để icon không chạm mép.
5. **Khối mập, bo tròn, viền mềm dày**, bóng đổ nhẹ — để nhìn rõ khi thu nhỏ còn ~40px.
6. **1 file / 1 vật**, **đúng tên & đúng thư mục** ghi trong bảng. **Không chữ, không watermark.**
7. Bộ icon phải **đồng bộ với nhau**: cùng độ dày viền, cùng tông màu, cùng "trọng lượng"
   thị giác (đừng cái đậm cái nhạt).

### ✅ DEFINITION OF DONE (chống trốn việc — bắt buộc báo cáo cuối mỗi phase)

```
Phase: U?
- <tên_file.png> — canvas <WxH>, nền trong suốt, mô tả: <...>
- ...
Tổng: đã tạo N/N file của phase.
```
Chưa đủ N/N thì **chưa xong phase.**

---

## 🎨 STYLE ANCHOR (dán kèm MỌI prompt)

```
Cozy 2D game UI icon, hand-drawn cartoon illustration, soft pastel earthy palette
(cream, warm beige, soft brown, muted pastels), thick soft rounded outline, chunky
rounded shapes, gentle soft drop shadow, Animal Crossing / Stardew Valley cozy
aesthetic, single centered object, fully transparent background (PNG), no text,
no watermark, high resolution, square canvas.
```

---

## Phase U1 — 4 NÚT CHĂM SÓC ⭐ ƯU TIÊN 1

Đây là 4 nút to nhất màn hình (Cho ăn / Chơi / Tắm / Ngủ) — thay 4 emoji 🍖🧸🚿💤.
Vẽ **icon vật thể** (nút bo tròn là do code vẽ, Gemini chỉ cần cái icon bên trong).

Thư mục: `apps/web/public/assets/ui/` · Canvas **512×512** · nền trong suốt.

| File | Vật thể (prompt riêng, ghép sau STYLE ANCHOR) |
|---|---|
| `action_feed.png` | a cute food bowl filled with carrots and kibble, warm appetizing, small steam |
| `action_play.png` | a cute plush teddy bear toy sitting, soft and huggable |
| `action_clean.png` | a small bathtub full of fluffy soap bubbles with a yellow rubber duck |
| `action_sleep.png` | a soft cozy pillow with a crescent moon and a few small stars floating above |

**DoD:** 4/4 file trong `assets/ui/`, canvas 512×512, nền trong suốt.

---

## Phase U2 — 3 MÓN ĂN (bảng chọn Cho ăn) — ƯU TIÊN 2

Thay 3 emoji 🥕🍰🍲 trong bảng chọn đồ ăn (Cà rốt / Bánh / Đại tiệc).

Thư mục: `apps/web/public/assets/ui/food/` · Canvas **512×512** · nền trong suốt.

| File | Vật thể |
|---|---|
| `food_carrot.png` | a single fresh orange carrot with green leafy top |
| `food_cake.png` | a slice of strawberry cream cake on a tiny plate |
| `food_feast.png` | a hearty steaming bowl piled with delicious food, a small feast |

**Chênh giá trị:** cà rốt = rẻ/nhỏ, bánh = vừa, đại tiệc = to/sang — vẽ **kích cỡ & độ
"hoành tráng" tăng dần** để người dùng nhìn là hiểu ngay cái nào bổ hơn.

**DoD:** 3/3 file trong `assets/ui/food/`.

---

## Phase U3 — ICON CHỈ SỐ & TIỀN TỆ (tuỳ chọn, đồng bộ hoá) — ƯU TIÊN 3

Thay các emoji nhỏ trên chip trạng thái + tiền (⭐💰🍗❤️😿🙂😸). Vẽ để cả app **một bộ icon
duy nhất** thay vì emoji hệ điều hành (điểm "kém premium" hiện tại).

Thư mục: `apps/web/public/assets/ui/` · Canvas **256×256** · nền trong suốt.

| File | Vật thể |
|---|---|
| `icon_coin.png` | a shiny gold coin with a small star, cozy cartoon |
| `icon_level.png` | a plump rounded star badge, warm yellow |
| `icon_satiety.png` | a cute drumstick / meat-on-bone, appetizing |
| `icon_bond.png` | a soft rounded heart, warm pink |
| `mood_happy.png` | a round happy blushing face, big smile |
| `mood_content.png` | a round calm content face, gentle smile |
| `mood_hungry.png` | a round sad hungry face, small teardrop |

**DoD:** 7/7 file trong `assets/ui/`.

---

## Sau khi Gemini vẽ xong (việc của Claude — không phải Gemini)

- Tạo thư mục `apps/web/public/assets/ui/` (+ `/food`).
- Thay emoji → `<Image>` trong: `InteractionDock.tsx` (U1), `FeedPicker.tsx` (U2),
  `PetHud.tsx` + header coin (U3).
- Không đổi logic — chỉ hoán phần hiển thị. Emoji giữ làm **fallback** tới khi ảnh về.
