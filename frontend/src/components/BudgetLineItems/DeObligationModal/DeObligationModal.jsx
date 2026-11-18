import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import CurrencyInput from "../../UI/Form/CurrencyInput";
import useAlert from "../../../hooks/use-alert.hooks";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import { useSubmitDeObligationMutation } from "../../../api/opsAPI";
import { useEditAgreementDispatch } from "../../Agreements/AgreementEditor/AgreementEditorContext.hooks";
import suite from "./suite";

/**
 * @typedef {import('../../../types/BudgetLineTypes').BudgetLine} BudgetLine
 */

/**
 * Two-step flow for de-obligating funds from an Obligated budget line (OPS-6488): a
 * confirmation step (this can only be a de-obligation), then an amount-entry step. Submitting
 * records a pending de-obligation request -- it never changes the budget line's real amount or
 * the CAN balance; that's OPS-6489's job once a Division Director approves it.
 *
 * @component
 * @param {Object} props
 * @param {BudgetLine} props.budgetLine - The Obligated budget line being de-obligated.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {Function} props.onClose - Called to close the modal (cancel, go back, or after a
 *   successful submit).
 * @returns {React.ReactElement | null}
 */
export const DeObligationModal = ({ budgetLine, isOpen, onClose }) => {
    const [step, setStep] = useState("confirm");
    const [requestedAmount, setRequestedAmount] = useState(budgetLine?.requested_de_obligation_amount ?? "");
    const [vestResult, setVestResult] = useState(suite.get());
    const { setAlert } = useAlert();
    const [submitDeObligation] = useSubmitDeObligationMutation();
    const dispatch = useEditAgreementDispatch();
    const modalRef = useRef(null);

    // Focus trap + Escape-to-close, matching ConfirmationModal/ContainerModal's pattern, so both
    // steps of this flow are fully keyboard operable.
    const getFocusableElements = useCallback(() => {
        if (!modalRef.current) return [];
        return Array.from(
            modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
        if (!isOpen) return undefined;
        const previouslyFocusedElement = document.activeElement;
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocusedElement?.focus();
        };
        // Re-run when the step changes so focus moves into the new step's first control.
    }, [isOpen, step, getFocusableElements, handleKeyDown]);

    if (!isOpen || !budgetLine) {
        return null;
    }

    const maxAmount = budgetLine.amount ?? 0;
    const errors = vestResult.getErrors("requestedAmount");

    const validate = (value) => {
        const result = suite.run({ requestedAmount: value }, maxAmount);
        setVestResult(result);
        return result;
    };

    const handleClose = () => {
        setStep("confirm");
        setRequestedAmount(budgetLine?.requested_de_obligation_amount ?? "");
        suite.reset();
        setVestResult(suite.get());
        onClose();
    };

    const handleSubmit = async () => {
        if (validate(requestedAmount).hasErrors()) {
            return;
        }
        try {
            const updatedBudgetLine = await submitDeObligation({
                id: budgetLine.id,
                requestedAmount: Number(requestedAmount)
            }).unwrap();
            // The edit page renders from EditAgreementContext's local draft copy of the budget
            // lines, not live from the RTK Query cache -- so even though the submit above already
            // persisted the de-obligation, the row won't show it until that draft copy is updated
            // too. This merges in the authoritative response fields (net_amount,
            // requested_de_obligation_amount, etc.) while keeping the UI-only decoration fields
            // (services_component_number, serviceComponentGroupingLabel, ...) that only exist on
            // the context copy. There's nothing left to send on "Save & Exit" for this field --
            // record_de_obligation_request already persisted it -- so this intentionally doesn't
            // flag the line as having an unsaved change.
            dispatch({ type: "UPDATE_BUDGET_LINE_ITEM", payload: { ...budgetLine, ...updatedBudgetLine } });
            setAlert({
                type: "success",
                heading: "De-obligation Submitted",
                message: `Budget line ${budgetLine.id} has been updated. Start a contract modification from the Award & Modifications tab when you're ready to send it for approval.`
            });
            scrollToTop();
            handleClose();
        } catch {
            setAlert({
                type: "error",
                heading: "Error Submitting De-obligation",
                message: "There was an error submitting the de-obligation. Please try again."
            });
            scrollToTop();
        }
    };

    // Rendered via a portal: this component is used from inside a table row (BLIRow), and a
    // <div> can't be a child of <tbody>/<tr> -- this escapes that structure, matching the "modal
    // triggered from deep in a list" pattern (no other modal in this codebase does this yet).
    return createPortal(
        <div
            className="usa-modal-wrapper is-visible"
            role="dialog"
            id="de-obligation-modal"
            aria-labelledby="de-obligation-modal-heading"
            aria-describedby="de-obligation-modal-description"
            data-cy="de-obligation-modal"
        >
            <div className="usa-modal-overlay">
                <div
                    className="usa-modal"
                    ref={modalRef}
                >
                    <div className="usa-modal__content">
                        <div className="usa-modal__main">
                            {step === "confirm" ? (
                                <>
                                    <h2
                                        className="usa-modal__heading font-family-sans"
                                        id="de-obligation-modal-heading"
                                        style={{ fontSize: "1.2188rem" }}
                                    >
                                        Editing an obligated budget line can only be completed for de-obligations. Do
                                        you need to de-obligate funding from this budget line?
                                    </h2>
                                    <div className="usa-prose">
                                        <p id="de-obligation-modal-description">
                                            De-obligating funding will update the total for this budget line and the
                                            agreement, but will not immediately impact the CAN balance. All
                                            de-obligations require a contract modification in order to process.
                                        </p>
                                    </div>
                                    <div className="usa-modal__footer">
                                        <ul className="usa-button-group">
                                            <li className="usa-button-group__item">
                                                <button
                                                    type="button"
                                                    className="usa-button"
                                                    data-cy="confirm-de-obligation"
                                                    onClick={() => setStep("amount")}
                                                >
                                                    Yes, De-obligate Funding
                                                </button>
                                            </li>
                                            <li className="usa-button-group__item">
                                                <button
                                                    type="button"
                                                    data-cy="go-back-de-obligation"
                                                    className="usa-button usa-button--unstyled padding-105 text-center"
                                                    onClick={handleClose}
                                                >
                                                    Go back
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2
                                        className="usa-modal__heading font-family-sans"
                                        id="de-obligation-modal-heading"
                                        style={{ fontSize: "1.2188rem" }}
                                    >
                                        De-obligate Funding
                                    </h2>
                                    <div
                                        className="usa-prose"
                                        id="de-obligation-modal-description"
                                    >
                                        <CurrencyInput
                                            name="requestedAmount"
                                            label="De-obligated Amount"
                                            messages={errors}
                                            value={requestedAmount}
                                            setEnteredAmount={setRequestedAmount}
                                            onChange={(_name, value) => validate(value)}
                                            dataCy="de-obligation-amount-input"
                                        />
                                        <span className="usa-hint">
                                            {`Above $0 up to $${Number(maxAmount).toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}`}
                                        </span>
                                    </div>
                                    <div className="usa-modal__footer">
                                        <ul className="usa-button-group">
                                            <li className="usa-button-group__item">
                                                <button
                                                    type="button"
                                                    className="usa-button"
                                                    data-cy="update-de-obligation"
                                                    onClick={handleSubmit}
                                                >
                                                    Update Budget Line
                                                </button>
                                            </li>
                                            <li className="usa-button-group__item">
                                                <button
                                                    type="button"
                                                    data-cy="cancel-de-obligation"
                                                    className="usa-button usa-button--unstyled padding-105 text-center"
                                                    onClick={handleClose}
                                                >
                                                    Cancel
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

DeObligationModal.propTypes = {
    budgetLine: PropTypes.object,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default DeObligationModal;
