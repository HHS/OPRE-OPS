import { render, screen } from "@testing-library/react";
import { expect, describe, it } from "vitest";
import ProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo";

describe("ProcurementTrackerStepTwo", () => {
    describe("PENDING State Rendering", () => {
        it("renders instructional paragraph", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="PENDING"
                />
            );

            expect(
                screen.getByText(
                    /Edit the pre-solicitation package in collaboration with the Procurement Shop/i
                )
            ).toBeInTheDocument();
        });

        it("renders checkbox element", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="PENDING"
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeInTheDocument();
        });

        it("checkbox is disabled when isCurrentStep is false", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={false}
                    stepStatus="PENDING"
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });

        it("checkbox is enabled when isCurrentStep is true", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="PENDING"
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).not.toBeDisabled();
        });

        it("renders Cancel button with correct attributes", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="PENDING"
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            expect(cancelButton).toBeInTheDocument();
            expect(cancelButton).toHaveAttribute("data-cy", "cancel-button");
        });

        it("renders Complete Step 1 button with correct attributes", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="PENDING"
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 1/i });
            expect(completeButton).toBeInTheDocument();
            expect(completeButton).toHaveAttribute("data-cy", "continue-btn");
        });

        it("wraps form elements in fieldset with usa-fieldset class", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="PENDING"
                />
            );

            const fieldset = screen.getByRole("group");
            expect(fieldset).toBeInTheDocument();
            expect(fieldset.tagName).toBe("FIELDSET");
            expect(fieldset).toHaveClass("usa-fieldset");
        });
    });

    describe("ACTIVE State Rendering", () => {
        it("renders form elements in ACTIVE state", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="ACTIVE"
                />
            );

            expect(screen.getByRole("checkbox")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /complete step 1/i })).toBeInTheDocument();
        });

        it("checkbox respects isCurrentStep prop in ACTIVE state", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={false}
                    stepStatus="ACTIVE"
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });

        it("renders instructional paragraph in ACTIVE state", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="ACTIVE"
                />
            );

            expect(
                screen.getByText(
                    /Edit the pre-solicitation package in collaboration with the Procurement Shop/i
                )
            ).toBeInTheDocument();
        });
    });

    describe("COMPLETED State Rendering", () => {
        it("renders completion message", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="COMPLETED"
                />
            );

            expect(screen.getByText("Step Completed")).toBeInTheDocument();
        });

        it("does not render form elements in COMPLETED state", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="COMPLETED"
                />
            );

            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /complete step 1/i })).not.toBeInTheDocument();
        });

        it("does not render instructional paragraph in COMPLETED state", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="COMPLETED"
                />
            );

            expect(
                screen.queryByText(
                    /Edit the pre-solicitation package in collaboration with the Procurement Shop/i
                )
            ).not.toBeInTheDocument();
        });

        it("does not render fieldset in COMPLETED state", () => {
            render(
                <ProcurementTrackerStepTwo
                    isCurrentStep={true}
                    stepStatus="COMPLETED"
                />
            );

            expect(screen.queryByRole("group")).not.toBeInTheDocument();
        });
    });
});
