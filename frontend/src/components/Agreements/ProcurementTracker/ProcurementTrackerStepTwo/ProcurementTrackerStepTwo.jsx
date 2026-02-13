import { getLocalISODate } from "../../../../helpers/utils";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";
import TermTag from "../../../UI/Term/TermTag";

/**
 * @typedef {Object} ProcurementTrackerStepTwoProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {Object} stepData - The data for step of the procurement tracker
 * @property {Array} authorizedUsers - List of users authorized for this agreement
 */

/**
 * @component
 * @param {ProcurementTrackerStepTwoProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepTwo = ({ stepStatus, stepData, authorizedUsers }) => {
    const {
        selectedUser,
        setSelectedUser,
        MemoizedDatePicker,
        setTargetCompletionDate,
        targetCompletionDate,
        step2CompletedByUserName,
        step2DateCompleted,
        setStep2DateCompleted,
        runValidate,
        validatorRes,
        step2DateCompletedLabel
    } = useProcurementTrackerStepTwo(stepData);

    return (
        <>
            {(stepStatus === "PENDING" || stepStatus === "ACTIVE") && (
                <fieldset className="usa-fieldset">
                    <p>
                        Edit the pre-solicitation package in collaboration with the Procurement Shop. Once the documents
                        are finalized, go to the Documents Tab, upload the final and signed versions, and check this
                        step as complete. If you have a target completion date for when the package will be finalized,
                        enter it below.
                    </p>
                    <div className="display-flex flex-align-end">
                        <MemoizedDatePicker
                            id="target-completion-date"
                            name="targetCompletionDate"
                            label="Target Completion Date"
                            hint="mm/dd/yyyy"
                            value={targetCompletionDate}
                            onChange={(e) => {
                                setTargetCompletionDate(e.target.value);
                            }}
                            maxDate={getLocalISODate()}
                        />
                        <button
                            className="usa-button usa-button--unstyled margin-bottom-1 margin-left-2"
                            data-cy="target-completion-save-btn"
                            onClick={() => {
                                alert("Save target completion date functionality coming soon!");
                            }}
                        >
                            Save
                        </button>
                    </div>
                    <div className="display-flex flex-align-center">
                        <UsersComboBox
                            className="width-card-lg margin-top-5"
                            label={"Task Completed By"}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            users={authorizedUsers}
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
                        />
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
                    <dl>
                        <TermTag
                            term="Completed By"
                            description={step2CompletedByUserName}
                        />
                        <TermTag
                            term="Date Completed"
                            description={step2DateCompletedLabel}
                        />
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepTwo;
