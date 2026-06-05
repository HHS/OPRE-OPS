import SlimAlert from "./SlimAlert";

export default {
    title: "UI/Alert/SlimAlert",
    component: SlimAlert,
    parameters: {
        docs: {
            description: {
                component:
                    "Compact single-line alert using the USWDS slim variant. " +
                    "Includes a special 'last-data-update' type with an icon and formatted date."
            }
        }
    },
    argTypes: {
        type: {
            control: "select",
            options: ["info", "success", "warning", "error", "emergency", "last-data-update"],
            description: "Alert severity type"
        },
        message: { control: "text", description: "Alert message text" },
        updateDate: { control: "text", description: "Date string for last-data-update type" }
    }
};

/** Informational slim alert. */
export const Info = {
    args: {
        type: "info",
        message: "This is an informational message."
    }
};

/** Success slim alert. */
export const Success = {
    args: {
        type: "success",
        message: "Changes saved successfully."
    }
};

/** Warning slim alert. */
export const Warning = {
    args: {
        type: "warning",
        message: "Approaching budget limit."
    }
};

/** Error slim alert. */
export const Error = {
    args: {
        type: "error",
        message: "Validation failed. Please check your inputs."
    }
};

/** Last data update variant with icon and date. */
export const LastDataUpdate = {
    args: {
        type: "last-data-update",
        updateDate: "05/15/2025"
    }
};
