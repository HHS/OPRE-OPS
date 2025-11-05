import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import {
    useGetAgreementsQuery,
    useLazyGetUserQuery,
    useLazyGetAgreementByIdQuery,
    useLazyGetAgreementsQuery,
    useGetChangeRequestsListQuery
} from "../../../api/opsAPI";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import store from "../../../store";
import AgreementsList from "./AgreementsList";

// Mock the API hooks
vi.mock("../../../api/opsAPI");

// Mock the table hooks
vi.mock("../../../components/UI/Table/Table.hooks");

// Mock the App component to avoid router complexity
vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-mock">{children}</div>
}));

// Mock complex child components to avoid cascading API dependencies
vi.mock("../../../components/Agreements/AgreementsTable", () => ({
    default: ({ agreements }) => (
        <div data-testid="agreements-table">
            {agreements && agreements.map((agreement) => <div key={agreement.id}>{agreement.name}</div>)}
        </div>
    )
}));

vi.mock("./AgreementsTabs", () => ({
    default: () => <div data-testid="agreement-tabs">All Agreements</div>
}));

vi.mock("./AgreementsFilterButton/AgreementsFilterButton", () => ({
    default: () => <button data-testid="filter-button">Filter</button>
}));

vi.mock("./AgreementsFilterTags/AgreementsFilterTags", () => ({
    default: () => <div data-testid="filter-tags">Filter Tags</div>
}));

vi.mock("../../../components/UI/PaginationNav/PaginationNav", () => ({
    default: ({ currentPage, totalPages }) => (
        <nav data-testid="pagination-nav">
            Page {currentPage} of {totalPages}
        </nav>
    )
}));

// Mock react-router-dom
vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
        useNavigate: vi.fn(() => vi.fn())
    };
});

// Mock data for agreements
const mockAgreementsResponse = {
    agreements: [
        {
            id: 1,
            name: "Agreement 1",
            agreement_type: "CONTRACT",
            project: { id: 1000, title: "Project 1" },
            product_service_code: { name: "PSC 1" },
            agreement_reason: "NEW_REQ",
            project_officer_id: 500,
            team_members: [{ id: 500 }],
            budget_line_items: [
                {
                    id: 1,
                    line_description: "SC1",
                    can: { id: 1, number: "G99PHS9" },
                    date_needed: "2043-06-13",
                    amount: 1000000,
                    status: "PLANNED",
                    proc_shop_fee_percentage: 0.005
                }
            ]
        },
        {
            id: 2,
            name: "Agreement 2",
            agreement_type: "GRANT",
            project: { id: 1000, title: "Project 1" },
            product_service_code: { name: "PSC 2" },
            agreement_reason: "RECOMPETE",
            project_officer_id: 500,
            team_members: [{ id: 500 }],
            budget_line_items: []
        }
    ],
    count: 50,
    limit: 10,
    offset: 0
};

// Setup for react-modal
beforeAll(() => {
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
});

afterEach(() => {
    // Clean up any modals
    document.body.innerHTML = "";
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
});

describe("AgreementsList - Pagination", () => {
    beforeEach(() => {
        // Mock the lazy query hooks
        useLazyGetUserQuery.mockReturnValue([vi.fn(), {}]);
        useLazyGetAgreementByIdQuery.mockReturnValue([vi.fn(), {}]);
        useLazyGetAgreementsQuery.mockReturnValue([vi.fn(), {}]);

        // Mock the change requests query (used by AgreementTabs)
        useGetChangeRequestsListQuery.mockReturnValue({
            data: [],
            error: undefined,
            isLoading: false
        });

        // Mock the sort conditions hook
        useSetSortConditions.mockReturnValue({
            sortDescending: false,
            sortCondition: null,
            setSortConditions: vi.fn()
        });
    });

    describe("Initial State", () => {
        it("should render loading state initially", () => {
            useGetAgreementsQuery.mockReturnValue({
                data: undefined,
                error: undefined,
                isLoading: true
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            expect(screen.getByText("Loading...")).toBeInTheDocument();
        });

        it("should display agreements when data is loaded", async () => {
            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                expect(screen.getByTestId("agreement-tabs")).toBeInTheDocument();
            });
        });
    });

    describe("Data Extraction from Wrapped Response", () => {
        it("should extract agreements array from wrapped response", async () => {
            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                expect(screen.getByText("Agreement 1")).toBeInTheDocument();
            });

            await waitFor(() => {
                expect(screen.getByText("Agreement 2")).toBeInTheDocument();
            })
        });

        it("should handle empty agreements array", async () => {
            const emptyResponse = {
                agreements: [],
                count: 0,
                limit: 10,
                offset: 0
            };

            useGetAgreementsQuery.mockReturnValue({
                data: emptyResponse,
                error: undefined,
                isLoading: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                expect(screen.getByTestId("agreement-tabs")).toBeInTheDocument();
            });

            // Should not crash with empty array
            expect(screen.queryByText("Agreement 1")).not.toBeInTheDocument();
        });
    });

    describe("Pagination Display", () => {
        it("should display pagination when total pages > 1", async () => {
            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse, // count: 50, limit: 10 = 5 pages
                error: undefined,
                isLoading: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                // Pagination component should be rendered
                const paginationNav = screen.queryByRole("navigation");
                expect(paginationNav).toBeInTheDocument();
            });
        });

        it("should not display pagination when total pages = 1", async () => {
            const singlePageResponse = {
                agreements: mockAgreementsResponse.agreements.slice(0, 1),
                count: 5,
                limit: 10,
                offset: 0
            };

            useGetAgreementsQuery.mockReturnValue({
                data: singlePageResponse,
                error: undefined,
                isLoading: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                expect(screen.getByTestId("agreement-tabs")).toBeInTheDocument();
            });

            // Pagination should not be rendered (totalPages = 1)
            const paginationNav = screen.queryByTestId("pagination-nav");
            expect(paginationNav).not.toBeInTheDocument();
        });
    });

    describe("Export Functionality", () => {
        it("should display export button when agreements exist", async () => {
            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                const exportButton = screen.getByText("Export");
                expect(exportButton).toBeInTheDocument();
            });
        });

        it("should not display export button when no agreements", async () => {
            const emptyResponse = {
                agreements: [],
                count: 0,
                limit: 10,
                offset: 0
            };

            useGetAgreementsQuery.mockReturnValue({
                data: emptyResponse,
                error: undefined,
                isLoading: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                expect(screen.getByTestId("agreement-tabs")).toBeInTheDocument();
            });

            const exportButton = screen.queryByText("Export");
            expect(exportButton).not.toBeInTheDocument();
        });
    });

    describe("Response Format Compatibility", () => {
        it("should handle wrapped response with count metadata", async () => {
            const wrappedResponse = {
                agreements: mockAgreementsResponse.agreements,
                count: 100,
                limit: 10,
                offset: 20
            };

            useGetAgreementsQuery.mockReturnValue({
                data: wrappedResponse,
                error: undefined,
                isLoading: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                expect(screen.getByText("Agreement 1")).toBeInTheDocument();
            });

            await waitFor(() => {
                // Component should render pagination (totalPages = 100/10 = 10)
                const paginationNav = screen.queryByRole("navigation");
                expect(paginationNav).toBeInTheDocument();
            });
        });
    });
});
