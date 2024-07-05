import PropTypes from "prop-types";
import { useEffect, useRef, useCallback } from "react";

/**
 * A modal component that can be used to display a message or prompt the user for confirmation.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading text to display in the modal.
 * @param {string | Array<any>} [props.description=""] - The description text to display in the modal.
 * @param {Function} [props.setShowModal=() => {}] - A function to set the visibility of the modal.
 * @param {string} [props.cancelButtonText] - The text to display on the primary action button.
 * @param {React.ReactNode} props.children - The child nodes to be rendered within the layout
 * @returns {JSX.Element} - The modal component JSX.
 */
export const ContainerModal = ({
    heading,
    description = "",
    setShowModal = () => {},
    cancelButtonText = "Cancel",
    children
}) => {
    const modalRef = useRef(null);

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
                    lastElement.focus();
                } else if (!event.shiftKey && document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
            if (event.key === "Escape") {
                setShowModal(false);
            }
        },
        [getFocusableElements, setShowModal]
    );

    useEffect(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        const previouslyFocusedElement = document.activeElement;

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocusedElement.focus();
        };
    }, [getFocusableElements, handleKeyDown]);
    return (
        <>
            <div
                className="usa-modal-wrapper is-visible"
                role="dialog"
                id="ops-modal"
                aria-labelledby="ops-modal-heading"
                aria-describedby="ops-modal-description"
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
                                    id="ops-modal-heading"
                                    style={{ fontSize: "1.2188rem" }}
                                >
                                    {heading}
                                </h2>
                                <div className="usa-prose">
                                    <p id="ops-modal-description">{description}</p>
                                    {children}
                                </div>
                                <div className="usa-modal__footer">
                                    <ul className="usa-button-group">
                                        <li className="usa-button-group__item">
                                            <button
                                                type="button"
                                                className="usa-button usa-button--unstyled padding-105 text-center"
                                                onClick={() => setShowModal(false)}
                                            >
                                                {cancelButtonText}
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

export default ContainerModal;

ContainerModal.propTypes = {
    heading: PropTypes.string.isRequired,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    setShowModal: PropTypes.func.isRequired,
    cancelButtonText: PropTypes.string
};
