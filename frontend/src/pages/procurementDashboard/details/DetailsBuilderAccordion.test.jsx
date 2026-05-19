import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DetailsBuilderAccordion from "./DetailsBuilderAccordion";

describe("DetailsBuilderAccordion", () => {
    const defaultStep = {
        id: "default-step-1",
        step_number: 1,
        step_type: "Acquisition Planning"
    };

    it("renders step number and total", () => {
        render(
            <DetailsBuilderAccordion
                step={defaultStep}
                totalSteps={6}
            />
        );

        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("of 6")).toBeInTheDocument();
    });

    it("renders step label as-is when already formatted", () => {
        render(
            <DetailsBuilderAccordion
                step={defaultStep}
                totalSteps={6}
            />
        );

        expect(screen.getByText("Acquisition Planning")).toBeInTheDocument();
    });

    it("converts UPPER_CASE step type to title case", () => {
        const step = { ...defaultStep, step_type: "PRE_SOLICITATION" };
        render(
            <DetailsBuilderAccordion
                step={step}
                totalSteps={6}
            />
        );

        expect(screen.getByText("Pre Solicitation")).toBeInTheDocument();
    });

    it("renders children inside the accordion", () => {
        render(
            <DetailsBuilderAccordion
                step={defaultStep}
                totalSteps={6}
            >
                <div data-testid="child-content">Step content here</div>
            </DetailsBuilderAccordion>
        );

        expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("handles empty step type gracefully", () => {
        const step = { ...defaultStep, step_type: "" };
        render(
            <DetailsBuilderAccordion
                step={step}
                totalSteps={6}
            />
        );

        expect(screen.getByText("1")).toBeInTheDocument();
    });
});
