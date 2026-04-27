import { computeDisplayPercents } from "../../../../helpers/utils";
import LineGraph from "./LineGraph";

export default {
    title: "UI/DataViz/LineGraph",
    component: LineGraph,
    parameters: {
        docs: {
            description: {
                component:
                    "Two-segment horizontal bar showing left (spending/budget) vs right (remaining). " +
                    "Always expects exactly **two** data items — destructures `data[0]` and `data[1]` " +
                    "directly. Left bar flex-width is resolved via `resolveLeftFlexWidth` which accepts " +
                    'either a numeric percent or the string `"<1"`. The `isStriped` prop adds diagonal ' +
                    "hatching to both bars (used in BudgetCard to indicate in-progress spending). " +
                    "`overBudget` disables striping only — bar colors are not changed by this prop. " +
                    "Callers (e.g. `BudgetCard`) set error-red via the `color` fields in `data` when over budget."
            }
        }
    },
    argTypes: {
        leftValue: {
            control: { type: "number", min: 0, step: 50_000 },
            description: "Left bar value (spending)",
            table: { category: "Values" }
        },
        rightValue: {
            control: { type: "number", min: 0, step: 50_000 },
            description: "Right bar value (remaining)",
            table: { category: "Values" }
        },
        leftColor: { control: "color", description: "Left bar color", table: { category: "Colors" } },
        rightColor: { control: "color", description: "Right bar color", table: { category: "Colors" } },
        isStriped: { control: "boolean", description: "Diagonal stripe overlay on both bars" },
        overBudget: { control: "boolean", description: "Disables stripe overlay; bar colors are determined by the `color` fields in `data`" }
    }
};

// Builds the two-item data array and computes display percents.
const buildData = ({ leftValue, rightValue, leftColor, rightColor }) => {
    const raw = [
        { id: 1, value: leftValue, color: leftColor },
        { id: 2, value: rightValue, color: rightColor }
    ];
    return computeDisplayPercents(raw);
};

const defaultColors = { leftColor: "#336a90", rightColor: "#d4d9dc" };

/**
 * Standard budget vs remaining split.
 * Use **Controls** to adjust values, toggle stripes, or trigger the over-budget state.
 */
export const Default = {
    args: { leftValue: 875_000, rightValue: 1_125_000, isStriped: false, overBudget: false, ...defaultColors },
    render: ({ leftValue, rightValue, leftColor, rightColor, isStriped, overBudget }) => (
        <LineGraph
            data={buildData({ leftValue, rightValue, leftColor, rightColor })}
            isStriped={isStriped}
            overBudget={overBudget}
        />
    )
};

/**
 * Striped variant — both bars show diagonal hatching indicating in-progress spending.
 * Used inside BudgetCard and BigBudgetCard.
 */
export const InProgress = {
    args: { leftValue: 875_000, rightValue: 1_125_000, isStriped: true, overBudget: false, ...defaultColors },
    render: ({ leftValue, rightValue, leftColor, rightColor, isStriped, overBudget }) => (
        <LineGraph
            data={buildData({ leftValue, rightValue, leftColor, rightColor })}
            isStriped={isStriped}
            overBudget={overBudget}
        />
    )
};

/**
 * Left value is zero — right bar fills the full width.
 * Verify: no left bar rendered, right bar spans 100%.
 */
export const ZeroLeft = {
    args: { leftValue: 0, rightValue: 2_000_000, isStriped: false, overBudget: false, ...defaultColors },
    render: ({ leftValue, rightValue, leftColor, rightColor, isStriped, overBudget }) => (
        <LineGraph
            data={buildData({ leftValue, rightValue, leftColor, rightColor })}
            isStriped={isStriped}
            overBudget={overBudget}
        />
    )
};

/**
 * Right value is zero — left bar fills the full width.
 * Verify: left bar spans 100%, no right bar visible.
 */
export const ZeroRight = {
    args: { leftValue: 2_000_000, rightValue: 0, isStriped: false, overBudget: false, ...defaultColors },
    render: ({ leftValue, rightValue, leftColor, rightColor, isStriped, overBudget }) => (
        <LineGraph
            data={buildData({ leftValue, rightValue, leftColor, rightColor })}
            isStriped={isStriped}
            overBudget={overBudget}
        />
    )
};
