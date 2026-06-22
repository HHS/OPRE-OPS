import Tooltip from "./Tooltip";

export default {
    title: "UI/USWDS/Tooltip",
    component: Tooltip,
    parameters: {
        docs: {
            description: {
                component:
                    "Wraps USWDS tooltip JavaScript. Appears on hover/focus of the child element. " +
                    "Dynamically reinitializes when `label` or `position` changes. " +
                    "See also: [USWDS Tooltip](https://designsystem.digital.gov/components/tooltip/)"
            }
        }
    },
    argTypes: {
        label: { control: "text" },
        position: {
            control: "select",
            options: ["top", "right", "bottom", "left"]
        }
    }
};

export const Top = {
    args: {
        label: "This field is read-only",
        position: "top"
    },
    render: (args) => (
        <div style={{ padding: "4rem", display: "flex", justifyContent: "center" }}>
            <Tooltip {...args}>
                <button
                    type="button"
                    className="usa-button"
                >
                    Hover me
                </button>
            </Tooltip>
        </div>
    )
};

export const Right = {
    args: {
        label: "Opens in a new window",
        position: "right"
    },
    render: (args) => (
        <div style={{ padding: "4rem" }}>
            <Tooltip {...args}>
                <button
                    type="button"
                    className="usa-button usa-button--outline"
                >
                    External link
                </button>
            </Tooltip>
        </div>
    )
};

export const Bottom = {
    args: {
        label: "Click to copy",
        position: "bottom"
    },
    render: (args) => (
        <div style={{ padding: "4rem", display: "flex", justifyContent: "center" }}>
            <Tooltip {...args}>
                <button
                    type="button"
                    className="usa-button usa-button--secondary"
                >
                    Copy ID
                </button>
            </Tooltip>
        </div>
    )
};

export const Left = {
    args: {
        label: "Required field",
        position: "left"
    },
    render: (args) => (
        <div style={{ padding: "4rem", display: "flex", justifyContent: "flex-end" }}>
            <Tooltip {...args}>
                <button
                    type="button"
                    className="usa-button usa-button--base"
                >
                    Info
                </button>
            </Tooltip>
        </div>
    )
};
