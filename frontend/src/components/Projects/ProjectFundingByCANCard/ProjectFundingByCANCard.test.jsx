import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProjectFundingByCANCard from "./ProjectFundingByCANCard";

vi.mock("../../UI/DataViz/LineGraph", () => ({
    default: () => <div data-testid="mock-line-graph" />
}));

const mockFundingByCAN = {
    total: 1500000,
    carry_forward_funding: 1250000,
    new_funding: 250000
};

describe("ProjectFundingByCANCard", () => {
    it("renders the card heading with the selected fiscal year", () => {
        render(
            <ProjectFundingByCANCard
                fiscalYear={2025}
                fundingByCAN={mockFundingByCAN}
            />
        );
        expect(screen.getByText("FY 2025 Project Funding by CAN")).toBeInTheDocument();
    });

    it("renders the 'Previous FYs Carry-Forward' legend label", () => {
        render(
            <ProjectFundingByCANCard
                fiscalYear={2025}
                fundingByCAN={mockFundingByCAN}
            />
        );
        expect(screen.getByText("Previous FYs Carry-Forward")).toBeInTheDocument();
    });

    it("renders the 'FY {selectedFY} New Funding' legend label", () => {
        render(
            <ProjectFundingByCANCard
                fiscalYear={2025}
                fundingByCAN={mockFundingByCAN}
            />
        );
        expect(screen.getByText("FY 2025 New Funding")).toBeInTheDocument();
    });

    it("updates the new funding label when fiscal year changes", () => {
        const { rerender } = render(
            <ProjectFundingByCANCard
                fiscalYear={2025}
                fundingByCAN={mockFundingByCAN}
            />
        );
        expect(screen.getByText("FY 2025 New Funding")).toBeInTheDocument();

        rerender(
            <ProjectFundingByCANCard
                fiscalYear={2024}
                fundingByCAN={mockFundingByCAN}
            />
        );
        expect(screen.getByText("FY 2024 New Funding")).toBeInTheDocument();
    });

    it("renders gracefully with empty fundingByCAN", () => {
        render(
            <ProjectFundingByCANCard
                fiscalYear={2025}
                fundingByCAN={{}}
            />
        );
        expect(screen.getByText("FY 2025 Project Funding by CAN")).toBeInTheDocument();
    });
});
