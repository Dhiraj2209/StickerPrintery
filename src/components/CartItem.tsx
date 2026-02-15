import { type CartItem as CartItemType, type StickerProduct } from "../types";
import { QuantityControl } from "./QuantityControl";
import { type SyntheticEvent } from "react";

type CartItemProps = {
    item: CartItemType;
    onUpdateQuantity: (product: StickerProduct, quantity: number) => void;
};

export function CartItem({ item, onUpdateQuantity }: CartItemProps) {
    const { product, quantity } = item;

    const stickerAspectRatio = (size: StickerProduct["size"]) =>
        size === "a3" ? "11.5 / 16.5" : "4.1 / 5.7";

    const handleImageFallback = (event: SyntheticEvent<HTMLImageElement>) => {
        const image = event.currentTarget;
        const current = image.src;
        if (current.includes("uc?export=view")) {
            return;
        }
        const idMatch = current.match(/[?&]id=([^&]+)/);
        if (!idMatch?.[1]) {
            return;
        }
        image.src = `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    };

    return (
        <article className="cart-item">
            <img
                src={product.imageUrl}
                alt={product.name}
                onError={handleImageFallback}
                style={{ aspectRatio: stickerAspectRatio(product.size) }}
            />
            <div>
                <h3>{product.name}</h3>
                <p>Sheet Name: {product.sheetName}</p>
                <p>Sticker Sheet ID: {product.id}</p>
                <p>Size: {product.size.toUpperCase()}</p>
                <p>Type: {product.type}</p>
                <p>Parent: {product.parentCategory}</p>
                <QuantityControl
                    quantity={quantity}
                    onChange={(next) => onUpdateQuantity(product, next)}
                />
            </div>
        </article>
    );
}
