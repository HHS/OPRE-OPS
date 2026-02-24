import DatePicker from "../../../UI/USWDS/DatePicker";
import DateRangePickerWrapper from "../../../UI/USWDS/DateRangePickerWrapper";

/**
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 * @typedef {Object} ProcurementTrackerStepThreeProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {Object} stepThreeData - The data for step 3 of the procurement tracker
 * @property {boolean} isActiveStep - Whether step is the active step
 * @property {SafeUser[]} authorizedUsers - List of users authorized for this agreement
 * @property {Function} [handleSetCompletedStepNumber] - Optional callback to set completed step number
 */

/**
 * @component
 * @param {ProcurementTrackerStepThreeProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepThree = ({ stepStatus }) => {
    const inProgressStatuses = ["PENDING", "ACTIVE"];

    return (
        <>
            {inProgressStatuses.includes(stepStatus) && (
                <fieldset className="usa-fieldset">
                    <p>
                        Once the Procurement Shop has posted the Solicitation and it’s “on the street”, enter the
                        Solicitation Start and End Dates. After all proposals are received, vendor questions have been
                        answered, and evaluations are starting, check this step as complete.
                    </p>
                    <DateRangePickerWrapper
                        id="period-of-performance"
                        key="period-of-performance"
                        className="display-flex flex-justify width-tablet"
                    >
                        <div style={{ width: "275px" }}>
                            <DatePicker
                                id="pop-start-date"
                                name="pop-start-date"
                                label="Period of Performance-Start"
                                hint="mm/dd/yyyy"
                                value={null}
                                onChange={() => {}}
                            />
                        </div>
                        <div style={{ width: "275px" }}>
                            <DatePicker
                                id="pop-end-date"
                                name="pop-end-date"
                                label="Period of Performance-End"
                                hint="mm/dd/yyyy"
                                value={null}
                                onChange={() => {}}
                            />
                        </div>
                        <button
                            className="usa-button usa-button--unstyled flex-align-self-end padding-bottom-1"
                            data-cy="target-completion-save-btn"
                            disabled={false}
                            onClick={() => {
                                alert("Save button clicked! Implement save functionality here.");
                            }}
                        >
                            Save
                        </button>
                    </DateRangePickerWrapper>
                </fieldset>
            )}
            {stepStatus === "COMPLETED" && (
                <div>
                    <p>
                        Once the Procurement Shop has posted the Solicitation and it’s “on the street”, enter the
                        Solicitation Start and End Dates. After all proposals are received, vendor questions have been
                        answered, and evaluations are starting, check this step as complete.
                    </p>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepThree;
