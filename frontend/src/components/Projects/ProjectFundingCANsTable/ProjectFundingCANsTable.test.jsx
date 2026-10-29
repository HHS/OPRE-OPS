import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getProbedTrail, renderWithProviders } from "../../../test-utils";
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
    const renderComponent = (cans = mockCANs, fiscalYear = 2025) =>
        renderWithProviders(
            <ProjectFundingCANsTable
                cans={cans}
                fiscalYear={fiscalYear}
            />
        );

    it("renders the table with correct column headers for the selected FY", () => {
        renderComponent();
        expect(screen.getByText("CAN")).toBeInTheDocument();
        expect(screen.getByText("Portfolio")).toBeInTheDocument();
        expect(screen.getByText("Active Period")).toBeInTheDocument();
        expect(screen.getByText("FY 25 Project Funding")).toBeInTheDocument();
        expect(screen.getByText("Lifetime Project Funding")).toBeInTheDocument();
    });

    it("updates the FY column header when fiscal year changes", () => {
        const { rerender } = renderComponent();
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

    it("renders each CAN number as a link to its detail page, on the project's selected FY", () => {
        renderComponent();
        const link = screen.getByRole("link", { name: "G99MVT3" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/cans/515?fy=2025");
    });

    it("renders a link for every CAN row", () => {
        renderComponent();
        expect(screen.getByRole("link", { name: "G99MVT3" })).toHaveAttribute("href", "/cans/515?fy=2025");
        expect(screen.getByRole("link", { name: "G994426" })).toHaveAttribute("href", "/cans/504?fy=2025");
        expect(screen.getByRole("link", { name: "G99XXX3" })).toHaveAttribute("href", "/cans/509?fy=2025");
    });

    it("renders portfolio name for each row", () => {
        renderComponent();
        expect(screen.getByText("Child Care Research")).toBeInTheDocument();
        expect(screen.getByText("Head Start Research")).toBeInTheDocument();
    });

    it("formats active_period as '5 Years', '1 Year', and 'TBD' for null", () => {
        renderComponent();
        expect(screen.getByText("5 Years")).toBeInTheDocument();
        expect(screen.getByText("1 Year")).toBeInTheDocument();
        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("renders the empty state when cans is empty", () => {
        renderComponent([]);
        expect(screen.getByTestId("project-funding-cans-empty")).toBeInTheDocument();
        expect(screen.getByText("No CANs found for this project.")).toBeInTheDocument();
        expect(screen.queryByTestId("project-funding-cans-table")).not.toBeInTheDocument();
    });

    it("renders $0 for zero fy_funding", () => {
        renderComponent([mockCANs[1]]);
        expect(screen.getAllByText("$0").length).toBeGreaterThan(0);
    });

    it("passes the provided ancestry as the breadcrumb trail when a CAN link is clicked", async () => {
        const ancestry = [
            { label: "Projects", to: "/projects" },
            { label: "Project X", to: "/projects/7" }
        ];
        renderWithProviders(
            <ProjectFundingCANsTable
                cans={mockCANs}
                fiscalYear={2025}
                ancestry={ancestry}
            />,
            { withLocationProbe: true }
        );

        await userEvent.click(screen.getByRole("link", { name: "G99MVT3" }));

        expect(getProbedTrail()).toEqual({ targetPath: "/cans/515?fy=2025", ancestors: ancestry });
    });
});
