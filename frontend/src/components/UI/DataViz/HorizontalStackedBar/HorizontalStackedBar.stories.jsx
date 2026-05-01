import { useState } from "react";
import { computeDisplayPercents } from "../../../../helpers/utils";
import HorizontalStackedBar from "./HorizontalStackedBar";

export default {
    title: "UI/DataViz/HorizontalStackedBar",
    component: HorizontalStackedBar,
    parameters: {
        docs: {
            description: {
                component:
                    "Multi-segment horizontal stacked bar. Segment widths are derived from each segment's " +
                    'numeric `value` (never from the display `percent` string), so segments with `percent: "<1"` ' +
                    "still render correctly. Segments where `value === 0` or `isPlaceholder === true` are filtered " +
                    "out before rendering. Returns `null` when all segments are filtered out. Hover / keyboard " +
                    "focus fires `setActiveId` so a parent legend can highlight the matching row."
            }
        }
    },
    argTypes: {
        dcfdAmount: {
            control: { type: "number", min: 0, step: 100_000 },
            description: "DCFD portfolio amount",
            table: { category: "Segment Values" }
        },
        dfsAmount: {
            control: { type: "number", min: 0, step: 100_000 },
            description: "DFS portfolio amount",
            table: { category: "Segment Values" }
        },
        deiAmount: {
            control: { type: "number", min: 0, step: 100_000 },
            description: "DEI portfolio amount",
            table: { category: "Segment Values" }
        },
        odAmount: {
            control: { type: "number", min: 0, step: 100_000 },
            description: "OD portfolio amount",
            table: { category: "Segment Values" }
        },
        nonOpreAmount: {
            control: { type: "number", min: 0, step: 100_000 },
            description: "Non-OPRE amount",
            table: { category: "Segment Values" }
        },
        dcfdColor: { control: "color", description: "DCFD color", table: { category: "Segment Colors" } },
        dfsColor: { control: "color", description: "DFS color", table: { category: "Segment Colors" } },
        deiColor: { control: "color", description: "DEI color", table: { category: "Segment Colors" } },
        odColor: { control: "color", description: "OD color", table: { category: "Segment Colors" } },
        nonOpreColor: { control: "color", description: "Non-OPRE color", table: { category: "Segment Colors" } }
    }
};

// ---------------------------------------------------------------------------
// Shared render factory
// ---------------------------------------------------------------------------
// Builds the segment data array from flat args, runs computeDisplayPercents so
// percent labels are accurate, then wires up setActiveId state.
// Bar widths are always derived from `value` inside the component — percents
// are display-only and must not be used for sizing.
const BarWrapper = ({
    dcfdAmount,
    dfsAmount,
    deiAmount,
    odAmount,
    nonOpreAmount,
    dcfdColor,
    dfsColor,
    deiColor,
    odColor,
    nonOpreColor
}) => {
    const setActiveId = useState(null)[1];

    const rawData = [
        {
            id: 1,
            label: "Child Welfare and Family Development",
            abbreviation: "DCFD",
            value: dcfdAmount,
            color: dcfdColor
        },
        { id: 2, label: "Division of Family Support", abbreviation: "DFS", value: dfsAmount, color: dfsColor },
        { id: 3, label: "Division of Economic Independence", abbreviation: "DEI", value: deiAmount, color: deiColor },
        { id: 4, label: "Office of the Director", abbreviation: "OD", value: odAmount, color: odColor },
        { id: 5, label: "Non-OPRE", abbreviation: "Non", value: nonOpreAmount, color: nonOpreColor }
    ];

    const data = computeDisplayPercents(rawData);
    return (
        <HorizontalStackedBar
            data={data}
            setActiveId={setActiveId}
        />
    );
};
BarWrapper.displayName = "HorizontalStackedBarStory";

// Default app portfolio colors
const defaultColors = {
    dcfdColor: "#336a90",
    dfsColor: "#e5a000",
    deiColor: "#518c49",
    odColor: "#8b4687",
    nonOpreColor: "#a9aeb1"
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Five portfolio segments — the standard OPRE use case.
 * Hover a segment to trigger `setActiveId` (parent legend would highlight).
 * Use **Controls** to adjust amounts and colors live.
 */
export const Default = {
    args: {
        dcfdAmount: 4_500_000,
        dfsAmount: 3_200_000,
        deiAmount: 2_800_000,
        odAmount: 1_500_000,
        nonOpreAmount: 900_000,
        ...defaultColors
    },
    render: (args) => <BarWrapper {...args} />
};

/**
 * One segment has a tiny value ($500) — well under 1% of total.
 * The component's internal minimum-width floor (1% flex-basis) ensures the
 * DEI segment stays visible. Verify: a small but non-zero segment is present.
 */
export const TinySegment = {
    args: {
        dcfdAmount: 4_500_000,
        dfsAmount: 3_200_000,
        deiAmount: 500,
        odAmount: 1_500_000,
        nonOpreAmount: 900_000,
        ...defaultColors
    },
    render: (args) => <BarWrapper {...args} />
};

/**
 * Only one segment has a non-zero value — renders as a single full-width bar.
 * Zero-value segments are filtered out before rendering.
 */
export const SingleSegment = {
    args: {
        dcfdAmount: 6_000_000,
        dfsAmount: 0,
        deiAmount: 0,
        odAmount: 0,
        nonOpreAmount: 0,
        ...defaultColors
    },
    render: (args) => <BarWrapper {...args} />
};

/**
 * All segments are zero — component returns `null` and renders nothing.
 * Verify: no bar element, no crash.
 */
export const AllZero = {
    args: {
        dcfdAmount: 0,
        dfsAmount: 0,
        deiAmount: 0,
        odAmount: 0,
        nonOpreAmount: 0,
        ...defaultColors
    },
    render: (args) => <BarWrapper {...args} />
};

/**
 * Keyboard navigation: each segment is `tabIndex={0}` with `role="button"`.
 * Tab through the segments and press Enter or Space to trigger `setActiveId`.
 * Open the **Accessibility** panel to confirm aria-labels are present.
 */
export const KeyboardNav = {
    args: {
        dcfdAmount: 4_500_000,
        dfsAmount: 3_200_000,
        deiAmount: 2_800_000,
        odAmount: 1_500_000,
        nonOpreAmount: 900_000,
        ...defaultColors
    },
    render: (args) => <BarWrapper {...args} />
};
