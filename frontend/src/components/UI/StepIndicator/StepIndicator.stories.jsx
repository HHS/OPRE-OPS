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
        step1: { control: "text", description: "Step 1 label", table: { category: "Steps" } },
        step2: { control: "text", description: "Step 2 label", table: { category: "Steps" } },
        step3: { control: "text", description: "Step 3 label", table: { category: "Steps" } },
        step4: { control: "text", description: "Step 4 label (leave empty to omit)", table: { category: "Steps" } },
        step5: { control: "text", description: "Step 5 label (leave empty to omit)", table: { category: "Steps" } },
        currentStep: {
            control: { type: "number", min: 1 },
            description: "Current active step (1-based index)"
        }
    },
    render: ({ step1, step2, step3, step4, step5, currentStep }) => {
        const steps = [step1, step2, step3, step4, step5].filter(Boolean);
        return (
            <StepIndicator
                steps={steps}
                currentStep={currentStep}
            />
        );
    }
};

/** First step active in a 3-step flow. */
export const FirstStep = {
    args: {
        step1: "Project & Agreement",
        step2: "Budget Lines",
        step3: "Review",
        step4: "",
        step5: "",
        currentStep: 1
    }
};

/** Middle step active. */
export const MiddleStep = {
    args: {
        step1: "Project & Agreement",
        step2: "Budget Lines",
        step3: "Review",
        step4: "",
        step5: "",
        currentStep: 2
    }
};

/** Last step active — all prior steps marked complete. */
export const LastStep = {
    args: {
        step1: "Project & Agreement",
        step2: "Budget Lines",
        step3: "Review",
        step4: "",
        step5: "",
        currentStep: 3
    }
};

/** Five-step flow with the third step active. */
export const FiveSteps = {
    args: {
        step1: "Start",
        step2: "Details",
        step3: "Budget",
        step4: "Review",
        step5: "Submit",
        currentStep: 3
    }
};
