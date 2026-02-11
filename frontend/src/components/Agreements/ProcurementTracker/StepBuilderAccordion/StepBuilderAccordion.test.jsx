import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import StepBuilderAccordion from "./StepBuilderAccordion";

describe("StepBuilderAccordion", () => {
    const baseStep = {
        id: 1,
        step_number: 1,
        step_type: "ACQUISITION_PLANNING",
        status: "PENDING"
    };

    it("renders formatted header text from enum values", () => {
        render(
            <StepBuilderAccordion
                step={baseStep}
                totalSteps={6}
            >
                <div>Step content</div>
            </StepBuilderAccordion>
        );

        expect(screen.getByTestId("step-builder-heading-1")).toHaveTextContent(/1\s+of\s+6\s+Acquisition Planning/);
        expect(screen.getByText("Acquisition Planning")).toBeInTheDocument();
    });

    it("maps COMPLETED status to completed heading class", () => {
        render(
            <StepBuilderAccordion
                step={{ ...baseStep, status: "COMPLETED" }}
                totalSteps={6}
            />
        );

        expect(screen.getByTestId("step-builder-heading-1")).toHaveClass("step-builder-accordion__heading--completed");
    });

    it("maps ACTIVE status to active heading class", () => {
        render(
            <StepBuilderAccordion
                step={{ ...baseStep, status: "ACTIVE" }}
                totalSteps={6}
            />
        );

        expect(screen.getByTestId("step-builder-heading-1")).toHaveClass("step-builder-accordion__heading--active");
    });

    it("maps unknown status to not-started heading class", () => {
        render(
            <StepBuilderAccordion
                step={{ ...baseStep, status: "UNKNOWN" }}
                totalSteps={6}
            />
        );

        expect(screen.getByTestId("step-builder-heading-1")).toHaveClass(
            "step-builder-accordion__heading--not-started"
        );
    });

    it("applies read-only heading class when isReadOnly is true", () => {
        render(
            <StepBuilderAccordion
                step={baseStep}
                totalSteps={6}
                isReadOnly={true}
            />
        );

        expect(screen.getByTestId("step-builder-heading-1")).toHaveClass("step-builder-accordion__heading--read-only");
    });

    it("maps pending status to not-started heading class without activeStepNumber", () => {
        render(
            <StepBuilderAccordion
                step={{ ...baseStep, status: "PENDING", step_number: 4 }}
                totalSteps={6}
            />
        );

        expect(screen.getByTestId("step-builder-heading-1")).toHaveClass(
            "step-builder-accordion__heading--not-started"
        );
    });

    it("falls back to activeStepNumber when status is not mapped", () => {
        const { rerender } = render(
            <StepBuilderAccordion
                step={{ ...baseStep, status: "PENDING", step_number: 1 }}
                totalSteps={6}
                activeStepNumber={2}
            />
        );

        expect(screen.getByTestId("step-builder-heading-1")).toHaveClass("step-builder-accordion__heading--completed");

        rerender(
            <StepBuilderAccordion
                step={{ ...baseStep, id: 2, status: "PENDING", step_number: 2 }}
                totalSteps={6}
                activeStepNumber={2}
            />
        );

        expect(screen.getByTestId("step-builder-heading-2")).toHaveClass("step-builder-accordion__heading--active");
    });

    it("delegates expand/collapse behavior to base accordion", async () => {
        render(
            <StepBuilderAccordion
                step={baseStep}
                totalSteps={6}
            >
                <div>Step content</div>
            </StepBuilderAccordion>
        );

        const button = screen.getByRole("button", { name: /1\s+of\s+6\s+acquisition planning/i });
        expect(button).toHaveAttribute("aria-expanded", "true");

        await userEvent.click(button);
        expect(button).toHaveAttribute("aria-expanded", "false");

        await userEvent.click(button);
        expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("allows expand/collapse when read-only", async () => {
        render(
            <StepBuilderAccordion
                step={baseStep}
                totalSteps={6}
                isReadOnly={true}
            >
                <div>Step content</div>
            </StepBuilderAccordion>
        );

        const button = screen.getByRole("button", { name: /1\s+of\s+6\s+acquisition planning/i });
        expect(button).toHaveAttribute("aria-expanded", "true");

        await userEvent.click(button);
        expect(button).toHaveAttribute("aria-expanded", "false");
    });
});
