import { computeDisplayPercents } from "../../../../helpers/utils";
import DonutGraphWithLegendCard from "./DonutGraphWithLegendCard";

export default {
    title: "UI/Cards/DonutGraphWithLegendCard",
    component: DonutGraphWithLegendCard,
    parameters: {
        docs: {
            description: {
                component:
                    "Card that combines a donut chart with an inline legend showing each slice's label, " +
                    "currency value, and percentage tag. Hovering a slice bolds the matching legend row. " +
                    "Callers are responsible for pre-computing display percents via `computeDisplayPercents` " +
                    "from `helpers/utils` before passing `data` — the card renders whatever `percent` values " +
                    "are in the array. No Redux or Router dependency."
            }
        }
    },
    argTypes: {
        title: {
            control: "text",
            description: "Card heading — typically includes the fiscal year",
            table: { category: "Card" }
        },
        draftAmount: {
            control: { type: "number", min: 0, step: 10_000 },
            description: "Dollar amount for **Draft** budget lines",
            table: { category: "Slice Values" }
        },
        plannedAmount: {
            control: { type: "number", min: 0, step: 10_000 },
            description: "Dollar amount for **Planned** budget lines",
            table: { category: "Slice Values" }
        },
        executingAmount: {
            control: { type: "number", min: 0, step: 10_000 },
            description: "Dollar amount for **Executing** budget lines",
            table: { category: "Slice Values" }
        },
        obligatedAmount: {
            control: { type: "number", min: 0, step: 10_000 },
            description: "Dollar amount for **Obligated** budget lines",
            table: { category: "Slice Values" }
        },
        draftColor: {
            control: "color",
            description: "Color for the Draft slice",
            table: { category: "Slice Colors" }
        },
        plannedColor: {
            control: "color",
            description: "Color for the Planned slice",
            table: { category: "Slice Colors" }
        },
        executingColor: {
            control: "color",
            description: "Color for the Executing slice",
            table: { category: "Slice Colors" }
        },
        obligatedColor: {
            control: "color",
            description: "Color for the Obligated slice",
            table: { category: "Slice Colors" }
        }
    }
};

// ---------------------------------------------------------------------------
// Shared render factory
// ---------------------------------------------------------------------------
// Flattens the individual slice args back into the data array shape expected
// by DonutGraphWithLegendCard, runs computeDisplayPercents so legend percent
// tags are accurate, then renders the card.
//
// DonutGraphWithLegendCard manages its own hover state and generates its own
// container_id via crypto.randomUUID() — no wrapper state needed here.
const renderCard = (title) => {
    const Render = ({ draftAmount, plannedAmount, executingAmount, obligatedAmount,
                      draftColor, plannedColor, executingColor, obligatedColor }) => {
        const rawData = [
            { id: 1, label: "Draft",     value: draftAmount,     color: draftColor },
            { id: 2, label: "Planned",   value: plannedAmount,   color: plannedColor },
            { id: 3, label: "Executing", value: executingAmount, color: executingColor },
            { id: 4, label: "Obligated", value: obligatedAmount, color: obligatedColor }
        ];
        return (
            <DonutGraphWithLegendCard
                data={computeDisplayPercents(rawData)}
                title={title}
            />
        );
    };
    Render.displayName = "DonutCardStory";
    return Render;
};

// ---------------------------------------------------------------------------
// Default app color values (resolves from sass/uswds/styles.scss):
//   --data-viz-bl-by-status-1  #a9aeb1  Draft
//   --data-viz-bl-by-status-2  #336a90  Planned
//   --data-viz-bl-by-status-3  #e5a000  Executing
//   --data-viz-bl-by-status-4  #8b4687  Obligated
// ---------------------------------------------------------------------------
const defaultColors = {
    draftColor: "#a9aeb1",
    plannedColor: "#336a90",
    executingColor: "#e5a000",
    obligatedColor: "#8b4687"
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Full four-slice BLI status breakdown — the standard use case.
 * Hover a slice to see the matching legend row bold.
 * Use **Controls** to adjust amounts and colors live.
 */
export const Default = {
    args: {
        draftAmount: 350_000,
        plannedAmount: 1_200_000,
        executingAmount: 875_000,
        obligatedAmount: 425_000,
        ...defaultColors
    },
    render: renderCard("FY 2025 Budget Lines by Status")
};

/**
 * All budget lines are in a single status category.
 * Legend shows the other three rows at $0 / 0%.
 * Use Controls to add amounts to other slices and watch the chart fill in.
 */
export const AllOneCategory = {
    args: {
        draftAmount: 0,
        plannedAmount: 0,
        executingAmount: 1_800_000,
        obligatedAmount: 0,
        ...defaultColors
    },
    render: renderCard("FY 2025 Budget Lines by Status")
};

/**
 * One slice is tiny ($500 out of ~$2.85M).
 * The internal arc floor ensures the Draft slice remains visible in the chart
 * while the legend correctly shows its display percent as "&lt;1%".
 */
export const TinySlice = {
    args: {
        draftAmount: 500,
        plannedAmount: 1_500_000,
        executingAmount: 900_000,
        obligatedAmount: 450_000,
        ...defaultColors
    },
    render: renderCard("FY 2025 Budget Lines by Status")
};
