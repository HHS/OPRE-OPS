import Card from "../../components/UI/Cards/Card";
import DonutGraphWithLegendCard from "../../components/UI/Cards/DonutGraphWithLegendCard";
import LineBar from "../../components/UI/DataViz/LineBar";
import ProcurementOverviewCard from "./ProcurementOverviewCard";

const stepData = [
    {
        id: 1,
        label: "Step 1",
        value: 5,
        color: "var(--data-viz-primary-10)",
        percent: 9,
        tagStyleActive: "whiteOnTeal"
    },
    {
        id: 2,
        label: "Step 2",
        value: 10,
        color: "var(--data-viz-primary-6)",
        percent: 19,
        tagStyleActive: "whiteOnTeal"
    },
    {
        id: 3,
        label: "Step 3",
        value: 3,
        color: "var(--data-viz-primary-2)",
        percent: 6,
        tagStyleActive: "whiteOnTeal"
    },
    {
        id: 4,
        label: "Step 4",
        value: 7,
        color: "var(--data-viz-primary-5)",
        percent: 13,
        tagStyleActive: "whiteOnPink"
    },
    {
        id: 5,
        label: "Step 5",
        value: 12,
        color: "var(--data-viz-primary-11)",
        percent: 23,
        tagStyleActive: "lightTextOnDarkBlue"
    },
    {
        id: 6,
        label: "Step 6",
        value: 15,
        color: "var(--data-viz-primary-4)",
        percent: 29,
        tagStyleActive: "lightTextOnDarkBlue"
    }
];

const budgetByStep = [
    { step: "Step 1", total: 1_000_000, color: "var(--portfolio-budget-graph-5)" },
    { step: "Step 2", total: 2_000_000, color: "var(--portfolio-budget-graph-4)" },
    { step: "Step 3", total: 3_000_000, color: "var(--portfolio-budget-graph-3)" },
    { step: "Step 4", total: 4_000_000, color: "var(--portfolio-budget-graph-2)" },
    { step: "Step 5", total: 5_000_000, color: "var(--portfolio-budget-graph-1)" },
    { step: "Step 6", total: 5_000_000, color: "var(--portfolio-budget-graph-1)" }
];

const maxBudget = Math.max(...budgetByStep.map((d) => d.total));

const ProcurementSummaryCards = () => {
    return (
        <>
            <ProcurementOverviewCard />
            <div className="display-flex flex-justify margin-top-2 gap-2">
                <DonutGraphWithLegendCard
                    title="FY 2026 Agreements by Procurement Step"
                    data={stepData}
                />
                <Card
                    title="FY 2026 Budget Lines By Procurement Step"
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
