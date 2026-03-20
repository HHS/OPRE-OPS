import { useMemo } from "react";
import Card from "../../components/UI/Cards/Card";
import LineBar from "../../components/UI/DataViz/LineBar";
import ProcurementOverviewCard from "./ProcurementOverviewCard";
import ProcurementStepSummaryCard from "./ProcurementStepSummaryCard";

const STEP_CONFIG = [
    { stepNumber: 1, label: "Step 1", color: "var(--procurement-step-1)" },
    { stepNumber: 2, label: "Step 2", color: "var(--procurement-step-2)" },
    { stepNumber: 3, label: "Step 3", color: "var(--procurement-step-3)" },
    { stepNumber: 4, label: "Step 4", color: "var(--procurement-step-4)" },
    { stepNumber: 5, label: "Step 5", color: "var(--procurement-step-5)" },
    { stepNumber: 6, label: "Step 6", color: "var(--procurement-step-6)" }
];

const computeStepData = (agreements, procurementTrackers, fiscalYear) => {
    const trackerByAgreementId = {};
    for (const tracker of procurementTrackers) {
        trackerByAgreementId[tracker.agreement_id] = tracker;
    }

    const amountByStep = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const agreementsByStep = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (const agreement of agreements) {
        const tracker = trackerByAgreementId[agreement.id];
        const stepNumber = tracker?.active_step_number;
        if (!stepNumber || stepNumber < 1 || stepNumber > 6) continue;

        agreementsByStep[stepNumber] += 1;

        const blis = (agreement.budget_line_items || []).filter((bli) => bli.fiscal_year === fiscalYear);
        for (const bli of blis) {
            amountByStep[stepNumber] += (bli.amount || 0) + (bli.fees || 0);
        }
    }

    const totalAgreementCount = Object.values(agreementsByStep).reduce((sum, val) => sum + val, 0);

    const stepData = STEP_CONFIG.map(({ stepNumber, label, color }) => ({
        id: stepNumber,
        label,
        color,
        value: agreementsByStep[stepNumber],
        percent: totalAgreementCount > 0 ? Math.round((agreementsByStep[stepNumber] / totalAgreementCount) * 100) : 0
    }));

    const budgetByStep = STEP_CONFIG.map(({ stepNumber, label, color }) => ({
        step: label,
        total: amountByStep[stepNumber],
        color
    }));

    return { stepData, budgetByStep };
};

const ProcurementSummaryCards = ({ agreements = [], procurementTrackers = [], fiscalYear, isLoading, error }) => {
    const { stepData, budgetByStep } = useMemo(
        () => computeStepData(agreements, procurementTrackers, fiscalYear),
        [agreements, procurementTrackers, fiscalYear]
    );

    const maxBudget = Math.max(...budgetByStep.map((d) => d.total), 1);

    return (
        <>
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
                isLoading={isLoading}
                error={error}
            />
            <div className="display-flex flex-justify margin-top-2 gap-2">
                <ProcurementStepSummaryCard
                    stepData={stepData}
                    fiscalYear={fiscalYear}
                />
                <Card
                    title={`FY ${fiscalYear} Budget Lines By Procurement Step`}
                    dataCy="budget-lines-by-step-card"
                >
                    {budgetByStep.map((item, i) => (
                        <LineBar
                            key={item.step}
                            iterator={i}
                            color={item.color}
                            ratio={item.total / maxBudget}
                            title={item.step}
                            total={item.total}
                        />
                    ))}
                </Card>
            </div>
            <p className="font-sans-3xs text-base-dark margin-top-1">
                * Agreements and budget lines by procurement step represent the breakdown of executing above.
            </p>
        </>
    );
};

export default ProcurementSummaryCards;
