import Tag from "./Tag";

export default {
    title: "UI/Tag",
    component: Tag,
    parameters: {
        docs: {
            description: {
                component:
                    "Color-coded label used for status indicators, budget categories, and graph legends. " +
                    "Supports multiple predefined color schemes and active/inactive states."
            }
        }
    },
    argTypes: {
        tagStyle: {
            control: "select",
            options: [
                "darkTextLightBackground",
                "lightTextDarkBackground",
                "darkTextWhiteBackground",
                "darkTextGreenBackground",
                "lightTextGreenBackground",
                "primaryDarkTextLightBackground",
                "lightTextRedBackground",
                "budgetAvailable"
            ],
            description: "Predefined color scheme"
        },
        text: { control: "text", description: "Tag display text" },
        active: { control: "boolean", description: "Active state for legend tags" },
        label: {
            control: "select",
            options: ["Available", "Planned", "Executing", "Obligated", "Draft"],
            description: "Context-based label for automatic styling"
        }
    }
};

/** Neutral light background with dark text. */
export const DarkTextLightBackground = {
    args: {
        tagStyle: "darkTextLightBackground",
        text: "Neutral"
    }
};

/** Dark background with light text. */
export const LightTextDarkBackground = {
    args: {
        tagStyle: "lightTextDarkBackground",
        text: "Dark Tag"
    }
};

/** Green background with dark text. */
export const DarkTextGreenBackground = {
    args: {
        tagStyle: "darkTextGreenBackground",
        text: "On Track"
    }
};

/** Red background with light text — used for over-budget warnings. */
export const LightTextRedBackground = {
    args: {
        tagStyle: "lightTextRedBackground",
        text: "Over Budget"
    }
};

/** Budget available style. */
export const BudgetAvailable = {
    args: {
        tagStyle: "budgetAvailable",
        text: "Available"
    }
};

/** Active state for a "Planned" legend tag. */
export const ActivePlanned = {
    args: {
        active: true,
        label: "Planned",
        text: "Planned"
    }
};

/** Active state for a "Draft" legend tag. */
export const ActiveDraft = {
    args: {
        active: true,
        label: "Draft",
        text: "Draft"
    }
};
