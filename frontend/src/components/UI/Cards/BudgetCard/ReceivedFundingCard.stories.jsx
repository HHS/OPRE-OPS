import ReceivedFundingCard from "./ReceivedFundingCard";

export default {
    title: "UI/Cards/ReceivedFundingCard",
    component: ReceivedFundingCard,
    parameters: {
        docs: {
            description: {
                component:
                    "Displays how much of the total funding has been received. Uses a `ReverseLineGraph` — the " +
                    "received amount fills from the left, remaining fills right. The bar and 'Received' tag are " +
                    "hidden when `totalFunding` is `0`. Unlike `BudgetCard`, there is no Over Budget state — " +
                    "over-received is an edge case shown separately."
            }
        }
    },
    argTypes: {
        title: {
            control: "text",
            description: "Card heading — typically includes the fiscal year"
        },
        totalReceived: {
            control: { type: "number", min: 0, step: 50_000 },
            description: "Amount of funding received to date"
        },
        totalFunding: {
            control: { type: "number", min: 0, step: 50_000 },
            description: "Total expected funding"
        }
    }
};

/**
 * Normal state — partial funding received.
 * Bar fills proportionally left-to-right. "Received" tag visible.
 * Use **Controls** to adjust received and total funding live.
 */
export const Default = {
    args: {
        title: "FY 2025 CANs Received Funding",
        totalReceived: 800_000,
        totalFunding: 2_000_000
    }
};

/**
 * More funding received than the total funding amount.
 * Bar overflows — verify the layout doesn't break.
 */
export const OverReceived = {
    args: {
        title: "FY 2025 CANs Received Funding",
        totalReceived: 2_400_000,
        totalFunding: 2_000_000
    }
};

/**
 * `totalFunding` is zero — bar and "Received" tag are hidden.
 * Card still renders heading and $0 cleanly.
 */
export const ZeroFunding = {
    args: {
        title: "FY 2025 CANs Received Funding",
        totalReceived: 0,
        totalFunding: 0
    }
};
