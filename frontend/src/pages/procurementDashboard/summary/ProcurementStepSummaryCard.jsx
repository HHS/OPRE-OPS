import React from "react";
import ResponsiveDonutWithInnerPercent from "../../../components/UI/DataViz/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../../components/UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import RoundedBox from "../../../components/UI/RoundedBox";
import StepLegendItem from "./StepLegendItem";

const ProcurementStepSummaryCard = ({ stepData = [], fiscalYear }) => {
    const [percent, setPercent] = React.useState("");
    const [hoverId, setHoverId] = React.useState(-1);
    return (
        <RoundedBox
            dataCy="procurement-step-summary-card"
            style={{ padding: "20px 0 20px 30px" }}
        >
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                FY {fiscalYear} Agreements by Procurement Step
            </h3>
            <div className="display-flex flex-justify">
                <div
                    className="font-12px flex-fill"
                    style={{ marginRight: "1rem" }}
                >
                    {stepData.map((item) => (
                        <StepLegendItem
                            key={item.id}
                            id={item.id}
                            activeId={hoverId}
                            label={item.label}
                            value={item.value}
                            color={item.color}
                            percent={item.percent}
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
