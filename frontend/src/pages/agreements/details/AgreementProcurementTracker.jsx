import StepIndicator from "../../../components/UI/StepIndicator";
import { useGetProcurementTrackersByAgreementIdQuery} from "../../../api/opsAPI";

const AgreementProcurementTracker = ({ agreement }) => {
    const agreementId = agreement?.id;

    const { data, isLoading, isError } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });

    console.log("Procurement Tracker Data:", { data, isLoading, isError, agreementId });

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
    if (isError) {
        return <div>Error loading procurement tracker data</div>;
    }

    // Extract tracker data
    const trackers = data?.data || [];
    const tracker = trackers[0];

    // Use active_step_number from tracker if available, otherwise default to 0
    const currentStep = tracker?.active_step_number ? tracker.active_step_number : 0;

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
            {tracker && (
                <div className="margin-top-4">
                    <p>
                        <strong>Tracker:</strong> {tracker.display_name}
                    </p>
                    <p>
                        <strong>Status:</strong> {tracker.status}
                    </p>
                    <p>
                        <strong>Type:</strong> {tracker.tracker_type}
                    </p>
                    <p>
                        <strong>Active Step:</strong> {tracker.active_step_number}
                    </p>
                </div>
            )}
        </>
    );
};

export default AgreementProcurementTracker;
