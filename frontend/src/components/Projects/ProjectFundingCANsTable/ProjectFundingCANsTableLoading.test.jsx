import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProjectFundingCANsTableLoading from "./ProjectFundingCANsTableLoading";

describe("ProjectFundingCANsTableLoading", () => {
    it("renders the skeleton table", () => {
        render(<ProjectFundingCANsTableLoading fiscalYear={2025} />);
        expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("renders the correct column headers including the dynamic FY column", () => {
        render(<ProjectFundingCANsTableLoading fiscalYear={2025} />);
        expect(screen.getByText("CAN")).toBeInTheDocument();
        expect(screen.getByText("FY 25 Project Funding")).toBeInTheDocument();
        expect(screen.getByText("Lifetime Project Funding")).toBeInTheDocument();
    });

    it("updates the FY column header when fiscalYear prop changes", () => {
        const { rerender } = render(<ProjectFundingCANsTableLoading fiscalYear={2025} />);
        expect(screen.getByText("FY 25 Project Funding")).toBeInTheDocument();

        rerender(<ProjectFundingCANsTableLoading fiscalYear={2027} />);
        expect(screen.getByText("FY 27 Project Funding")).toBeInTheDocument();
        expect(screen.queryByText("FY 25 Project Funding")).not.toBeInTheDocument();
    });

    it("renders skeleton pill cells", () => {
        render(<ProjectFundingCANsTableLoading fiscalYear={2025} />);
        expect(screen.getAllByTestId("skeleton-cell-pill").length).toBeGreaterThan(0);
    });

    it("has an accessible aria-label while loading", () => {
        render(<ProjectFundingCANsTableLoading fiscalYear={2025} />);
        expect(screen.getByRole("table", { name: "Loading project funding CANs" })).toBeInTheDocument();
    });
});
