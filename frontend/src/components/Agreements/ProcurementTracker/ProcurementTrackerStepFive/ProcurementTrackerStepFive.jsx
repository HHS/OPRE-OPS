import { useNavigate } from "react-router-dom";
import { getLocalISODate } from "../../../../helpers/utils";
import TextArea from "../../../UI/Form/TextArea";
import ConfirmationModal from "../../../UI/Modals/ConfirmationModal";
import TermTag from "../../../UI/Term/TermTag";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepFive from "./ProcurementTrackerStepFive.hooks";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PROCUREMENT_STEP_STATUS } from "../ProcurementTracker.constants";

/**
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerPreAwardStep} ProcurementTrackerPreAwardStep
 */

/**
 * @typedef {Object} ProcurementTrackerStepFiveProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {boolean} isDisabled - The complete step form is disabled
 * @property {ProcurementTrackerPreAwardStep} stepFiveData - The data for step 5 of the procurement tracker
 * @property {boolean} isActiveStep - Whether step is the active step
 * @property {SafeUser[]} authorizedUsers - List of users authorized for this agreement
 * @property {number} agreementId - The agreement ID
 * @property {import("../../../../types/BudgetLineTypes").BudgetLine[] | undefined} [budgetLineItems] - Array of budget line items
 * @property {((stepNumber: number) => void) | undefined} [handleSetCompletedStepNumber] - Optional callback to set completed step number
 * @property {boolean} [isReadOnly] - Whether to render in read-only mode (plain text, no form controls)
 */

/**
 * @component
 * @param {ProcurementTrackerStepFiveProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepFive = ({
    stepStatus,
    isDisabled,
    stepFiveData,
    isActiveStep,
    authorizedUsers,
    agreementId,
    budgetLineItems,
    handleSetCompletedStepNumber,
    isReadOnly = false
}) => {
    const navigate = useNavigate();
    const {
        isPreAwardComplete,
        setIsPreAwardComplete,
        selectedUser,
        setSelectedUser,
        setTargetCompletionDate,
        targetCompletionDate,
        step5CompletedByUserName,
        step5DateCompleted,
        setStep5DateCompleted,
        step5Notes,
        setStep5Notes,
        step5NotesLabel,
        runValidate,
        validatorRes,
        step5DateCompletedLabel,
        MemoizedDatePicker,
        handleTargetCompletionDateSubmit,
        step5TargetCompletionDateLabel,
        showModal,
        setShowModal,
        modalProps,
        cancelModalStep5,
        handleStepFiveComplete
    } = useProcurementTrackerStepFive(stepFiveData, handleSetCompletedStepNumber);

    // Disabled flags for form controls
    const isTargetCompletionDateSaveDisabled =
        isDisabled || validatorRes.hasErrors("targetCompletionDate") || !targetCompletionDate || !stepFiveData?.id;
    const isPreAwardCheckboxDisabled = isDisabled || !isActiveStep;
    const isUsersComboBoxDisabled = isDisabled || !isPreAwardComplete || authorizedUsers.length === 0;
    const isPreAwardFieldsDisabled = isDisabled || !isPreAwardComplete;
    const hasBLIInReview = budgetLineItems?.some((bli) => bli.in_review) ?? false;
    const isRequestBtnDisabled = isDisabled || !isActiveStep || !!stepFiveData?.approval_requested || hasBLIInReview;
    const isStep5SubmitDisabled = Boolean(
        isDisabled ||
        !isPreAwardComplete ||
        !selectedUser?.id ||
        !step5DateCompleted ||
        validatorRes.hasErrors() ||
        !stepFiveData?.id ||
        stepFiveData?.approval_requested
    );
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
            {isReadOnly && (
                <div>
                    <p>
                        Edit the Agreement to match the Vendor Price Sheet and ensure any final Budget Changes are
                        approved, if needed. Request Pre-Award Approval from the Procurement Shop. If you have a target
                        completion date for when the Final Consensus Memo will be sent, enter it below. Once you receive
                        Pre-Award Approval and send the Final Consensus Memo to the Procurement Shop, check this task as
                        complete.
                    </p>
                    {stepStatus === PROCUREMENT_STEP_STATUS.COMPLETED && (
                        <div className="display-flex flex-align-center margin-top-5">
                            <FontAwesomeIcon
                                icon={faCircleCheck}
                                size="lg"
                                className="margin-right-1 flex-shrink-0 text-primary-darker"
                                aria-hidden="true"
                            />
                            <p className="margin-y-0">
                                The Agreement was edited to match the Vendor Price Sheet and any final Budget Changes
                                were approved, if needed. Pre-Award Approval was received and the Final Consensus Memo
                                has been sent to the Procurement Shop.
                            </p>
                        </div>
                    )}
                    <dl className="display-flex flex-wrap">
                        <div className="width-full">
                            <TermTag
                                term="Target Completion Date"
                                description={step5TargetCompletionDateLabel || "TBD"}
                            />
                        </div>
                        <TermTag
                            term="Completed By"
                            description={step5CompletedByUserName || "TBD"}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Date Completed"
                            description={step5DateCompletedLabel || "TBD"}
                        />
                        <div className="width-full">
                            <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                            <dd className="margin-0 margin-top-1">{step5NotesLabel || "None"}</dd>
                        </div>
                    </dl>
                </div>
            )}
            {!isReadOnly &&
                (stepStatus === PROCUREMENT_STEP_STATUS.PENDING || stepStatus === PROCUREMENT_STEP_STATUS.ACTIVE) && (
                    <fieldset className="usa-fieldset">
                        <p>
                            Edit the Agreement to match the Vendor Price Sheet and ensure any final Budget Changes are
                            approved, if needed. Request Pre-Award Approval from the Procurement Shop. If you have a
                            target completion date for when the Final Consensus Memo will be sent, enter it below. Once
                            you receive Pre-Award Approval and send the Final Consensus Memo to the Procurement Shop,
                            check this task as complete.
                        </p>

                        <div className="display-flex flex-align-end margin-bottom-2">
                            {stepFiveData?.target_completion_date ? (
                                <TermTag
                                    term="Target Completion Date"
                                    description={step5TargetCompletionDateLabel}
                                />
                            ) : (
                                <>
                                    <MemoizedDatePicker
                                        id="target-completion-date"
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
                                        data-cy="step-5-target-completion-save-btn"
                                        disabled={isTargetCompletionDateSaveDisabled}
                                        onClick={() => {
                                            handleTargetCompletionDateSubmit(stepFiveData?.id);
                                        }}
                                    >
                                        Save
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Pre-Award Approval Request Section */}
                        {
                            <div className="margin-bottom-3">
                                <p>
                                    Before completing this step, you may request Pre-Award Approval from your Division
                                    Director.
                                </p>
                                <button
                                    type="button"
                                    className="usa-button"
                                    onClick={() => navigate(`/agreements/${agreementId}/pre-award-approval`)}
                                    disabled={isRequestBtnDisabled}
                                    title={
                                        isRequestBtnDisabled
                                            ? "Pre-Award Approval cannot be requested right now. Ensure this step is unlocked, Pre-Award Approval has not already been requested, and that no Budget Line Items are currently in review."
                                            : undefined
                                    }
                                    data-cy="request-pre-award-approval-btn"
                                >
                                    Request Pre-Award Approval
                                </button>
                            </div>
                        }

                        <div className="usa-checkbox margin-top-3">
                            <input
                                className="usa-checkbox__input"
                                id="step-5-checkbox"
                                type="checkbox"
                                name="step-5-checkbox"
                                value="step-5-checkbox"
                                checked={isPreAwardComplete}
                                onChange={() => setIsPreAwardComplete(!isPreAwardComplete)}
                                disabled={isPreAwardCheckboxDisabled}
                            />
                            <label
                                className="usa-checkbox__label"
                                htmlFor="step-5-checkbox"
                            >
                                The Agreement was edited to match the Vendor Price Sheet and any final Budget Changes
                                were approved, if needed. I received Pre-Award Approval and the Final Consensus Memo has
                                been sent to the Procurement Shop.
                            </label>
                        </div>
                        <div className="display-flex flex-align-center">
                            <UsersComboBox
                                className="width-card-lg margin-top-5"
                                label={"Task Completed By"}
                                selectedUser={selectedUser}
                                setSelectedUser={setSelectedUser}
                                users={authorizedUsers}
                                isDisabled={isUsersComboBoxDisabled}
                                messages={validatorRes.getErrors("users") || []}
                                onChange={
                                    /** @param {any} name @param {any} value */ (name, value) => {
                                        runValidate(name, value);
                                    }
                                }
                            />

                            <MemoizedDatePicker
                                id="step-5-date-completed"
                                name="dateCompleted"
                                className="margin-left-4"
                                label="Date Completed"
                                hint="mm/dd/yyyy"
                                value={step5DateCompleted}
                                messages={validatorRes.getErrors("dateCompleted") || []}
                                onChange={
                                    /** @param {any} e */ (e) => {
                                        runValidate("dateCompleted", e.target.value);
                                        setStep5DateCompleted(e.target.value);
                                    }
                                }
                                maxDate={getLocalISODate()}
                                isDisabled={isPreAwardFieldsDisabled}
                            />
                        </div>
                        <TextArea
                            name="notes"
                            label="Notes (optional)"
                            className="margin-top-2"
                            maxLength={750}
                            value={step5Notes}
                            onChange={/** @param {any} _ @param {any} value */ (_, value) => setStep5Notes(value)}
                            isDisabled={isPreAwardFieldsDisabled}
                        />

                        <div className="margin-top-2 display-flex flex-justify-end">
                            <button
                                type="button"
                                className="usa-button usa-button--unstyled margin-right-2"
                                data-cy="cancel-button"
                                onClick={cancelModalStep5}
                                disabled={isPreAwardFieldsDisabled}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="usa-button"
                                data-cy="continue-btn"
                                onClick={() => {
                                    handleStepFiveComplete(stepFiveData?.id);
                                }}
                                disabled={isStep5SubmitDisabled}
                            >
                                Complete Step 5
                            </button>
                        </div>
                    </fieldset>
                )}

            {!isReadOnly && stepStatus === PROCUREMENT_STEP_STATUS.COMPLETED && (
                <div>
                    <p>
                        OPRE edits the Agreement to match the Vendor Price Sheet and ensures any final Budget Changes
                        are approved, if needed. Once OPRE receives Pre-Award Approval and sends the Final Consensus
                        Memo to the Procurement Shop, this step is marked complete.
                    </p>
                    <div className="display-flex flex-align-center margin-top-5">
                        <FontAwesomeIcon
                            icon={faCircleCheck}
                            size="lg"
                            className="margin-right-1 flex-shrink-0"
                            style={{ color: "#162e51" }}
                            aria-hidden="true"
                        />
                        <p className="margin-y-0">
                            The Agreement was edited to match the Vendor Price Sheet and any final Budget Changes were
                            approved, if needed. Pre-Award Approval was received and the Final Consensus Memo has been
                            sent to the Procurement Shop.
                        </p>
                    </div>
                    <dl className="display-flex flex-wrap">
                        <div className="width-full">
                            <TermTag
                                term="Target Completion Date"
                                description={step5TargetCompletionDateLabel || "None"}
                            />
                        </div>
                        <TermTag
                            term="Completed By"
                            description={step5CompletedByUserName}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Date Completed"
                            description={step5DateCompletedLabel}
                        />
                        <div className="width-full">
                            <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                            <dd className="margin-0 margin-top-1">{step5NotesLabel || "None"}</dd>
                        </div>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepFive;
