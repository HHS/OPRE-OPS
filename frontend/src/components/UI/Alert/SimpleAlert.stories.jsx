import { fn } from "storybook/test";
import SimpleAlert from "./SimpleAlert";

export default {
    title: "UI/Alert/SimpleAlert",
    component: SimpleAlert,
    parameters: {
        docs: {
            description: {
                component:
                    "Pure alert component with no Redux dependency. Supports all USWDS alert types, " +
                    "closable state, markdown content, and configurable heading level."
            }
        }
    },
    argTypes: {
        type: {
            control: "select",
            options: ["info", "success", "warning", "error", "emergency"],
            description: "Alert severity type"
        },
        heading: { control: "text", description: "Alert heading text" },
        message: { control: "text", description: "Alert body message (supports markdown)" },
        isClosable: { control: "boolean", description: "Show close button" },
        headingLevel: {
            control: { type: "number", min: 1, max: 6 },
            description: "HTML heading level (1-6)"
        }
    },
    args: {
        setIsAlertVisible: fn()
    }
};

/** Informational alert with heading and message. */
export const Info = {
    args: {
        type: "info",
        heading: "Information",
        message: "This is an informational alert."
    }
};

/** Success alert. */
export const Success = {
    args: {
        type: "success",
        heading: "Success",
        message: "Operation completed successfully."
    }
};

/** Warning alert. */
export const Warning = {
    args: {
        type: "warning",
        heading: "Warning",
        message: "Proceed with caution."
    }
};

/** Error alert. */
export const Error = {
    args: {
        type: "error",
        heading: "Error",
        message: "Something went wrong. Please try again."
    }
};

/** Closable alert with dismiss button. */
export const Closable = {
    args: {
        type: "info",
        heading: "Dismissible",
        message: "Click the X to close this alert.",
        isClosable: true
    }
};

/** Alert with children rendered below the message. */
export const WithChildren = {
    args: {
        type: "info",
        heading: "Details",
        message: "Review the information below."
    },
    render: (args) => (
        <SimpleAlert {...args}>
            <ul>
                <li>Item one needs attention</li>
                <li>Item two is optional</li>
            </ul>
        </SimpleAlert>
    )
};
