import TextArea from "../../../UI/Form/TextArea";
import ConfirmationModal from "../../../UI/Modals";
import TermTag from "../../../UI/Term/TermTag";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepOne from "./ProcurementTrackerStepOne.hooks";
import { getLocalISODate } from "../../../../helpers/utils";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerAcquisitionPlanningStep} ProcurementTrackerAcquisitionPlanningStep
 */

/**
 * @typedef {Object} ProcurementTrackerStepOneProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {ProcurementTrackerAcquisitionPlanningStep} stepOneData - The data for step one of the procurement tracker
 * @property {boolean} isActiveStep - Whether step is the active step
 * @property {Function} handleSetCompletedStepNumber - Function to set the completed step number
 * @property {SafeUser[]} authorizedUsers - List of users authorized for this agreement
 * @property {boolean} isDisabled - Whether step controls should be disabled
 * @property {boolean} [isReadOnly] - Whether to render in read-only mode (plain text, no form controls)
 */

/**
 * @component
 * @param {ProcurementTrackerStepOneProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepOne = ({
    stepStatus,
    stepOneData,
    isActiveStep,
    handleSetCompletedStepNumber,
    authorizedUsers,
    isDisabled,
    isReadOnly = false
}) => {
    const {
        isPreSolicitationPackageSent,
        setIsPreSolicitationPackageSent,
        selectedUser,
        setSelectedUser,
        step1DateCompleted,
        setStep1DateCompleted,
        MemoizedDatePicker,
        setStep1Notes,
        step1Notes,
        handleStep1Complete,
        cancelModalStep1,
        disableStep1Buttons,
        modalProps,
        showModal,
        setShowModal,
        step1CompletedByUserName,
        step1DateCompletedLabel,
        step1NotesLabel,
        runValidate,
        validatorRes
    } = useProcurementTrackerStepOne(stepOneData, handleSetCompletedStepNumber, !isDisabled);

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
                        Once the pre-solicitation package is sufficiently drafted and signed by all parties, send it to
                        the Procurement Shop and check this step as complete.
                    </p>
                    {stepStatus === "COMPLETED" && (
                        <div className="display-flex flex-align-center margin-top-5">
                            <FontAwesomeIcon
                                icon={faCircleCheck}
                                size="lg"
                                className="margin-right-1 flex-shrink-0 text-primary-darker"
                                aria-hidden="true"
                            />
                            <p className="margin-y-0">
                                The pre-solicitation package has been sent to the Procurement Shop for review
                            </p>
                        </div>
                    )}
                    <dl className="display-flex flex-wrap">
                        <TermTag
                            term="Completed By"
                            description={step1CompletedByUserName || "TBD"}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Date Completed"
                            description={step1DateCompletedLabel || "TBD"}
                        />
                        <div className="width-full">
                            <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                            <dd className="margin-0 margin-top-1">{step1NotesLabel || "None"}</dd>
                        </div>
                    </dl>
                </div>
            )}
            {!isReadOnly && stepStatus === "PENDING" && (
                <fieldset className="usa-fieldset">
                    <p>
                        Once the pre-solicitation package is sufficiently drafted and signed by all parties, send it to
                        the Procurement Shop and check this step as complete.
                    </p>
                    <div className="usa-checkbox">
                        <input
                            className="usa-checkbox__input"
                            id="step-1-checkbox"
                            type="checkbox"
                            name="step-1-checkbox"
                            value="step-1-checkbox"
                            checked={isPreSolicitationPackageSent}
                            onChange={() => setIsPreSolicitationPackageSent(!isPreSolicitationPackageSent)}
                            disabled={isDisabled || !isActiveStep}
                        />
                        <label
                            className="usa-checkbox__label"
                            htmlFor="step-1-checkbox"
                        >
                            The pre-solicitation package has been sent to the Procurement Shop for review
                        </label>
                    </div>
                    <div className="display-flex flex-align-center">
                        <UsersComboBox
                            className="width-card-lg margin-top-5"
                            label={"Task Completed By"}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            messages={validatorRes.getErrors("users") || []}
                            isDisabled={isDisabled || !isPreSolicitationPackageSent || authorizedUsers.length === 0}
                            onChange={(name, value) => {
                                runValidate(name, value);
                            }}
                            users={authorizedUsers}
                        />
                        <MemoizedDatePicker
                            id="step-1-date-completed"
                            className="margin-left-4"
                            name="dateCompleted"
                            label="Date Completed"
                            hint="mm/dd/yyyy"
                            value={step1DateCompleted}
                            messages={validatorRes.getErrors("dateCompleted") || []}
                            onChange={(e) => {
                                runValidate("dateCompleted", e.target.value);
                                setStep1DateCompleted(e.target.value);
                            }}
                            isDisabled={isDisabled || !isPreSolicitationPackageSent}
                            maxDate={getLocalISODate()}
                        />
                    </div>
                    <TextArea
                        name="notes"
                        label="Notes (optional)"
                        className="margin-top-2"
                        maxLength={750}
                        value={step1Notes}
                        onChange={(_, value) => setStep1Notes(value)}
                        isDisabled={isDisabled || !isPreSolicitationPackageSent}
                    />
                    <div className="margin-top-2 display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-right-2"
                            data-cy="cancel-button"
                            onClick={cancelModalStep1}
                            disabled={isDisabled || !isPreSolicitationPackageSent}
                        >
                            Cancel
                        </button>
                        <button
                            className="usa-button"
                            data-cy="continue-btn"
                            onClick={() => handleStep1Complete(stepOneData?.id)}
                            disabled={disableStep1Buttons}
                        >
                            Complete Step 1
                        </button>
                    </div>
                </fieldset>
            )}

            {!isReadOnly && stepStatus === "COMPLETED" && (
                <div>
                    <p>
                        When the pre-solicitation package has been sufficiently drafted and signed by all parties, send
                        it to the Procurement Shop and update the task below.
                    </p>
                    <div className="display-flex flex-align-center margin-top-5">
                        <FontAwesomeIcon
                            icon={faCircleCheck}
                            size="lg"
                            className="margin-right-1 flex-shrink-0 text-primary-darker"
                            aria-hidden="true"
                        />
                        <p className="margin-y-0">
                            The pre-solicitation package has been sent to the Procurement Shop for review
                        </p>
                    </div>
                    <dl className="display-flex flex-wrap">
                        <TermTag
                            term="Completed By"
                            description={step1CompletedByUserName}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Date Completed"
                            description={step1DateCompletedLabel}
                        />
                        <div className="width-full">
                            <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                            <dd className="margin-0 margin-top-1">{step1NotesLabel || "None"}</dd>
                        </div>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepOne;
