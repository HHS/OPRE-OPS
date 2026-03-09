import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProjectsList from "./ProjectsList";
import { opsApi } from "../../../api/opsAPI";

const mockNavigate = vi.fn();
const mockUseGetProjectsQuery = vi.fn();

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
        useGetProjectsQuery: () => mockUseGetProjectsQuery()
    };
});

vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

describe("ProjectsList", () => {
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

    const renderComponent = () =>
        render(
            <Provider store={mockStore}>
                <MemoryRouter>
                    <ProjectsList />
                </MemoryRouter>
            </Provider>
        );

    it("renders loading state when projects are loading", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: [],
            isLoading: true,
            isError: false
        });

        renderComponent();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders the projects page with debug data on success", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: [
                {
                    id: 10,
                    title: "Project Alpha",
                    short_title: "ALPHA",
                    description: "Alpha description",
                    project_type: "RESEARCH",
                    origination_date: "2021-01-01"
                }
            ],
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.getByText("Projects")).toBeInTheDocument();
        expect(screen.getByText("All Projects")).toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Project" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Type" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Start" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "End" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "FY Total" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Project Total" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Project Alpha" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Project Alpha" })).toHaveAttribute("href", "/projects/10");
        expect(screen.getByText("Research")).toBeInTheDocument();
        expect(screen.getByText("1/1/2021")).toBeInTheDocument();
        expect(screen.getAllByText("TBD")).toHaveLength(3);
    });

    it("sorts projects when a sortable header is clicked", async () => {
        const user = userEvent.setup();

        mockUseGetProjectsQuery.mockReturnValue({
            data: [
                {
                    id: 10,
                    title: "Project Alpha",
                    short_title: "ALPHA",
                    description: "Alpha description",
                    project_type: "RESEARCH",
                    origination_date: "2021-01-01"
                },
                {
                    id: 11,
                    title: "Support Beta",
                    short_title: "BETA",
                    description: "Beta description",
                    project_type: "ADMINISTRATIVE_AND_SUPPORT",
                    origination_date: "2020-01-01"
                }
            ],
            isLoading: false,
            isError: false
        });

        renderComponent();

        const projectCellsBefore = screen.getAllByRole("cell", { name: /Project Alpha|Support Beta/ });
        expect(projectCellsBefore[0]).toHaveTextContent("Project Alpha");
        expect(projectCellsBefore[1]).toHaveTextContent("Support Beta");

        await user.click(screen.getByRole("button", { name: /Project/i }));

        const projectCellsAfter = screen.getAllByRole("cell", { name: /Project Alpha|Support Beta/ });
        expect(projectCellsAfter[0]).toHaveTextContent("Support Beta");
        expect(projectCellsAfter[1]).toHaveTextContent("Project Alpha");
    });

    it("navigates to the error page when the query fails", async () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: true
        });

        renderComponent();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });
});
