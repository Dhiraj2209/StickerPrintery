import { useMemo, useState } from "react";
import {
    STICKERS,
    STICKER_TYPES,
    PARENT_CATEGORIES,
    type HomeSectionId,
} from "../data/stickers";
import {
    type StickerProduct,
    type StickerType,
    type ParentCategory,
    type CartItem,
} from "../types";
import { ProductCard } from "../components/ProductCard";
import { HOME_SECTIONS } from "../data/stickers";

type SortOption = "default" | "alphabetical" | "size-asc" | "size-desc";

type ListingViewProps = {
    sectionId: HomeSectionId;
    searchTerm: string;
    cart: Record<string, CartItem>;
    onUpdateQuantity: (product: StickerProduct, quantity: number) => void;
    onSetActiveSticker: (product: StickerProduct) => void;
    onBack: () => void;
};

export function ListingView({
    sectionId,
    searchTerm,
    cart,
    onUpdateQuantity,
    onSetActiveSticker,
    onBack,
}: ListingViewProps) {
    const [sortBy, setSortBy] = useState<SortOption>("default");
    const [selectedType, setSelectedType] =
        useState<(typeof STICKER_TYPES)[number]>("all");
    const [selectedParent, setSelectedParent] =
        useState<(typeof PARENT_CATEGORIES)[number]>("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const currentSection =
        HOME_SECTIONS.find((section) => section.id === sectionId) ?? null;

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
            item.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
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

        const sizeRank: Record<StickerProduct["size"], number> = {
            a6: 1,
            a4: 2,
            a3: 3,
            custom: 4,
        };

        if (currentSection.id === "best-seller") {
            if (sortBy === "alphabetical") {
                return [...parentFiltered].sort((a, b) => a.name.localeCompare(b.name));
            }
            if (sortBy === "size-desc") {
                return [...parentFiltered].sort((a, b) => sizeRank[b.size] - sizeRank[a.size]);
            }
            return [...parentFiltered].sort((a, b) => sizeRank[a.size] - sizeRank[b.size]);
        }

        if (sortBy === "alphabetical") {
            return [...parentFiltered].sort((a, b) => a.name.localeCompare(b.name));
        }
        return parentFiltered;
    }, [
        currentSection,
        searchTerm,
        selectedParent,
        selectedType,
        sortBy,
        sectionId,
    ]);

    if (!currentSection) {
        return <div>Section not found</div>;
    }

    return (
        <section className="listing-page">
            <div className="listing-controls">
                <button className="back-link" type="button" onClick={onBack}>
                    Back
                </button>
                <div className="controls-right">
                    <div className="sort-group">
                        <label htmlFor="sortBy">Sort</label>
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value as SortOption)}
                        >
                            <option value="default">
                                {currentSection.id === "best-seller"
                                    ? "Default (A6, A4, A3)"
                                    : "Default"}
                            </option>
                            <option value="alphabetical">Alphabetical</option>
                            {currentSection.id === "best-seller" ? (
                                <>
                                    <option value="size-asc">Sheet Size (A6, A4, A3)</option>
                                    <option value="size-desc">Sheet Size Reverse (A3, A4, A6)</option>
                                </>
                            ) : null}
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
                                setSelectedType(
                                    event.target.value as (typeof STICKER_TYPES)[number]
                                )
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
                                setSelectedParent(
                                    event.target.value as (typeof PARENT_CATEGORIES)[number]
                                )
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
                        <ProductCard
                            key={product.id}
                            product={product}
                            quantity={currentQty}
                            onUpdateQuantity={onUpdateQuantity}
                            onImageClick={onSetActiveSticker}
                        />
                    );
                })}
            </div>
        </section>
    );
}
