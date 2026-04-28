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

    it("keeps Project Details and Project Funding tabs enabled", () => {
        renderComponent();

        expect(screen.getByRole("button", { name: "Project Details" })).not.toBeDisabled();
        expect(screen.getByRole("button", { name: "Project Funding" })).not.toBeDisabled();
    });

    it("keeps all tabs enabled", () => {
        renderComponent();

        expect(screen.getByRole("button", { name: "Project Details" })).not.toBeDisabled();
        expect(screen.getByRole("button", { name: "Project Funding" })).not.toBeDisabled();
        expect(screen.getByRole("button", { name: "Project Spending" })).not.toBeDisabled();
    });

    it("navigates to the funding route when Project Funding tab is clicked", () => {
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: "Project Funding" }));

        expect(mockNavigate).toHaveBeenCalledWith("/projects/1000/funding");
    });

    it("navigates to the spending route when Project Spending tab is clicked", () => {
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: "Project Spending" }));

        expect(mockNavigate).toHaveBeenCalledWith("/projects/1000/spending");
    });

    it("renders no Coming Soon tooltips", () => {
        renderComponent();

        expect(screen.queryAllByRole("tooltip", { hidden: true })).toHaveLength(0);
    });
});
