import { render, screen } from "@testing-library/react";
import { StepIndicator } from "./StepIndicator";

describe("StepIndicator", () => {
    const steps = ["Step 1", "Step 2", "Step 3"];

    test("renders the correct number of steps", () => {
        render(<StepIndicator steps={steps} currentStep={1} />);
        const stepElements = screen.getAllByRole("listitem");
        expect(stepElements).toHaveLength(steps.length);
    });

    test("renders the correct step labels", () => {
        render(<StepIndicator steps={steps} currentStep={1} />);
        const stepElements = screen.getAllByRole("listitem");
        stepElements.forEach((element, index) => {
            expect(element).toHaveTextContent(steps[index]);
        });
    });

    test("applies 'usa-step-indicator__segment--current' class to the current step", () => {
        render(<StepIndicator steps={steps} currentStep={2} />);
        const stepElements = screen.getAllByRole("listitem");
        const currentStepElement = stepElements.find((element, index) => index + 1 === 2);
        expect(currentStepElement).toHaveClass("usa-step-indicator__segment--current");
    });

    test("does not apply 'usa-step-indicator__segment--current' class to other steps", () => {
        render(<StepIndicator steps={steps} currentStep={2} />);
        const stepElements = screen.getAllByRole("listitem");
        const otherStepElements = stepElements.filter((element, index) => index + 1 !== 2);
        const currentStepElement = stepElements.find((element, index) => index + 1 === 2);
        expect(currentStepElement).toHaveClass("usa-step-indicator__segment--current");
        otherStepElements.forEach((element) => {
            expect(element).not.toHaveClass("usa-step-indicator__segment--current");
        });
    });
});
