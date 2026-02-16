import { getLocalISODate } from "../../../../helpers/utils";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";
import TermTag from "../../../UI/Term/TermTag";
import DatePicker from "../../../UI/USWDS/DatePicker";

/**
 * @typedef {Object} ProcurementTrackerStepTwoProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {Object} stepData - The data for step of the procurement tracker
 * @property {Array} authorizedUsers - List of users authorized for this agreement
 * @property {boolean} hasActiveTracker - Whether an active tracker exists
 */

/**
 * @component
 * @param {ProcurementTrackerStepTwoProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepTwo = ({ stepStatus, stepData, authorizedUsers, hasActiveTracker }) => {
    const {
        selectedUser,
        setSelectedUser,
        setTargetCompletionDate,
        targetCompletionDate,
        step2CompletedByUserName
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
                        <DatePicker
                            id="target-completion-date"
                            name="targetCompletionDate"
                            label="Target Completion Date"
                            hint="mm/dd/yyyy"
                            value={targetCompletionDate}
                            onChange={(e) => {
                                setTargetCompletionDate(e.target.value);
                            }}
                            minDate={getLocalISODate()}
                            isDisabled={!hasActiveTracker}
                        />
                        <button
                            type="button"
                            className="usa-button usa-button--unstyled margin-bottom-1 margin-left-2"
                            data-cy="target-completion-save-btn"
                            onClick={() => {
                                alert("Save target completion date functionality coming soon!");
                            }}
                            disabled={!hasActiveTracker}
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
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepTwo;
