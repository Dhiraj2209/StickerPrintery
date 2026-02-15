import { useEffect, useMemo, useRef, useState } from "react";
import { type FormEvent } from "react";
import "./App.css";
import { WHATSAPP_NUMBER, type HomeSectionId } from "./data/stickers";
import { type CartItem, type CustomerDetails, type StickerProduct } from "./types";
import { generateOrderPdf } from "./utils/pdf";
import { Header } from "./components/Header";
import { HomeView } from "./views/HomeView";
import { ListingView } from "./views/ListingView";
import { CartView } from "./views/CartView";
import { OrderModal } from "./components/OrderModal";
import { StickerModal } from "./components/StickerModal";

type ViewState =
  | { page: "home" }
  | { page: "listing"; sectionId: HomeSectionId }
  | { page: "cart" };

function App() {
  const [view, setView] = useState<ViewState>({ page: "home" });
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSticker, setActiveSticker] = useState<StickerProduct | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const hasInitializedHistory = useRef(false);
  const isHandlingPopState = useRef(false);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
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

    if (
      !customer.name ||
      !customer.contactNumber ||
      !customer.streetAddress ||
      !customer.pincode
    ) {
      return;
    }
    if (
      !/^\d{10}$/.test(customer.contactNumber) ||
      !/^\d{6}$/.test(customer.pincode)
    ) {
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
          `${summaryText}\n\nPDF downloaded. Please attach and send it.`
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

  return (
    <div className="app-shell">
      <Header
        showSearch={showSearch}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        cartCount={cartCount}
        onCartClick={() => navigateTo({ page: "cart" })}
      />

      <main className="page-content">
        {view.page === "home" ? (
          <HomeView
            onNavigate={(sectionId) => navigateTo({ page: "listing", sectionId })}
          />
        ) : null}

        {view.page === "listing" ? (
          <ListingView
            sectionId={view.sectionId}
            searchTerm={searchTerm}
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onSetActiveSticker={setActiveSticker}
            onBack={goBack}
          />
        ) : null}

        {view.page === "cart" ? (
          <CartView
            cartItems={cartItems}
            cartCount={cartCount}
            onUpdateQuantity={updateQuantity}
            onBack={goBack}
            onOrderNow={() => setIsOrderModalOpen(true)}
          />
        ) : null}
      </main>

      {activeSticker ? (
        <StickerModal
          product={activeSticker}
          quantity={cart[activeSticker.id]?.quantity ?? 0}
          onClose={() => setActiveSticker(null)}
          onUpdateQuantity={updateQuantity}
        />
      ) : null}

      {isOrderModalOpen ? (
        <OrderModal
          isSubmitting={isSubmittingOrder}
          onClose={() => setIsOrderModalOpen(false)}
          onSubmit={handleSubmitOrder}
        />
      ) : null}
    </div>
  );
}

export default App;
