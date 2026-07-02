import { useNavigate } from "react-router-dom";
import { getLocalISODate } from "../../../../helpers/utils";
import TextArea from "../../../UI/Form/TextArea";
import ConfirmationModal from "../../../UI/Modals/ConfirmationModal";
import TermTag from "../../../UI/Term/TermTag";
import Tooltip from "../../../UI/USWDS/Tooltip/Tooltip";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepFive from "./ProcurementTrackerStepFive.hooks";
import { faCircleCheck, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PROCUREMENT_STEP_STATUS, ProcurementTrackerPreAwardApprovalStatus } from "../ProcurementTracker.constants";

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
        handleSaveNotes,
        handleStepFiveComplete
    } = useProcurementTrackerStepFive(stepFiveData, handleSetCompletedStepNumber);

    // Disabled flags for form controls
    const isApprovalDeclined = stepFiveData?.approval_status === "DECLINED";
    const isApprovalApproved = stepFiveData?.approval_status === "APPROVED";
    const isRequisitionApproved = !!stepFiveData?.requisition_approved_by;
    const isAwaitingBudgetTeam = isApprovalApproved && !isRequisitionApproved;
    const isTargetCompletionDateSaveDisabled =
        isDisabled || validatorRes.hasErrors("targetCompletionDate") || !targetCompletionDate || !stepFiveData?.id;
    const isPreAwardCheckboxDisabled = isDisabled || !isActiveStep || !isApprovalApproved || isAwaitingBudgetTeam;
    const isUsersComboBoxDisabled = isDisabled || !isPreAwardComplete || authorizedUsers.length === 0;
    const isPreAwardFieldsDisabled = isDisabled || !isPreAwardComplete;
    const hasBLIInReview = budgetLineItems?.some((bli) => bli.in_review) ?? false;
    // Allow re-requesting when approval is declined, even if approval_requested was previously true

    const isRequestBtnDisabled =
        isDisabled || !isActiveStep || (!!stepFiveData?.approval_requested && !isApprovalDeclined) || hasBLIInReview;
    const isStep5SubmitDisabled = Boolean(
        isDisabled ||
        !isPreAwardComplete ||
        !selectedUser?.id ||
        !step5DateCompleted ||
        validatorRes.hasErrors() ||
        !stepFiveData?.id ||
        stepFiveData?.approval_status !== ProcurementTrackerPreAwardApprovalStatus.APPROVED ||
        !stepFiveData?.requisition_approved_by // Budget team must approve requisition before completing step
    );

    // Calculate which specific condition is blocking the pre-award approval request
    // Precedence order (most actionable first): BLI in review > approval already requested > step not active > global disabled
    const getPreAwardTooltipMessage = () => {
        // Most actionable: user can resolve BLI reviews immediately
        if (hasBLIInReview) {
            return "Budget lines In Review Status must be approved or declined before you can request pre-award approval";
        }
        // Less actionable: user typically waits for reviewer (but can be explicit about the state)
        if (stepFiveData?.approval_requested && stepFiveData?.approval_status !== "DECLINED") {
            return "Pre-Award Approval has already been requested";
        }
        // Requires completing prior step, usually obvious from UI
        if (!isActiveStep) {
            return "Complete Step 4 before requesting Pre-Award Approval";
        }
        // Generic fallback for global disabled state (no tracker, agreement not editable, etc.)
        if (isDisabled) {
            return "Pre-Award Approval cannot be requested at this time";
        }
        return ""; // No tooltip when button is enabled
    };

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
                        All agreements need Pre-Award Approval before the Final Consensus Memo can be sent to the
                        Procurement Shop. Review the Vendor Price Sheet and make any edits or budget line status changes
                        as needed. After final edits are approved by the Division Director(s), come back here and click
                        Request Pre-Award Approval.
                    </p>
                    <p>
                        Once you receive Pre-Award Approval, and the Budget Team submits the requisition, upload the
                        Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS), and check this step as
                        complete. If you have a target completion date for when the Final Consensus Memo will be sent,
                        enter it below.
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
                                has been sent to the HHS Consolidated Acquisition Solution (HCAS).
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
                            All agreements need Pre-Award Approval before the Final Consensus Memo can be sent to the
                            Procurement Shop. Review the Vendor Price Sheet and make any edits or budget line status
                            changes as needed. After final edits are approved by the Division Director(s), come back
                            here and click Request Pre-Award Approval.
                        </p>
                        <p>
                            Once you receive Pre-Award Approval, and the Budget Team submits the requisition, upload the
                            Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS), and check this
                            step as complete. If you have a target completion date for when the Final Consensus Memo
                            will be sent, enter it below.
                        </p>

                        <div className="display-flex flex-align-end margin-bottom-4">
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
                                <Tooltip
                                    label={getPreAwardTooltipMessage()}
                                    position="top"
                                >
                                    <button
                                        type="button"
                                        className="usa-button usa-button--outline"
                                        onClick={() => navigate(`/agreements/${agreementId}/pre-award-approval`)}
                                        disabled={isRequestBtnDisabled}
                                        data-cy="request-pre-award-approval-btn"
                                    >
                                        Request Pre-Award Approval
                                    </button>
                                </Tooltip>
                                {isApprovalDeclined && (
                                    <div
                                        className="usa-alert usa-alert--error usa-alert--slim margin-top-2"
                                        role="alert"
                                    >
                                        <div className="usa-alert__body">
                                            <p className="usa-alert__text">
                                                This agreement has been declined for Pre-Award. Please do not upload the
                                                Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS)
                                                until changes have been made and re-submitted for approval above.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {stepFiveData?.approval_requested && !isRequisitionApproved && !isApprovalDeclined && (
                                    <div
                                        className="usa-alert usa-alert--warning usa-alert--slim margin-top-2"
                                        role="status"
                                    >
                                        <div className="usa-alert__body">
                                            <p className="usa-alert__text">
                                                This agreement is In Review for Pre-Award Approval. Edits or changes
                                                cannot be made at this time.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {isRequisitionApproved && (
                                    <div
                                        className="usa-alert usa-alert--success usa-alert--slim margin-top-2"
                                        role="status"
                                    >
                                        <div className="usa-alert__body">
                                            <p className="usa-alert__text">
                                                This agreement has been approved for Pre-Award. Please upload the Final
                                                Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS), and
                                                continue your progress in the Procurement Tracker.
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                                been sent to the HHS Consolidated Acquisition Solution (HCAS).
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
                        <div className="display-table">
                            <TextArea
                                name="notes"
                                label="Notes (optional)"
                                className="margin-top-2"
                                maxLength={750}
                                value={step5Notes}
                                onChange={/** @param {any} _ @param {any} value */ (_, value) => setStep5Notes(value)}
                                textAreaStyle={{ height: "8.5rem", minWidth: "30rem" }}
                                isDisabled={isDisabled}
                            />
                            <div className="display-flex flex-justify-end">
                                <button
                                    type="button"
                                    className="usa-button usa-button--unstyled"
                                    data-cy="save-notes-button"
                                    onClick={() => handleSaveNotes(stepFiveData?.id)}
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
                        All agreements need Pre-Award Approval before the Final Consensus Memo can be sent to the
                        Procurement Shop. Review the Vendor Price Sheet and make any edits or budget line status changes
                        as needed. After final edits are approved by the Division Director(s), come back here and click
                        Request Pre-Award Approval.
                    </p>
                    <p>
                        Once you receive Pre-Award Approval, and the Budget Team submits the requisition, upload the
                        Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS), and check this step as
                        complete. If you have a target completion date for when the Final Consensus Memo will be sent,
                        enter it below.
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
                            sent to the HHS Consolidated Acquisition Solution (HCAS).
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
