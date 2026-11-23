import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProjectCountSummaryCard from "./ProjectCountSummaryCard";

const testSummary = {
    total_projects: 18,
    projects_by_type: {
        RESEARCH: 13,
        ADMINISTRATIVE: 2,
        TECHNICAL_ASSISTANCE: 3
    },
    amounts_by_type: {
        RESEARCH: { amount: 3557011799.2, percent: 100 },
        ADMINISTRATIVE: { amount: 301500, percent: 0 }
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
        expect(screen.getByText("18")).toBeInTheDocument();
    });

    it("renders a tag for each project type with count and label", () => {
        render(
            <ProjectCountSummaryCard
                title="FY 2025 Projects"
                summary={testSummary}
            />
        );
        expect(screen.getByText("13 Research")).toBeInTheDocument();
        expect(screen.getByText("2 Administrative")).toBeInTheDocument();
        expect(screen.getByText("3 Technical Assistance")).toBeInTheDocument();
    });

    it("renders tags in Research, Administrative, Technical Assistance order", () => {
        // keys deliberately reversed so the order comes from PROJECT_TYPE_ORDER, not object insertion order
        const { container } = render(
            <ProjectCountSummaryCard
                title="FY 2025 Projects"
                summary={{
                    ...testSummary,
                    projects_by_type: { TECHNICAL_ASSISTANCE: 3, ADMINISTRATIVE: 2, RESEARCH: 13 }
                }}
            />
        );
        const allText = container.textContent;
        const researchIndex = allText.indexOf("13 Research");
        const adminIndex = allText.indexOf("2 Administrative");
        const technicalAssistanceIndex = allText.indexOf("3 Technical Assistance");
        expect(researchIndex).toBeLessThan(adminIndex);
        expect(adminIndex).toBeLessThan(technicalAssistanceIndex);
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
        expect(screen.queryByText(/Administrative/)).not.toBeInTheDocument();
    });
});
