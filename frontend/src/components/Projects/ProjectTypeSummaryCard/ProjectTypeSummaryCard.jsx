import React from "react";
import {
    PROJECT_TYPE_ADMIN_SUPPORT,
    PROJECT_TYPE_COLORS,
    PROJECT_TYPE_RESEARCH,
    PROJECT_TYPE_TAG_STYLE_ACTIVE
} from "../ProjectTypes.constants";
import LegendItem from "../../UI/Cards/LineGraphWithLegendCard/LegendItem";
import ResponsiveDonutWithInnerPercent from "../../UI/DataViz/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import RoundedBox from "../../UI/RoundedBox";

const PROJECT_TYPE_CONFIG = [
    {
        type: PROJECT_TYPE_RESEARCH,
        label: "Research",
        color: PROJECT_TYPE_COLORS[PROJECT_TYPE_RESEARCH],
        tagStyleActive: PROJECT_TYPE_TAG_STYLE_ACTIVE[PROJECT_TYPE_RESEARCH]
    },
    {
        type: PROJECT_TYPE_ADMIN_SUPPORT,
        label: "Admin & Support",
        color: PROJECT_TYPE_COLORS[PROJECT_TYPE_ADMIN_SUPPORT],
        tagStyleActive: PROJECT_TYPE_TAG_STYLE_ACTIVE[PROJECT_TYPE_ADMIN_SUPPORT]
    }
];

/**
 * Computes a display-friendly percent string.
 * Returns "<1" when a non-zero value rounds down to 0, otherwise the rounded integer.
 * @param {number} value - The slice value
 * @param {number} total - The total across all slices
 * @returns {number|string} - Rounded percent or "<1"
 */
const computeDisplayPercent = (value, total) => {
    if (total === 0 || value === 0) return 0;
    const exact = (value / total) * 100;
    const rounded = Math.round(exact);
    return rounded === 0 ? "<1" : rounded;
};

/**
 * Ensures every non-zero slice is at least 1% of the total so it remains
 * visible in the donut chart. Only affects the chart rendering — legend
 * values and percents always reflect the real amounts.
 * @param {Array} items - Array of { id, value, ... } data items
 * @param {number} total - Sum of all real values
 * @returns {Array} - Items with chart-safe values applied
 */
const applyMinimumArcValue = (items, total) => {
    if (total === 0) return items;
    const minValue = total * 0.01;
    return items.map((item) => ({
        ...item,
        value: item.value > 0 && item.value < minValue ? minValue : item.value
    }));
};

/**
 * ProjectTypeSummaryCard component
 * Displays project budget amounts broken down by project type with a donut chart.
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.title - The heading for the card
 * @param {Object} props.summary - Backend-computed aggregate summary across all filtered projects
 * @param {Object} props.summary.amounts_by_type - Budget amounts and percentages per project type
 * @returns {React.ReactElement} - The rendered component
 */
const ProjectTypeSummaryCard = ({ title, summary }) => {
    const [percent, setPercent] = React.useState("");
    const [hoverId, setHoverId] = React.useState(-1);

    const amountsByType = summary?.amounts_by_type ?? {};

    const rawData = PROJECT_TYPE_CONFIG.filter(({ type }) => amountsByType[type] !== undefined).map(
        ({ type, label, color, tagStyleActive }, index) => ({
            id: index + 1,
            label,
            value: amountsByType[type]?.amount ?? 0,
            color,
            tagStyleActive
        })
    );

    const totalAmount = rawData.reduce((sum, item) => sum + item.value, 0);

    // Legend data: real values + display-friendly percents
    const legendData = rawData.map((item) => ({
        ...item,
        percent: computeDisplayPercent(item.value, totalAmount)
    }));

    // Chart data: floor tiny slices so every non-zero slice is visible
    const chartData = applyMinimumArcValue(legendData, totalAmount);

    return (
        <RoundedBox
            dataCy="project-type-summary-card"
            style={{ padding: "20px 0 20px 30px" }}
        >
            <h3 className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal">{title}</h3>
            <div className="display-flex flex-justify">
                <div
                    className="font-12px flex-fill"
                    style={{ marginRight: "1rem", marginTop: "1rem" }}
                >
                    {legendData.map((item) => (
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
                        id="project-type-chart"
                        className="width-card height-card margin-top-neg-1"
                        aria-label="This is a Donut Chart that displays the percent by project type in the center."
                        role="img"
                    >
                        <ResponsiveDonutWithInnerPercent
                            data={chartData}
                            width={150}
                            height={150}
                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            setPercent={setPercent}
                            setHoverId={setHoverId}
                            CustomLayerComponent={CustomLayerComponent(percent ? `${percent}%` : "")}
                            container_id="project-type-chart"
                            ariaLabel="This is a Donut Chart that displays the percent by project type in the center."
                        />
                    </div>
                )}
            </div>
        </RoundedBox>
    );
};

export default ProjectTypeSummaryCard;
