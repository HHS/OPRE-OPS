import React from "react";
import {
    PROJECT_TYPE_COLORS,
    PROJECT_TYPE_LABELS,
    PROJECT_TYPE_ORDER,
    PROJECT_TYPE_TAG_STYLE_ACTIVE
} from "../ProjectTypes.constants";
import LegendItem from "../../UI/Cards/LineGraphWithLegendCard/LegendItem";
import ResponsiveDonutWithInnerPercent from "../../UI/DataViz/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import RoundedBox from "../../UI/RoundedBox";

// Build config from shared constants — single source of truth for labels, colors, and tag styles
const PROJECT_TYPE_CONFIG = PROJECT_TYPE_ORDER.map((type) => ({
    type,
    label: PROJECT_TYPE_LABELS[type],
    color: PROJECT_TYPE_COLORS[type],
    tagStyleActive: PROJECT_TYPE_TAG_STYLE_ACTIVE[type]
}));

/**
 * Computes display-friendly percent labels for an array of items.
 *
 * Handles the edge case where one dominant item rounds to 100% while other
 * non-zero items exist — which would produce a contradictory legend like
 * "100% + <1%". In that case the dominant item is labelled ">99%" instead.
 *
 * Rules applied per item:
 *   - Zero value          → 0
 *   - Non-zero but rounds to 0 → "<1"
 *   - Rounds to 100 while other non-zero items exist → ">99"
 *   - Otherwise           → rounded integer
 *
 * @param {Array<{value: number}>} items - Data items with a numeric `value` field
 * @param {number} total - Sum of all item values
 * @returns {Array<number|string>} - Parallel array of display percent labels
 */
const computeDisplayPercents = (items, total) => {
    if (total === 0) return items.map(() => 0);

    const rounded = items.map((item) => {
        if (item.value === 0) return 0;
        const exact = (item.value / total) * 100;
        const r = Math.round(exact);
        return r === 0 ? "<1" : r;
    });

    // Check if any item shows 100 while others have non-zero amounts
    const hasOtherNonZero = (idx) => items.some((item, i) => i !== idx && item.value > 0);

    return rounded.map((r, idx) => (r === 100 && hasOtherNonZero(idx) ? ">99" : r));
};

/**
 * Ensures every non-zero slice is at least 1% of the total so it remains
 * visible in the donut chart, while preserving the original total used to
 * compute arc proportions by reducing the added amount from larger slices.
 * Only affects the chart rendering — legend values and percents always
 * reflect the real amounts.
 * @param {Array} items - Array of { id, value, ... } data items
 * @param {number} total - Sum of all real values
 * @returns {Array} - Items with chart-safe values applied
 */
const applyMinimumArcValue = (items, total) => {
    if (total === 0) return items;

    const minValue = total * 0.01;

    // Floor any non-zero slice that is below the minimum
    const adjustedItems = items.map((item) => ({
        ...item,
        value: item.value > 0 && item.value < minValue ? minValue : item.value
    }));

    // How much was added in total by flooring
    const addedValue = adjustedItems.reduce((sum, item, index) => sum + (item.value - items[index].value), 0);

    if (addedValue <= 0) return adjustedItems;

    // Subtract the added amount proportionally from slices that are above the minimum
    const reducibleTotal = adjustedItems.reduce(
        (sum, item) => (item.value > minValue ? sum + (item.value - minValue) : sum),
        0
    );

    // If we cannot redistribute without pushing other slices below minimum, return as-is
    if (reducibleTotal < addedValue) return adjustedItems;

    let remaining = addedValue;

    return adjustedItems.map((item) => {
        if (item.value <= minValue || remaining <= 0) return item;
        const reducible = item.value - minValue;
        const reduction = Math.min(reducible, (reducible / reducibleTotal) * addedValue, remaining);
        remaining -= reduction;
        return { ...item, value: item.value - reduction };
    });
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

    // Legend data: real values + display-friendly percents (computed together
    // so cross-item consistency — e.g. ">99%" alongside "<1%" — can be enforced)
    const displayPercents = computeDisplayPercents(rawData, totalAmount);
    const legendData = rawData.map((item, idx) => ({
        ...item,
        percent: displayPercents[idx]
    }));

    // Chart data: floor tiny slices so every non-zero slice is visible,
    // redistributing the added amount from larger slices to preserve the total
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
                            ariaLabel="Donut chart showing project budget by type"
                        />
                    </div>
                )}
            </div>
        </RoundedBox>
    );
};

export default ProjectTypeSummaryCard;
