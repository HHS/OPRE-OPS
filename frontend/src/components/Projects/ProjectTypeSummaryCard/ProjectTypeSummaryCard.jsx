import React from "react";
import {
    PROJECT_TYPE_COLORS,
    PROJECT_TYPE_LABELS,
    PROJECT_TYPE_ORDER,
    PROJECT_TYPE_TAG_STYLE_ACTIVE
} from "../ProjectTypes.constants";
import { computeDisplayPercents } from "../../../helpers/utils";
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

    // Legend data: real values + cross-item-normalised display percents
    // Uses computeDisplayPercents (plural) so the dominant-item cap (99, not 100)
    // is applied when a dominant type would otherwise show 100% alongside non-zero peers.
    const legendData = computeDisplayPercents(rawData);

    // chartData is passed directly to ResponsiveDonutWithInnerPercent which
    // applies applyMinimumArcValue internally — no local flooring needed here.

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
                            data={legendData}
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
