import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProjectSummaryCardsSection from "./ProjectSummaryCardsSection";

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent", () => ({
    default: () => <div data-testid="donut-chart" />
}));

vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent", () => ({
    default: () => () => null
}));

const testSummary = {
    total_projects: 15,
    projects_by_type: {
        RESEARCH: 13,
        ADMINISTRATIVE: 2
    },
    amounts_by_type: {
        RESEARCH: { amount: 7000000, percent: 70 },
        ADMINISTRATIVE: { amount: 3000000, percent: 30 }
    }
};

describe("ProjectSummaryCardsSection", () => {
    it("titles both cards with the fiscal year", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="FY 2025"
                summary={testSummary}
            />
        );

        expect(screen.getByRole("heading", { name: "FY 2025 Projects" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "FY 2025 Projects by Type" })).toBeInTheDocument();
    });

    it("titles both cards with 'All FYs' when no single year is selected", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="All FYs"
                summary={testSummary}
            />
        );

        expect(screen.getByRole("heading", { name: "All FYs Projects" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "All FYs Projects by Type" })).toBeInTheDocument();
    });

    it("shows the project counts and budget by type from the summary", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="FY 2025"
                summary={testSummary}
            />
        );

        expect(screen.getByText("15")).toBeInTheDocument();
        expect(screen.getByText("13 Research")).toBeInTheDocument();
        expect(screen.getByText("2 Admin & Support")).toBeInTheDocument();
        expect(screen.getByText("$7,000,000.00")).toBeInTheDocument();
        expect(screen.getByText("$3,000,000.00")).toBeInTheDocument();
    });

    it("shows a zero project count when there is no summary", () => {
        render(
            <ProjectSummaryCardsSection
                fiscalYear="FY 2025"
                summary={null}
            />
        );

        expect(screen.getByText("0")).toBeInTheDocument();
        expect(screen.queryByTestId("donut-chart")).not.toBeInTheDocument();
    });
});
