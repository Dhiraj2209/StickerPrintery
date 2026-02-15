import { type CartItem as CartItemType, type StickerProduct } from "../types";
import { CartItem } from "../components/CartItem";

type CartViewProps = {
    cartItems: CartItemType[];
    cartCount: number;
    onUpdateQuantity: (product: StickerProduct, quantity: number) => void;
    onBack: () => void;
    onOrderNow: () => void;
};

export function CartView({
    cartItems,
    cartCount,
    onUpdateQuantity,
    onBack,
    onOrderNow,
}: CartViewProps) {
    return (
        <section className="cart-page">
            <div className="cart-head-row">
                <button className="back-link" type="button" onClick={onBack}>
                    Back
                </button>
                <h2>Cart Summary</h2>
            </div>

            <div className="cart-scroll-area">
                {cartItems.length === 0 ? (
                    <p className="empty-state">No sticker sheet selected yet.</p>
                ) : null}
                {cartItems.map((item) => (
                    <CartItem
                        key={item.product.id}
                        item={item}
                        onUpdateQuantity={onUpdateQuantity}
                    />
                ))}
            </div>

            <div className="cart-fixed-footer">
                <p>
                    Total Quantity: <strong>{cartCount}</strong>
                </p>
                <button
                    type="button"
                    className="order-now-btn"
                    onClick={onOrderNow}
                    disabled={cartItems.length === 0}
                >
                    Order Now
                </button>
            </div>
        </section>
    );
}
