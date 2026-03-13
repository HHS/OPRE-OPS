import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ReportingCountCard from "./ReportingCountCard";

const mockCounts = {
    projects: {
        total: 34,
        types: [
            { type: "RESEARCH", count: 24 },
            { type: "ADMINISTRATIVE_AND_SUPPORT", count: 10 }
        ]
    },
    agreements: {
        total: 40,
        types: [
            { type: "CONTRACT", count: 20 },
            { type: "PARTNER", count: 8 },
            { type: "GRANT", count: 7 },
            { type: "DIRECT_OBLIGATION", count: 5 }
        ]
    },
    new_agreements: {
        total: 17,
        types: [
            { type: "CONTRACT", count: 10 },
            { type: "PARTNER", count: 3 },
            { type: "GRANT", count: 2 },
            { type: "DIRECT_OBLIGATION", count: 2 }
        ]
    },
    continuing_agreements: {
        total: 15,
        types: [
            { type: "CONTRACT", count: 8 },
            { type: "PARTNER", count: 3 },
            { type: "GRANT", count: 3 },
            { type: "DIRECT_OBLIGATION", count: 1 }
        ]
    },
    budget_lines: {
        total: 80,
        types: [
            { type: "DRAFT", count: 10 },
            { type: "PLANNED", count: 30 },
            { type: "IN_EXECUTION", count: 25 },
            { type: "OBLIGATED", count: 15 }
        ]
    }
};

describe("ReportingCountCard", () => {
    it("renders nothing when counts is null", () => {
        const { container } = render(
            <ReportingCountCard
                fiscalYear={2025}
                counts={null}
            />
        );
        expect(container.innerHTML).toBe("");
    });

    it("renders all five column headers", () => {
        render(
            <ReportingCountCard
                fiscalYear={2025}
                counts={mockCounts}
            />
        );
        expect(screen.getByText("FY 2025 Projects")).toBeInTheDocument();
        expect(screen.getByText("FY 2025 Agreements")).toBeInTheDocument();
        expect(screen.getByText("FY 2025 New")).toBeInTheDocument();
        expect(screen.getByText("FY 2025 Continuing")).toBeInTheDocument();
        expect(screen.getByText("FY 2025 Budget Lines")).toBeInTheDocument();
    });

    it("renders totals for each column", () => {
        render(
            <ReportingCountCard
                fiscalYear={2025}
                counts={mockCounts}
            />
        );
        expect(screen.getByText("34")).toBeInTheDocument();
        expect(screen.getByText("40")).toBeInTheDocument();
        expect(screen.getByText("17")).toBeInTheDocument();
        expect(screen.getByText("15")).toBeInTheDocument();
        expect(screen.getByText("80")).toBeInTheDocument();
    });

    it("renders project type tags", () => {
        render(
            <ReportingCountCard
                fiscalYear={2025}
                counts={mockCounts}
            />
        );
        expect(screen.getByText("24 Research")).toBeInTheDocument();
        expect(screen.getByText("10 Admin & Support")).toBeInTheDocument();
    });

    it("renders agreement type tags", () => {
        render(
            <ReportingCountCard
                fiscalYear={2025}
                counts={mockCounts}
            />
        );
        expect(screen.getAllByText("20 Contracts")).toHaveLength(1);
        expect(screen.getAllByText("8 Partner")).toHaveLength(1);
    });

    it("renders budget line status tags", () => {
        render(
            <ReportingCountCard
                fiscalYear={2025}
                counts={mockCounts}
            />
        );
        expect(screen.getByText("10 Draft")).toBeInTheDocument();
        expect(screen.getByText("30 Planned")).toBeInTheDocument();
        expect(screen.getByText("25 Executing")).toBeInTheDocument();
        expect(screen.getByText("15 Obligated")).toBeInTheDocument();
    });

    it("handles empty types arrays", () => {
        const emptyCounts = {
            projects: { total: 0, types: [] },
            agreements: { total: 0, types: [] },
            new_agreements: { total: 0, types: [] },
            continuing_agreements: { total: 0, types: [] },
            budget_lines: { total: 0, types: [] }
        };

        render(
            <ReportingCountCard
                fiscalYear={2025}
                counts={emptyCounts}
            />
        );
        expect(screen.getByText("FY 2025 Projects")).toBeInTheDocument();
        expect(screen.getAllByText("0")).toHaveLength(5);
    });
});
