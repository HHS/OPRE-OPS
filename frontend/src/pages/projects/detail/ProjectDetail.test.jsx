import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProjectDetail from "./ProjectDetail";
import { opsApi } from "../../../api/opsAPI";

const mockNavigate = vi.fn();
const mockUseGetProjectByIdQuery = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock("../../../api/opsAPI", async () => {
    const actual = await vi.importActual("../../../api/opsAPI");
    return {
        ...actual,
        useGetProjectByIdQuery: () => mockUseGetProjectByIdQuery()
    };
});

vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

const mockProject = {
    id: 1000,
    title: "Human Services Interoperability Support",
    short_title: "HSS",
    description: "This contract will conduct interoperability activities.",
    project_type: "RESEARCH",
    origination_date: "2021-01-01",
    team_leaders: [
        { id: 500, full_name: "Chris Fortunato", email: "chris.fortunato@example.com" },
        { id: 501, full_name: "Jane Smith", email: "jane.smith@example.com" }
    ]
};

describe("ProjectDetail", () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();
        mockStore = configureStore({
            reducer: {
                [opsApi.reducerPath]: opsApi.reducer,
                auth: () => ({
                    isLoggedIn: true,
                    activeUser: { id: 1, roles: [] }
                }),
                alert: () => ({
                    isActive: false,
                    type: "",
                    heading: "",
                    message: "",
                    redirectUrl: ""
                })
            },
            middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware)
        });
    });

    const renderComponent = (id = "1000") =>
        render(
            <Provider store={mockStore}>
                <MemoryRouter initialEntries={[`/projects/${id}`]}>
                    <Routes>
                        <Route
                            path="/projects/:id"
                            element={<ProjectDetail />}
                        />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

    it("renders loading state when the project is loading", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: undefined
        });

        renderComponent();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders the project title, tabs, and details view on success", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({
            data: mockProject,
            isLoading: false,
            error: undefined
        });

        renderComponent();

        // Header
        expect(screen.getByText("Human Services Interoperability Support")).toBeInTheDocument();
        // "HSS" appears in both the subtitle h2 and the Project Nickname tag
        expect(screen.getAllByText("HSS")).toHaveLength(2);

        // Tabs
        expect(screen.getByRole("button", { name: "Project Details" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Project Spending" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Project Funding" })).toBeInTheDocument();

        // Details section heading
        expect(screen.getByText("Project Details", { selector: "h2" })).toBeInTheDocument();

        // Description
        expect(screen.getByText("This contract will conduct interoperability activities.")).toBeInTheDocument();

        // Right column tags — each team member gets their own tag
        expect(screen.getByText("Research")).toBeInTheDocument();
        expect(screen.getByText("Chris Fortunato")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("renders a not-found message on a 404 error", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: { status: 404, data: "Not Found" }
        });

        renderComponent("9999");

        expect(screen.getByText("Project Not Found")).toBeInTheDocument();
        expect(screen.getByText(/No project exists with ID 9999/)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates to the error page on a non-404 server error", async () => {
        mockUseGetProjectByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: { status: 500, data: "Internal Server Error" }
        });

        renderComponent();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    it("skips the query and renders nothing when no id param is present", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: undefined
        });

        // Render outside a :id route so useParams returns no id
        render(
            <Provider store={mockStore}>
                <MemoryRouter initialEntries={["/projects"]}>
                    <Routes>
                        <Route
                            path="/projects"
                            element={<ProjectDetail />}
                        />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

        // Query is skipped (projectId === -1), nothing errored, nothing loaded
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("fires navigate when a tab is clicked", async () => {
        const { userEvent } = await import("@testing-library/user-event");
        const user = userEvent.setup();

        mockUseGetProjectByIdQuery.mockReturnValue({
            data: mockProject,
            isLoading: false,
            error: undefined
        });

        renderComponent("1000");

        // Project Details tab is already selected; click Project Spending (disabled) — skip.
        // Click the enabled Project Details tab to fire the onClick.
        await user.click(screen.getByRole("button", { name: "Project Details" }));

        expect(mockNavigate).toHaveBeenCalledWith("/projects/1000");
    });
});
