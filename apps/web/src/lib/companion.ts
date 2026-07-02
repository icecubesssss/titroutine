// Pure, client-safe "life-simulation" scheduler for the rabbit companion.
//
// Vấn đề: app đã có ~45 animation (Phase 1–6) nhưng HomeView chỉ dùng ~6 trạng
// thái cố định (idle/sleep/happy/sad/welcome/study). Toàn bộ hoạt cảnh sinh hoạt
// (uống trà sáng, đọc sách, nghe nhạc, lễ hội, easter-egg...) nằm im.
//
// Module này chọn một "hành động nền" (ambient) theo GIỜ trong ngày + MÙA/LỄ +
// một chút ngẫu nhiên, để thỏ trông như có cuộc sống riêng. Nó chỉ đề xuất; việc
// action đó có sprite hay không do RabbitCompanion lọc (availableActions) và
// fallback xử lý. Không phụ thuộc React → dễ test.

import type { CompanionAction } from "@/components/pet/RabbitCompanion";

export interface AmbientContext {
  /** Các action mà stage hiện tại thực sự có sprite (Object.keys(config.actions)). */
  available: ReadonlySet<string>;
  /** Thời điểm hiện tại (client-local). Cho phép inject để test. */
  now?: Date;
  /** Nguồn ngẫu nhiên (mặc định Math.random). Cho phép inject để test. */
  rng?: () => number;
  /** Thời tiết thật hiện tại (nếu lấy được) → thỉnh thoảng ngắm mưa/tuyết. */
  weather?: "rain" | "snow" | null;
}

/** Map mã thời tiết WMO của Open-Meteo về loại hoạt cảnh thỏ. */
export function weatherFromCode(code: number): "rain" | "snow" | null {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return "rain";
  return null;
}

// Ứng viên action theo từng khung giờ. Gồm cả từ vựng stage-4 lẫn action chuyên đề
// của các stage khác (young_play, spirit_meditate/read, teen_yoga/laptop/coffee,
// woman_tea/plan). pickAmbientAction lọc theo `available` nên mỗi stage chỉ dùng
// action mình thực có → mọi hình thái đều "có đời sống riêng" theo phong cách của nó.
const HOURLY_POOLS: Array<{ from: number; to: number; actions: CompanionAction[] }> = [
  { from: 5, to: 6, actions: ["wake_up_stretch", "exercise_stretch", "teen_yoga"] },
  { from: 6, to: 9, actions: ["morning_tea", "wake_up_stretch", "exercise_stretch", "woman_tea", "teen_coffee", "spirit_meditate"] },
  { from: 9, to: 12, actions: ["study_laptop", "study", "read_window", "read_floor", "spirit_read", "teen_laptop", "woman_plan"] },
  { from: 12, to: 14, actions: ["eat", "morning_tea", "teen_coffee"] },
  { from: 14, to: 17, actions: ["study_laptop", "study", "read_floor", "brush_hair", "proud_smile", "young_play", "spirit_read", "teen_laptop", "woman_plan"] },
  { from: 17, to: 20, actions: ["relax_music", "brush_hair", "read_window", "woman_tea", "teen_yoga", "young_play"] },
  { from: 20, to: 23, actions: ["read_floor", "sleepy_yawn", "relax_music", "spirit_meditate", "woman_tea"] },
  { from: 23, to: 24, actions: ["sleep", "rare_sleep_drool"] },
  { from: 0, to: 5, actions: ["sleep", "rare_sleep_drool"] },
];

/** Easter-egg hiếm: thỉnh thoảng xen vào cho bất ngờ. */
const RARE_POOL: CompanionAction[] = [
  "rare_cat", "rare_star", "rare_sing", "rare_cook_burn", "rare_read_sleep",
];
const RARE_CHANCE = 0.04;

/**
 * Action gợi ý theo mùa/lễ dựa trên ngày dương lịch. Trả về null nếu không rơi
 * vào cửa sổ nào. (Tết âm lịch cần lịch mặt trăng nên tạm bỏ qua — sẽ thêm sau.)
 */
export function seasonalAction(month: number, day: number, year?: number): CompanionAction | null {
  if (month === 12 && day >= 20 && day <= 26) return "event_christmas";
  if (isLunarNewYear(year ?? new Date().getFullYear(), month, day)) return "event_lunar_new_year";
  if (month >= 3 && month <= 4) return "season_spring";
  if (month >= 9 && month <= 10) return "season_autumn";
  return null;
}

/** Ngày mùng 1 Tết Nguyên Đán (dương lịch) theo năm — cửa sổ ±3 ngày quanh mốc. */
const LUNAR_NEW_YEAR: Record<number, [number, number]> = {
  2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3],
};
function isLunarNewYear(year: number, month: number, day: number): boolean {
  const d = LUNAR_NEW_YEAR[year];
  if (!d) return false;
  const target = new Date(year, d[0] - 1, d[1]).getTime();
  const now = new Date(year, month - 1, day).getTime();
  return Math.abs(now - target) <= 3 * 86_400_000;
}

function poolForHour(hour: number): CompanionAction[] {
  const bucket = HOURLY_POOLS.find((b) => hour >= b.from && hour < b.to);
  return bucket ? bucket.actions : ["idle"];
}

function pickFrom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Chọn một hành động nền cho lượt hiện tại. Luôn trả về một action mà stage đang
 * xét CÓ sprite (đã lọc theo `available`); nếu không có ứng viên nào phù hợp thì
 * trả "idle".
 */
export function pickAmbientAction(ctx: AmbientContext): CompanionAction {
  const now = ctx.now ?? new Date();
  const rng = ctx.rng ?? Math.random;
  const hour = now.getHours();

  const candidates: CompanionAction[] = [...poolForHour(hour)];

  // Thời tiết thật: khi đang mưa/tuyết, ~nửa số lượt thỏ ngắm mưa/đắp người tuyết.
  if (ctx.weather === "rain" && rng() < 0.5) candidates.unshift("weather_rain");
  else if (ctx.weather === "snow" && rng() < 0.5) candidates.unshift("weather_snow");

  // Xen lễ hội / mùa với xác suất vừa phải để không lấn át sinh hoạt thường ngày.
  const seasonal = seasonalAction(now.getMonth() + 1, now.getDate(), now.getFullYear());
  if (seasonal && rng() < 0.35) candidates.unshift(seasonal);

  // Xen easter-egg hiếm.
  if (rng() < RARE_CHANCE) candidates.push(pickFrom(RARE_POOL, rng));

  // Chỉ giữ những ứng viên stage này thực sự vẽ được.
  const viable = candidates.filter((a) => ctx.available.has(a));
  if (viable.length === 0) return "idle";
  return pickFrom(viable, rng);
}

/** Mốc streak có hoạt cảnh ăn mừng riêng. Trả về action nếu `streak` đúng mốc. */
export function streakMilestoneAction(streak: number): CompanionAction | null {
  if (streak === 1000) return "streak_1000";
  if (streak === 365) return "streak_365";
  if (streak === 100) return "streak_100";
  if (streak === 30) return "streak_30";
  return null;
}
