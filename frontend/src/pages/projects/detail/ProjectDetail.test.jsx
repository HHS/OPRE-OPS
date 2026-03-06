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

    const renderComponent = (id = "10") =>
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

    it("renders the project title and debug data on success", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({
            data: {
                id: 10,
                title: "Child Welfare Research Project",
                short_title: "CWRP",
                description: "A project focused on child welfare outcomes.",
                project_type: "RESEARCH",
                origination_date: "2020-06-15"
            },
            isLoading: false,
            error: undefined
        });

        renderComponent();

        expect(screen.getByText("Child Welfare Research Project")).toBeInTheDocument();
        expect(screen.getByText("CWRP")).toBeInTheDocument();
    });

    it("navigates to the error page when the query fails", async () => {
        mockUseGetProjectByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: { status: 404, data: "Not Found" }
        });

        renderComponent();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });
});
