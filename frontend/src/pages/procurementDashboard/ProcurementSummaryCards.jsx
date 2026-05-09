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

const buildStepData = (procurementStepSummary) => {
    if (!procurementStepSummary) {
        return {
            stepData: STEP_CONFIG.map(({ stepNumber, label, color }) => ({
                id: stepNumber,
                label,
                color,
                value: 0,
                percent: 0
            })),
            budgetByStep: STEP_CONFIG.map(({ label, color }) => ({
                step: label,
                total: 0,
                color
            }))
        };
    }

    const { step_data } = procurementStepSummary;

    const stepData = step_data.map((item) => {
        const config = STEP_CONFIG.find((s) => s.stepNumber === item.step);
        return {
            id: item.step,
            label: config?.label ?? `Step ${item.step}`,
            color: config?.color ?? "var(--procurement-step-1)",
            value: item.agreements,
            percent: item.agreements_percent
        };
    });

    const budgetByStep = step_data.map((item) => {
        const config = STEP_CONFIG.find((s) => s.stepNumber === item.step);
        return {
            step: config?.label ?? `Step ${item.step}`,
            total: item.amount,
            color: config?.color ?? "var(--procurement-step-1)"
        };
    });

    return { stepData, budgetByStep };
};

/**
 * @typedef {Object} ProcurementSummaryCardsProps
 * @property {import("./ProcurementOverviewCard").ProcurementOverview | null} procurementOverview - Overview data from the API.
 * @property {Object | null} procurementStepSummary - Step summary data from the API.
 * @property {number} fiscalYear - The fiscal year being displayed.
 * @property {boolean} isLoading - Whether data is still loading.
 * @property {*} error - Error object, if any.
 */

/**
 * @component ProcurementSummaryCards
 * @param {ProcurementSummaryCardsProps} props
 * @returns {JSX.Element}
 */
const ProcurementSummaryCards = ({ procurementOverview, procurementStepSummary, fiscalYear, isLoading, error }) => {
    const { stepData, budgetByStep } = useMemo(() => buildStepData(procurementStepSummary), [procurementStepSummary]);

    const maxBudget = Math.max(...budgetByStep.map((d) => d.total), 1);

    return (
        <>
            <ProcurementOverviewCard
                procurementOverview={procurementOverview}
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
