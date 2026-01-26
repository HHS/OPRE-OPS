import StepIndicator from "../../../components/UI/StepIndicator";
import { useGetProcurementTrackersByAgreementIdQuery } from "../../../api/opsAPI";
import { IS_PROCUREMENT_TRACKER_READY } from "../../../constants";
import DebugCode from "../../../components/DebugCode";

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
            {activeTracker && <DebugCode data={activeTracker}></DebugCode>}
        </>
    );
};

export default AgreementProcurementTracker;
