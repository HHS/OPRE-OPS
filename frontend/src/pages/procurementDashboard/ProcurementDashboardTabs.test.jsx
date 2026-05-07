import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProcurementDashboardTabs from "./ProcurementDashboardTabs";

vi.mock("../../components/UI/USWDS/Tooltip", () => ({
    default: ({ children, label }) => (
        <div
            data-testid="tooltip"
            data-label={label}
        >
            {children}
        </div>
    )
}));

vi.mock("../../components/UI/TabsSection", () => ({
    default: ({ links, label }) => <nav aria-label={label}>{links}</nav>
}));

describe("ProcurementDashboardTabs", () => {
    it("renders All Procurement as a link", () => {
        render(
            <MemoryRouter initialEntries={["/procurement-dashboard"]}>
                <ProcurementDashboardTabs />
            </MemoryRouter>
        );
        const link = screen.getByRole("link", { name: "All Procurement" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/procurement-dashboard");
    });

    it("renders disabled tabs with tooltips", () => {
        render(
            <MemoryRouter initialEntries={["/procurement-dashboard"]}>
                <ProcurementDashboardTabs />
            </MemoryRouter>
        );
        const firstAward = screen.getByText("First Award");
        expect(firstAward).toBeDisabled();

        const modifications = screen.getByText("Modifications");
        expect(modifications).toBeDisabled();

        const tooltips = screen.getAllByTestId("tooltip");
        expect(tooltips).toHaveLength(2);
        expect(tooltips[0]).toHaveAttribute("data-label", "Coming soon");
    });

    it("does not render disabled tabs as links", () => {
        render(
            <MemoryRouter initialEntries={["/procurement-dashboard"]}>
                <ProcurementDashboardTabs />
            </MemoryRouter>
        );
        const links = screen.getAllByRole("link");
        // Only "All Procurement" should be a link
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveTextContent("All Procurement");
    });
});
