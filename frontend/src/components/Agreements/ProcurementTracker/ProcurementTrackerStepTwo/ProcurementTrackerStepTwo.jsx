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
    const { selectedUser, setSelectedUser, MemoizedDatePicker, step2CompletedByUserName } =
        useProcurementTrackerStepTwo(stepData);

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
                            label="Target Completion Date"
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
                    <UsersComboBox
                        className="width-card-lg margin-top-2"
                        label={"Task Completed By"}
                        selectedUser={selectedUser}
                        setSelectedUser={setSelectedUser}
                        users={authorizedUsers}
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
