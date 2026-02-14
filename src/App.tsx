import { useEffect, useMemo, useRef, useState } from "react";
import { type FormEvent, type SyntheticEvent } from "react";
import "./App.css";
import {
  COMPANY_NAME,
  HOME_SECTIONS,
  PARENT_CATEGORIES,
  STICKERS,
  STICKER_TYPES,
  WHATSAPP_NUMBER,
  type HomeSectionId,
} from "./data/stickers";
import {
  type CartItem,
  type CustomerDetails,
  type ParentCategory,
  type StickerProduct,
  type StickerType,
} from "./types";
import { generateOrderPdf } from "./utils/pdf";

type ViewState =
  | { page: "home" }
  | { page: "listing"; sectionId: HomeSectionId }
  | { page: "cart" };

function QuantityControl({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="qty-control">
      <button type="button" onClick={() => onChange(quantity - 1)}>
        -
      </button>
      <input
        aria-label="Quantity"
        value={quantity}
        inputMode="numeric"
        onChange={(event) => {
          const raw = event.target.value.replace(/[^\d]/g, "");
          const parsed = raw ? Number(raw) : 0;
          onChange(parsed);
        }}
      />
      <button type="button" onClick={() => onChange(quantity + 1)}>
        +
      </button>
    </div>
  );
}

function App() {
  const [view, setView] = useState<ViewState>({ page: "home" });
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "alphabetical">("default");
  const [selectedType, setSelectedType] = useState<(typeof STICKER_TYPES)[number]>("all");
  const [selectedParent, setSelectedParent] = useState<(typeof PARENT_CATEGORIES)[number]>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeSticker, setActiveSticker] = useState<StickerProduct | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const hasInitializedHistory = useRef(false);
  const isHandlingPopState = useRef(false);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  useEffect(() => {
    if (!hasInitializedHistory.current) {
      window.history.replaceState({ view }, "");
      hasInitializedHistory.current = true;
      return;
    }
    if (isHandlingPopState.current) {
      isHandlingPopState.current = false;
      return;
    }
    window.history.pushState({ view }, "");
  }, [view]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const nextView = event.state?.view as ViewState | undefined;
      isHandlingPopState.current = true;
      setView(nextView ?? { page: "home" });
      setActiveSticker(null);
      setIsOrderModalOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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

    const typed = searched.filter((item) => {
      if (selectedType === "all") {
        return true;
      }
      return item.type === (selectedType as StickerType);
    });

    const parentFiltered = typed.filter((item) => {
      if (selectedParent === "all") {
        return true;
      }
      return item.parentCategory === (selectedParent as ParentCategory);
    });

    if (sortBy === "alphabetical") {
      return [...parentFiltered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return parentFiltered;
  }, [currentSection, searchTerm, selectedParent, selectedType, sortBy]);

  const updateQuantity = (product: StickerProduct, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: { product, quantity } };
    });
  };

  const navigateTo = (next: ViewState) => {
    setView(next);
    setActiveSticker(null);
    setIsOrderModalOpen(false);
  };

  const goBack = () => {
    if (view.page === "home") {
      return;
    }
    window.history.back();
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
    if (!/^\d{10}$/.test(customer.contactNumber) || !/^\d{6}$/.test(customer.pincode)) {
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
      navigateTo({ page: "home" });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Unable to place order", error);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const showSearch = view.page === "listing";
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
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <p className="brand-label">Premium Sticker Sheets</p>
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

          <button className="cart-button" onClick={() => navigateTo({ page: "cart" })} type="button">
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
                    setSelectedType("all");
                    setSelectedParent("all");
                    setIsFilterOpen(false);
                    navigateTo({ page: "listing", sectionId: section.id });
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
              <button className="back-link" type="button" onClick={goBack}>
                Back
              </button>
              <div className="controls-right">
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
                <button
                  type="button"
                  className="back-link"
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                >
                  Filter
                </button>
              </div>
            </div>

            {isFilterOpen ? (
              <div className="filter-panel">
                <div className="sort-group">
                  <label htmlFor="typeFilter">Type</label>
                  <select
                    id="typeFilter"
                    value={selectedType}
                    onChange={(event) =>
                      setSelectedType(event.target.value as (typeof STICKER_TYPES)[number])
                    }
                  >
                    {STICKER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sort-group">
                  <label htmlFor="parentFilter">Parent</label>
                  <select
                    id="parentFilter"
                    value={selectedParent}
                    onChange={(event) =>
                      setSelectedParent(event.target.value as (typeof PARENT_CATEGORIES)[number])
                    }
                  >
                    {PARENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

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
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        onError={handleImageFallback}
                      />
                    </button>
                    <h3>{product.name}</h3>
                    <p>
                      Sheet: {product.sheetName} | Size: {product.size.toUpperCase()}
                    </p>
                    <p>
                      Type: {product.type} | Parent: {product.parentCategory}
                    </p>
                    {currentQty === 0 ? (
                      <button className="action-button" type="button" onClick={() => updateQuantity(product, 1)}>
                        Add
                      </button>
                    ) : (
                      <QuantityControl
                        quantity={currentQty}
                        onChange={(next) => updateQuantity(product, next)}
                      />
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
              <button className="back-link" type="button" onClick={goBack}>
                Back
              </button>
              <h2>Cart Summary</h2>
            </div>

            <div className="cart-scroll-area">
              {cartItems.length === 0 ? <p className="empty-state">No sticker sheet selected yet.</p> : null}
              {cartItems.map(({ product, quantity }) => (
                <article className="cart-item" key={product.id}>
                  <img src={product.imageUrl} alt={product.name} onError={handleImageFallback} />
                  <div>
                    <h3>{product.name}</h3>
                    <p>Sheet Name: {product.sheetName}</p>
                    <p>Sticker Sheet ID: {product.id}</p>
                    <p>Size: {product.size.toUpperCase()}</p>
                    <p>Type: {product.type}</p>
                    <p>Parent: {product.parentCategory}</p>
                    <QuantityControl
                      quantity={quantity}
                      onChange={(next) => updateQuantity(product, next)}
                    />
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
        <div
          className="modal-layer"
          role="dialog"
          aria-modal="true"
          aria-label="Sticker preview"
          onClick={() => setActiveSticker(null)}
        >
          <div className="preview-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-modal" onClick={() => setActiveSticker(null)}>
              Close
            </button>
            <img src={activeSticker.imageUrl} alt={activeSticker.name} onError={handleImageFallback} />
            <h3>{activeSticker.name}</h3>
            <p>
              {activeSticker.sheetName} | Size: {activeSticker.size.toUpperCase()}
            </p>
            <p>
              Type: {activeSticker.type} | Parent: {activeSticker.parentCategory}
            </p>
            {(cart[activeSticker.id]?.quantity ?? 0) === 0 ? (
              <button className="action-button" type="button" onClick={() => updateQuantity(activeSticker, 1)}>
                Add
              </button>
            ) : (
              <QuantityControl
                quantity={cart[activeSticker.id]?.quantity ?? 1}
                onChange={(next) => updateQuantity(activeSticker, next)}
              />
            )}
          </div>
        </div>
      ) : null}

      {isOrderModalOpen ? (
        <div
          className="modal-layer"
          role="dialog"
          aria-modal="true"
          aria-label="Order details form"
          onClick={() => setIsOrderModalOpen(false)}
        >
          <form className="order-modal" onSubmit={handleSubmitOrder} onClick={(event) => event.stopPropagation()}>
            <h3>Customer Details</h3>
            <label htmlFor="name">Customer Name</label>
            <input id="name" name="name" required />

            <label htmlFor="contactNumber">Contact Number</label>
            <input
              id="contactNumber"
              name="contactNumber"
              required
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              minLength={10}
              title="Contact number must be exactly 10 digits"
            />

            <label htmlFor="streetAddress">Street Address</label>
            <input id="streetAddress" name="streetAddress" required />

            <label htmlFor="pincode">Pincode</label>
            <input
              id="pincode"
              name="pincode"
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              minLength={6}
              title="Pincode must be exactly 6 digits"
            />

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
