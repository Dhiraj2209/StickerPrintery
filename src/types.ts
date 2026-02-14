export type StickerSize = "a6" | "a4" | "a3" | "custom";
export type StickerType =
  | "flowers"
  | "general"
  | "motivation quotes"
  | "islamic"
  | "god";
export type ParentCategory = "ResinStickers" | "Bikestickers" | "Branding stickers";

export type StickerProduct = {
  id: string;
  name: string;
  sheetName: string;
  size: StickerSize;
  type: StickerType;
  parentCategory: ParentCategory;
  imageUrl: string;
  bestSeller: boolean;
};

export type CartItem = {
  product: StickerProduct;
  quantity: number;
};

export type CustomerDetails = {
  name: string;
  contactNumber: string;
  streetAddress: string;
  pincode: string;
};
