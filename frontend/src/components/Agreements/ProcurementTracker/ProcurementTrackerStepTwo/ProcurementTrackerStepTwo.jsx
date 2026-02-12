import { getLocalISODate } from "../../../../helpers/utils";
import DebugCode from "../../../DebugCode";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";

/**
 * @typedef {Object} ProcurementTrackerStepTwoProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {Object} stepData - The data for step of the procurement tracker
 */

/**
 * @component
 * @param {ProcurementTrackerStepTwoProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepTwo = ({ stepStatus, stepData }) => {
    const { MemoizedDatePicker, setTargetCompletionDate, targetCompletionDate } =
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
                    <DebugCode data={stepData} />
                </fieldset>
            )}

            {stepStatus === "COMPLETED" && (
                <div>
                    <p>Step Two Completed</p>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepTwo;
