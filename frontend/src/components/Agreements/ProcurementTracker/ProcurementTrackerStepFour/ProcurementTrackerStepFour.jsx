import { getLocalISODate } from "../../../../helpers/utils";
import TextArea from "../../../UI/Form/TextArea";
import ConfirmationModal from "../../../UI/Modals/ConfirmationModal";
import TermTag from "../../../UI/Term/TermTag";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepFour from "./ProcurementTrackerStepFour.hooks";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PROCUREMENT_STEP_STATUS } from "../ProcurementTracker.constants";

/**
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerEvaluationStep} ProcurementTrackerEvaluationStep
 */

/**
 * @typedef {Object} ProcurementTrackerStepFourProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {boolean} isDisabled - The complete step form is disabled
 * @property {ProcurementTrackerEvaluationStep} stepFourData - The data for step 4 of the procurement tracker
 * @property {boolean} isActiveStep - Whether step is the active step
 * @property {SafeUser[]} authorizedUsers - List of users authorized for this agreement
 * @property {((stepNumber: number) => void) | undefined} [handleSetCompletedStepNumber] - Optional callback to set completed step number
 * @property {boolean} [isReadOnly] - Whether to render in read-only mode (plain text, no form controls)
 */

/**
 * @component
 * @param {ProcurementTrackerStepFourProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepFour = ({
    stepStatus,
    isDisabled,
    stepFourData,
    isActiveStep,
    authorizedUsers,
    handleSetCompletedStepNumber,
    isReadOnly = false
}) => {
    const {
        isEvaluationComplete,
        setIsEvaluationComplete,
        selectedUser,
        setSelectedUser,
        setTargetCompletionDate,
        targetCompletionDate,
        step4CompletedByUserName,
        step4DateCompleted,
        setStep4DateCompleted,
        step4Notes,
        setStep4Notes,
        step4NotesLabel,
        runValidate,
        validatorRes,
        step4DateCompletedLabel,
        MemoizedDatePicker,
        handleTargetCompletionDateSubmit,
        step4TargetCompletionDateLabel,
        showModal,
        setShowModal,
        modalProps,
        cancelModalStep4,
        handleStepFourComplete
    } = useProcurementTrackerStepFour(stepFourData, handleSetCompletedStepNumber);

    // Disabled flags for form controls
    const isTargetCompletionDateSaveDisabled =
        isDisabled || validatorRes.hasErrors("targetCompletionDate") || !targetCompletionDate || !stepFourData?.id;
    const isEvaluationCheckboxDisabled = isDisabled || !isActiveStep;
    const isUsersComboBoxDisabled = isDisabled || !isEvaluationComplete || authorizedUsers.length === 0;
    const isEvaluationFieldsDisabled = isDisabled || !isEvaluationComplete;
    const disableStep4Buttons =
        isDisabled ||
        !isEvaluationComplete ||
        !selectedUser?.id ||
        !step4DateCompleted ||
        validatorRes.hasErrors() ||
        !stepFourData?.id;

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
                        Complete the technical evaluations and any potential negotiations. If you have a target
                        completion date for when evaluations will be complete, enter it below. Once you internally
                        select a vendor check this task as complete (Internally means internal to OPRE, before you send
                        the Final Consensus Memo to the Procurement Shop).
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
                                Evaluations are complete and OPRE has internally selected a vendor (Final Consensus Memo
                                has not been sent)
                            </p>
                        </div>
                    )}
                    <dl className="display-flex flex-wrap">
                        <div className="width-full">
                            <TermTag
                                term="Target Completion Date"
                                description={step4TargetCompletionDateLabel || "TBD"}
                            />
                        </div>
                        <TermTag
                            term="Completed By"
                            description={step4CompletedByUserName || "TBD"}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Date Completed"
                            description={step4DateCompletedLabel || "TBD"}
                        />
                        <div className="width-full">
                            <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                            <dd className="margin-0 margin-top-1">{step4NotesLabel || "None"}</dd>
                        </div>
                    </dl>
                </div>
            )}
            {!isReadOnly &&
                (stepStatus === PROCUREMENT_STEP_STATUS.PENDING || stepStatus === PROCUREMENT_STEP_STATUS.ACTIVE) && (
                    <fieldset className="usa-fieldset">
                        <p>
                            Complete the technical evaluations and any potential negotiations. If you have a target
                            completion date for when evaluations will be complete, enter it below. Once you internally
                            select a vendor check this task as complete (Internally means internal to OPRE, before you
                            send the Final Consensus Memo to the Procurement Shop).
                        </p>
                        <div className="display-flex flex-align-end margin-bottom-2">
                            {stepFourData?.target_completion_date ? (
                                <TermTag
                                    term="Target Completion Date"
                                    description={step4TargetCompletionDateLabel}
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
                                        data-cy="step-4-target-completion-save-btn"
                                        disabled={isTargetCompletionDateSaveDisabled}
                                        onClick={() => {
                                            handleTargetCompletionDateSubmit(stepFourData?.id);
                                        }}
                                    >
                                        Save
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="usa-checkbox margin-top-3">
                            <input
                                className="usa-checkbox__input"
                                id="step-4-checkbox"
                                type="checkbox"
                                name="step-4-checkbox"
                                value="step-4-checkbox"
                                checked={isEvaluationComplete}
                                onChange={() => setIsEvaluationComplete(!isEvaluationComplete)}
                                disabled={isEvaluationCheckboxDisabled}
                            />
                            <label
                                className="usa-checkbox__label"
                                htmlFor="step-4-checkbox"
                            >
                                Evaluations are complete and OPRE has internally selected a vendor (Final Consensus Memo
                                has not been sent)
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
                                id="step-4-date-completed"
                                name="dateCompleted"
                                className="margin-left-4"
                                label="Date Completed"
                                hint="mm/dd/yyyy"
                                value={step4DateCompleted}
                                messages={validatorRes.getErrors("dateCompleted") || []}
                                onChange={
                                    /** @param {any} e */ (e) => {
                                        runValidate("dateCompleted", e.target.value);
                                        setStep4DateCompleted(e.target.value);
                                    }
                                }
                                maxDate={getLocalISODate()}
                                isDisabled={isEvaluationFieldsDisabled}
                            />
                        </div>
                        <TextArea
                            name="notes"
                            label="Notes (optional)"
                            className="margin-top-2"
                            maxLength={750}
                            value={step4Notes}
                            onChange={/** @param {any} _ @param {any} value */ (_, value) => setStep4Notes(value)}
                            isDisabled={isEvaluationFieldsDisabled}
                        />

                        <div className="margin-top-2 display-flex flex-justify-end">
                            <button
                                type="button"
                                className="usa-button usa-button--unstyled margin-right-2"
                                data-cy="cancel-button"
                                onClick={cancelModalStep4}
                                disabled={isEvaluationFieldsDisabled}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="usa-button"
                                data-cy="continue-btn"
                                onClick={() => {
                                    handleStepFourComplete(stepFourData?.id);
                                }}
                                disabled={disableStep4Buttons}
                            >
                                Complete Step 4
                            </button>
                        </div>
                    </fieldset>
                )}

            {!isReadOnly && stepStatus === PROCUREMENT_STEP_STATUS.COMPLETED && (
                <div>
                    <p>
                        OPRE completes the technical evaluations and any potential negotiations. Once OPRE internally
                        selects a vendor (before sending the Final Consensus Memo to the Procurement Shop), this step is
                        marked complete.
                    </p>
                    <div className="display-flex flex-align-center margin-top-5">
                        <FontAwesomeIcon
                            icon={faCircleCheck}
                            size="lg"
                            className="margin-right-1 flex-shrink-0 text-primary-darker"
                            aria-hidden="true"
                        />
                        <p className="margin-y-0">
                            Evaluations are complete and OPRE has internally selected a vendor (Final Consensus Memo has
                            not been sent)
                        </p>
                    </div>
                    <dl className="display-flex flex-wrap">
                        <div className="width-full">
                            <TermTag
                                term="Target Completion Date"
                                description={step4TargetCompletionDateLabel || "None"}
                            />
                        </div>
                        <TermTag
                            term="Completed By"
                            description={step4CompletedByUserName}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Date Completed"
                            description={step4DateCompletedLabel}
                        />
                        <div className="width-full">
                            <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                            <dd className="margin-0 margin-top-1">{step4NotesLabel || "None"}</dd>
                        </div>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepFour;
