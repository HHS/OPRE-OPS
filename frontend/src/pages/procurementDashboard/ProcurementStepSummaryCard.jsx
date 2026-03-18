import React from "react";
import ResponsiveDonutWithInnerPercent from "../../components/UI/DataViz/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../components/UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import LegendItem from "../../components/UI/Cards/LineGraphWithLegendCard/LegendItem";
import RoundedBox from "../../components/UI/RoundedBox";

const stepData = [
    {
        id: 1,
        label: "Step 1",
        value: 5,
        color: "var(--procurement-step-1)",
        percent: 9,
        tagStyleActive: "whiteOnTeal"
    },
    {
        id: 2,
        label: "Step 2",
        value: 10,
        color: "var(--procurement-step-2)",
        percent: 19,
        tagStyleActive: "whiteOnTeal"
    },
    {
        id: 3,
        label: "Step 3",
        value: 3,
        color: "var(--procurement-step-3)",
        percent: 6,
        tagStyleActive: "whiteOnTeal"
    },
    {
        id: 4,
        label: "Step 4",
        value: 7,
        color: "var(--procurement-step-4)",
        percent: 13,
        tagStyleActive: "whiteOnPink"
    },
    {
        id: 5,
        label: "Step 5",
        value: 12,
        color: "var(--procurement-step-5)",
        percent: 23,
        tagStyleActive: "lightTextOnDarkBlue"
    },
    {
        id: 6,
        label: "Step 6",
        value: 15,
        color: "var(--procurement-step-6)",
        percent: 29,
        tagStyleActive: "lightTextOnDarkBlue"
    }
];

const ProcurementStepSummaryCard = () => {
    const [percent, setPercent] = React.useState("");
    const [hoverId, setHoverId] = React.useState(-1);

    return (
        <RoundedBox
            dataCy="procurement-step-summary-card"
            style={{ padding: "20px 0 20px 30px" }}
        >
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                FY 2026 Agreements by Procurement Step
            </h3>
            <div className="display-flex flex-justify">
                <div
                    className="font-12px flex-fill"
                    style={{ marginRight: "1rem" }}
                >
                    {stepData.map((item) => (
                        <LegendItem
                            key={item.id}
                            id={item.id}
                            activeId={hoverId}
                            label={item.label}
                            value={item.value}
                            color={item.color}
                            percent={item.percent}
                            tagStyleActive={item.tagStyleActive}
                        />
                    ))}
                </div>
                <div
                    id="procurement-step-chart"
                    className="width-card height-card margin-top-2"
                    aria-label="This is a Donut Chart that displays the percent by procurement step in the center."
                    role="img"
                >
                    <ResponsiveDonutWithInnerPercent
                        data={stepData}
                        width={150}
                        height={150}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        setPercent={setPercent}
                        setHoverId={setHoverId}
                        CustomLayerComponent={CustomLayerComponent(percent ? `${percent}%` : "")}
                        container_id="procurement-step-chart"
                        ariaLabel="This is a Donut Chart that displays the percent by procurement step in the center."
                    />
                </div>
            </div>
        </RoundedBox>
    );
};

export default ProcurementStepSummaryCard;
