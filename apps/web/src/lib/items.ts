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

// Emptied for a from-scratch redesign — add new entries here as the new art lands.
export const SHOP_ITEMS: ShopItem[] = [];
