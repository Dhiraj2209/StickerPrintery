import { useMemo, useState } from "react";
import { type FormEvent } from "react";
import "./App.css";
import {
  COMPANY_NAME,
  HOME_SECTIONS,
  STICKERS,
  WHATSAPP_NUMBER,
  type HomeSectionId,
} from "./data/stickers";
import { type CartItem, type CustomerDetails, type StickerProduct } from "./types";
import { generateOrderPdf } from "./utils/pdf";

type ViewState =
  | { page: "home" }
  | { page: "listing"; sectionId: HomeSectionId }
  | { page: "cart" };

function App() {
  const [view, setView] = useState<ViewState>({ page: "home" });
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "alphabetical">("default");
  const [activeSticker, setActiveSticker] = useState<StickerProduct | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const currentSection =
    view.page === "listing"
      ? HOME_SECTIONS.find((section) => section.id === view.sectionId) ?? null
      : null;

  const listingProducts = useMemo(() => {
    if (!currentSection) {
      return [];
    }

    const source = STICKERS.filter((sticker) => {
      if (currentSection.id === "best-seller") {
        return sticker.bestSeller;
      }
      return sticker.size.toLowerCase() === currentSection.id;
    });

    const searched = source.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase().trim()),
    );

    if (sortBy === "alphabetical") {
      return [...searched].sort((a, b) => a.name.localeCompare(b.name));
    }

    return searched;
  }, [currentSection, searchTerm, sortBy]);

  const updateQuantity = (product: StickerProduct, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }

      return {
        ...prev,
        [product.id]: { product, quantity },
      };
    });
  };

  const handleSubmitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cartItems.length === 0) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const customer: CustomerDetails = {
      name: String(formData.get("name") ?? "").trim(),
      contactNumber: String(formData.get("contactNumber") ?? "").trim(),
      streetAddress: String(formData.get("streetAddress") ?? "").trim(),
      pincode: String(formData.get("pincode") ?? "").trim(),
    };

    if (!customer.name || !customer.contactNumber || !customer.streetAddress || !customer.pincode) {
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const { blob, fileName, summaryText } = await generateOrderPdf({
        customer,
        cartItems,
      });
      const pdfFile = new File([blob], fileName, { type: "application/pdf" });

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      const sharePayload = {
        title: "Sticker Order",
        text: summaryText,
        files: [pdfFile],
      };

      if (navigator.canShare && navigator.canShare(sharePayload)) {
        await navigator.share(sharePayload);
      } else {
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          `${summaryText}\n\nPDF downloaded. Please attach and send it.`,
        )}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      setCart({});
      setIsOrderModalOpen(false);
      setView({ page: "home" });
    } catch (error) {
      // Keep this visible for troubleshooting share/PDF issues in browser-only mode.
      // eslint-disable-next-line no-console
      console.error("Unable to place order", error);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const showSearch = view.page === "listing";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <p className="brand-label">Sticker Studio</p>
          <h1>{COMPANY_NAME}</h1>
        </div>

        <div className="header-actions">
          {showSearch ? (
            <input
              type="search"
              className="search-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search sticker sheets..."
              aria-label="Search stickers by name"
            />
          ) : (
            <div className="search-input placeholder-hidden" />
          )}

          <button className="cart-button" onClick={() => setView({ page: "cart" })} type="button">
            Cart View
            <span>{cartCount}</span>
          </button>
        </div>
      </header>

      <main className="page-content">
        {view.page === "home" ? (
          <section className="home-grid">
            <h2>Choose Sticker Sheets</h2>
            <p>Pick by bestseller picks or sheet size.</p>
            <div className="section-cards">
              {HOME_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className="section-card"
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("default");
                    setView({ page: "listing", sectionId: section.id });
                  }}
                >
                  <strong>{section.label}</strong>
                  <span>{section.description}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {view.page === "listing" && currentSection ? (
          <section className="listing-page">
            <div className="listing-controls">
              <button className="back-link" type="button" onClick={() => setView({ page: "home" })}>
                Back to Home
              </button>
              <div className="sort-group">
                <label htmlFor="sortBy">Sort</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as "default" | "alphabetical")}
                >
                  <option value="default">Default</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            <h2>{currentSection.label}</h2>
            <div className="sticker-grid">
              {listingProducts.map((product) => {
                const currentQty = cart[product.id]?.quantity ?? 0;
                return (
                  <article className="sticker-card" key={product.id}>
                    <button
                      className="image-button"
                      type="button"
                      onClick={() => setActiveSticker(product)}
                      aria-label={`View ${product.name}`}
                    >
                      <img src={product.imageUrl} alt={product.name} loading="lazy" />
                    </button>
                    <h3>{product.name}</h3>
                    <p>
                      Sheet: {product.sheetName} | Size: {product.size.toUpperCase()}
                    </p>
                    {currentQty === 0 ? (
                      <button className="action-button" type="button" onClick={() => updateQuantity(product, 1)}>
                        Add
                      </button>
                    ) : (
                      <div className="qty-control">
                        <button type="button" onClick={() => updateQuantity(product, currentQty - 1)}>
                          -
                        </button>
                        <span>{currentQty}</span>
                        <button type="button" onClick={() => updateQuantity(product, currentQty + 1)}>
                          +
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {view.page === "cart" ? (
          <section className="cart-page">
            <div className="cart-head-row">
              <button className="back-link" type="button" onClick={() => setView({ page: "home" })}>
                Back to Home
              </button>
              <h2>Cart Summary</h2>
            </div>

            <div className="cart-scroll-area">
              {cartItems.length === 0 ? <p className="empty-state">No sticker sheet selected yet.</p> : null}
              {cartItems.map(({ product, quantity }) => (
                <article className="cart-item" key={product.id}>
                  <img src={product.imageUrl} alt={product.name} />
                  <div>
                    <h3>{product.name}</h3>
                    <p>Sheet Name: {product.sheetName}</p>
                    <p>Sticker Sheet ID: {product.id}</p>
                    <p>Size: {product.size.toUpperCase()}</p>
                    <div className="qty-control">
                      <button type="button" onClick={() => updateQuantity(product, quantity - 1)}>
                        -
                      </button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => updateQuantity(product, quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-fixed-footer">
              <p>
                Total Quantity: <strong>{cartCount}</strong>
              </p>
              <button
                type="button"
                className="order-now-btn"
                onClick={() => setIsOrderModalOpen(true)}
                disabled={cartItems.length === 0}
              >
                Order Now
              </button>
            </div>
          </section>
        ) : null}
      </main>

      {activeSticker ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Sticker preview">
          <div className="preview-modal">
            <button type="button" className="close-modal" onClick={() => setActiveSticker(null)}>
              Close
            </button>
            <img src={activeSticker.imageUrl} alt={activeSticker.name} />
            <h3>{activeSticker.name}</h3>
            <p>
              {activeSticker.sheetName} | Size: {activeSticker.size.toUpperCase()}
            </p>
            {(cart[activeSticker.id]?.quantity ?? 0) === 0 ? (
              <button className="action-button" type="button" onClick={() => updateQuantity(activeSticker, 1)}>
                Add
              </button>
            ) : (
              <div className="qty-control">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(activeSticker, (cart[activeSticker.id]?.quantity ?? 1) - 1)
                  }
                >
                  -
                </button>
                <span>{cart[activeSticker.id]?.quantity ?? 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(activeSticker, (cart[activeSticker.id]?.quantity ?? 1) + 1)
                  }
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isOrderModalOpen ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Order details form">
          <form className="order-modal" onSubmit={handleSubmitOrder}>
            <h3>Customer Details</h3>
            <label htmlFor="name">Customer Name</label>
            <input id="name" name="name" required />

            <label htmlFor="contactNumber">Contact Number</label>
            <input id="contactNumber" name="contactNumber" required />

            <label htmlFor="streetAddress">Street Address</label>
            <input id="streetAddress" name="streetAddress" required />

            <label htmlFor="pincode">Pincode</label>
            <input id="pincode" name="pincode" required />

            <div className="modal-buttons">
              <button type="button" onClick={() => setIsOrderModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmittingOrder}>
                {isSubmittingOrder ? "Creating PDF..." : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default App;
