import { useNavigate } from "react-router-dom";
import { getLocalISODate } from "../../../../helpers/utils";
import TextArea from "../../../UI/Form/TextArea";
import ConfirmationModal from "../../../UI/Modals/ConfirmationModal";
import TermTag from "../../../UI/Term/TermTag";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepSix from "./ProcurementTrackerStepSix.hooks";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PROCUREMENT_STEP_STATUS } from "../ProcurementTracker.constants";

/**
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerAwardStep} ProcurementTrackerAwardStep
 */

/**
 * @typedef {Object} ProcurementTrackerStepSixProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {boolean} isDisabled - The complete step form is disabled
 * @property {ProcurementTrackerAwardStep} stepSixData - The data for step 6 of the procurement tracker
 * @property {boolean} isActiveStep - Whether step is the active step
 * @property {SafeUser[]} authorizedUsers - List of users authorized for this agreement
 * @property {number} agreementId - The agreement ID
 * @property {import("../../../../types/BudgetLineTypes").BudgetLine[] | undefined} [budgetLineItems] - Array of budget line items
 * @property {((stepNumber: number) => void) | undefined} [handleSetCompletedStepNumber] - Optional callback to set completed step number
 * @property {boolean} [isReadOnly] - Whether to render in read-only mode (plain text, no form controls)
 */

/**
 * @component
 * @param {ProcurementTrackerStepSixProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepSix = ({
    stepStatus,
    isDisabled,
    stepSixData,
    isActiveStep,
    authorizedUsers,
    agreementId,
    budgetLineItems,
    handleSetCompletedStepNumber,
    isReadOnly = false
}) => {
    const navigate = useNavigate();
    const {
        isAwardCheckboxChecked,
        setIsAwardCheckboxChecked,
        selectedUser,
        setSelectedUser,
        setTargetCompletionDate,
        targetCompletionDate,
        stepSixCompletedByUserName,
        stepSixDateCompleted,
        setStepSixDateCompleted,
        stepSixNotes,
        setStepSixNotes,
        stepSixNotesLabel,
        runValidate,
        validatorRes,
        stepSixDateCompletedLabel,
        MemoizedDatePicker,
        handleTargetCompletionDateSubmit,
        stepSixTargetCompletionDateLabel,
        showModal,
        setShowModal,
        modalProps,
        cancelModalStepSix,
        handleStepSixComplete
    } = useProcurementTrackerStepSix(stepSixData, handleSetCompletedStepNumber);

    // Disabled flags for form controls
    const isApprovalApproved = stepSixData?.approval_status === "APPROVED";
    const isTargetCompletionDateSaveDisabled =
        isDisabled || validatorRes.hasErrors("targetCompletionDate") || !targetCompletionDate || !stepSixData?.id;
    const isAwardCheckboxDisabled = isDisabled || !isActiveStep || !isApprovalApproved;
    const isUsersComboBoxDisabled = isDisabled || !isAwardCheckboxChecked || authorizedUsers.length === 0;
    const isAwardFieldsDisabled = isDisabled || !isAwardCheckboxChecked;

    // Check if there are any BLIs in review status
    const hasBLIInReview = budgetLineItems?.some((bli) => bli.in_review) ?? false;

    const isRequestBtnDisabled =
        isDisabled ||
        !isActiveStep ||
        (!!stepSixData?.approval_requested && stepSixData?.approval_status !== "DECLINED") ||
        hasBLIInReview;

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}

            {/* State 1: Read-Only Completed View */}
            {isReadOnly && stepStatus === PROCUREMENT_STEP_STATUS.COMPLETED && (
                <div className="display-flex">
                    <TermTag
                        iconName="check"
                        iconColor="green"
                        tagStyle="primaryDarkTextWhiteBackground"
                        label={`Completed by ${stepSixCompletedByUserName || "Unknown"} on ${stepSixDateCompletedLabel || "Unknown"}`}
                    />
                    {stepSixNotesLabel && (
                        <div className="margin-left-2">
                            <strong>Notes:</strong> {stepSixNotesLabel}
                        </div>
                    )}
                </div>
            )}

            {/* State 2: Active/Pending Edit Form */}
            {!isReadOnly &&
                (stepStatus === PROCUREMENT_STEP_STATUS.PENDING || stepStatus === PROCUREMENT_STEP_STATUS.ACTIVE) && (
                    <>
                        <p className="margin-top-0">
                            Once you receive the signed award, please send it to the Budget Team and click Request Award
                            Approval below. During this process you will add CLINs, and update the Vendor and Vendor
                            Type. The budget team will review everything has been entered correctly before changing the
                            agreement to Awarded in OPS. Enter the Target Completion Date as the date you expect to
                            receive the signed award, and once you Request Award Approval, check this step as complete.
                        </p>

                        <div className="display-flex flex-align-end margin-bottom-2">
                            {stepSixTargetCompletionDateLabel ? (
                                <TermTag
                                    term="Target Completion Date"
                                    description={stepSixTargetCompletionDateLabel}
                                />
                            ) : (
                                <>
                                    <MemoizedDatePicker
                                        id="target-completion-date-step-6"
                                        name="targetCompletionDate"
                                        label="Target Completion Date (optional)"
                                        messages={validatorRes.getErrors("targetCompletionDate") || []}
                                        hint="mm/dd/yyyy"
                                        value={targetCompletionDate}
                                        onChange={
                                            /** @param {any} e */ (e) => {
                                                runValidate("targetCompletionDate", e.target.value);
                                                setTargetCompletionDate(e.target.value);
                                            }
                                        }
                                        minDate={getLocalISODate()}
                                        isDisabled={isDisabled}
                                    />
                                    <button
                                        type="button"
                                        className="usa-button usa-button--unstyled margin-bottom-1 margin-left-2"
                                        data-cy="save-target-completion-date-step-6"
                                        disabled={isTargetCompletionDateSaveDisabled}
                                        onClick={() => {
                                            handleTargetCompletionDateSubmit(stepSixData?.id);
                                        }}
                                    >
                                        Save
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Request Award Approval Button */}
                        <div className="margin-bottom-3">
                            <button
                                type="button"
                                className="usa-button usa-button--outline"
                                onClick={() => navigate(`/agreements/${agreementId}/award-approval`)}
                                disabled={isRequestBtnDisabled}
                                title={
                                    isRequestBtnDisabled
                                        ? "Award Approval cannot be requested right now. Ensure this step is unlocked, Award Approval has not already been requested, and that no Budget Line Items are currently in review."
                                        : undefined
                                }
                                data-cy="request-award-approval-btn"
                            >
                                Request Award Approval
                            </button>
                        </div>

                        <fieldset className="usa-fieldset margin-top-0">
                            {/* Main Checkbox */}
                            <div className="usa-checkbox">
                                <input
                                    className="usa-checkbox__input"
                                    id="award-checkbox-step-6"
                                    type="checkbox"
                                    name="award-checkbox-step-6"
                                    checked={isAwardCheckboxChecked}
                                    onChange={(e) => setIsAwardCheckboxChecked(e.target.checked)}
                                    disabled={isAwardCheckboxDisabled}
                                    data-cy="award-checkbox-step-6"
                                />
                                <label
                                    className="usa-checkbox__label"
                                    htmlFor="award-checkbox-step-6"
                                >
                                    I received the signed award and it has been uploaded. CLINs have been entered and I
                                    requested Award Approval by the Budget Team.
                                </label>
                            </div>

                            {/* Task Completed By and Date Completed */}
                            <div className="display-flex flex-align-center">
                                <UsersComboBox
                                    className="width-card-lg margin-top-5"
                                    selectedUser={selectedUser}
                                    setSelectedUser={setSelectedUser}
                                    users={authorizedUsers}
                                    label="Task Completed By"
                                    isDisabled={isUsersComboBoxDisabled}
                                    messages={validatorRes.getErrors("users") || []}
                                    onChange={(name, value) => runValidate(name, value)}
                                />

                                <MemoizedDatePicker
                                    id="date-completed-step-6"
                                    name="dateCompleted"
                                    className="margin-left-4"
                                    label="Date Completed"
                                    hint="mm/dd/yyyy"
                                    value={stepSixDateCompleted}
                                    onChange={
                                        /** @param {any} e */ (e) => {
                                            runValidate("dateCompleted", e.target.value);
                                            setStepSixDateCompleted(e.target.value);
                                        }
                                    }
                                    maxDate={getLocalISODate()}
                                    isDisabled={isAwardFieldsDisabled}
                                    messages={validatorRes.getErrors("dateCompleted") || []}
                                />
                            </div>

                            {/* Notes */}
                            <TextArea
                                name="notes-step-6"
                                label="Notes (optional)"
                                className="margin-top-2"
                                value={stepSixNotes}
                                onChange={/** @param {any} _ @param {any} value */ (_, value) => setStepSixNotes(value)}
                                isDisabled={isAwardFieldsDisabled}
                                maxLength={750}
                                data-cy="notes-step-6"
                            />

                            <div className="margin-top-2 display-flex flex-justify-end">
                                <button
                                    type="button"
                                    className="usa-button usa-button--unstyled margin-right-2"
                                    onClick={cancelModalStepSix}
                                    disabled={isDisabled}
                                    data-cy="cancel-step-6"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="usa-button"
                                    onClick={() => handleStepSixComplete(stepSixData?.id)}
                                    disabled={
                                        isDisabled ||
                                        validatorRes.hasErrors("dateCompleted") ||
                                        validatorRes.hasErrors("users") ||
                                        !selectedUser ||
                                        !stepSixDateCompleted ||
                                        !isAwardCheckboxChecked
                                    }
                                    data-cy="complete-step-6"
                                >
                                    Complete Step 6
                                </button>
                            </div>
                        </fieldset>
                    </>
                )}

            {/* State 3: Completed Non-ReadOnly View */}
            {!isReadOnly && stepStatus === PROCUREMENT_STEP_STATUS.COMPLETED && (
                <div className="display-flex flex-align-center">
                    <FontAwesomeIcon
                        icon={faCircleCheck}
                        className="text-green margin-right-1"
                        size="lg"
                    />
                    <span>
                        Completed by {stepSixCompletedByUserName || "Unknown"} on{" "}
                        {stepSixDateCompletedLabel || "Unknown"}
                    </span>
                    {stepSixNotesLabel && (
                        <div className="margin-left-2">
                            <strong>Notes:</strong> {stepSixNotesLabel}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepSix;
