import { COMPANY_NAME } from "../data/stickers";

type HeaderProps = {
    showSearch: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    cartCount: number;
    onCartClick: () => void;
};

export function Header({
    showSearch,
    searchTerm,
    onSearchChange,
    cartCount,
    onCartClick,
}: HeaderProps) {
    return (
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
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search sticker sheets..."
                        aria-label="Search stickers by name"
                    />
                ) : (
                    <div className="search-input placeholder-hidden" />
                )}

                <button className="cart-button" onClick={onCartClick} type="button">
                    Cart View
                    <span>{cartCount}</span>
                </button>
            </div>
        </header>
    );
}
