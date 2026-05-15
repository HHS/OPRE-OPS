import { computeDisplayPercents } from "../../../../helpers/utils";
import LineGraphWithLegendCard from "./LineGraphWithLegendCard";

export default {
    title: "UI/Cards/LineGraphWithLegendCard",
    component: LineGraphWithLegendCard,
    parameters: {
        docs: {
            description: {
                component:
                    "Card that displays a large currency total, a two-segment horizontal bar graph, and an inline " +
                    "legend. The bar graph always expects exactly **two** data items. Hovering a segment bolds the " +
                    "matching legend row. The bar is hidden when `bigNumber` is `0` — the card still renders the " +
                    "heading, amount, and legend in that case. Callers must pre-compute display percents via " +
                    "`computeDisplayPercents` from `helpers/utils` before passing `data`."
            }
        }
    },
    argTypes: {
        heading: {
            control: "text",
            description: "Card heading — typically includes the fiscal year",
            table: { category: "Card" }
        },
        bigNumber: {
            control: { type: "number", min: 0, step: 100_000 },
            description: "Total amount shown as the large currency figure. Set to `0` to hide the bar graph.",
            table: { category: "Card" }
        },
        leftLabel: {
            control: "text",
            description: "Label for the left bar segment",
            table: { category: "Left Segment" }
        },
        leftAmount: {
            control: { type: "number", min: 0, step: 10_000 },
            description: "Dollar amount for the left bar segment",
            table: { category: "Left Segment" }
        },
        leftColor: {
            control: "color",
            description: "Color for the left bar segment",
            table: { category: "Left Segment" }
        },
        rightLabel: {
            control: "text",
            description: "Label for the right bar segment",
            table: { category: "Right Segment" }
        },
        rightAmount: {
            control: { type: "number", min: 0, step: 10_000 },
            description: "Dollar amount for the right bar segment",
            table: { category: "Right Segment" }
        },
        rightColor: {
            control: "color",
            description: "Color for the right bar segment",
            table: { category: "Right Segment" }
        }
    }
};

// ---------------------------------------------------------------------------
// Shared render factory
// ---------------------------------------------------------------------------
// Rebuilds the two-item data array from flat args and runs computeDisplayPercents
// so legend percent tags are accurate. LineGraphWithLegendCard manages its own
// activeId state — no wrapper state needed here.
const renderCard = ({ heading, bigNumber, leftLabel, leftAmount, leftColor, rightLabel, rightAmount, rightColor }) => {
    const rawData = [
        { id: 1, label: leftLabel, value: leftAmount, color: leftColor },
        { id: 2, label: rightLabel, value: rightAmount, color: rightColor }
    ];
    return (
        <LineGraphWithLegendCard
            heading={heading}
            bigNumber={bigNumber}
            data={computeDisplayPercents(rawData)}
        />
    );
};

// Wrap in a named component so react/display-name is satisfied.
const CardStory = (args) => renderCard(args);
CardStory.displayName = "LineGraphWithLegendCardStory";

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * CAN total budget split between carry-forward and new funding —
 * the most common real-world use of this card.
 * Hover a bar segment to see its legend row bold.
 * Use **Controls** to adjust amounts, labels, and colors live.
 */
export const Default = {
    args: {
        heading: "FY 2025 CANs Total Budget",
        bigNumber: 2_000_000,
        leftLabel: "Previous FYs Carry-Forward",
        leftAmount: 750_000,
        leftColor: "#0076d6",
        rightLabel: "FY 2025 New Funding",
        rightAmount: 1_250_000,
        rightColor: "#d4d9dc"
    },
    render: CardStory
};

/**
 * Both segments are equal — verifies the bar renders a 50/50 split
 * and legend percent tags both show 50%.
 */
export const EqualSplit = {
    args: {
        heading: "FY 2025 CANs Total Budget",
        bigNumber: 2_000_000,
        leftLabel: "Previous FYs Carry-Forward",
        leftAmount: 1_000_000,
        leftColor: "#0076d6",
        rightLabel: "FY 2025 New Funding",
        rightAmount: 1_000_000,
        rightColor: "#d4d9dc"
    },
    render: CardStory
};

/**
 * `bigNumber` is 0 — the bar graph is hidden and the card shows only the
 * heading, $0 amount, and legend rows. Verify the card doesn't crash or
 * show an empty bar container.
 */
export const ZeroBudget = {
    args: {
        heading: "FY 2025 CANs Total Budget",
        bigNumber: 0,
        leftLabel: "Previous FYs Carry-Forward",
        leftAmount: 0,
        leftColor: "#0076d6",
        rightLabel: "FY 2025 New Funding",
        rightAmount: 0,
        rightColor: "#d4d9dc"
    },
    render: CardStory
};
