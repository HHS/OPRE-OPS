import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProjectCountSummaryCard from "./ProjectCountSummaryCard";

const testSummary = {
    total_projects: 15,
    projects_by_type: {
        RESEARCH: 13,
        ADMINISTRATIVE_AND_SUPPORT: 2
    },
    amounts_by_type: {
        RESEARCH: { amount: 3557011799.2, percent: 100 },
        ADMINISTRATIVE_AND_SUPPORT: { amount: 301500, percent: 0 }
    }
};

describe("ProjectCountSummaryCard", () => {
    it("renders the title", () => {
        render(
            <ProjectCountSummaryCard
                title="FY 2025 Projects"
                summary={testSummary}
            />
        );
        expect(screen.getByText("FY 2025 Projects")).toBeInTheDocument();
    });

    it("renders the total project count", () => {
        render(
            <ProjectCountSummaryCard
                title="FY 2025 Projects"
                summary={testSummary}
            />
        );
        expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("renders a tag for each project type with count and label", () => {
        render(
            <ProjectCountSummaryCard
                title="FY 2025 Projects"
                summary={testSummary}
            />
        );
        expect(screen.getByText("13 Research")).toBeInTheDocument();
        expect(screen.getByText("2 Admin & Support")).toBeInTheDocument();
    });

    it("renders Research tag before Admin & Support tag", () => {
        const { container } = render(
            <ProjectCountSummaryCard
                title="FY 2025 Projects"
                summary={testSummary}
            />
        );
        const allText = container.textContent;
        const researchIndex = allText.indexOf("13 Research");
        const adminIndex = allText.indexOf("2 Admin & Support");
        expect(researchIndex).toBeLessThan(adminIndex);
    });

    it("handles null summary gracefully", () => {
        render(
            <ProjectCountSummaryCard
                title="FY 2025 Projects"
                summary={null}
            />
        );
        expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles undefined summary gracefully", () => {
        render(<ProjectCountSummaryCard title="FY 2025 Projects" />);
        expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("only renders tags for types present in projects_by_type", () => {
        render(
            <ProjectCountSummaryCard
                title="FY 2025 Projects"
                summary={{ total_projects: 13, projects_by_type: { RESEARCH: 13 } }}
            />
        );
        expect(screen.getByText("13 Research")).toBeInTheDocument();
        expect(screen.queryByText(/Admin & Support/)).not.toBeInTheDocument();
    });
});
