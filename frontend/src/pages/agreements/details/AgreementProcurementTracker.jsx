import React from "react";
import { useGetProcurementTrackersByAgreementIdQuery } from "../../../api/opsAPI";
import ProcurementTrackerStepOne from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepOne";
import StepBuilderAccordion from "../../../components/Agreements/ProcurementTracker/StepBuilderAccordion";
import DebugCode from "../../../components/DebugCode";
import StepIndicator from "../../../components/UI/StepIndicator";
import { IS_PROCUREMENT_TRACKER_READY } from "../../../constants";
import ProcurementTrackerStepTwo from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepTwo";

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
    const [isFormSubmitted, setIsFormSubmitted] = React.useState(false);
    const handleSetIsFormSubmitted = (value) => {
        setIsFormSubmitted(value);
    };
    const agreementId = agreement?.id;

    const { data, isLoading, isError } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId || !IS_PROCUREMENT_TRACKER_READY,
        refetchOnMountOrArgChange: true
    });

    // Extract tracker data
    const trackers = data?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === "ACTIVE");
    const hasActiveTracker = !!activeTracker;
    const stepOneData = activeTracker?.steps.find((step) => step.step_number === 1);
    const stepTwoData = activeTracker?.steps.find((step) => step.step_number === 2);

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

    // Active trackers default to step 1 when no active_step_number exists.
    const currentStep = activeTracker?.active_step_number ? activeTracker.active_step_number : 1;
    // Keep step 1 open for read-only/no-active-tracker mode, but don't show any active segment in the step indicator.
    const accordionOpenStep = hasActiveTracker ? currentStep : 1;
    const indicatorCurrentStep = hasActiveTracker ? currentStep : 0;
    const sortedActiveSteps = [...(activeTracker?.steps || [])].sort(
        (a, b) => (a?.step_number ?? Number.MAX_SAFE_INTEGER) - (b?.step_number ?? Number.MAX_SAFE_INTEGER)
    );

    // Create default steps structure when there's no active tracker
    const defaultSteps = WIZARD_STEPS.map((stepName, index) => ({
        id: `default-step-${index + 1}`,
        step_number: index + 1,
        step_type: stepName,
        status: "PENDING"
    }));

    // Use sorted active tracker steps when present, otherwise use default read-only structure.
    const stepsToRender = hasActiveTracker ? sortedActiveSteps : defaultSteps;

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
                currentStep={indicatorCurrentStep}
            />
            {stepsToRender.map((step) => {
                return (
                    <StepBuilderAccordion
                        step={step}
                        totalSteps={WIZARD_STEPS.length}
                        activeStepNumber={hasActiveTracker ? currentStep : undefined}
                        isReadOnly={!hasActiveTracker}
                        // Keep step 1 and the active step open after form submission, all others closed
                        isClosed={
                            isFormSubmitted
                                ? !(step.step_number === 1 || step.step_number === accordionOpenStep)
                                : step.step_number !== accordionOpenStep
                        }
                        level={3}
                        key={step.id}
                    >
                        {step.step_number === 1 && (
                            <ProcurementTrackerStepOne
                                stepStatus={step.status}
                                stepOneData={stepOneData}
                                hasActiveTracker={hasActiveTracker}
                                handleSetIsFormSubmitted={handleSetIsFormSubmitted}
                                agreement={agreement}
                            />
                        )}
                        {step.step_number === 2 && (
                            <ProcurementTrackerStepTwo
                                stepStatus={step.status}
                                stepData={stepTwoData}
                            />
                        )}
                    </StepBuilderAccordion>
                );
            })}
            {activeTracker && <DebugCode data={activeTracker}></DebugCode>}
        </>
    );
};

export default AgreementProcurementTracker;
