import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProcurementTrackerStepThree from "./ProcurementTrackerStepThree";

describe("ProcurementTrackerStepThree", () => {
    const mockStepData = { id: 3 };

    it("renders instructional shell when status is PENDING", () => {
        render(
            <ProcurementTrackerStepThree
                stepStatus="PENDING"
                stepThreeData={mockStepData}
                isActiveStep={false}
                authorizedUsers={[]}
                handleSetCompletedStepNumber={vi.fn()}
            />
        );

        expect(screen.getByText(/Once the Procurement Shop has posted the Solicitation/i)).toBeInTheDocument();
        expect(screen.getByText(/enter the Solicitation Start and End Dates/i)).toBeInTheDocument();
    });

    it("renders instructional shell when status is ACTIVE", () => {
        render(
            <ProcurementTrackerStepThree
                stepStatus="ACTIVE"
                stepThreeData={mockStepData}
                isActiveStep={true}
                authorizedUsers={[]}
                handleSetCompletedStepNumber={vi.fn()}
            />
        );

        expect(screen.getByText(/Once the Procurement Shop has posted the Solicitation/i)).toBeInTheDocument();
    });

    it("renders completed summary text when status is COMPLETED", () => {
        render(
            <ProcurementTrackerStepThree
                stepStatus="COMPLETED"
                stepThreeData={mockStepData}
                isActiveStep={false}
                authorizedUsers={[]}
                handleSetCompletedStepNumber={vi.fn()}
            />
        );

        expect(screen.getByText(/After all proposals are received/i)).toBeInTheDocument();
    });
});
