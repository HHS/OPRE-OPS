import { useGetProcurementTrackersByAgreementIdQuery } from "../../../api/opsAPI";
import ProcurementTrackerStepOne from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepOne";
import DebugCode from "../../../components/DebugCode";
import Accordion from "../../../components/UI/Accordion";
import StepIndicator from "../../../components/UI/StepIndicator";
import { IS_PROCUREMENT_TRACKER_READY } from "../../../constants";

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
    const WIZARD_STEPS = [
        "Acquisition Planning",
        "Pre-Solicitation",
        "Solicitation",
        "Evaluation",
        "Pre-Award",
        "Award"
    ];
    const agreementId = agreement?.id;

    const { data, isLoading, isError } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId || !IS_PROCUREMENT_TRACKER_READY,
        refetchOnMountOrArgChange: true
    });

    // Extract tracker data
    const trackers = data?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === "ACTIVE");
    const stepOneData = activeTracker?.steps.find((step) => step.step_number === 1);

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

    // Use active_step_number from tracker if available, otherwise default to 0
    const currentStep = activeTracker?.active_step_number ? activeTracker.active_step_number : 0;

    // Create default steps structure when there's no active tracker
    const defaultSteps = WIZARD_STEPS.map((stepName, index) => ({
        id: `default-step-${index + 1}`,
        step_number: index + 1,
        step_type: stepName,
        status: "PENDING"
    }));

    // Use active tracker steps if available, otherwise use default structure
    const stepsToRender = activeTracker?.steps || defaultSteps;

    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">Procurement Tracker</h2>
            </div>
            <p className="font-sans-sm margin-bottom-4">
                Follow the steps below to complete the procurement process for Budget Lines in Executing Status.
            </p>
            <StepIndicator
                steps={WIZARD_STEPS}
                currentStep={currentStep}
            />
            {stepsToRender.map((step) => {
                return (
                    <Accordion
                        heading={`Step ${step.step_number} of ${WIZARD_STEPS.length} ${step.step_type}`}
                        isClosed={activeTracker ? activeTracker.active_step_number !== step.step_number : true}
                        level={3}
                        key={step.id}
                    >
                        {step.step_number === 1 && (
                            <ProcurementTrackerStepOne
                                stepStatus={step.status}
                                stepOneData={stepOneData}
                                hasActiveTracker={activeTracker}
                            />
                        )}
                    </Accordion>
                );
            })}
            {activeTracker && <DebugCode data={activeTracker}></DebugCode>}
        </>
    );
};

export default AgreementProcurementTracker;
