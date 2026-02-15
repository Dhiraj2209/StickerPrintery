
export function QuantityControl({
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
