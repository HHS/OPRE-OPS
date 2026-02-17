import TextArea from "../../../UI/Form/TextArea";
import ConfirmationModal from "../../../UI/Modals";
import TermTag from "../../../UI/Term/TermTag";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepOne from "./ProcurementTrackerStepOne.hooks";
import { getLocalISODate } from "../../../../helpers/utils";

/**
 * @typedef {Object} ProcurementTrackerStepOneProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {Object} stepOneData - The data for step one of the procurement tracker
 * @property {boolean} hasActiveTracker - Whether an active tracker exists
 * @property {Function} handleSetIsFormSubmitted - Function to set the form submission state
 * @property {Array} authorizedUsers - List of users authorized for this agreement
 */

/**
 * @component
 * @param {ProcurementTrackerStepOneProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepOne = ({
    stepStatus,
    stepOneData,
    hasActiveTracker,
    handleSetIsFormSubmitted,
    authorizedUsers
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
    } = useProcurementTrackerStepOne(stepOneData, handleSetIsFormSubmitted);

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
            {(stepStatus === "PENDING" || stepStatus === "ACTIVE") && (
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
                            disabled={!hasActiveTracker}
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
                            isDisabled={!isPreSolicitationPackageSent || authorizedUsers.length === 0}
                            onChange={(name, value) => {
                                runValidate(name, value);
                            }}
                            users={authorizedUsers}
                        />
                        <MemoizedDatePicker
                            id="date-completed"
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
                            isDisabled={!isPreSolicitationPackageSent}
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
                        isDisabled={!isPreSolicitationPackageSent}
                    />
                    <div className="margin-top-2 display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-right-2"
                            data-cy="cancel-button"
                            onClick={cancelModalStep1}
                            disabled={!isPreSolicitationPackageSent}
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

            {stepStatus === "COMPLETED" && (
                <div>
                    <p>
                        When the pre-solicitation package has been sufficiently drafted and signed by all parties, send
                        it to the Procurement Shop and update the task below.
                    </p>
                    <p>The pre-solicitation package has been sent to the Procurement Shop for review</p>

                    <dl>
                        <TermTag
                            term="Completed By"
                            description={step1CompletedByUserName}
                        />
                        <TermTag
                            term="Date Completed"
                            description={step1DateCompletedLabel}
                        />
                        <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                        <dd className="margin-0 margin-top-1">{step1NotesLabel}</dd>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepOne;
