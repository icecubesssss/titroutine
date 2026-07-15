// Shop catalogue. Display name/description are NOT here — they live in the i18n
// message files keyed by id (`Shop.item_<id>_name` / `_desc`) so every locale is
// covered. This file holds only the structural/economy data + how an item renders.
export interface ShopItem {
  id: string;
  price: number;
  slot: "wallpaper" | "rug" | "object" | "outfit" | "accessory";
  imageUrl: string;
  /** Accessories render as an emoji worn on the pet's head (no art assets). */
  emoji?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Wallpapers
  {
    id: "wallpaper_cozy_pink",
    price: 250,
    slot: "wallpaper",
    imageUrl: "/assets/items/wallpaper_floral.png",
  },
  {
    id: "wallpaper_night_sky",
    price: 300,
    slot: "wallpaper",
    imageUrl: "/assets/items/wallpaper_stars.png",
  },
  {
    id: "wallpaper_forest",
    price: 200,
    slot: "wallpaper",
    imageUrl: "/assets/items/wallpaper_forest.png",
  },
  // Rugs
  {
    id: "rug_cloud",
    price: 150,
    slot: "rug",
    imageUrl: "/assets/items/rug_cloud.png",
  },
  {
    id: "rug_rainbow",
    price: 200,
    slot: "rug",
    imageUrl: "/assets/items/rug_rainbow.png",
  },
  // Extra wallpaper
  {
    id: "wallpaper_beach",
    price: 280,
    slot: "wallpaper",
    imageUrl: "/assets/items/wallpaper_beach.png",
  },
  {
    id: "wallpaper_cafe",
    price: 260,
    slot: "wallpaper",
    imageUrl: "/assets/items/wallpaper_cafe.png",
  },
  {
    id: "wallpaper_rainy",
    price: 240,
    slot: "wallpaper",
    imageUrl: "/assets/items/wallpaper_rainy.png",
  },
  {
    id: "wallpaper_winter",
    price: 300,
    slot: "wallpaper",
    imageUrl: "/assets/items/wallpaper_winter.png",
  },
  // Extra rugs
  { id: "rug_round_cream", price: 130, slot: "rug", imageUrl: "/assets/items/rug_round_cream.png" },
  { id: "rug_grass", price: 140, slot: "rug", imageUrl: "/assets/items/rug_grass.png" },
  { id: "rug_heart", price: 170, slot: "rug", imageUrl: "/assets/items/rug_heart.png" },
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
  // Outfits (Stage 6 only). Equipping swaps the woman sprite for a costumed sheet
  // — see OUTFIT_SHEETS in RabbitCompanion. imageUrl = single-frame thumbnail.
  { id: "outfit_summer_dress", price: 220, slot: "outfit", imageUrl: "/assets/items/outfit_summer_dress_thumb.png" },
  { id: "outfit_winter_coat", price: 260, slot: "outfit", imageUrl: "/assets/items/outfit_winter_coat_thumb.png" },
  { id: "outfit_chef", price: 300, slot: "outfit", imageUrl: "/assets/items/outfit_chef_thumb.png" },
  // New items added for the special upgrade
  { id: "wallpaper_autumn", price: 220, slot: "wallpaper", imageUrl: "/assets/items/wallpaper_autumn.png" },
  { id: "rug_star", price: 180, slot: "rug", imageUrl: "/assets/items/rug_star.png" },
  { id: "object_cozy_sofa", price: 170, slot: "object", imageUrl: "/assets/items/object_cozy_sofa.png" },
  { id: "object_scented_candle", price: 90, slot: "object", imageUrl: "/assets/items/object_scented_candle.png" },
  // 4 new custom cute items
  { id: "wallpaper_sakura", price: 320, slot: "wallpaper", imageUrl: "/assets/items/wallpaper_sakura.png" },
  { id: "rug_sunflower", price: 190, slot: "rug", imageUrl: "/assets/items/rug_sunflower.png" },
  { id: "object_vintage_radio", price: 160, slot: "object", imageUrl: "/assets/items/object_vintage_radio.png" },
  { id: "object_gaming_chair", price: 280, slot: "object", imageUrl: "/assets/items/object_gaming_chair.png" },
  // 20 new cozy items
  { id: "object_fireplace_cozy", price: 220, slot: "object", imageUrl: "/assets/items/object_fireplace_cozy.png" },
  { id: "object_cat_tree", price: 180, slot: "object", imageUrl: "/assets/items/object_cat_tree.png" },
  { id: "object_monstera_plant", price: 130, slot: "object", imageUrl: "/assets/items/object_monstera_plant.png" },
  { id: "object_study_desk", price: 240, slot: "object", imageUrl: "/assets/items/object_study_desk.png" },
  { id: "object_beanbag_chair", price: 150, slot: "object", imageUrl: "/assets/items/object_beanbag_chair.png" },
  { id: "object_aquarium_mini", price: 160, slot: "object", imageUrl: "/assets/items/object_aquarium_mini.png" },
  { id: "object_bunny_plush", price: 90, slot: "object", imageUrl: "/assets/items/object_bunny_plush.png" },
  { id: "object_coffee_maker", price: 140, slot: "object", imageUrl: "/assets/items/object_coffee_maker.png" },
  { id: "object_floor_cushions", price: 110, slot: "object", imageUrl: "/assets/items/object_floor_cushions.png" },
  { id: "object_hanging_ivy", price: 120, slot: "object", imageUrl: "/assets/items/object_hanging_ivy.png" },
  { id: "object_record_player", price: 200, slot: "object", imageUrl: "/assets/items/object_record_player.png" },
  { id: "object_art_easel", price: 170, slot: "object", imageUrl: "/assets/items/object_art_easel.png" },
  { id: "object_humidifier_cozy", price: 100, slot: "object", imageUrl: "/assets/items/object_humidifier_cozy.png" },
  { id: "object_succulent_terrarium", price: 95, slot: "object", imageUrl: "/assets/items/object_succulent_terrarium.png" },
  { id: "object_globe_lamp", price: 150, slot: "object", imageUrl: "/assets/items/object_globe_lamp.png" },
  { id: "object_ceramic_teaset", price: 85, slot: "object", imageUrl: "/assets/items/object_ceramic_teaset.png" },
  { id: "object_retro_tv", price: 210, slot: "object", imageUrl: "/assets/items/object_retro_tv.png" },
  { id: "object_wardrobe_cozy", price: 250, slot: "object", imageUrl: "/assets/items/object_wardrobe_cozy.png" },
  { id: "object_basket_blankets", price: 115, slot: "object", imageUrl: "/assets/items/object_basket_blankets.png" },
  { id: "object_desk_organizer", price: 105, slot: "object", imageUrl: "/assets/items/object_desk_organizer.png" },
  // Pet accessories (Habit-Rabbit cosmetics): emoji worn on the head, works for
  // every stage — egg included. No sprite art required.
  { id: "accessory_bow", price: 120, slot: "accessory", imageUrl: "", emoji: "🎀" },
  { id: "accessory_top_hat", price: 150, slot: "accessory", imageUrl: "", emoji: "🎩" },
  { id: "accessory_sun_hat", price: 180, slot: "accessory", imageUrl: "", emoji: "👒" },
  { id: "accessory_crown", price: 350, slot: "accessory", imageUrl: "", emoji: "👑" },
];
