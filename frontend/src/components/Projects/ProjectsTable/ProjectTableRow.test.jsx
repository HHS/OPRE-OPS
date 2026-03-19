import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProjectTableRow from "./ProjectTableRow";

const MOCK_PROJECT = {
    id: 10,
    title: "Project Alpha",
    project_type: "RESEARCH",
    start_date: "2021-06-13",
    end_date: "2025-09-30",
    fiscal_year_totals: { 2026: "500000.00", 2025: "300000.00" },
    project_total: "800000.00",
    agreement_name_list: [
        { id: 1, name: "Agreement Nickname" },
        { id: 2, name: "Using Innovative Data to Explore Something Longer" }
    ]
};

const MOCK_PROJECT_NO_AGREEMENTS = {
    id: 11,
    title: "Support Beta",
    project_type: "ADMINISTRATIVE_AND_SUPPORT",
    start_date: null,
    end_date: null,
    fiscal_year_totals: {},
    project_total: "0",
    agreement_name_list: []
};

const renderRow = (project = MOCK_PROJECT, selectedFiscalYear = "2026") =>
    render(
        <MemoryRouter>
            <table>
                <tbody>
                    <ProjectTableRow
                        project={project}
                        selectedFiscalYear={selectedFiscalYear}
                    />
                </tbody>
            </table>
        </MemoryRouter>
    );

describe("ProjectTableRow", () => {
    it("renders the project title as a link", () => {
        renderRow();
        const link = screen.getByRole("link", { name: "Project Alpha" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/projects/10");
    });

    it("renders the project title link with text-ink text-no-underline classes", () => {
        renderRow();
        const link = screen.getByRole("link", { name: "Project Alpha" });
        expect(link).toHaveClass("text-ink", "text-no-underline");
    });

    it("renders the project type as a human-readable label", () => {
        renderRow();
        expect(screen.getByText("Research")).toBeInTheDocument();
    });

    it("renders formatted start and end dates", () => {
        renderRow();
        expect(screen.getByText("6/13/2021")).toBeInTheDocument();
        expect(screen.getByText("9/30/2025")).toBeInTheDocument();
    });

    it("renders TBD for null dates", () => {
        renderRow(MOCK_PROJECT_NO_AGREEMENTS);
        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(2);
    });

    it("renders the FY total as currency for the selected fiscal year", () => {
        renderRow(MOCK_PROJECT, "2026");
        expect(screen.getByText("$500,000.00")).toBeInTheDocument();
    });

    it("renders the project total as currency", () => {
        renderRow();
        expect(screen.getByText("$800,000.00")).toBeInTheDocument();
    });

    it("renders a chevron expand button", () => {
        renderRow();
        expect(screen.getByTestId("expand-row")).toBeInTheDocument();
    });

    it("does not show expanded data by default", () => {
        renderRow();
        expect(screen.queryByTestId("expanded-data")).not.toBeInTheDocument();
    });

    it("shows expanded data when chevron is clicked", async () => {
        const user = userEvent.setup();
        renderRow();

        await user.click(screen.getByTestId("expand-row"));

        expect(screen.getByTestId("expanded-data")).toBeInTheDocument();
    });

    it("shows the total agreements count in the expanded row", async () => {
        const user = userEvent.setup();
        renderRow();

        await user.click(screen.getByTestId("expand-row"));

        expect(screen.getByTestId("agreement-count")).toHaveTextContent("2");
    });

    it("renders agreement tags as links to the agreement detail page", async () => {
        const user = userEvent.setup();
        renderRow();

        await user.click(screen.getByTestId("expand-row"));

        const tags = screen.getAllByTestId("agreement-tag");
        expect(tags).toHaveLength(2);
        expect(tags[0]).toHaveAttribute("href", "/agreements/1");
        expect(tags[1]).toHaveAttribute("href", "/agreements/2");
    });

    it("renders short agreement names without truncation", async () => {
        const user = userEvent.setup();
        renderRow();

        await user.click(screen.getByTestId("expand-row"));

        expect(screen.getByText("Agreement Nickname")).toBeInTheDocument();
    });

    it("truncates long agreement names with ellipsis", async () => {
        const user = userEvent.setup();
        renderRow();

        await user.click(screen.getByTestId("expand-row"));

        // "Using Innovative Data to Explore Something Longer" sliced at 25 chars
        // → "Using Innovative Data to " + "..."
        expect(screen.getByText("Using Innovative Data to ...")).toBeInTheDocument();
    });

    it("shows the full agreement name in the title attribute for truncated names", async () => {
        const user = userEvent.setup();
        renderRow();

        await user.click(screen.getByTestId("expand-row"));

        const truncatedTag = screen.getByText("Using Innovative Data to ...");
        expect(truncatedTag).toHaveAttribute("title", "Using Innovative Data to Explore Something Longer");
    });

    it("shows TBD in expanded row when agreement list is empty", async () => {
        const user = userEvent.setup();
        renderRow(MOCK_PROJECT_NO_AGREEMENTS);

        await user.click(screen.getByTestId("expand-row"));

        expect(screen.getByTestId("agreement-count")).toHaveTextContent("0");
        // TBD placeholder rendered for no agreements
        const expandedRow = screen.getByTestId("expanded-data");
        expect(within(expandedRow).getByText("TBD")).toBeInTheDocument();
    });

    it("collapses expanded row when chevron is clicked again", async () => {
        const user = userEvent.setup();
        renderRow();

        await user.click(screen.getByTestId("expand-row"));
        expect(screen.getByTestId("expanded-data")).toBeInTheDocument();

        await user.click(screen.getByTestId("expand-row"));
        expect(screen.queryByTestId("expanded-data")).not.toBeInTheDocument();
    });

    it("renders the testid on the main row", () => {
        renderRow();
        expect(screen.getByTestId("project-table-row-10")).toBeInTheDocument();
    });
});
