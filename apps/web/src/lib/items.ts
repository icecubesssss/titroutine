// Shop catalogue. Display name/description are NOT here — they live in the i18n
// message files keyed by id (`Shop.item_<id>_name` / `_desc`) so every locale is
// covered. This file holds only the structural/economy data + how an item renders.
export interface ShopItem {
  id: string;
  price: number;
  slot: "wallpaper" | "rug" | "object" | "outfit";
  className?: string; // CSS class to apply when equipped (for wallpapers/rugs)
  imageUrl: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Wallpapers
  {
    id: "wallpaper_cozy_pink",
    price: 250,
    slot: "wallpaper",
    className: "bg-[url('/assets/items/wallpaper_floral.png')] bg-cover bg-center",
    imageUrl: "/assets/items/wallpaper_floral.png",
  },
  {
    id: "wallpaper_night_sky",
    price: 300,
    slot: "wallpaper",
    className: "bg-[url('/assets/items/wallpaper_stars.png')] bg-cover bg-center",
    imageUrl: "/assets/items/wallpaper_stars.png",
  },
  {
    id: "wallpaper_forest",
    price: 200,
    slot: "wallpaper",
    className: "bg-[url('/assets/items/wallpaper_forest.png')] bg-cover bg-center",
    imageUrl: "/assets/items/wallpaper_forest.png",
  },
  // Rugs
  {
    id: "rug_cloud",
    price: 150,
    slot: "rug",
    className: "bg-white/40",
    imageUrl: "/assets/items/rug_cloud.png",
  },
  {
    id: "rug_rainbow",
    price: 200,
    slot: "rug",
    className: "bg-gradient-to-r from-red-100 via-yellow-100 to-blue-100",
    imageUrl: "/assets/items/rug_rainbow.png",
  },
  // Extra wallpaper
  {
    id: "wallpaper_beach",
    price: 280,
    slot: "wallpaper",
    className: "bg-[url('/assets/items/wallpaper_beach.png')] bg-cover bg-center",
    imageUrl: "/assets/items/wallpaper_beach.png",
  },
  // Furniture / decor objects. Rendered as a free-standing image in the room
  // (one equipped object at a time, via the "object" slot).
  { id: "object_bed_cozy", price: 180, slot: "object", imageUrl: "/assets/items/object_bed_cozy.png" },
  { id: "object_lamp_warm", price: 120, slot: "object", imageUrl: "/assets/items/object_lamp_warm.png" },
  { id: "object_plant_pot", price: 100, slot: "object", imageUrl: "/assets/items/object_plant_pot.png" },
  { id: "object_bookshelf", price: 160, slot: "object", imageUrl: "/assets/items/object_bookshelf.png" },
  { id: "object_window_day", price: 140, slot: "object", imageUrl: "/assets/items/object_window_day.png" },
  { id: "object_bowl_carrot", price: 80, slot: "object", imageUrl: "/assets/items/object_bowl_carrot.png" },
  { id: "object_frame_photo", price: 90, slot: "object", imageUrl: "/assets/items/object_frame_photo.png" },
  { id: "object_clock_wall", price: 110, slot: "object", imageUrl: "/assets/items/object_clock_wall.png" },
  { id: "object_tea_table", price: 150, slot: "object", imageUrl: "/assets/items/object_tea_table.png" },
  { id: "object_toy_ball", price: 70, slot: "object", imageUrl: "/assets/items/object_toy_ball.png" },
];
