import { getLocalISODate } from "../../../../helpers/utils";
import TermTag from "../../../UI/Term/TermTag";
import TextArea from "../../../UI/Form/TextArea";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";

/**
 * @typedef {Object} ProcurementTrackerStepTwoProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {Object} stepTwoData - The data for step 2 of the procurement tracker
 * @property {Array} authorizedUsers - List of users authorized for this agreement
 * @property {boolean} hasActiveTracker - Whether an active tracker exists
 */

/**
 * @component
 * @param {ProcurementTrackerStepTwoProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepTwo = ({ stepStatus, stepTwoData, authorizedUsers, hasActiveTracker }) => {
    const {
        selectedUser,
        setSelectedUser,
        step2CompletedByUserName,
        MemoizedDatePicker,
        setTargetCompletionDate,
        targetCompletionDate,
        step2Notes,
        setStep2Notes,
        step2NotesLabel,
        runValidate,
        validatorRes
    } = useProcurementTrackerStepTwo(stepTwoData);

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
                            messages={validatorRes.getErrors("targetCompletionDate") || []}
                            hint="mm/dd/yyyy"
                            value={targetCompletionDate}
                            onChange={(e) => {
                                runValidate("targetCompletionDate", e.target.value);
                                setTargetCompletionDate(e.target.value);
                            }}
                            minDate={getLocalISODate()}
                        />
                        <button
                            type="button"
                            className="usa-button usa-button--unstyled margin-bottom-1 margin-left-2"
                            data-cy="target-completion-save-btn"
                            disabled={validatorRes.hasErrors("targetCompletionDate")}
                            onClick={() => {
                                alert("Save target completion date functionality coming soon!");
                            }}
                        >
                            Save
                        </button>
                    </div>
                    <UsersComboBox
                        className="width-card-lg margin-top-2"
                        label={"Task Completed By"}
                        selectedUser={selectedUser}
                        setSelectedUser={setSelectedUser}
                        users={authorizedUsers}
                        isDisabled={!hasActiveTracker}
                    />
                    <TextArea
                        name="notes"
                        label="Notes (optional)"
                        className="margin-top-2"
                        maxLength={750}
                        value={step2Notes}
                        onChange={(_, value) => setStep2Notes(value)}
                    />
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
                        <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                        <dd className="margin-0 margin-top-1">{step2NotesLabel}</dd>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepTwo;
