import { type FormEvent } from "react";

type OrderModalProps = {
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function OrderModal({ isSubmitting, onClose, onSubmit }: OrderModalProps) {
    return (
        <div
            className="modal-layer"
            role="dialog"
            aria-modal="true"
            aria-label="Order details form"
            onClick={onClose}
        >
            <form
                className="order-modal"
                onSubmit={onSubmit}
                onClick={(event) => event.stopPropagation()}
            >
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
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating PDF..." : "Confirm"}
                    </button>
                </div>
            </form>
        </div>
    );
}
