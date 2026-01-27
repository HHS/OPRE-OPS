import StepIndicator from "../../../components/UI/StepIndicator";
import { useGetProcurementTrackersByAgreementIdQuery } from "../../../api/opsAPI";
import { IS_PROCUREMENT_TRACKER_READY } from "../../../constants";
import DebugCode from "../../../components/DebugCode";
import Accordion from "../../../components/UI/Accordion";
import ComboBox from "../../../components/UI/Form/ComboBox";
import DatePicker from "../../../components/UI/USWDS/DatePicker";
import TextArea from "../../../components/UI/Form/TextArea";

/**
 * @typedef {Object} AgreementProcurementTrackerProps
 * @property {import("../../../types/AgreementTypes").Agreement | undefined} agreement - The agreement object containing at least an id
 */

/**
 * @component
 * @param {AgreementProcurementTrackerProps} props
 * @returns {React.ReactElement}
 */

const AgreementProcurementTracker = ({ agreement }) => {
    const agreementId = agreement?.id;

    const { data, isLoading, isError } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId || !IS_PROCUREMENT_TRACKER_READY,
        refetchOnMountOrArgChange: true
    });

    const wizardSteps = [
        "Acquisition Planning",
        "Pre-Solicitation",
        "Solicitation",
        "Evaluation",
        "Pre-Award",
        "Award"
    ];

    // Handle loading state
    if (isLoading) {
        return <div>Loading procurement tracker...</div>;
    }

    // Handle error state
    if (isError || !agreementId) {
        return <div>Error loading procurement tracker data</div>;
    }

    if (!IS_PROCUREMENT_TRACKER_READY) {
        return <div>The Procurement Tracker feature is coming soon.</div>;
    }

    // Extract tracker data
    const trackers = data?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === "ACTIVE");

    if (!activeTracker) {
        return <div>No active Procurement Tracker found.</div>;
    }

    // Use active_step_number from tracker if available, otherwise default to 0
    const currentStep = activeTracker?.active_step_number ? activeTracker.active_step_number : 0;

    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">Procurement Tracker</h2>
            </div>
            <p className="font-sans-sm margin-bottom-4">
                Follow the steps below to complete the procurement process for Budget Lines in Executing Status.
            </p>
            <StepIndicator
                steps={wizardSteps}
                currentStep={currentStep}
            />
            {/* Accordions */}
            {activeTracker?.steps.length > 0 &&
                activeTracker?.steps?.map((step) => {
                    return (
                        <Accordion
                            heading={`Step ${step.step_number} of ${activeTracker?.steps.length} ${step.step_type}
`}
                            isClosed={activeTracker.active_step_number !== step.step_number}
                            level={3}
                            key={step.id}
                        >
                            {/* ComboBox for Users*/}
                            {/* DatePicker for Date Completed */}
                            {/* TextArea for optional Notes*/}
                            <p>
                                Once the pre-solicitation package is sufficiently drafted and signed by all parties,
                                send it to the Procurement Shop and check this step as complete.
                            </p>
                            <fieldset className="usa-fieldset">
                                <div className="usa-checkbox">
                                    <input
                                        className="usa-checkbox__input"
                                        id="step-1-checkbox"
                                        type="checkbox"
                                        name="step-1-checkbox"
                                    />
                                    <label
                                        className="usa-checkbox__label"
                                        htmlFor="step-1-checkbox"
                                    >
                                        The pre-solicitation package has been sent to the Procurement Shop for review
                                    </label>
                                </div>
                                <ComboBox />
                                <DatePicker
                                    id="date-completed"
                                    name="dateCompleted"
                                    label="Date Completed"
                                    hint="mm/dd/yyyy"
                                    onChange={""}
                                />
                                <TextArea
                                    name="notes"
                                    label="Notes"
                                    className="margin-top-0"
                                    maxLength={750}
                                    // value={formData?.description || ""}
                                    onChange={""}
                                />
                                <button
                                    className="usa-button usa-button--unstyled margin-right-2"
                                    data-cy="cancel-button"
                                    onClick={""}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="usa-button"
                                    data-cy="continue-btn"
                                    onClick={""}
                                    disabled={""}
                                >
                                    Complete Step 1
                                </button>
                            </fieldset>
                            <p>{step.step_type}</p>
                        </Accordion>
                    );
                })}
            {activeTracker && <DebugCode data={activeTracker}></DebugCode>}
        </>
    );
};

export default AgreementProcurementTracker;
