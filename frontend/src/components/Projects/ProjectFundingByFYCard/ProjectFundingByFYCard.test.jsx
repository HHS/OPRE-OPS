import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProjectFundingByFYCard from "./ProjectFundingByFYCard";

const mockFundingByFiscalYear = [
    { fiscal_year: 2021, amount: 6000000 },
    { fiscal_year: 2022, amount: 4000000 },
    { fiscal_year: 2023, amount: 3000000 },
    { fiscal_year: 2024, amount: 2000000 },
    { fiscal_year: 2025, amount: 1500000 }
];

describe("ProjectFundingByFYCard", () => {
    it("renders the card title", () => {
        render(
            <ProjectFundingByFYCard
                fundingByFiscalYear={mockFundingByFiscalYear}
                fiscalYear={2025}
            />
        );
        expect(screen.getByText("Project Funding By FY")).toBeInTheDocument();
    });

    it("renders exactly 5 FY rows", () => {
        render(
            <ProjectFundingByFYCard
                fundingByFiscalYear={mockFundingByFiscalYear}
                fiscalYear={2025}
            />
        );
        expect(screen.getByText("FY 2025")).toBeInTheDocument();
        expect(screen.getByText("FY 2024")).toBeInTheDocument();
        expect(screen.getByText("FY 2023")).toBeInTheDocument();
        expect(screen.getByText("FY 2022")).toBeInTheDocument();
        expect(screen.getByText("FY 2021")).toBeInTheDocument();
    });

    it("shifts the 5-year window when fiscalYear changes", () => {
        const { rerender } = render(
            <ProjectFundingByFYCard
                fundingByFiscalYear={mockFundingByFiscalYear}
                fiscalYear={2025}
            />
        );
        expect(screen.getByText("FY 2021")).toBeInTheDocument();

        rerender(
            <ProjectFundingByFYCard
                fundingByFiscalYear={mockFundingByFiscalYear}
                fiscalYear={2027}
            />
        );
        expect(screen.queryByText("FY 2021")).not.toBeInTheDocument();
        expect(screen.getByText("FY 2027")).toBeInTheDocument();
        expect(screen.getByText("FY 2023")).toBeInTheDocument();
    });

    it("renders gracefully with empty funding data", () => {
        render(
            <ProjectFundingByFYCard
                fundingByFiscalYear={[]}
                fiscalYear={2025}
            />
        );
        expect(screen.getByText("Project Funding By FY")).toBeInTheDocument();
        expect(screen.getByText("FY 2025")).toBeInTheDocument();
    });
});
