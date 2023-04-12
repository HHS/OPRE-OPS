import PropTypes from "prop-types";

export const Modal = ({
    heading = "",
    description = "",
    setShowModal = () => {},
    actionButtonText,
    handleConfirm = () => {},
}) => {
    return (
        <>
            <div
                className="usa-modal-wrapper is-visible"
                role="dialog"
                id="example-modal-1"
                aria-labelledby="modal-1-heading"
                aria-describedby="modal-1-description"
                onClick={() => setShowModal(false)}
            >
                <div className="usa-modal-overlay" aria-controls="example-modal-1">
                    <div className="usa-modal" tabIndex="-1" onClick={(e) => e.stopPropagation()}>
                        <div className="usa-modal__content">
                            <div className="usa-modal__main">
                                <h2 className="usa-modal__heading" id="modal-1-heading">
                                    {heading}
                                </h2>
                                {description && (
                                    <div className="usa-prose">
                                        <p id="modal-1-description">{description}</p>
                                    </div>
                                )}
                                <div className="usa-modal__footer">
                                    <ul className="usa-button-group">
                                        <li className="usa-button-group__item">
                                            <button
                                                type="button"
                                                className="usa-button"
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
                                                className="usa-button usa-button--unstyled padding-105 text-center"
                                                onClick={() => setShowModal(false)}
                                            >
                                                Cancel
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

Modal.propTypes = {
    heading: PropTypes.string.isRequired,
    description: PropTypes.string,
    setShowModal: PropTypes.func.isRequired,
    actionButtonText: PropTypes.string.isRequired,
    handleConfirm: PropTypes.func.isRequired,
};
