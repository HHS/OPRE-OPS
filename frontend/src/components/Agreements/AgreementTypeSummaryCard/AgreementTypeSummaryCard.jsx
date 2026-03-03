import React from "react";
import { calculatePercent } from "../../../helpers/utils";
import ResponsiveDonutWithInnerPercent from "../../UI/DataViz/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import LegendItem from "../../UI/Cards/LineGraphWithLegendCard/LegendItem";
import RoundedBox from "../../UI/RoundedBox";

/**
 * Renders a summary card that displays agreements by type.
 * @component
 * @param {Object} props - The props that were defined by the caller of this component.
 * @param {string} props.titlePrefix - The prefix for the title, typically indicating the fiscal year
 * @param {number} props.contractTotal - The total amount for Contract agreements
 * @param {number} props.partnerTotal - The total amount for Partner agreements (AA, IAA)
 * @param {number} props.grantTotal - The total amount for Grant agreements
 * @param {number} props.directObligationTotal - The total amount for Direct Obligation agreements
 * @returns {React.ReactElement} - A React component that displays the agreement type summary card.
 */
const AgreementTypeSummaryCard = ({
    titlePrefix,
    contractTotal = 0,
    partnerTotal = 0,
    grantTotal = 0,
    directObligationTotal = 0
}) => {
    const [percent, setPercent] = React.useState("");
    const [hoverId, setHoverId] = React.useState(-1);

    const totalAmount = contractTotal + partnerTotal + grantTotal + directObligationTotal;

    const data = [
        {
            id: 1,
            label: "Contract",
            value: contractTotal,
            color: "var(--data-viz-agreement-contract)",
            percent: calculatePercent(contractTotal, totalAmount),
            tagStyleActive: "whiteOnContractBlue"
        },
        {
            id: 2,
            label: "Partner",
            value: partnerTotal,
            color: "var(--data-viz-agreement-partner)",
            percent: calculatePercent(partnerTotal, totalAmount),
            tagStyleActive: "darkOnPartnerGreen"
        },
        {
            id: 3,
            label: "Grant",
            value: grantTotal,
            color: "var(--data-viz-agreement-grant)",
            percent: calculatePercent(grantTotal, totalAmount),
            tagStyleActive: "darkOnGrantOrange"
        },
        {
            id: 4,
            label: "Direct Obligation",
            value: directObligationTotal,
            color: "var(--data-viz-agreement-direct-obligation)",
            percent: calculatePercent(directObligationTotal, totalAmount),
            tagStyleActive: "whiteOnDirectObligationPink"
        }
    ];

    return (
        <RoundedBox
            dataCy="agreement-type-summary-card"
            style={{ padding: "20px 0 20px 30px" }}
        >
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{`${titlePrefix} Spending by Agreement Type`}</h3>

            <div className="display-flex flex-justify">
                <div
                    className="font-12px"
                    style={{ minWidth: "230px" }}
                >
                    {data.map((item) => (
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
                {totalAmount > 0 && (
                    <div
                        id="agreement-type-chart"
                        className="width-card height-card margin-top-neg-1"
                        aria-label="This is a Donut Chart that displays the percent by agreement type in the center."
                        role="img"
                    >
                        <ResponsiveDonutWithInnerPercent
                            data={data}
                            width={150}
                            height={150}
                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            setPercent={setPercent}
                            setHoverId={setHoverId}
                            CustomLayerComponent={CustomLayerComponent(percent)}
                            container_id="agreement-type-chart"
                        />
                    </div>
                )}
            </div>
        </RoundedBox>
    );
};

export default AgreementTypeSummaryCard;
