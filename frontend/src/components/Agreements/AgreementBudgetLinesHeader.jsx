import { faPen, faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tooltip from "../UI/USWDS/Tooltip";

/**
 * @component - Agreement detail header.
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading to display.
 * @param {string} [props.details] - The details to display.
 * @param {boolean} props.includeDrafts - Whether the edit mode is on.
 * @param {Function} props.setIncludeDrafts - The function to set the edit mode.
 * @param {boolean} props.isEditable - Whether the agreement is editable.
 * @param {boolean} [props.isEditMode] - Whether the edit mode is on.
 * @param {Function} [props.setIsEditMode] - The function to set the edit mode.
 * @param {boolean} [props.isPreAwardInReview] - Whether pre-award approval is in review.
 * @param {boolean} [props.isAwardInReview] - Whether award approval is in review.
 * @param {boolean} [props.isPostPreAwardLocked] - Whether the agreement is permanently locked after full pre-award approval.
 * @returns {React.ReactElement} - The rendered component.
 */
export const AgreementBudgetLinesHeader = ({
    heading,
    details,
    includeDrafts,
    setIncludeDrafts,
    isEditable,
    isEditMode = false,
    setIsEditMode = () => {},
    isPreAwardInReview = false,
    isAwardInReview = false,
    isPostPreAwardLocked = false
}) => {
    // Editing is disabled when the agreement is in review/locked, consistent with AgreementDetailHeader.
    const isEditDisabled = isPreAwardInReview || isAwardInReview || isPostPreAwardLocked;
    let editDisabledTooltipLabel;
    if (isPreAwardInReview) {
        editDisabledTooltipLabel =
            "This agreement is In Review for Pre-Award Approval. Edits or changes cannot be made at this time.";
    } else if (isAwardInReview) {
        editDisabledTooltipLabel =
            "This agreement is In Review for Award Approval. Edits or changes cannot be made at this time.";
    } else {
        editDisabledTooltipLabel = "This agreement has completed Pre-Award Approval and is locked from further edits.";
    }
    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2
                    id="budget-lines-header"
                    className="font-sans-lg"
                >
                    {heading}
                </h2>

                <div className="display-flex flex-align-baseline">
                    <button
                        type="button"
                        id="toggleDraftBLIs"
                        className="hover:text-underline cursor-pointer margin-right-205"
                        onClick={() => setIncludeDrafts(!includeDrafts)}
                    >
                        <FontAwesomeIcon
                            icon={includeDrafts ? faToggleOn : faToggleOff}
                            size="2xl"
                            className={`margin-right-1 cursor-pointer ${includeDrafts ? "text-primary" : "text-base"}`}
                            title={includeDrafts ? "On (Drafts included)" : "Off (Drafts excluded)"}
                        />
                        <span className="text-primary">Include Drafts</span>
                    </button>

                    {/* ENABLED EDIT BUTTON */}
                    {!isEditMode && isEditable && !isEditDisabled && (
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
                                style={{ top: "-2px" }}
                            />
                            <span className="text-primary">Edit</span>
                        </button>
                    )}
                    {/* DISABLED EDIT BUTTON */}
                    {!isEditMode && isEditable && isEditDisabled && (
                        <Tooltip
                            label={editDisabledTooltipLabel}
                            className="display-flex flex-align-baseline"
                        >
                            <span
                                id="edit-disabled"
                                className="usa-button--unstyled usa-button--disabled display-flex flex-align-baseline"
                                aria-disabled="true"
                                data-cy="edit-disabled"
                            >
                                <FontAwesomeIcon
                                    icon={faPen}
                                    size="2x"
                                    className="height-2 width-2 margin-right-1"
                                    style={{ position: "relative", top: "2px" }}
                                    aria-hidden="true"
                                    data-position="top"
                                />
                                <span>Edit</span>
                            </span>
                        </Tooltip>
                    )}
                </div>
            </div>
            {details && <p className="font-sans-sm">{details}</p>}
        </>
    );
};

export default AgreementBudgetLinesHeader;
