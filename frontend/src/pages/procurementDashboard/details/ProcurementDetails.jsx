import { useMemo } from "react";
import DetailsBuilderAccordion from "./DetailsBuilderAccordion";
import ProcurementDetailsStep from "./ProcurementDetailsStep";

const ProcurementDetails = ({ fiscalYear, agreements, procurementTrackers, procurementStepSummary }) => {
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

    const agreementsByStep = useMemo(() => {
        const stepToAgreementIds = {};
        for (const tracker of procurementTrackers) {
            if (!stepToAgreementIds[tracker.active_step_number]) {
                stepToAgreementIds[tracker.active_step_number] = new Set();
            }
            stepToAgreementIds[tracker.active_step_number].add(tracker.agreement_id);
        }

        const result = {};
        for (const stepNumber of Object.keys(stepToAgreementIds)) {
            const ids = stepToAgreementIds[stepNumber];
            result[stepNumber] = agreements.filter((a) => ids.has(a.id));
        }
        return result;
    }, [agreements, procurementTrackers]);

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
                        isClosed={step.step_number !== 1}
                    >
                        <ProcurementDetailsStep
                            agreements={agreementsByStep[step.step_number] ?? []}
                            agreementsPerStep={procurementStepSummary?.step_data[step.step_number - 1]?.agreements}
                        />
                    </DetailsBuilderAccordion>
                );
            })}
        </>
    );
};

export default ProcurementDetails;
