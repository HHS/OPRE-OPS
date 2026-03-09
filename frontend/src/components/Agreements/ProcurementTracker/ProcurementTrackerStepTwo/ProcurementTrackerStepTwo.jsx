import { getLocalISODate } from "../../../../helpers/utils";
import TextArea from "../../../UI/Form/TextArea";
import ConfirmationModal from "../../../UI/Modals/ConfirmationModal";
import SimpleAlert from "../../../UI/Alert/SimpleAlert";
import TermTag from "../../../UI/Term/TermTag";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerPreSolicitationStep} ProcurementTrackerPreSolicitationStep
 */

/**
 * @typedef {Object} ProcurementTrackerStepTwoProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {boolean} isDisabled - The complete step form is disabled
 * @property {ProcurementTrackerPreSolicitationStep} stepTwoData - The data for step 2 of the procurement tracker
 * @property {boolean} isActiveStep - Whether step is the active step
 * @property {SafeUser[]} authorizedUsers - List of users authorized for this agreement
 * @property {Function} [handleSetCompletedStepNumber] - Optional callback to set completed step number
 */

/**
 * @component
 * @param {ProcurementTrackerStepTwoProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepTwo = ({
    stepStatus,
    isDisabled,
    stepTwoData,
    isActiveStep,
    authorizedUsers,
    handleSetCompletedStepNumber
}) => {
    const {
        isPreSolicitationPackageFinalized,
        setIsPreSolicitationPackageFinalized,
        draftSolicitationDate,
        setDraftSolicitationDate,
        selectedUser,
        setSelectedUser,
        setTargetCompletionDate,
        targetCompletionDate,
        step2CompletedByUserName,
        step2DateCompleted,
        setStep2DateCompleted,
        step2Notes,
        setStep2Notes,
        step2NotesLabel,
        runValidate,
        validatorRes,
        step2DateCompletedLabel,
        MemoizedDatePicker,
        handleTargetCompletionDateSubmit,
        handleRevisedTargetDateSubmit,
        step2TargetCompletionDateLabel,
        showModal,
        setShowModal,
        modalProps,
        cancelModalStep2,
        handleStepTwoComplete,
        step2DraftSolicitationDateLabel,
        isPastDue,
        revisedTargetDate,
        setRevisedTargetDate
    } = useProcurementTrackerStepTwo(stepTwoData, handleSetCompletedStepNumber);

    // Disabled flags for form controls
    const isTargetCompletionDateSaveDisabled =
        isDisabled || validatorRes.hasErrors("targetCompletionDate") || !targetCompletionDate;
    const isRevisedTargetDateSaveDisabled =
        isDisabled || validatorRes.hasErrors("revisedTargetDate") || !revisedTargetDate;
    const isPreSolicitationCheckboxDisabled = isDisabled || !isActiveStep;
    const isUsersComboBoxDisabled = isDisabled || !isPreSolicitationPackageFinalized || authorizedUsers.length === 0;
    const isPackageFinalizedFieldsDisabled = isDisabled || !isPreSolicitationPackageFinalized;
    const isCompleteStep2Disabled =
        isPackageFinalizedFieldsDisabled ||
        validatorRes.hasErrors() ||
        !selectedUser?.id ||
        !step2DateCompleted ||
        (!stepTwoData?.target_completion_date && !targetCompletionDate);

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
            {stepStatus === "PENDING" && (
                <fieldset className="usa-fieldset">
                    <p>
                        Edit the pre-solicitation package in collaboration with the Procurement Shop. Once the documents
                        are finalized, go to the Documents Tab, upload the final and signed versions, and check this
                        step as complete. If you have a target completion date for when the package will be finalized,
                        enter it below.
                    </p>
                    <div className="display-flex flex-align-end margin-bottom-2">
                        {stepTwoData?.target_completion_date ? (
                            <TermTag
                                term="Target Completion Date"
                                description={step2TargetCompletionDateLabel}
                            />
                        ) : (
                            <>
                                <MemoizedDatePicker
                                    id="target-completion-date"
                                    name="targetCompletionDate"
                                    label="Target Completion Date"
                                    messages={validatorRes.getErrors("targetCompletionDate") || []}
                                    hint="mm/dd/yyyy"
                                    value={targetCompletionDate}
                                    onChange={(e) => {
                                        runValidate("targetCompletionDate", e.target.value);
                                        setTargetCompletionDate(e.target.value);
                                    }}
                                    minDate={getLocalISODate()}
                                    isDisabled={isDisabled}
                                />
                                <button
                                    className="usa-button usa-button--unstyled margin-bottom-1 margin-left-2"
                                    data-cy="target-completion-save-btn"
                                    disabled={isTargetCompletionDateSaveDisabled}
                                    onClick={() => {
                                        handleTargetCompletionDateSubmit(stepTwoData?.id);
                                    }}
                                >
                                    Save
                                </button>
                            </>
                        )}
                    </div>
                    {isPastDue && (
                        <>
                            <div className="margin-x-4">
                                <SimpleAlert
                                    type="warning"
                                    message="The Target Completion Date is past due. Please enter a Revised Target Date below."
                                />
                            </div>
                            <div className="display-flex flex-align-end margin-bottom-2">
                                <MemoizedDatePicker
                                    id="revised-target-date"
                                    name="revisedTargetDate"
                                    label="Revised Target Completion Date"
                                    messages={validatorRes.getErrors("revisedTargetDate") || []}
                                    hint="mm/dd/yyyy"
                                    value={revisedTargetDate}
                                    onChange={(e) => {
                                        runValidate("revisedTargetDate", e.target.value);
                                        setRevisedTargetDate(e.target.value);
                                    }}
                                    minDate={getLocalISODate()}
                                    isDisabled={isDisabled}
                                />
                                <button
                                    className="usa-button usa-button--unstyled margin-bottom-1 margin-left-2"
                                    data-cy="revised-target-save-btn"
                                    disabled={isRevisedTargetDateSaveDisabled}
                                    onClick={() => {
                                        handleRevisedTargetDateSubmit(stepTwoData?.id);
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </>
                    )}
                    <div className="usa-checkbox margin-top-3">
                        <input
                            className="usa-checkbox__input"
                            id="step-2-checkbox"
                            type="checkbox"
                            name="step-2-checkbox"
                            value="step-2-checkbox"
                            checked={isPreSolicitationPackageFinalized}
                            onChange={() => setIsPreSolicitationPackageFinalized(!isPreSolicitationPackageFinalized)}
                            disabled={isPreSolicitationCheckboxDisabled}
                        />
                        <label
                            className="usa-checkbox__label"
                            htmlFor="step-2-checkbox"
                        >
                            The pre-solicitation package has been finalized between the Procurement Shop and OPRE and
                            the final version has been uploaded
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
                            onChange={(name, value) => {
                                runValidate(name, value);
                            }}
                        />

                        <MemoizedDatePicker
                            id="step-2-date-completed"
                            name="dateCompleted"
                            className="margin-left-4"
                            label="Date Completed"
                            hint="mm/dd/yyyy"
                            value={step2DateCompleted}
                            messages={validatorRes.getErrors("dateCompleted") || []}
                            onChange={(e) => {
                                runValidate("dateCompleted", e.target.value);
                                setStep2DateCompleted(e.target.value);
                            }}
                            maxDate={getLocalISODate()}
                            isDisabled={isPackageFinalizedFieldsDisabled}
                        />
                    </div>
                    <TextArea
                        name="notes"
                        label="Notes (optional)"
                        className="margin-top-2"
                        maxLength={750}
                        value={step2Notes}
                        onChange={(_, value) => setStep2Notes(value)}
                        isDisabled={isPackageFinalizedFieldsDisabled}
                    />
                    <p
                        className={`margin-top-4 margin-bottom-0 ${isPackageFinalizedFieldsDisabled ? "text-base" : "text-base-dark"}`}
                    >
                        After the package is finalized, enter the Draft Solicitation date below (if applicable).
                    </p>
                    <div className="display-flex">
                        <MemoizedDatePicker
                            id="step-2-draft-solicitation-date"
                            name="draftSolicitationDate"
                            label="Draft Solicitation Date (optional)"
                            hint="mm/dd/yyyy"
                            value={draftSolicitationDate}
                            messages={validatorRes.getErrors("draftSolicitationDate") || []}
                            onChange={(e) => {
                                runValidate("draftSolicitationDate", e.target.value);
                                setDraftSolicitationDate(e.target.value);
                            }}
                            isDisabled={isPackageFinalizedFieldsDisabled}
                        />
                    </div>

                    <div className="margin-top-2 display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-right-2"
                            data-cy="cancel-button"
                            onClick={cancelModalStep2}
                            disabled={isPackageFinalizedFieldsDisabled}
                        >
                            Cancel
                        </button>
                        <button
                            className="usa-button"
                            data-cy="continue-btn"
                            onClick={() => {
                                handleStepTwoComplete(stepTwoData?.id);
                            }}
                            disabled={isCompleteStep2Disabled}
                        >
                            Complete Step 2
                        </button>
                    </div>
                </fieldset>
            )}

            {stepStatus === "COMPLETED" && (
                <div>
                    <p>
                        Edit the pre-solicitation package in collaboration with the Procurement Shop. Once the documents
                        are finalized, go to the Documents Tab, upload the final and signed versions, and update the
                        task below.
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
                            The pre-solicitation package has been finalized between the Procurement Shop and OPRE and
                            the final version has been uploaded
                        </p>
                    </div>
                    <dl className="display-flex flex-wrap">
                        <div className="width-full">
                            <TermTag
                                term="Target Completion Date"
                                description={step2TargetCompletionDateLabel || "None"}
                            />
                        </div>
                        <TermTag
                            term="Completed By"
                            description={step2CompletedByUserName}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Date Completed"
                            description={step2DateCompletedLabel}
                        />
                        <div className="width-full">
                            <TermTag
                                term="Draft Solicitation Date"
                                description={step2DraftSolicitationDateLabel || "None"}
                            />
                        </div>
                        <div className="width-full">
                            <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                            <dd className="margin-0 margin-top-1">{step2NotesLabel || "None"}</dd>
                        </div>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepTwo;
