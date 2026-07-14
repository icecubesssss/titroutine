import { useEffect, useRef, useState, type RefObject } from "react";

// Hide the floating toolbars while the user scrolls down inside the given
// scroll container, reveal them on scroll-up or near the top. 15px dead-zone
// keeps it from flickering on tiny scrolls. Supports dual refs for desktop
// and mobile scroll containers.
export function useAutoHideToolbars(
  scrollRef: RefObject<HTMLElement | null>,
  mobileScrollRef?: RefObject<HTMLElement | null>
): boolean {
  const [showToolbars, setShowToolbars] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const habitsEl = scrollRef.current;
    const mobileEl = mobileScrollRef?.current;

    const handleScroll = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      if (!target) return;
      const currentScrollY = target.scrollTop;

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

    if (habitsEl) {
      habitsEl.addEventListener("scroll", handleScroll);
    }
    if (mobileEl) {
      mobileEl.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (habitsEl) {
        habitsEl.removeEventListener("scroll", handleScroll);
      }
      if (mobileEl) {
        mobileEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, [scrollRef, mobileScrollRef]);

  return showToolbars;
}

