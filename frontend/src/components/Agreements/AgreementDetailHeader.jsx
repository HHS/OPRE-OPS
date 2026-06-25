import { faPen, faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tooltip from "../UI/USWDS/Tooltip";

/**
 * @component - Agreement detail header.
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading to display.
 * @param {string} props.details - The details to display.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @param {boolean} props.isEditable - Whether the agreement is editable.
 * @param {boolean} props.hasUnsavedChanges - Whether there are unsaved changes.
 * @param {boolean} [props.isPreAwardInReview] - Whether pre-award approval is in review.
 * @param {boolean} [props.isAwardInReview] - Whether award approval is in review.
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementDetailHeader = ({
    heading,
    details,
    isEditMode,
    setIsEditMode,
    isEditable,
    hasUnsavedChanges = false,
    isPreAwardInReview = false,
    isAwardInReview = false
}) => {
    const isInReview = isPreAwardInReview || isAwardInReview;
    const reviewTooltipLabel = isPreAwardInReview
        ? "This agreement is In Review for Pre-Award Approval. Edits or changes cannot be made at this time."
        : "This agreement is In Review for Award Approval. Edits or changes cannot be made at this time.";
    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">{heading}</h2>
                {isEditMode && hasUnsavedChanges && (
                    <div
                        className="margin-top-1 margin-bottom-1 margin-left-4 radius-md usa-alert--warning"
                        style={{ display: "inline-block", width: "fit-content", padding: "4px" }}
                    >
                        <FontAwesomeIcon
                            icon={faWarning}
                            aria-hidden="true"
                        ></FontAwesomeIcon>{" "}
                        Unsaved Changes
                    </div>
                )}
                {/* ENABLED EDIT BUTTON - when not in edit mode, is editable, and NOT in any approval review */}
                {!isEditMode && isEditable && !isInReview && (
                    <button
                        type="button"
                        id="edit"
                        className="hover:text-underline cursor-pointer"
                        onClick={() => setIsEditMode(!isEditMode)}
                    >
                        <FontAwesomeIcon
                            icon={faPen}
                            size="2x"
                            className="text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                        />
                        <span className="text-primary">Edit</span>
                    </button>
                )}
                {/* DISABLED EDIT BUTTON - when in approval review */}
                {!isEditMode && isEditable && isInReview && (
                    <Tooltip label={reviewTooltipLabel}>
                        <span
                            id="edit-disabled"
                            className="usa-button--unstyled usa-button--disabled display-flex flex-align-center"
                            aria-disabled="true"
                            data-cy="edit-disabled"
                            tabIndex={0}
                            role="button"
                        >
                            <FontAwesomeIcon
                                icon={faPen}
                                className="height-2 width-2 margin-right-1"
                                aria-hidden="true"
                            />
                            <span>Edit</span>
                        </span>
                    </Tooltip>
                )}
                {isEditMode && (
                    <div className="margin-left-auto">
                        <FontAwesomeIcon
                            icon={faPen}
                            size="2x"
                            className="text-black height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                            aria-hidden="true"
                        />
                        <span
                            id="editing"
                            className="text-black"
                        >
                            Editing...
                        </span>
                    </div>
                )}
            </div>
            <p className="font-sans-sm">{details}</p>
        </>
    );
};

export default AgreementDetailHeader;
