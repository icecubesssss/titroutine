import { useEffect, useRef, useState, type RefObject } from "react";

// Hide the floating toolbars while the user scrolls down inside the given
// scroll container, reveal them on scroll-up or near the top. 15px dead-zone
// keeps it from flickering on tiny scrolls.
export function useAutoHideToolbars(scrollRef: RefObject<HTMLElement | null>): boolean {
  const [showToolbars, setShowToolbars] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const habitsEl = scrollRef.current;
    if (!habitsEl) return;

    const handleScroll = () => {
      const currentScrollY = habitsEl.scrollTop;

      // Nếu cuộn về sát trên cùng, luôn hiện thanh công cụ
      if (currentScrollY <= 10) {
        setShowToolbars(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;
      // Khoảng cách cuộn tối thiểu là 15px để tránh quá nhạy
      if (Math.abs(diff) < 15) return;

      if (diff > 0) {
        // Đang cuộn xuống -> Ẩn thanh công cụ
        setShowToolbars(false);
      } else {
        // Đang cuộn lên -> Hiện thanh công cụ
        setShowToolbars(true);
      }
      lastScrollY.current = currentScrollY;
    };

    habitsEl.addEventListener("scroll", handleScroll);
    return () => {
      habitsEl.removeEventListener("scroll", handleScroll);
    };
  }, [scrollRef]);

  return showToolbars;
}
