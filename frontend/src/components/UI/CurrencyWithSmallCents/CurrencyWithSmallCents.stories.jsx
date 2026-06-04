import CurrencyWithSmallCents from "./CurrencyWithSmallCents";

export default {
    title: "UI/CurrencyWithSmallCents",
    component: CurrencyWithSmallCents,
    parameters: {
        docs: {
            description: {
                component:
                    "Displays a currency value with the dollar amount in bold and cents rendered as a smaller superscript. Hides cents when the amount is zero."
            }
        }
    },
    argTypes: {
        amount: {
            control: { type: "number", min: 0, step: 1000 },
            description: "Currency amount to display"
        },
        dollarsClasses: { control: "text", description: "CSS classes for the dollar span" },
        centsClasses: { control: "text", description: "CSS classes for the cents span" }
    }
};

/** Typical amount with dollars and cents. */
export const Default = {
    args: {
        amount: 1_500_000.5
    }
};

/** Zero amount — cents portion is hidden. */
export const Zero = {
    args: {
        amount: 0
    }
};

/** Large amount demonstrating thousand separators. */
export const LargeAmount = {
    args: {
        amount: 99_999_999.99
    }
};

/** Whole dollar amount with no cents. */
export const NoCents = {
    args: {
        amount: 500_000.0
    }
};

/** Small amount showing cents clearly. */
export const SmallAmount = {
    args: {
        amount: 42.07
    }
};
