export type StickerSize = "a6" | "a4" | "a3" | "custom";

export type StickerProduct = {
  id: string;
  name: string;
  sheetName: string;
  size: StickerSize;
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
