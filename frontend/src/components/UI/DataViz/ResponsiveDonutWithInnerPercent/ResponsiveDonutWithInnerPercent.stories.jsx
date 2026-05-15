import { useState } from "react";
import { computeDisplayPercents } from "../../../../helpers/utils";
import CustomLayerComponent from "./CustomLayerComponent";
import ResponsiveDonutWithInnerPercent from "./ResponsiveDonutWithInnerPercent";

export default {
    title: "UI/DataViz/ResponsiveDonutWithInnerPercent",
    component: ResponsiveDonutWithInnerPercent,
    parameters: {
        docs: {
            description: {
                component:
                    "Donut chart built on `@nivo/pie` with a custom center layer that displays the hovered slice's " +
                    "percentage. Arc geometry is floored to 1% of total internally so tiny non-zero slices always " +
                    "render a visible arc. Pass real `value` fields — do **not** pre-apply `applyMinimumArcValue` " +
                    "before passing data. Display percents must be computed via `computeDisplayPercents` from " +
                    "`helpers/utils` before passing to this component. The `container_id` prop must match the `id` " +
                    "of the wrapping `<div>` so the internal `MutationObserver` can label the nivo SVG for " +
                    "accessibility."
            }
        }
    },
    argTypes: {
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
// Shared wrapper
// ---------------------------------------------------------------------------
// All stories use this wrapper so argTypes/controls are inherited consistently.
// Accepts flat args from Storybook controls, builds the data array, then
// applies computeDisplayPercents before rendering. Also owns the hover state
// (percent shown in donut center, hoverId for legend highlight).
//
// containerId must match the wrapping div's id so the internal MutationObserver
// can find the nivo SVG and apply aria-label to it. Each story passes a unique
// containerId to avoid DOM conflicts when Storybook hot-reloads.
const DonutWrapper = ({
    draftAmount,
    plannedAmount,
    executingAmount,
    obligatedAmount,
    draftColor,
    plannedColor,
    executingColor,
    obligatedColor,
    containerId,
    ariaLabel
}) => {
    const [percent, setPercent] = useState("");
    // hoverId drives legend highlighting; no legend in this bare-chart story so
    // only the setter is needed to satisfy the component's prop contract.
    const setHoverId = useState(-1)[1];

    const rawData = [
        { id: 1, label: "Draft", value: draftAmount, color: draftColor },
        { id: 2, label: "Planned", value: plannedAmount, color: plannedColor },
        { id: 3, label: "Executing", value: executingAmount, color: executingColor },
        { id: 4, label: "Obligated", value: obligatedAmount, color: obligatedColor }
    ];
    const legendData = computeDisplayPercents(rawData);

    return (
        <div
            id={containerId}
            style={{ width: 150, height: 150 }}
        >
            <ResponsiveDonutWithInnerPercent
                data={legendData}
                width={150}
                height={150}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                setPercent={setPercent}
                setHoverId={setHoverId}
                CustomLayerComponent={CustomLayerComponent(percent ? `${percent}%` : "")}
                container_id={containerId}
                ariaLabel={ariaLabel}
            />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Default app color values (what the CSS variables resolve to in styles.scss):
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

// Shared render — every story uses this so argTypes / controls are always active.
const renderDonut = (containerId, ariaLabel) => {
    const Render = (args) => (
        <DonutWrapper
            {...args}
            containerId={containerId}
            ariaLabel={ariaLabel}
        />
    );
    Render.displayName = "DonutStory";
    return Render;
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Four-slice BLI status breakdown — the standard use case.
 * Use the **Controls** panel to adjust slice values and colors live.
 * Hover over a slice to see its percentage appear in the center.
 */
export const Default = {
    args: {
        draftAmount: 350_000,
        plannedAmount: 1_200_000,
        executingAmount: 875_000,
        obligatedAmount: 425_000,
        ...defaultColors
    },
    render: renderDonut("donut-default", "Donut chart: Budget lines by status.")
};

/**
 * Only one slice has a non-zero value — all budget lines are in a single status.
 * Use Controls to set any other amount to a non-zero value and watch
 * additional slices appear.
 * Verify: the dominant slice renders as a complete ring.
 */
export const AllOneCategory = {
    args: {
        draftAmount: 0,
        plannedAmount: 0,
        executingAmount: 1_800_000,
        obligatedAmount: 0,
        ...defaultColors
    },
    render: renderDonut("donut-all-one-category", "Donut chart: All budget lines in Executing status.")
};

/**
 * One slice is tiny ($500 out of ~$2.85M — well under 1% of total).
 * `applyMinimumArcValue` (applied internally) floors it to 1% so it still
 * renders a visible arc. Use Controls to raise `draftAmount` and watch the arc grow.
 * Verify: the tiny Draft slice is visible even at its default value.
 */
export const TinySlice = {
    args: {
        draftAmount: 500,
        plannedAmount: 1_500_000,
        executingAmount: 900_000,
        obligatedAmount: 450_000,
        ...defaultColors
    },
    render: renderDonut("donut-tiny-slice", "Donut chart: Budget lines by status including a very small Draft amount.")
};

/**
 * Accessibility labeling smoke-test.
 * The internal MutationObserver should apply the `ariaLabel` prop to the nivo SVG.
 * Open the **Accessibility** panel (A key) and confirm:
 *   - Role: img
 *   - Name matches the ariaLabel text
 *   - No critical violations flagged by addon-a11y
 */
export const AccessibilityLabeling = {
    args: {
        draftAmount: 350_000,
        plannedAmount: 1_200_000,
        executingAmount: 875_000,
        obligatedAmount: 425_000,
        ...defaultColors
    },
    render: renderDonut(
        "donut-a11y",
        "Donut chart showing FY 2025 budget lines by status: 12% Draft, 42% Planned, 31% Executing, 15% Obligated."
    )
};
