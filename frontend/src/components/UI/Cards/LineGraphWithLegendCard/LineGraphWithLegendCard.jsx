import React from "react";
import LineGraph from "../../DataViz/LineGraph";
import CurrencyCard from "../CurrencyCard";
import LegendItem from "./LegendItem";

/**
 * @typedef {Object} LineGraphWithLegendCardProps
 * @property {Data[]} data - Array of data objects
 * @property {number} bigNumber - The total budget number
 * @property {string} heading - The heading text
 */

/**
 * @typedef {Object} Data
 * @property {number} id
 * @property {string} label
 * @property {number} value
 * @property {string} color
 * @property {string} percent
 * @property {string} tagActiveStyle
 */

/**
 * @component LineGraphWithLegendCard
 * @param {LineGraphWithLegendCardProps} props
 * @returns {JSX.Element}
 */
const LineGraphWithLegendCard = ({ data = [], bigNumber, heading }) => {
    const reactId = React.useId();
    const [activeId, setActiveId] = React.useState(0);
    return (
        <CurrencyCard
            headerText={heading}
            amount={bigNumber}
        >
            <div
                id={`line-graph-card-${reactId}`}
                className="margin-top-2"
            >
                <LineGraph
                    setActiveId={setActiveId}
                    data={data}
                />
            </div>
            {data.map((item) => (
                <LegendItem
                    activeId={activeId}
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    value={item.value}
                    color={item.color}
                    percent={item.percent}
                    tagStyleActive={item.tagActiveStyle}
                />
            ))}
        </CurrencyCard>
    );
};

export default LineGraphWithLegendCard;
