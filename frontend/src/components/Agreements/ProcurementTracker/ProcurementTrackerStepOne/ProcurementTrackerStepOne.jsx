import TextArea from "../../../UI/Form/TextArea";
import TermTag from "../../../UI/Term/TermTag";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepOne from "./ProcurementTrackerStepOne.hooks";

/**
 * @typedef {Object} ProcurementTrackerStepOneProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {Object} stepOneData - The data for step one of the procurement tracker
 */

/**
 * @component
 * @param {ProcurementTrackerStepOneProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepOne = ({ stepStatus, stepOneData }) => {
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
        cancelStep1,
        disableStep1Continue,
        step1CompletedByUserName,
        step1DateCompletedLabel,
        step1NotesLabel
    } = useProcurementTrackerStepOne(stepOneData);

    return (
        <>
            {stepStatus === "PENDING" && (
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
                        />
                        <label
                            className="usa-checkbox__label"
                            htmlFor="step-1-checkbox"
                        >
                            The pre-solicitation package has been sent to the Procurement Shop for review
                        </label>
                    </div>
                    <UsersComboBox
                        label={"Task Completed By"}
                        selectedUser={selectedUser}
                        setSelectedUser={setSelectedUser}
                        isDisabled={!isPreSolicitationPackageSent}
                    />
                    <MemoizedDatePicker
                        id="date-completed"
                        name="dateCompleted"
                        label="Date Completed"
                        hint="mm/dd/yyyy"
                        value={step1DateCompleted}
                        onChange={(e) => setStep1DateCompleted(e.target.value)}
                        isDisabled={!isPreSolicitationPackageSent}
                        maxDate={new Date()}
                    />
                    <TextArea
                        name="notes"
                        label="Notes (optional)"
                        className="margin-top-0"
                        maxLength={750}
                        value={step1Notes}
                        onChange={(_, value) => setStep1Notes(value)}
                        isDisabled={!isPreSolicitationPackageSent}
                    />
                    <button
                        className="usa-button usa-button--unstyled margin-right-2"
                        data-cy="cancel-button"
                        onClick={cancelStep1}
                    >
                        Cancel
                    </button>
                    <button
                        className="usa-button"
                        data-cy="continue-btn"
                        onClick={() => handleStep1Complete(stepOneData.id)}
                        disabled={disableStep1Continue}
                    >
                        Complete Step 1
                    </button>
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
