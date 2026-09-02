import { faPen, faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getEditDisabledTooltip } from "../../helpers/agreement.helpers";
import Tooltip from "../UI/USWDS/Tooltip";

/**
 * @component - Agreement detail header.
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading to display.
 * @param {string} [props.details] - The details to display.
 * @param {boolean} props.includeDrafts - Whether the edit mode is on.
 * @param {Function} props.setIncludeDrafts - The function to set the edit mode.
 * @param {boolean} props.isEditable - Whether the agreement is editable (enable source of truth for the button).
 * @param {boolean} [props.canUserEdit] - Whether the user has base edit permission (superuser or team member).
 * @param {boolean} [props.isAgreementNotDeveloped] - Whether the agreement type is not developed yet.
 * @param {boolean} [props.allBudgetLinesInReview] - Whether all budget lines are in review.
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
    canUserEdit = false,
    isAgreementNotDeveloped = false,
    allBudgetLinesInReview = false,
    isEditMode = false,
    setIsEditMode = () => {},
    isPreAwardInReview = false,
    isAwardInReview = false,
    isPostPreAwardLocked = false
}) => {
    // `isEditable` (computed by the parent) is the single source of truth for whether the button
    // is enabled. When it is false, the button is shown disabled with a tooltip explaining why.
    const editDisabledTooltipLabel = getEditDisabledTooltip({
        canUserEdit,
        isAgreementNotDeveloped,
        isPreAwardInReview,
        isAwardInReview,
        isPostPreAwardLocked,
        allBudgetLinesInReview
    });
    return (
        <>
            <div className="display-flex flex-justify flex-align-center margin-top-6">
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

                    {/* ENABLED EDIT BUTTON - when not in edit mode and editing is allowed */}
                    {!isEditMode && isEditable && (
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
                    {/* DISABLED EDIT BUTTON - always shown (with tooltip) when editing is not allowed */}
                    {!isEditMode && !isEditable && (
                        <Tooltip
                            label={editDisabledTooltipLabel}
                            className="display-flex flex-align-baseline"
                        >
                            <span
                                id="edit-disabled"
                                className="hover:text-underline cursor-not-allowed text-disabled display-flex flex-align-baseline"
                                aria-disabled="true"
                                data-cy="edit-disabled"
                                role="button"
                                tabIndex={0}
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
