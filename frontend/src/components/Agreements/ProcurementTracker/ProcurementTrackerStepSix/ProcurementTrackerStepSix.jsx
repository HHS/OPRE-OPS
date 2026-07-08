import React from "react";
import { useNavigate } from "react-router-dom";
import { getLocalISODate } from "../../../../helpers/utils";
import TextArea from "../../../UI/Form/TextArea";
import ConfirmationModal from "../../../UI/Modals/ConfirmationModal";
import TermTag from "../../../UI/Term/TermTag";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepSix from "./ProcurementTrackerStepSix.hooks";
import { faCircleCheck, faCheck, faPen } from "@fortawesome/free-solid-svg-icons";
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
        isSubmitting,
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
        handleSaveNotes,
        handleStepSixComplete
    } = useProcurementTrackerStepSix(stepSixData, handleSetCompletedStepNumber);

    const [isEditingNotes, setIsEditingNotes] = React.useState(false);

    // Disabled flags for form controls
    const isApprovalRequested =
        stepSixData?.approval_requested &&
        (stepSixData?.approval_status === null ||
            stepSixData?.approval_status === undefined ||
            stepSixData?.approval_status === "PENDING");
    const isTargetCompletionDateSaveDisabled =
        isDisabled || validatorRes.hasErrors("targetCompletionDate") || !targetCompletionDate || !stepSixData?.id;
    const isAwardCheckboxDisabled = isDisabled || !isActiveStep || !stepSixData?.approval_requested;
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

                        {/* Inline success message when approval has been requested */}
                        {isApprovalRequested && (
                            <div
                                className="usa-alert usa-alert--success usa-alert--slim margin-top-2"
                                role="status"
                            >
                                <div className="usa-alert__body">
                                    <p className="usa-alert__text">
                                        This agreement has been submitted for Award Approval. Please complete step 6
                                        below.
                                    </p>
                                </div>
                            </div>
                        )}

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
                            <div className="display-table">
                                <TextArea
                                    name="notes-step-6"
                                    label="Notes (optional)"
                                    className="margin-top-2"
                                    value={stepSixNotes}
                                    onChange={
                                        /** @param {any} _ @param {any} value */ (_, value) => setStepSixNotes(value)
                                    }
                                    isDisabled={isDisabled}
                                    maxLength={750}
                                    data-cy="notes-step-6"
                                    textAreaStyle={{ height: "8.5rem", minWidth: "30rem" }}
                                />
                                <div className="display-flex flex-justify-end">
                                    <button
                                        type="button"
                                        className="usa-button usa-button--unstyled"
                                        data-cy="save-notes-button"
                                        onClick={() => handleSaveNotes(stepSixData?.id)}
                                        disabled={isDisabled}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            size="2x"
                                            className={"text-primary height-2 width-2 cursor-pointer"}
                                        />
                                        Save Notes
                                    </button>
                                </div>
                            </div>

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
                                        isSubmitting ||
                                        validatorRes.hasErrors("dateCompleted") ||
                                        validatorRes.hasErrors("users") ||
                                        !selectedUser ||
                                        !stepSixDateCompleted ||
                                        !isAwardCheckboxChecked
                                    }
                                    data-cy="complete-step-6"
                                >
                                    {isSubmitting ? "Completing..." : "Complete Step 6"}
                                </button>
                            </div>
                        </fieldset>
                    </>
                )}

            {/* State 3: Completed Non-ReadOnly View */}
            {!isReadOnly && stepStatus === PROCUREMENT_STEP_STATUS.COMPLETED && (
                <div>
                    <p>
                        Once you receive the signed award, please send it to the Budget Team and click Request Award
                        Approval below. During this process you will add CLINs, and update the Vendor and Vendor Type.
                        The budget team will review everything has been entered correctly before changing the agreement
                        to Awarded in OPS.
                    </p>
                    <div className="display-flex flex-align-center margin-top-5">
                        <FontAwesomeIcon
                            icon={faCircleCheck}
                            size="lg"
                            className="margin-right-1 flex-shrink-0 text-primary-darker"
                            aria-hidden="true"
                        />
                        <p className="margin-y-0">
                            Award received and uploaded. CLINs entered and Award Approval requested.
                        </p>
                    </div>
                    <dl className="display-flex flex-wrap">
                        <div className="width-full">
                            <TermTag
                                term="Target Completion Date"
                                description={stepSixTargetCompletionDateLabel || "None"}
                            />
                        </div>
                        <TermTag
                            term="Completed By"
                            description={stepSixCompletedByUserName || "Unknown"}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Date Completed"
                            description={stepSixDateCompletedLabel || "Unknown"}
                        />
                        {stepSixData?.approval_status && (
                            <TermTag
                                term="Award Approval Status"
                                description={stepSixData.approval_status}
                                className="margin-left-4"
                            />
                        )}
<div className="margin-top-2">
                        <dt className="margin-0 text-base-dark font-12px">Notes</dt>
                        {isEditingNotes ? (
                            <div className="display-table">
                                <TextArea
                                    name="notes-step-6"
                                    label=""
                                    className="margin-top-1"
                                    maxLength={750}
                                    value={stepSixNotes}
                                    onChange={
                                        /** @param {any} _ @param {any} value */ (_, value) => setStepSixNotes(value)
                                    }
                                    textAreaStyle={{ height: "8.5rem", minWidth: "30rem" }}
                                    isDisabled={isDisabled}
                                />
                                <div className="display-flex flex-justify-end">
                                    <button
                                        type="button"
                                        className="usa-button usa-button--unstyled margin-right-2"
                                        data-cy="cancel-edit-notes-button"
                                        onClick={() => {
                                            setStepSixNotes(stepSixData?.notes ?? "");
                                            setIsEditingNotes(false);
                                        }}
                                        disabled={isDisabled}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="usa-button usa-button--unstyled"
                                        data-cy="save-notes-button"
                                        onClick={async () => {
                                            await handleSaveNotes(stepSixData?.id);
                                            setIsEditingNotes(false);
                                        }}
                                        disabled={isDisabled}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            size="2x"
                                            className="text-primary height-2 width-2 cursor-pointer"
                                        />
                                        Save Notes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <dd className="margin-0 margin-top-1">{stepSixNotesLabel || "None"}</dd>
                                <button
                                    type="button"
                                    className="usa-button usa-button--unstyled margin-top-1"
                                    data-cy="edit-notes-button"
                                    onClick={() => setIsEditingNotes(true)}
                                    disabled={isDisabled}
                                >
                                    <FontAwesomeIcon
                                        icon={faPen}
                                        className="margin-right-1"
                                        aria-hidden="true"
                                    />
                                    Edit Notes
                                </button>
                            </>
                        )}
                    </div>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepSix;
