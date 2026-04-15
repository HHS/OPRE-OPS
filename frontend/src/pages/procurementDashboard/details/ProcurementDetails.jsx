import DetailsBuilderAccordion from "./DetailsBuilderAccordion";
import ProcurementDetailsStepOne from "./ProcurementDetailsStepOne";

const ProcurementDetails = ({ fiscalYear }) => {
    const WIZARD_STEPS = [
        "Acquisition Planning",
        "Pre-Solicitation",
        "Solicitation",
        "Evaluation",
        "Pre-Award",
        "Award"
    ];

    const stepsToRender = WIZARD_STEPS.map((stepName, index) => ({
        id: `default-step-${index + 1}`,
        step_number: index + 1,
        step_type: stepName
    }));

    return (
        <>
            <h2 className="margin-top-10">Procurement Details</h2>
            <p className="line-height-alt-4 margin-bottom-5">
                This is a detailed view of agreements currently in each procurement step for FY {fiscalYear}. Each step
                includes a description of the tasks being completed, an overview of agreements, budget lines, and
                portfolios, as well as a list of agreements and their status.
            </p>
            {stepsToRender.map((step) => {
                return (
                    <DetailsBuilderAccordion
                        step={step}
                        totalSteps={WIZARD_STEPS.length}
                        key={`${step.id}`}
                    >
                        {step.step_number === 1 && <ProcurementDetailsStepOne />}
                    </DetailsBuilderAccordion>
                );
            })}
        </>
    );
};

export default ProcurementDetails;
