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
const ProcurementTrackerStepThree = ({
    stepStatus
}) => {
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
