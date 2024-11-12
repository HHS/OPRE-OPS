import React from "react";
import ResponsiveDonutWithInnerPercent from "../../DataViz/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import RoundedBox from "../../RoundedBox";
import LegendItem from "../LineGraphWithLegendCard/LegendItem";
import styles from "./styles.module.css";

/**
 * @typedef {Object} Data
 * @property {number} id - The id.
 * @property {string} label - The label.
 * @property {number} value - The value.
 * @property {string} color - The color.
 * @property {string} percent - The percent.
 * @property {string} [tagStyleActive] - The tag style active.
 */

/**
 * @typedef {Object} DonutGraphWithLegendCardProps
 * @property {Data[]} data - The array of data items.
 * @property {string} title - The title for the card
 * @property {number} totalFunding - The total funding.
 */

/**
 * @component DonutGraphWithLegendCard
 * @param {DonutGraphWithLegendCardProps} props
 * @returns {JSX.Element}
 */
const DonutGraphWithLegendCard = ({ data, title, totalFunding }) => {
    const [percent, setPercent] = React.useState("");
    const [hoverId, setHoverId] = React.useState(-1);
    const reactId = React.useId();

    return (
        <RoundedBox className="padding-y-205 padding-x-4 display-inline-block">
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{title}</h3>

            <div className="display-flex flex-justify">
                <div
                    className={
                        totalFunding > 0 ? `${styles.widthLegend} maxw-card-lg font-12px` : "width-card-lg font-12px"
                    }
                >
                    {data.map((item) => (
                        <LegendItem
                            key={item.id}
                            id={item.id}
                            activeId={hoverId}
                            tagStyleActive={item.tagStyleActive ?? ""}
                            label={item.label}
                            value={item.value}
                            color={item.color}
                            percent={item.percent}
                        />
                    ))}
                </div>
                <div
                    id={`donutGraphWithLegendCard-${reactId}`}
                    className="width-card height-card margin-top-neg-1 margin-left-2"
                    aria-label="This is a Donut Chart that displays the percent by budget line status in the center."
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
                        container_id={`donutGraphWithLegendCard-${reactId}`}
                    />
                </div>
            </div>
        </RoundedBox>
    );
};

export default DonutGraphWithLegendCard;
