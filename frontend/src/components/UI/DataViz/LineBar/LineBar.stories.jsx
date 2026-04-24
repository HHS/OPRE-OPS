import LineBar from "./LineBar";

export default {
    title: "UI/DataViz/LineBar",
    component: LineBar,
    parameters: {
        docs: {
            description: {
                component:
                    "Single horizontal bar with a title on the left and a currency amount on the right. " +
                    "Bar width is set via a `ratio` (0–1). When `total === 0` and `iterator === 0`, " +
                    "displays `\"TBD\"` instead of `$0` — this handles the first row in a list where no " +
                    "data is yet available. Used in `PortfolioFunding` to show per-fiscal-year budget bars."
            }
        }
    },
    argTypes: {
        title:    { control: "text",                                   description: "Label displayed to the left of the bar" },
        ratio:    { control: { type: "range", min: 0, max: 1, step: 0.01 }, description: "Bar width as a fraction of 1.0" },
        color:    { control: "color",                                  description: "Bar background color" },
        total:    { control: { type: "number", min: 0, step: 10_000 }, description: "Currency amount displayed to the right" },
        iterator: { control: { type: "number", min: 0, step: 1 },      description: "Row index — when `0` and `total === 0`, shows TBD" }
    }
};

/**
 * Standard bar with a title, proportional width, and currency amount.
 * Use the **ratio** slider in Controls to resize the bar live (0 = empty, 1 = full).
 */
export const Default = {
    args: {
        title:    "FY 2025",
        ratio:    0.65,
        color:    "#336a90",
        total:    1_300_000,
        iterator: 0
    }
};

/**
 * `ratio` is 0 and `total` is 0 — bar has no width.
 * When `iterator === 0`, displays "TBD" instead of "$0".
 */
export const ZeroValue = {
    args: {
        title:    "FY 2025",
        ratio:    0,
        color:    "#336a90",
        total:    0,
        iterator: 0
    }
};

/**
 * `ratio` is 0 and `total` is 0 but `iterator > 0` — displays "$0" (not TBD).
 * The TBD fallback only applies to the first row in a list.
 */
export const ZeroValueNotFirstRow = {
    args: {
        title:    "FY 2024",
        ratio:    0,
        color:    "#336a90",
        total:    0,
        iterator: 1
    }
};

/**
 * Bar fills the full container width (`ratio === 1`).
 */
export const MaxValue = {
    args: {
        title:    "FY 2025",
        ratio:    1,
        color:    "#336a90",
        total:    2_000_000,
        iterator: 0
    }
};
