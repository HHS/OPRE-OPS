import { getLocalISODate } from "../../../../helpers/utils";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";
import TermTag from "../../../UI/Term/TermTag";
import DatePicker from "../../../UI/USWDS/DatePicker";

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
// eslint-disable-next-line no-unused-vars
const ProcurementTrackerStepTwo = ({ stepStatus, stepTwoData, authorizedUsers, hasActiveTracker }) => {
    const {
        selectedUser,
        setSelectedUser,
        setTargetCompletionDate,
        targetCompletionDate,
        step2CompletedByUserName,
        step2DateCompleted,
        setStep2DateCompleted,
        runValidate,
        validatorRes,
        step2DateCompletedLabel
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
                    {/* TODO: Add save functionality for target completion date */}
                    <DatePicker
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
                    <div className="display-flex flex-align-center">
                        <UsersComboBox
                            className="width-card-lg margin-top-5"
                            label={"Task Completed By"}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            users={authorizedUsers}
                        />

                        <DatePicker
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
