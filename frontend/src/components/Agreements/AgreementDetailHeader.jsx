import { faPen, faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getEditDisabledTooltip } from "../../helpers/agreement.helpers";
import EditingIndicator from "../UI/EditingIndicator";
import DisabledEditButton from "./DisabledEditButton";

/**
 * @component - Agreement detail header.
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading to display.
 * @param {string} props.details - The details to display.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @param {boolean} props.isEditable - Whether the agreement is editable (enable source of truth for the button).
 * @param {boolean} [props.canUserEdit] - Whether the user has base edit permission (superuser or team member).
 * @param {boolean} [props.isAgreementNotDeveloped] - Whether the agreement type is not developed yet.
 * @param {boolean} props.hasUnsavedChanges - Whether there are unsaved changes.
 * @param {boolean} [props.isPreAwardInReview] - Whether pre-award approval is in review.
 * @param {boolean} [props.isAwardInReview] - Whether award approval is in review.
 * @param {boolean} [props.isPostPreAwardLocked] - Whether the agreement is permanently locked after full pre-award approval.
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementDetailHeader = ({
    heading,
    details,
    isEditMode,
    setIsEditMode,
    isEditable,
    canUserEdit = false,
    isAgreementNotDeveloped = false,
    hasUnsavedChanges = false,
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
        isPostPreAwardLocked
    });
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
                        />
                        <span className="text-primary">Edit</span>
                    </button>
                )}
                {/* DISABLED EDIT BUTTON - always shown (with tooltip) when editing is not allowed */}
                {!isEditMode && !isEditable && <DisabledEditButton label={editDisabledTooltipLabel} />}
                {isEditMode && (
                    <div className="margin-left-auto">
                        <EditingIndicator />
                    </div>
                )}
            </div>
            <p className="font-sans-sm">{details}</p>
        </>
    );
};

export default AgreementDetailHeader;
