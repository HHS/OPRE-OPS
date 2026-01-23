import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StepIndicator from "./StepIndicator";

/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */

describe("StepIndicator", () => {
    const mockSteps = ["Step 1", "Step 2", "Step 3", "Step 4"];

    it("renders all steps", () => {
        render(
            <StepIndicator
                steps={mockSteps}
                currentStep={1}
            />
        );

        mockSteps.forEach((step) => {
            expect(screen.getByText(step)).toBeInTheDocument();
        });
    });

    it("marks the current step with the correct class", () => {
        const { container } = render(
            <StepIndicator
                steps={mockSteps}
                currentStep={2}
            />
        );

        const currentStepElement = container.querySelector('[data-cy="step-indicator-1"]');
        expect(currentStepElement).toHaveClass("usa-step-indicator__segment--current");
    });

    it("marks completed steps with the correct class", () => {
        const { container } = render(
            <StepIndicator
                steps={mockSteps}
                currentStep={3}
            />
        );

        const firstStep = container.querySelector('[data-cy="step-indicator-0"]');
        const secondStep = container.querySelector('[data-cy="step-indicator-1"]');
        const thirdStep = container.querySelector('[data-cy="step-indicator-2"]');
        const fourthStep = container.querySelector('[data-cy="step-indicator-3"]');

        expect(firstStep).toHaveClass("usa-step-indicator__segment--complete");
        expect(secondStep).toHaveClass("usa-step-indicator__segment--complete");
        expect(thirdStep).toHaveClass("usa-step-indicator__segment--current");
        expect(fourthStep).not.toHaveClass("usa-step-indicator__segment--complete");
        expect(fourthStep).not.toHaveClass("usa-step-indicator__segment--current");
    });

    it("renders with first step as current when currentStep is 1", () => {
        const { container } = render(
            <StepIndicator
                steps={mockSteps}
                currentStep={1}
            />
        );

        const firstStep = container.querySelector('[data-cy="step-indicator-0"]');
        expect(firstStep).toHaveClass("usa-step-indicator__segment--current");
        expect(firstStep).not.toHaveClass("usa-step-indicator__segment--complete");
    });

    it("renders with last step as current when currentStep is last", () => {
        const { container } = render(
            <StepIndicator
                steps={mockSteps}
                currentStep={4}
            />
        );

        const lastStep = container.querySelector('[data-cy="step-indicator-3"]');
        expect(lastStep).toHaveClass("usa-step-indicator__segment--current");

        // All previous steps should be complete
        const firstStep = container.querySelector('[data-cy="step-indicator-0"]');
        const secondStep = container.querySelector('[data-cy="step-indicator-1"]');
        const thirdStep = container.querySelector('[data-cy="step-indicator-2"]');

        expect(firstStep).toHaveClass("usa-step-indicator__segment--complete");
        expect(secondStep).toHaveClass("usa-step-indicator__segment--complete");
        expect(thirdStep).toHaveClass("usa-step-indicator__segment--complete");
    });

    it("renders the correct aria-label", () => {
        render(
            <StepIndicator
                steps={mockSteps}
                currentStep={2}
            />
        );

        const stepIndicator = screen.getByLabelText("progress");
        expect(stepIndicator).toBeInTheDocument();
    });

    it("renders with custom step labels", () => {
        const customSteps = [
            "Acquisition Planning",
            "Pre-Solicitation",
            "Solicitation",
            "Evaluation",
            "Pre-Award",
            "Award"
        ];

        render(
            <StepIndicator
                steps={customSteps}
                currentStep={3}
            />
        );

        customSteps.forEach((step) => {
            expect(screen.getByText(step)).toBeInTheDocument();
        });
    });

    it("handles currentStep of 0 (no current step)", () => {
        const { container } = render(
            <StepIndicator
                steps={mockSteps}
                currentStep={0}
            />
        );

        // No step should be marked as current
        mockSteps.forEach((_, index) => {
            const step = container.querySelector(`[data-cy="step-indicator-${index}"]`);
            expect(step).not.toHaveClass("usa-step-indicator__segment--current");
        });
    });

    it("renders with data-cy attribute for testing", () => {
        const { container } = render(
            <StepIndicator
                steps={mockSteps}
                currentStep={2}
            />
        );

        expect(container.querySelector('[data-cy="step-indicator"]')).toBeInTheDocument();
        mockSteps.forEach((_, index) => {
            expect(container.querySelector(`[data-cy="step-indicator-${index}"]`)).toBeInTheDocument();
        });
    });
});
