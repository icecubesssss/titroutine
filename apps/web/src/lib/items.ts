export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  slot: "wallpaper" | "rug" | "object";
  className?: string; // CSS class to apply when equipped (for wallpapers/rugs)
  imageUrl: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Wallpapers
  {
    id: "wallpaper_cozy_pink",
    name: "Hoa Mùa Xuân",
    description: "Hình nền hoa nhí tone hồng ấm áp.",
    price: 250,
    slot: "wallpaper",
    className: "bg-[#ffe4e1] bg-[url('/assets/patterns/floral.png')] bg-repeat",
    imageUrl: "/assets/items/wallpaper_floral.png",
  },
  {
    id: "wallpaper_night_sky",
    name: "Bầu Trời Đêm",
    description: "Hình nền bầu trời sao lung linh.",
    price: 300,
    slot: "wallpaper",
    className: "bg-gradient-to-b from-[#1a1c2c] to-[#4a3d60]",
    imageUrl: "/assets/items/wallpaper_stars.png",
  },
  {
    id: "wallpaper_forest",
    name: "Rừng Xanh",
    description: "Không gian tươi mát mộc mạc.",
    price: 200,
    slot: "wallpaper",
    className: "bg-gradient-to-b from-[#d4ecd3] to-[#8db596]",
    imageUrl: "/assets/items/wallpaper_forest.png",
  },
  // Rugs
  {
    id: "rug_cloud",
    name: "Thảm Đám Mây",
    description: "Thảm bồng bềnh êm ái.",
    price: 150,
    slot: "rug",
    className: "bg-white/40",
    imageUrl: "/assets/items/rug_cloud.png",
  },
  {
    id: "rug_rainbow",
    name: "Thảm Cầu Vồng",
    description: "Nhiều màu sắc tươi vui.",
    price: 200,
    slot: "rug",
    className: "bg-gradient-to-r from-red-100 via-yellow-100 to-blue-100",
    imageUrl: "/assets/items/rug_rainbow.png",
  },
];
