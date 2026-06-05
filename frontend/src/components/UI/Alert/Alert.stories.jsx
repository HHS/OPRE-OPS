import Alert from "./Alert";

export default {
    title: "UI/Alert",
    component: Alert,
    parameters: {
        docs: {
            description: {
                component:
                    "Redux-driven alert banner. Reads state from the alert slice and auto-dismisses " +
                    "after 6 seconds. Supports closeable and toast variants. Seed state via parameters.store.preloadedState."
            }
        }
    }
};

const alertState = (overrides) => ({
    parameters: {
        store: {
            preloadedState: {
                alert: {
                    isActive: true,
                    type: "success",
                    heading: "Success",
                    message: "Your changes have been saved.",
                    redirectUrl: "",
                    isCloseable: true,
                    isToastMessage: false,
                    ...overrides
                }
            }
        }
    }
});

/** Success alert — auto-dismisses after 6 seconds. */
export const Success = {
    ...alertState({ type: "success", heading: "Saved", message: "Agreement saved successfully." })
};

/** Error alert with alert role for screen readers. */
export const Error = {
    ...alertState({ type: "error", heading: "Error", message: "Could not save changes. Please try again." })
};

/** Closeable alert with dismiss button. */
export const Closeable = {
    ...alertState({
        type: "info",
        heading: "Note",
        message: "This alert can be dismissed.",
        isCloseable: true
    })
};

/** Toast message — centered overlay variant. */
export const ToastMessage = {
    ...alertState({
        type: "success",
        heading: "Copied",
        message: "Link copied to clipboard.",
        isToastMessage: true
    })
};
