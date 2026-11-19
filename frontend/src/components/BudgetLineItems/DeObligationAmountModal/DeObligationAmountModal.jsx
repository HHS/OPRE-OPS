import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import CurrencyInput from "../../UI/Form/CurrencyInput";
import suite from "./suite";

/**
 * Asks how much to de-obligate from an Obligated budget line (OPS-6488). Shown after the user
 * confirms they need to de-obligate; confirming stages the amount, it doesn't save it.
 * @component
 * @param {Object} props
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} props.budgetLine - The Obligated budget line.
 * @param {Function} props.onConfirm - Called with the amount to de-obligate.
 * @param {Function} props.onClose - Called to close without staging anything.
 * @returns {React.ReactElement}
 */
export const DeObligationAmountModal = ({ budgetLine, onConfirm, onClose }) => {
    const obligatedAmount = budgetLine?.amount ?? 0;
    const [amount, setAmount] = useState(budgetLine?.requested_de_obligation_amount ?? null);
    const [result, setResult] = useState(() => {
        suite.reset();
        return suite.get();
    });
    const modalRef = useRef(null);

    const getFocusableElements = useCallback(() => {
        if (!modalRef.current) return [];
        return Array.from(
            modalRef.current.querySelectorAll(
                'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        );
    }, []);

    const handleKeyDown = useCallback(
        (event) => {
            const focusableElements = getFocusableElements();
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (event.key === "Tab") {
                if (event.shiftKey && document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement?.focus();
                } else if (!event.shiftKey && document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement?.focus();
                }
            }
            if (event.key === "Escape") {
                onClose();
            }
        },
        [getFocusableElements, onClose]
    );

    useEffect(() => {
        const previouslyFocusedElement = document.activeElement;
        modalRef.current?.querySelector("input")?.focus();
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocusedElement?.focus?.();
        };
    }, [handleKeyDown]);

    const validate = (value) => {
        const next = suite.run({ requestedAmount: value }, obligatedAmount);
        setResult(next);
        return next;
    };

    const handleConfirm = () => {
        if (amount == null || validate(amount).hasErrors()) {
            return;
        }
        onConfirm(amount);
    };

    return (
        <div
            className="usa-modal-wrapper is-visible"
            role="dialog"
            id="de-obligation-amount-modal"
            aria-labelledby="de-obligation-amount-modal-heading"
            aria-describedby="de-obligation-amount-modal-description"
            data-cy="de-obligation-amount-modal"
        >
            <div className="usa-modal-overlay">
                <div
                    className="usa-modal"
                    ref={modalRef}
                >
                    <div className="usa-modal__content">
                        <div className="usa-modal__main">
                            <h2
                                className="usa-modal__heading font-family-sans"
                                id="de-obligation-amount-modal-heading"
                                style={{ fontSize: "1.2188rem" }}
                            >
                                How much do you need to de-obligate?
                            </h2>
                            <div className="usa-prose">
                                <p id="de-obligation-amount-modal-description">
                                    The original budget line amount is {formatCurrency(obligatedAmount)}
                                </p>
                            </div>
                            <CurrencyInput
                                name="deObligationAmount"
                                label="Amount to De-Obligate"
                                className="maxw-card-lg"
                                messages={result.getErrors("requestedAmount")}
                                value={amount ?? ""}
                                setEnteredAmount={setAmount}
                                onChange={(_name, value) => validate(value === "" ? null : Number(value))}
                                dataCy="de-obligation-amount-input"
                            />
                            <div className="usa-modal__footer">
                                <ul className="usa-button-group">
                                    <li className="usa-button-group__item">
                                        <button
                                            type="button"
                                            className="usa-button"
                                            data-cy="confirm-de-obligation-amount"
                                            disabled={amount == null || result.hasErrors()}
                                            onClick={handleConfirm}
                                        >
                                            De-obligate Funding
                                        </button>
                                    </li>
                                    <li className="usa-button-group__item">
                                        <button
                                            type="button"
                                            className="usa-button usa-button--unstyled padding-105 text-center"
                                            data-cy="cancel-de-obligation-amount"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="usa-button usa-modal__close"
                            aria-label="Close this window"
                            data-cy="close-de-obligation-amount"
                            onClick={onClose}
                        >
                            <FontAwesomeIcon
                                icon={faClose}
                                className="height-3 width-3"
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

DeObligationAmountModal.propTypes = {
    budgetLine: PropTypes.object.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default DeObligationAmountModal;
