import { type StickerProduct } from "../types";

export type HomeSectionId = "best-seller" | "a6" | "a4" | "a3" | "custom";

export const COMPANY_NAME = "StickerPrintery";
export const WHATSAPP_NUMBER = "919999999999";
export const DRIVE_ROOT_FOLDER = "1PfDNRG0tPtLE_tX5JOgQdsg4pApW51TF";

const TYPE_CODE_MAP = {
  FL: "flowers",
  GN: "general",
  QT: "motivation quotes",
  IS: "islamic",
  GD: "god",
} as const;

const CATEGORY_CODE_MAP = {
  R: "ResinStickers",
  B: "Branding stickers",
} as const;

const DRIVE_FILES = [
  { fileId: "15tfVpaNfkS1SEfWD8gKwvpTWhrZuMR2A", filename: "B-GN-THANKS-A6-118.png" },
  { fileId: "1WYsPnLIYX405roi4ZwMRU0t2AkQ7lmud", filename: "B-QT-GRIND-A6-032.png" },
  { fileId: "1fHY5zO1V0BIMNGj_Im0xzZVKKLVNNUev", filename: "R-FL-LILY-A6-014.png" },
  { fileId: "1O7km0N3GzokwJ1-6B2ThfeKCYDDL3iYK", filename: "R-GD-GANESH-A4-021.png" },
  { fileId: "1TcSNqtqXAf9EGu7ArytcKRZIenRgwRuQ", filename: "R-IS-SABR-A4-007.png" },
] as const;

export const STICKER_TYPES = [
  "all",
  "flowers",
  "general",
  "motivation quotes",
  "islamic",
  "god",
] as const;

export const PARENT_CATEGORIES = ["all", "ResinStickers", "Bikestickers", "Branding stickers"] as const;

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

export function parseStickerFilename(fileNameWithExt: string) {
  const base = fileNameWithExt.replace(/\.[^.]+$/, "");
  const match = base.match(
    /^(?<category>[A-Z])-(?<type>[A-Z]{2})-(?<shortName>[A-Z0-9]+)-(?<size>A[46])-(?<serial>\d{3})$/,
  );
  if (!match?.groups) {
    return null;
  }

  const categoryCode = match.groups.category as keyof typeof CATEGORY_CODE_MAP;
  const typeCode = match.groups.type as keyof typeof TYPE_CODE_MAP;
  const shortName = match.groups.shortName;
  const sizeCode = match.groups.size;
  const serial = Number(match.groups.serial);

  const parentCategory = CATEGORY_CODE_MAP[categoryCode] ?? "Branding stickers";
  const type = TYPE_CODE_MAP[typeCode] ?? "general";
  const size = sizeCode.toLowerCase() as StickerProduct["size"];
  const readableName = shortName.charAt(0) + shortName.slice(1).toLowerCase();

  return {
    fullCode: base,
    type,
    size,
    serial,
    parentCategory,
    displayName: readableName,
  };
}

export const STICKERS: StickerProduct[] = DRIVE_FILES.map((file) => {
  const parsed = parseStickerFilename(file.filename);
  if (!parsed) {
    throw new Error(`Invalid filename format: ${file.filename}`);
  }

  return {
    id: parsed.fullCode,
    name: parsed.displayName,
    sheetName: parsed.fullCode,
    size: parsed.size,
    type: parsed.type,
    parentCategory: parsed.parentCategory,
    imageUrl: `https://drive.google.com/thumbnail?id=${file.fileId}&sz=w1200`,
    bestSeller: parsed.serial <= 35,
  };
});
