import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProjectFundingCANsTable from "./ProjectFundingCANsTable";

const mockCANs = [
    {
        id: 515,
        number: "G99MVT3",
        portfolio_id: 3,
        portfolio: "Child Care Research",
        active_period: 5,
        fy_funding: 500000,
        lifetime_funding: 4000000
    },
    {
        id: 504,
        number: "G994426",
        portfolio_id: 2,
        portfolio: "Head Start Research",
        active_period: 1,
        fy_funding: 0,
        lifetime_funding: 40000000
    },
    {
        id: 509,
        number: "G99XXX3",
        portfolio_id: 6,
        portfolio: "Healthy Marriage & Responsible Fatherhood Research",
        active_period: null,
        fy_funding: 0,
        lifetime_funding: 0
    }
];

describe("ProjectFundingCANsTable", () => {
    it("renders the table with correct column headers for the selected FY", () => {
        render(
            <ProjectFundingCANsTable
                cans={mockCANs}
                fiscalYear={2025}
            />
        );
        expect(screen.getByText("CAN")).toBeInTheDocument();
        expect(screen.getByText("Portfolio")).toBeInTheDocument();
        expect(screen.getByText("Active Period")).toBeInTheDocument();
        expect(screen.getByText("FY 25 Project Funding")).toBeInTheDocument();
        expect(screen.getByText("Lifetime Project Funding")).toBeInTheDocument();
    });

    it("updates the FY column header when fiscal year changes", () => {
        const { rerender } = render(
            <ProjectFundingCANsTable
                cans={mockCANs}
                fiscalYear={2025}
            />
        );
        expect(screen.getByText("FY 25 Project Funding")).toBeInTheDocument();

        rerender(
            <ProjectFundingCANsTable
                cans={mockCANs}
                fiscalYear={2024}
            />
        );
        expect(screen.getByText("FY 24 Project Funding")).toBeInTheDocument();
        expect(screen.queryByText("FY 25 Project Funding")).not.toBeInTheDocument();
    });

    it("renders a row for each CAN", () => {
        render(
            <ProjectFundingCANsTable
                cans={mockCANs}
                fiscalYear={2025}
            />
        );
        expect(screen.getByText("G99MVT3")).toBeInTheDocument();
        expect(screen.getByText("G994426")).toBeInTheDocument();
        expect(screen.getByText("G99XXX3")).toBeInTheDocument();
    });

    it("renders portfolio name for each row", () => {
        render(
            <ProjectFundingCANsTable
                cans={mockCANs}
                fiscalYear={2025}
            />
        );
        expect(screen.getByText("Child Care Research")).toBeInTheDocument();
        expect(screen.getByText("Head Start Research")).toBeInTheDocument();
    });

    it("formats active_period as '5 Years', '1 Year', and 'TBD' for null", () => {
        render(
            <ProjectFundingCANsTable
                cans={mockCANs}
                fiscalYear={2025}
            />
        );
        expect(screen.getByText("5 Years")).toBeInTheDocument();
        expect(screen.getByText("1 Year")).toBeInTheDocument();
        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("renders the empty state when cans is empty", () => {
        render(
            <ProjectFundingCANsTable
                cans={[]}
                fiscalYear={2025}
            />
        );
        expect(screen.getByTestId("project-funding-cans-empty")).toBeInTheDocument();
        expect(screen.getByText("No CANs found for this project.")).toBeInTheDocument();
        expect(screen.queryByTestId("project-funding-cans-table")).not.toBeInTheDocument();
    });

    it("renders $0.00 for zero fy_funding", () => {
        render(
            <ProjectFundingCANsTable
                cans={[mockCANs[1]]}
                fiscalYear={2025}
            />
        );
        expect(screen.getAllByText("$0.00").length).toBeGreaterThan(0);
    });
});
