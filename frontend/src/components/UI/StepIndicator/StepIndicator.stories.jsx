import StepIndicator from "./StepIndicator";

export default {
    title: "UI/StepIndicator",
    component: StepIndicator,
    parameters: {
        docs: {
            description: {
                component:
                    "USWDS step indicator showing progress through a multi-step wizard. " +
                    "Highlights the current step and marks previous steps as complete."
            }
        }
    },
    argTypes: {
        steps: { control: "object", description: "Array of step name strings" },
        currentStep: {
            control: { type: "number", min: 1 },
            description: "Current active step (1-based index)"
        }
    }
};

/** First step active in a 3-step flow. */
export const FirstStep = {
    args: {
        steps: ["Project & Agreement", "Budget Lines", "Review"],
        currentStep: 1
    }
};

/** Middle step active. */
export const MiddleStep = {
    args: {
        steps: ["Project & Agreement", "Budget Lines", "Review"],
        currentStep: 2
    }
};

/** Last step active — all prior steps marked complete. */
export const LastStep = {
    args: {
        steps: ["Project & Agreement", "Budget Lines", "Review"],
        currentStep: 3
    }
};

/** Five-step flow with the third step active. */
export const FiveSteps = {
    args: {
        steps: ["Start", "Details", "Budget", "Review", "Submit"],
        currentStep: 3
    }
};
