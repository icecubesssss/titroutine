// Memory-album catalogue. Shared between the client modal and the server so the
// unlock thresholds never drift apart. Unlocking is *persistent*: once a streak
// crosses a memory's threshold the key is written to the `memories` table, so the
// keepsake survives a later streak reset (a broken streak must not erase memories).

export interface MemoryItem {
  key: string;
  title: string;
  caption: string;
  requiredStreak: number;
  imageUrl: string;
}

export const MEMORIES: MemoryItem[] = [
  {
    key: "memory_day_1",
    title: "Ngày Đầu Gặp Gỡ",
    caption: "The day we first met.",
    requiredStreak: 1,
    imageUrl: "/assets/memory_day_1.png",
  },
  {
    key: "memory_day_30",
    title: "Cùng Nhau Cố Gắng",
    caption: "We started building habits together.",
    requiredStreak: 30,
    imageUrl: "/assets/memory_day_30.png",
  },
  {
    key: "memory_day_100",
    title: "Một Chặng Đường Dài",
    caption: "We've come this far.",
    requiredStreak: 100,
    imageUrl: "/assets/memory_day_100.png",
  },
  {
    key: "memory_day_365",
    title: "Kỷ Niệm Tròn Năm",
    caption: "One whole year together.",
    requiredStreak: 365,
    imageUrl: "/assets/memory_day_365.png",
  },
  {
    key: "memory_day_1000",
    title: "Cảm Ơn Vì Đã Ở Lại",
    caption: "Thank you for staying.",
    requiredStreak: 1000,
    imageUrl: "/assets/memory_day_1000.png",
  },
];

/** Keys of every memory a given streak has earned (used for display + persistence). */
export function eligibleMemoryKeys(streak: number): string[] {
  return MEMORIES.filter((m) => streak >= m.requiredStreak).map((m) => m.key);
}
