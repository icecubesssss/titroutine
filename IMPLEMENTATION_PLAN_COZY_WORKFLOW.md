# KẾ HOẠCH NÂNG CẤP GIAI ĐOẠN 2: LỊCH HẠT ĐẬU CẢM XÚC (DAILYBEAN MOOD GRID)
## (Đặc tả chi tiết và kế hoạch triển khai cho Giai đoạn 2)

Tài liệu này trình bày chi tiết kế hoạch kỹ thuật để triển khai **Giai đoạn 2** của dự án đại tu Titroutine, tập trung vào việc lưu trữ cảm xúc thực tế và dựng giao diện lịch hạt đậu động mượt mà phong cách DailyBean.

---

## I. HIỆN TRẠNG & KHÁM PHÁ CỦA CODEBASE
* **logMoodAction (`actions.ts` dòng 947)**: Hiện tại chỉ thay đổi profile coins và affection, các biến `_mood`, `_tags`, `_reflection` bị bỏ qua (`void _mood; void _tags; void _reflection;`). Dữ liệu cảm xúc thực tế chưa được lưu xuống database.
* **getDashboard (`data.ts` dòng 37)**: Chưa tải lịch sử mood log của người dùng từ cơ sở dữ liệu.
* **Mood Grid (`HomeView.tsx`)**: Lịch tuần hiện tại hiển thị các ô checkmark thô sơ của thói quen, chưa có widget hạt đậu cảm xúc của từng ngày.

---

## II. ĐỀ XUẤT CÁC THAY ĐỔI CHI TIẾT (PROPOSED CHANGES)

### 1. Cơ sở dữ liệu (Database Schema & Migration)
* **File tạo mới**: [05_daily_bean_and_diaries.sql](file:///Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/titroutine/packages/database/migrations/05_daily_bean_and_diaries.sql)
  * Thiết lập bảng `daily_bean_logs` lưu trữ `user_id`, `logged_date`, `mood`, `activities` (array), và `note` (reflection).
  * Kích hoạt cơ chế bảo mật hàng (RLS) để bảo vệ nhật ký cảm xúc riêng tư của từng user.

### 2. Cập nhật Backend & API Actions
* **File sửa đổi**: [actions.ts](file:///Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/titroutine/apps/web/src/app/%5Blocale%5D/actions.ts)
  * Cập nhật hàm `logMoodAction` để ghi dữ liệu trực tiếp vào bảng `daily_bean_logs`.
  * Ràng buộc logic unique `(user_id, logged_date)` sử dụng phương thức `.upsert` để ghi đè nếu người dùng ghi chép lại tâm trạng nhiều lần trong ngày.
* **File sửa đổi**: [data.ts](file:///Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/titroutine/apps/web/src/lib/data.ts)
  * Tải lịch sử mood log 30 ngày gần nhất trong `getDashboard` và gộp vào object `DashboardData` trả về cho Client.

### 3. Thiết kế Widget Lịch Hạt Đậu Cảm Xúc (`MoodBeanGrid.tsx`)
* **File tạo mới**: [MoodBeanGrid.tsx](file:///Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/titroutine/apps/web/src/components/home/MoodBeanGrid.tsx)
  * Widget hiển thị dạng Bento Box phẳng chứa lịch tuần/tháng dưới dạng các hạt đậu tròn mềm (Bean shapes) có màu pastel tương ứng cảm xúc ngày đó.
  * **Tooltip khi hover**: Hiển thị card glassmorphic chứa icon hoạt động, ghi chú tâm sự và danh sách thói quen đã hoàn thành. Tooltip mở rộng bằng transition Framer Motion lò xo cực kỳ nẩy.

### 4. Tinh chỉnh Modal Check-in Cảm Xúc (`MoodCheckinModal.tsx`)
* **File sửa đổi**: [MoodCheckinModal.tsx](file:///Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/titroutine/apps/web/src/components/mindfulness/MoodCheckinModal.tsx)
  * Áp dụng Framer Motion cho 5 icon cảm xúc lớn. Khi hover, hạt đậu cảm xúc phồng to (`scale: 1.15`) nhún nhảy nhẹ. Khi click chọn, icon thực hiện cú nẩy lò xo cực đàn hồi (`whileTap={{ scale: 0.85 }}`).
  * Các tag hoạt động hiển thị hiệu ứng spring scale-up khi được chọn.

---

## III. PHÂN BỔ THỜI GIAN THỰC THI CHI TIẾT HÀNG NGÀY (SPRINT SCHEDULE)

* **Ngày 1: Chạy Migration & Kiểm tra cơ sở dữ liệu**
  * Áp dụng file SQL `05_daily_bean_and_diaries.sql` vào môi trường Supabase local/production.
* **Ngày 2: Viết code lưu/tải dữ liệu (actions.ts & data.ts)**
  * Cập nhật logic `.upsert` cho `logMoodAction` trong `actions.ts`.
  * Cập nhật `getDashboard` tải mood logs và bổ sung type trong `types.ts`.
* **Ngày 3: Thiết kế Widget Lịch Hạt Đậu (`MoodBeanGrid.tsx`)**
  * Viết component hiển thị lưới hạt đậu tròn màu sắc pastel có spring hovers.
* **Ngày 4: Thêm hoạt họa bouncy cho check-in modal (`MoodCheckinModal.tsx`)**
  * Nâng cấp emoji & tag buttons bằng Framer Motion `motion.button` và spring transitions.
* **Ngày 5: Lập trình Tooltip chi tiết và transition phóng to**
  * Sử dụng Framer Motion `AnimatePresence` để tooltip hiển thị mượt mà khi hover hạt đậu.
* **Ngày 6: Tích hợp Widget vào Bento Grid chính (`HomeView.tsx`)**
  * Ghép `MoodBeanGrid` vào góc phải Bento Box của màn hình desktop.
* **Ngày 7: Rà soát, sửa lỗi linter và chạy build**
  * Chạy `npm run build` để kiểm tra compile và hoàn thiện Giai đoạn 2.

---

## IV. BƯỚC TIẾP THEO & PHÊ DUYỆT (NEXT STEPS)
Bạn hãy phê duyệt bản kế hoạch chi tiết cho **Giai đoạn 2** này để tôi bắt đầu áp dụng thay đổi vào cơ sở dữ liệu và mã nguồn ngay bây giờ!
