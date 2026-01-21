import { useState, useEffect } from "react";
import StepIndicator from "../../../components/UI/StepIndicator";

//Implemented mocked procurement tracker endpoints
const BACKEND_DOMAIN =
    (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN) ||
    import.meta.env.VITE_BACKEND_DOMAIN ||
    "https://localhost:8000";

const AgreementProcurementTracker = () => {
    const wizardSteps = [
        "Acquisition Planning",
        "Pre-Solicitation",
        "Solicitation",
        "Evaluation",
        "Pre-Award",
        "Award"
    ];

    const procurementTrackerSteps = {
        ACQUISITION_PLANNING: 1,
        PRE_SOLICITATION: 2,
        SOLICITATION: 3,
        EVALUATION: 4,
        PRE_AWARD: 5,
        AWARD: 6
    };

    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const fetchProcurementSteps = async () => {
            try {
                //Replace the number 9 with the agreement's ID using the agreement prop
                const response = await fetch(`${BACKEND_DOMAIN}/procurement-tracker-steps?agreement_id=${9}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch procurement steps: ${response.status}`);
                }

                const data = await response.json();

                // Find the highest numbered step with completed status
                const highestCompletedStep = data.data
                    .filter((step) => step.status === "IN_PROGRESS") // Filter for completed steps
                    .map((step) => procurementTrackerSteps[step.step_type]) // Map to step numbers
                    .reduce((max, current) => Math.max(max, current), 0); // Find the maximum

                setCurrentStep(highestCompletedStep);
            } catch (error) {
                console.error("Error fetching procurement steps:", error);
            }
        };

        fetchProcurementSteps();
    }, [procurementTrackerSteps]);

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
        </>
    );
};

export default AgreementProcurementTracker;
