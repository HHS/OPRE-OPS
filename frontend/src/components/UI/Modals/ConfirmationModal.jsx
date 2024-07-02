import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import LogItem from "../LogItem";

/**
 * A modal component that can be used to display a message or prompt the user for confirmation.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading text to display in the modal.
 * @param {string | Array<any>} [props.description=""] - The description text to display in the modal.
 * @param {Function} [props.setShowModal=() => {}] - A function to set the visibility of the modal.
 * @param {string} props.actionButtonText - The text to display on the primary action button.
 * @param {string} [props.secondaryButtonText="Cancel"] - The text to display on the secondary action button.
 * @param {Function} [props.handleConfirm=() => {}] - A function to handle the primary action button click.
 * @returns {JSX.Element} - The modal component JSX.
 */
export const ConfirmationModal = ({
    heading,
    description = "",
    setShowModal = () => {},
    actionButtonText,
    secondaryButtonText = "Cancel",
    handleConfirm = () => {}
}) => {
    const modalRef = useRef(null);

    useEffect(() => {
        // set initial focus to the modal
        const currentModalRef = modalRef.current;
        currentModalRef.focus();

        const handleKeydown = (event) => {
            // get all focusable elements in the modal container
            const focusableElements = currentModalRef.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.key === "Tab") {
                // handle focus wraparound
                if (document.activeElement === lastElement && !event.shiftKey) {
                    event.preventDefault();
                    firstElement.focus();
                }
                if (document.activeElement === firstElement && event.shiftKey) {
                    event.preventDefault();
                    lastElement.focus();
                }
            }
            if (event.key === "Escape") {
                // close the modal on Escape key press
                setShowModal(false);
            }
        };

        // add event listener for keyboard navigation
        currentModalRef.addEventListener("keydown", handleKeydown);

        // clean up the event listener when the component unmounts
        return () => {
            currentModalRef.removeEventListener("keydown", handleKeydown);
        };
    }, [setShowModal]);
    return (
        <>
            <div
                className="usa-modal-wrapper is-visible"
                role="dialog"
                id="ops-modal"
                aria-labelledby="ops-modal-heading"
                aria-describedby="ops-modal-description"
                onClick={() => setShowModal(false)}
            >
                <div
                    className="usa-modal-overlay"
                    aria-controls="ops-modal"
                >
                    <div
                        className="usa-modal"
                        tabIndex={-1}
                        onClick={(e) => e.stopPropagation()}
                        ref={modalRef}
                    >
                        <div className="usa-modal__content">
                            <div className="usa-modal__main">
                                <h2
                                    className="usa-modal__heading font-family-sans"
                                    id="ops-modal-heading"
                                    style={{ fontSize: "1.2188rem" }}
                                >
                                    {heading}
                                </h2>
                                {description && description instanceof Array && description.length > 0 && (
                                    <ul>
                                        {description.map((item) => (
                                            <LogItem
                                                key={item.id}
                                                title={item.title}
                                                createdOn={item.created_on}
                                                message={item.message}
                                                variant="large"
                                                withSeparator={true}
                                            />
                                        ))}
                                    </ul>
                                )}
                                {description && typeof description === "string" && (
                                    <div className="usa-prose">
                                        <p id="ops-modal-description">{description}</p>
                                    </div>
                                )}
                                <div className="usa-modal__footer">
                                    <ul className="usa-button-group">
                                        <li className="usa-button-group__item">
                                            <button
                                                type="button"
                                                className="usa-button"
                                                data-cy="confirm-action"
                                                onClick={() => {
                                                    setShowModal(false);
                                                    handleConfirm();
                                                }}
                                            >
                                                {actionButtonText}
                                            </button>
                                        </li>
                                        <li className="usa-button-group__item">
                                            <button
                                                type="button"
                                                data-cy="cancel-action"
                                                className="usa-button usa-button--unstyled padding-105 text-center"
                                                onClick={() => setShowModal(false)}
                                            >
                                                {secondaryButtonText}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfirmationModal;

ConfirmationModal.propTypes = {
    heading: PropTypes.string.isRequired,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    setShowModal: PropTypes.func.isRequired,
    actionButtonText: PropTypes.string.isRequired,
    secondaryButtonText: PropTypes.string,
    handleConfirm: PropTypes.func.isRequired
};
