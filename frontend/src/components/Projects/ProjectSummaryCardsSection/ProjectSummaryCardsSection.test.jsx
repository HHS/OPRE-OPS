import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProjectSummaryCardsSection from "./ProjectSummaryCardsSection";

vi.mock("../ProjectCountSummaryCard", () => ({
    default: ({ title, summary }) => (
        <div data-testid="project-count-summary-card">
            <span data-testid="count-card-title">{title}</span>
            <span data-testid="count-card-total">{summary?.total_projects ?? 0}</span>
        </div>
    )
}));

vi.mock("../ProjectTypeSummaryCard", () => ({
    default: ({ title, summary }) => (
        <div data-testid="project-type-summary-card">
            <span data-testid="type-card-title">{title}</span>
            <span data-testid="type-card-research-amount">{summary?.amounts_by_type?.RESEARCH?.amount ?? 0}</span>
        </div>
    )
}));

const testSummary = {
    total_projects: 15,
    projects_by_type: {
        RESEARCH: 13,
        ADMINISTRATIVE_AND_SUPPORT: 2
    },
    amounts_by_type: {
        RESEARCH: { amount: 7000000, percent: 70 },
        ADMINISTRATIVE_AND_SUPPORT: { amount: 3000000, percent: 30 }
    }
};

describe("ProjectSummaryCardsSection", () => {
    it("renders both child cards", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="FY 2025"
                summary={testSummary}
            />
        );
        expect(screen.getByTestId("project-count-summary-card")).toBeInTheDocument();
        expect(screen.getByTestId("project-type-summary-card")).toBeInTheDocument();
    });

    it("passes correct title to count card for a fiscal year", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="FY 2025"
                summary={testSummary}
            />
        );
        expect(screen.getByTestId("count-card-title")).toHaveTextContent("FY 2025 Projects");
    });

    it("passes correct title to type card for a fiscal year", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="FY 2025"
                summary={testSummary}
            />
        );
        expect(screen.getByTestId("type-card-title")).toHaveTextContent("FY 2025 Projects by Type");
    });

    it("passes correct titles when fiscalYear is 'All FYs'", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="All FYs"
                summary={testSummary}
            />
        );
        expect(screen.getByTestId("count-card-title")).toHaveTextContent("All FYs Projects");
        expect(screen.getByTestId("type-card-title")).toHaveTextContent("All FYs Projects by Type");
    });

    it("passes summary data to both child cards", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="FY 2025"
                summary={testSummary}
            />
        );
        expect(screen.getByTestId("count-card-total")).toHaveTextContent("15");
        expect(screen.getByTestId("type-card-research-amount")).toHaveTextContent("7000000");
    });

    it("handles null summary gracefully", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="FY 2025"
                summary={null}
            />
        );
        expect(screen.getByTestId("count-card-total")).toHaveTextContent("0");
    });

    it("handles undefined summary gracefully", () => {
        render(<ProjectSummaryCardsSection fiscalYear="FY 2025" />);
        expect(screen.getByTestId("count-card-total")).toHaveTextContent("0");
    });
});
