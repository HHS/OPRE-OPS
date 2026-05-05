import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProjectFilterTags from "./ProjectFilterTags";

describe("ProjectFilterTags", () => {
    const mockSetFilters = vi.fn();

    const mockFilters = {
        fiscalYear: [],
        portfolio: [],
        projectSearch: [],
        agreementSearch: [],
        projectType: []
    };

    beforeEach(() => {
        mockSetFilters.mockClear();
    });

    it("should not render when no filters are active", () => {
        render(
            <ProjectFilterTags
                filters={mockFilters}
                setFilters={mockSetFilters}
            />
        );

        // Should render nothing when no filters are active
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render fiscal year filter tags", () => {
        const filtersWithFY = {
            ...mockFilters,
            fiscalYear: [
                { id: 2023, title: "FY 2023" },
                { id: 2024, title: "FY 2024" }
            ]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithFY}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("FY 2023")).toBeInTheDocument();
        expect(screen.getByText("FY 2024")).toBeInTheDocument();
    });

    it("should render portfolio filter tags", () => {
        const filtersWithPortfolio = {
            ...mockFilters,
            portfolio: [
                { id: 1, name: "Portfolio A" },
                { id: 2, name: "Portfolio B" }
            ]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithPortfolio}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("Portfolio A")).toBeInTheDocument();
        expect(screen.getByText("Portfolio B")).toBeInTheDocument();
    });

    it("should render project search filter tags", () => {
        const filtersWithProjects = {
            ...mockFilters,
            projectSearch: [{ title: "Project Alpha" }, { title: "Project Beta" }]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithProjects}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("Project Alpha")).toBeInTheDocument();
        expect(screen.getByText("Project Beta")).toBeInTheDocument();
    });

    it("should render agreement search filter tags", () => {
        const filtersWithAgreements = {
            ...mockFilters,
            agreementSearch: [{ title: "Agreement 1" }, { title: "Agreement 2" }]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithAgreements}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("Agreement 1")).toBeInTheDocument();
        expect(screen.getByText("Agreement 2")).toBeInTheDocument();
    });

    it("should render project type filter tags", () => {
        const filtersWithTypes = {
            ...mockFilters,
            projectType: [{ title: "RESEARCH" }, { title: "ADMINISTRATIVE_AND_SUPPORT" }]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithTypes}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("RESEARCH")).toBeInTheDocument();
        expect(screen.getByText("ADMINISTRATIVE_AND_SUPPORT")).toBeInTheDocument();
    });

    it("should render all filter types together", () => {
        const allFilters = {
            fiscalYear: [{ id: 2023, title: "FY 2023" }],
            portfolio: [{ id: 1, name: "Portfolio A" }],
            projectSearch: [{ title: "Project Alpha" }],
            agreementSearch: [{ title: "Agreement 1" }],
            projectType: [{ title: "RESEARCH" }]
        };

        render(
            <ProjectFilterTags
                filters={allFilters}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("FY 2023")).toBeInTheDocument();
        expect(screen.getByText("Portfolio A")).toBeInTheDocument();
        expect(screen.getByText("Project Alpha")).toBeInTheDocument();
        expect(screen.getByText("Agreement 1")).toBeInTheDocument();
        expect(screen.getByText("RESEARCH")).toBeInTheDocument();
    });

    it("should remove fiscal year filter when tag is clicked", async () => {
        const user = userEvent.setup();
        const filtersWithFY = {
            ...mockFilters,
            fiscalYear: [
                { id: 2023, title: "FY 2023" },
                { id: 2024, title: "FY 2024" }
            ]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithFY}
                setFilters={mockSetFilters}
            />
        );

        const fy2023Icon = screen.getByLabelText("Remove FY 2023 filter");
        await user.click(fy2023Icon);

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should remove portfolio filter when tag is clicked", async () => {
        const user = userEvent.setup();
        const filtersWithPortfolio = {
            ...mockFilters,
            portfolio: [
                { id: 1, name: "Portfolio A" },
                { id: 2, name: "Portfolio B" }
            ]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithPortfolio}
                setFilters={mockSetFilters}
            />
        );

        const portfolioAIcon = screen.getByLabelText("Remove Portfolio A filter");
        await user.click(portfolioAIcon);

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should remove project search filter when tag is clicked", async () => {
        const user = userEvent.setup();
        const filtersWithProjects = {
            ...mockFilters,
            projectSearch: [{ title: "Project Alpha" }]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithProjects}
                setFilters={mockSetFilters}
            />
        );

        const projectIcon = screen.getByLabelText("Remove Project Alpha filter");
        await user.click(projectIcon);

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should remove agreement search filter when tag is clicked", async () => {
        const user = userEvent.setup();
        const filtersWithAgreements = {
            ...mockFilters,
            agreementSearch: [{ title: "Agreement 1" }]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithAgreements}
                setFilters={mockSetFilters}
            />
        );

        const agreementIcon = screen.getByLabelText("Remove Agreement 1 filter");
        await user.click(agreementIcon);

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should remove project type filter when tag is clicked", async () => {
        const user = userEvent.setup();
        const filtersWithTypes = {
            ...mockFilters,
            projectType: [{ title: "RESEARCH" }]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithTypes}
                setFilters={mockSetFilters}
            />
        );

        const typeIcon = screen.getByLabelText("Remove RESEARCH filter");
        await user.click(typeIcon);

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should handle multiple tags of same filter type", () => {
        const filtersWithMultiple = {
            ...mockFilters,
            fiscalYear: [
                { id: 2023, title: "FY 2023" },
                { id: 2024, title: "FY 2024" },
                { id: 2025, title: "FY 2025" }
            ]
        };

        render(
            <ProjectFilterTags
                filters={filtersWithMultiple}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("FY 2023")).toBeInTheDocument();
        expect(screen.getByText("FY 2024")).toBeInTheDocument();
        expect(screen.getByText("FY 2025")).toBeInTheDocument();
    });

    it("should handle empty arrays for all filter types", () => {
        render(
            <ProjectFilterTags
                filters={mockFilters}
                setFilters={mockSetFilters}
            />
        );

        // Should not render any tags
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
