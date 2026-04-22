import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProjectFunding from "./ProjectFunding";
import { opsApi } from "../../../api/opsAPI";

const mockNavigate = vi.fn();
const mockUseGetProjectByIdQuery = vi.fn();
const mockUseGetProjectFundingByIdQuery = vi.fn();

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
        useGetProjectByIdQuery: () => mockUseGetProjectByIdQuery(),
        useGetProjectFundingByIdQuery: () => mockUseGetProjectFundingByIdQuery(),
        useGetPortfoliosQuery: () => ({ data: [], isLoading: false, error: undefined })
    };
});

vi.mock("../../../components/Projects/ProjectFundingByPortfolioCard/ProjectFundingByPortfolioCard", () => ({
    default: () => <div data-testid="project-funding-by-portfolio-card" />
}));

vi.mock("../../../components/Projects/ProjectFundingByCANCard/ProjectFundingByCANCard", () => ({
    default: () => <div data-testid="project-funding-by-can-card" />
}));

vi.mock("../../../components/Projects/ProjectFundingByFYCard/ProjectFundingByFYCard", () => ({
    default: () => <div data-testid="project-funding-by-fy-card" />
}));

vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

vi.mock("../../../components/DebugCode", () => ({
    default: ({ data }) => <pre data-testid="debug-code">{JSON.stringify(data)}</pre>
}));

const mockProject = {
    id: 1000,
    title: "Human Services Interoperability Support",
    short_title: "HSS",
    project_type: "RESEARCH"
};

const mockFundingData = {
    funding_by_portfolio: [
        { portfolio_id: 1, portfolio: "Child Care", amount: 1000000.0 },
        { portfolio_id: 2, portfolio: "Child Welfare", amount: 250000.0 }
    ],
    funding_by_can: {
        total: 1250000.0,
        carry_forward_funding: 1000000.0,
        new_funding: 250000.0
    },
    funding_by_fiscal_year: [
        { fiscal_year: 2024, amount: 2000000.0 },
        { fiscal_year: 2025, amount: 1250000.0 }
    ],
    cans: [
        {
            id: 1,
            number: "G99XXX1",
            portfolio_id: 1,
            portfolio: "Child Care",
            active_period: 5,
            fy_funding: 1000000.0,
            lifetime_funding: 3000000.0
        },
        {
            id: 2,
            number: "G99XXX2",
            portfolio_id: 2,
            portfolio: "Child Welfare",
            active_period: 1,
            fy_funding: 250000.0,
            lifetime_funding: 500000.0
        }
    ]
};

describe("ProjectFunding", () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();
        mockStore = configureStore({
            reducer: {
                [opsApi.reducerPath]: opsApi.reducer,
                auth: () => ({ isLoggedIn: true, activeUser: { id: 1, roles: [] } }),
                alert: () => ({ isActive: false, type: "", heading: "", message: "", redirectUrl: "" })
            },
            middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware)
        });
    });

    const renderComponent = (id = "1000") =>
        render(
            <Provider store={mockStore}>
                <MemoryRouter initialEntries={[`/projects/${id}/funding`]}>
                    <Routes>
                        <Route
                            path="/projects/:id/funding"
                            element={<ProjectFunding />}
                        />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

    it("renders loading state when project or funding data is loading", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({ data: undefined, isLoading: true, error: undefined });
        mockUseGetProjectFundingByIdQuery.mockReturnValue({ data: undefined, isLoading: false, error: undefined });

        renderComponent();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders the project title, tabs, FY selector, section headings, and summary cards on success", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({ data: mockProject, isLoading: false, error: undefined });
        mockUseGetProjectFundingByIdQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            error: undefined
        });

        renderComponent();

        expect(screen.getByText("Human Services Interoperability Support")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Project Funding" })).toBeInTheDocument();
        expect(screen.getByLabelText("Fiscal Year")).toBeInTheDocument();
        expect(screen.getByText("Project Funding Summary")).toBeInTheDocument();
        expect(screen.getByText("Project Funding by CAN")).toBeInTheDocument();
        expect(screen.getByTestId("project-funding-by-portfolio-card")).toBeInTheDocument();
        expect(screen.getByTestId("project-funding-by-can-card")).toBeInTheDocument();
        expect(screen.getByTestId("project-funding-by-fy-card")).toBeInTheDocument();
    });

    it("renders DebugCode with funding data in dev mode", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({ data: mockProject, isLoading: false, error: undefined });
        mockUseGetProjectFundingByIdQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            error: undefined
        });

        renderComponent();

        const debugEl = screen.getByTestId("debug-code");
        expect(debugEl).toBeInTheDocument();
        expect(debugEl.textContent).toContain("Child Care");
    });

    it("renders a not-found message on a 404 project error", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: { status: 404, data: "Not Found" }
        });
        mockUseGetProjectFundingByIdQuery.mockReturnValue({ data: undefined, isLoading: false, error: undefined });

        renderComponent("9999");

        expect(screen.getByText("Project Not Found")).toBeInTheDocument();
        expect(screen.getByText(/No project exists with ID 9999/)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates to error page on a non-404 project error", async () => {
        const { waitFor } = await import("@testing-library/react");

        mockUseGetProjectByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: { status: 500, data: "Server Error" }
        });
        mockUseGetProjectFundingByIdQuery.mockReturnValue({ data: undefined, isLoading: false, error: undefined });

        renderComponent();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    it("navigates to error page on a non-404 funding error", async () => {
        const { waitFor } = await import("@testing-library/react");

        mockUseGetProjectByIdQuery.mockReturnValue({ data: mockProject, isLoading: false, error: undefined });
        mockUseGetProjectFundingByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: { status: 500, data: "Server Error" }
        });

        renderComponent();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    it("updates the fiscal year when the FY selector changes", () => {
        mockUseGetProjectByIdQuery.mockReturnValue({ data: mockProject, isLoading: false, error: undefined });
        mockUseGetProjectFundingByIdQuery.mockReturnValue({
            data: mockFundingData,
            isLoading: false,
            error: undefined
        });

        renderComponent();

        const select = screen.getByRole("combobox");
        fireEvent.change(select, { target: { value: "2024" } });

        expect(select.value).toBe("2024");
    });
});
