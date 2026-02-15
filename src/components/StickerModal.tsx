import { type StickerProduct } from "../types";
import { QuantityControl } from "./QuantityControl";
import { type SyntheticEvent } from "react";

type StickerModalProps = {
    product: StickerProduct;
    quantity: number;
    onClose: () => void;
    onUpdateQuantity: (product: StickerProduct, quantity: number) => void;
};

export function StickerModal({
    product,
    quantity,
    onClose,
    onUpdateQuantity,
}: StickerModalProps) {

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
        <div
            className="modal-layer"
            role="dialog"
            aria-modal="true"
            aria-label="Sticker preview"
            onClick={onClose}
        >
            <div className="preview-modal" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="close-modal" onClick={onClose}>
                    Close
                </button>
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    onError={handleImageFallback}
                    style={{ aspectRatio: stickerAspectRatio(product.size) }}
                />
                <h3>{product.name}</h3>
                <p>
                    {product.sheetName} | Size: {product.size.toUpperCase()}
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
            </div>
        </div>
    );
}
