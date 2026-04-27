import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProjectDetailTabs from "./ProjectDetailTabs";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: "/projects/1000" })
    };
});

describe("ProjectDetailTabs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () =>
        render(
            <MemoryRouter initialEntries={["/projects/1000"]}>
                <ProjectDetailTabs projectId={1000} />
            </MemoryRouter>
        );

    it("renders all project detail tabs", () => {
        renderComponent();

        expect(screen.getByRole("button", { name: "Project Details" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Project Spending" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Project Funding" })).toBeInTheDocument();
    });

    it("keeps Project Details enabled and navigates when clicked", () => {
        renderComponent();

        const detailsTab = screen.getByRole("button", { name: "Project Details" });
        expect(detailsTab).not.toBeDisabled();

        fireEvent.click(detailsTab);

        expect(mockNavigate).toHaveBeenCalledWith("/projects/1000");
    });

    it("disables only the Project Funding tab", () => {
        renderComponent();

        expect(screen.getByRole("button", { name: "Project Spending" })).not.toBeDisabled();
        expect(screen.getByRole("button", { name: "Project Funding" })).toBeDisabled();
    });

    it("renders coming soon tooltip only for Project Funding tab", () => {
        renderComponent();

        const fundingTab = screen.getByRole("button", { name: "Project Funding" });
        const spendingTab = screen.getByRole("button", { name: "Project Spending" });

        // Only one tab is still disabled/tooltipped
        const tooltips = screen.getAllByRole("tooltip", { hidden: true });
        expect(tooltips).toHaveLength(1);
        expect(tooltips[0]).toHaveTextContent("Coming Soon");

        expect(fundingTab).toHaveAttribute("data-position", "top");
        expect(spendingTab).not.toHaveAttribute("data-position", "top");
    });
});
