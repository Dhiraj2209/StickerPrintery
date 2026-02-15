import { type StickerProduct } from "../types";
import { QuantityControl } from "./QuantityControl";
import { type SyntheticEvent } from "react";

type ProductCardProps = {
    product: StickerProduct;
    quantity: number;
    onUpdateQuantity: (product: StickerProduct, quantity: number) => void;
    onImageClick: (product: StickerProduct) => void;
};

export function ProductCard({
    product,
    quantity,
    onUpdateQuantity,
    onImageClick,
}: ProductCardProps) {
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
        <article className="sticker-card">
            <button
                className="image-button"
                type="button"
                onClick={() => onImageClick(product)}
                aria-label={`View ${product.name}`}
            >
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    onError={handleImageFallback}
                    style={{ aspectRatio: stickerAspectRatio(product.size) }}
                />
            </button>
            <h3>{product.name}</h3>
            <p>
                Sheet: {product.sheetName} | Size: {product.size.toUpperCase()}
            </p>
            <p>
                Type: {product.type} | Parent: {product.parentCategory}
            </p>
            {quantity === 0 ? (
                <button
                    className="action-button"
                    type="button"
                    onClick={() => onUpdateQuantity(product, 1)}
                >
                    Add
                </button>
            ) : (
                <QuantityControl
                    quantity={quantity}
                    onChange={(next) => onUpdateQuantity(product, next)}
                />
            )}
        </article>
    );
}
