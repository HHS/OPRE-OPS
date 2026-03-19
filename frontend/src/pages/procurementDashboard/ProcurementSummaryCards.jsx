import Card from "../../components/UI/Cards/Card";
import LineBar from "../../components/UI/DataViz/LineBar";
import ProcurementOverviewCard from "./ProcurementOverviewCard";
import ProcurementStepSummaryCard from "./ProcurementStepSummaryCard";

const budgetByStep = [
    { step: "Step 1", total: 1_000_000, color: "var(--procurement-step-1)" },
    { step: "Step 2", total: 2_000_000, color: "var(--procurement-step-2)" },
    { step: "Step 3", total: 3_000_000, color: "var(--procurement-step-3)" },
    { step: "Step 4", total: 4_000_000, color: "var(--procurement-step-4)" },
    { step: "Step 5", total: 5_000_000, color: "var(--procurement-step-5)" },
    { step: "Step 6", total: 5_000_000, color: "var(--procurement-step-6)" }
];

const maxBudget = Math.max(...budgetByStep.map((d) => d.total));

const ProcurementSummaryCards = ({ agreements = [], fiscalYear, isLoading, error }) => {
    return (
        <>
            <ProcurementOverviewCard
                agreements={agreements}
                fiscalYear={fiscalYear}
                isLoading={isLoading}
                error={error}
            />
            <div className="display-flex flex-justify margin-top-2 gap-2">
                <ProcurementStepSummaryCard />
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
