import PropTypes from "prop-types";
import { useEffect, useRef } from "react";

export const ContainerModal = ({
    heading,
    description = "",
    setShowModal = () => {},
    cancelButtonText = "Cancel",
    children
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
        };

        // add event listener for keyboard navigation
        currentModalRef.addEventListener("keydown", handleKeydown);

        // clean up the event listener when the component unmounts
        return () => {
            currentModalRef.removeEventListener("keydown", handleKeydown);
        };
    }, []);
    return (
        <>
            <div
                className="usa-modal-wrapper is-visible"
                role="dialog"
                id="ops-modal"
                aria-labelledby="ops-modal-heading"
                aria-describedby="ops-modal-description"
            >
                <div
                    className="usa-modal-overlay"
                    aria-controls="ops-modal"
                    onClick={() => setShowModal(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            setShowModal(false);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                >
                    <div
                        className="usa-modal"
                        ref={modalRef}
                    >
                        <div
                            className="usa-modal__content"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            role="presentation"
                        >
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
