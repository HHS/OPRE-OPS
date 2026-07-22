import DisabledButtonWithTooltip from "./DisabledButtonWithTooltip";

export default {
    title: "UI/Button/DisabledButtonWithTooltip",
    component: DisabledButtonWithTooltip,
    parameters: {
        docs: {
            description: {
                component:
                    "A button that is visually disabled but wraps itself in a focusable element so a tooltip can still fire on hover/focus. Use whenever a disabled button needs to explain why it is disabled."
            }
        }
    },
    argTypes: {
        label: { control: "text", description: "Tooltip label" },
        tooltipPosition: {
            control: { type: "select" },
            options: ["top", "bottom", "left", "right"],
            description: "Tooltip position"
        },
        className: { control: "text", description: "CSS class for the inner button" },
        dataCy: { control: "text", description: "data-cy selector" }
    }
};

export const Default = {
    args: {
        label: "In order to send this agreement to approval, click edit to update the required information.",
        tooltipPosition: "top",
        children: "Send to Approval"
    }
};
