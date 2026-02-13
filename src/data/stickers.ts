import { type StickerProduct } from "../types";

export type HomeSectionId = "best-seller" | "a6" | "a4" | "a3" | "custom";

export const COMPANY_NAME = "Something Stickers";
export const WHATSAPP_NUMBER = "919999999999";

export const HOME_SECTIONS: Array<{
  id: HomeSectionId;
  label: string;
  description: string;
}> = [
  { id: "best-seller", label: "Best Seller", description: "Top loved sticker sheets" },
  { id: "a6", label: "A6 Sheets", description: "Pocket-sized quick stickers" },
  { id: "a4", label: "A4 Sheets", description: "Balanced daily sticker sets" },
  { id: "a3", label: "A3 Sheets", description: "Large expressive formats" },
  { id: "custom", label: "Custom Sheets", description: "Unique shape collections" },
];

export const STICKERS: StickerProduct[] = [
  {
    id: "ST-A6-101",
    name: "Bloom Notes",
    sheetName: "A6 Floral Pockets",
    size: "a6",
    imageUrl: "/stickers/sticker-1.svg",
    bestSeller: true,
  },
  {
    id: "ST-A6-102",
    name: "Mint Icons",
    sheetName: "A6 Tiny UI Icons",
    size: "a6",
    imageUrl: "/stickers/sticker-2.svg",
    bestSeller: false,
  },
  {
    id: "ST-A4-201",
    name: "Planner Waves",
    sheetName: "A4 Weekly Planner",
    size: "a4",
    imageUrl: "/stickers/sticker-3.svg",
    bestSeller: true,
  },
  {
    id: "ST-A4-202",
    name: "Coffee Labels",
    sheetName: "A4 Cafe Mood Set",
    size: "a4",
    imageUrl: "/stickers/sticker-4.svg",
    bestSeller: false,
  },
  {
    id: "ST-A3-301",
    name: "Mega Doodles",
    sheetName: "A3 Wall Doodle Pack",
    size: "a3",
    imageUrl: "/stickers/sticker-5.svg",
    bestSeller: true,
  },
  {
    id: "ST-A3-302",
    name: "Festival Burst",
    sheetName: "A3 Event Burst Sheet",
    size: "a3",
    imageUrl: "/stickers/sticker-6.svg",
    bestSeller: false,
  },
  {
    id: "ST-CUS-401",
    name: "Logo Mix",
    sheetName: "Custom Brand Mix",
    size: "custom",
    imageUrl: "/stickers/sticker-7.svg",
    bestSeller: true,
  },
  {
    id: "ST-CUS-402",
    name: "Shape Patch",
    sheetName: "Custom Shape Patch Pack",
    size: "custom",
    imageUrl: "/stickers/sticker-8.svg",
    bestSeller: false,
  },
];
