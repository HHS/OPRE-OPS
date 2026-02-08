import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import {
    useGetAgreementsQuery,
    useGetAgreementsFilterOptionsQuery,
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

vi.mock("../../../components/UI/FiscalYear", () => ({
    default: ({ fiscalYear, handleChangeFiscalYear, showAllOption }) => (
        <div data-testid="fiscal-year-select">
            <select
                data-testid="fiscal-year-dropdown"
                value={fiscalYear}
                onChange={(e) => handleChangeFiscalYear(e.target.value)}
            >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                {showAllOption && <option value="All">All</option>}
            </select>
        </div>
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

        // Mock the agreements filter options query
        useGetAgreementsFilterOptionsQuery.mockReturnValue({
            data: {
                fiscal_years: [2023, 2024, 2025],
                portfolios: [],
                project_titles: [],
                agreement_types: [],
                agreement_names: [],
                contract_numbers: [],
                research_types: []
            },
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
            });
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

        it("should fetch agreements in batches when exporting > 50 agreements", async () => {
            // Mock response with 125 total agreements (should require 3 batches of 50)
            const largeDataResponse = {
                agreements: mockAgreementsResponse.agreements,
                count: 125,
                limit: 10,
                offset: 0
            };

            useGetAgreementsQuery.mockReturnValue({
                data: largeDataResponse,
                error: undefined,
                isLoading: false
            });

            const mockGetAllAgreementsTrigger = vi.fn((params) => ({
                unwrap: () =>
                    Promise.resolve({
                        agreements: [
                            {
                                id: params.page * 50 + 1,
                                name: `Agreement ${params.page * 50 + 1}`,
                                project_officer_id: null
                            }
                        ],
                        count: 125,
                        limit: params.limit,
                        offset: params.page * params.limit
                    })
            }));

            const mockAgreementTrigger = vi.fn((id) => ({
                unwrap: () => Promise.resolve({ id, name: `Agreement ${id}`, budget_line_items: [] })
            }));

            const mockUserTrigger = vi.fn(() => ({
                unwrap: () => Promise.resolve({ id: 500, full_name: "Test User" })
            }));

            useLazyGetAgreementsQuery.mockReturnValue([mockGetAllAgreementsTrigger, {}]);
            useLazyGetAgreementByIdQuery.mockReturnValue([mockAgreementTrigger, {}]);
            useLazyGetUserQuery.mockReturnValue([mockUserTrigger, {}]);

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

            const exportButton = screen.getByRole("button", { name: /export/i });
            exportButton.click();

            // Wait for export to trigger
            await waitFor(
                () => {
                    // Should call getAllAgreementsTrigger 3 times (125 / 50 = 3 batches)
                    expect(mockGetAllAgreementsTrigger).toHaveBeenCalledTimes(3);
                },
                { timeout: 5000 }
            );

            // Verify each call uses limit=50 and correct page numbers
            expect(mockGetAllAgreementsTrigger).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    page: 0,
                    limit: 50
                })
            );
            expect(mockGetAllAgreementsTrigger).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    page: 1,
                    limit: 50
                })
            );
            expect(mockGetAllAgreementsTrigger).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    page: 2,
                    limit: 50
                })
            );
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

describe("AgreementsList - Fiscal Year Filtering", () => {
    beforeEach(() => {
        // Mock the lazy query hooks
        useLazyGetUserQuery.mockReturnValue([vi.fn(), {}]);
        useLazyGetAgreementByIdQuery.mockReturnValue([vi.fn(), {}]);
        useLazyGetAgreementsQuery.mockReturnValue([vi.fn(), {}]);

        // Mock the change requests query
        useGetChangeRequestsListQuery.mockReturnValue({
            data: [],
            error: undefined,
            isLoading: false
        });

        // Mock the agreements filter options query with fiscal years
        useGetAgreementsFilterOptionsQuery.mockReturnValue({
            data: {
                fiscal_years: [2023, 2024, 2025],
                portfolios: [],
                project_titles: [],
                agreement_types: [],
                agreement_names: [],
                contract_numbers: [],
                research_types: []
            },
            error: undefined,
            isLoading: false
        });

        // Mock the sort conditions hook
        useSetSortConditions.mockReturnValue({
            sortDescending: false,
            sortCondition: null,
            setSortConditions: vi.fn()
        });

        // Mock agreements query
        useGetAgreementsQuery.mockReturnValue({
            data: mockAgreementsResponse,
            error: undefined,
            isLoading: false
        });
    });

    it("should display fiscal year dropdown with 'All' option", async () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("fiscal-year-select")).toBeInTheDocument();
        });

        const allOption = screen.getByRole("option", { name: "All" });
        expect(allOption).toBeInTheDocument();
    });

    it("should populate fiscal year options from API", async () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("fiscal-year-select")).toBeInTheDocument();
        });

        // Verify fiscal years from API are available
        expect(screen.getByRole("option", { name: "2023" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "2024" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "2025" })).toBeInTheDocument();
    });

    it("should default to current fiscal year", async () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("fiscal-year-select")).toBeInTheDocument();
        });

        const dropdown = screen.getByTestId("fiscal-year-dropdown");
        // Should have a value (current fiscal year from getCurrentFiscalYear())
        expect(dropdown.value).toBeTruthy();
    });

    it("should pass fiscal years from API to query params when no filters applied", async () => {
        const mockQuery = vi.fn();
        useGetAgreementsQuery.mockImplementation((params) => {
            mockQuery(params);
            return {
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false
            };
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(mockQuery).toHaveBeenCalled();
        });

        // Verify that fiscalYear filter is included in query params
        const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
        expect(lastCall[0].filters.fiscalYear).toBeDefined();
        expect(Array.isArray(lastCall[0].filters.fiscalYear)).toBe(true);
    });

    it("should handle empty fiscal years from API gracefully", async () => {
        useGetAgreementsFilterOptionsQuery.mockReturnValue({
            data: {
                fiscal_years: [],
                portfolios: [],
                project_titles: [],
                agreement_types: [],
                agreement_names: [],
                contract_numbers: [],
                research_types: []
            },
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
            expect(screen.getByTestId("fiscal-year-select")).toBeInTheDocument();
        });

        // Should still render without crashing
        expect(screen.getByTestId("agreement-tabs")).toBeInTheDocument();
    });

    it("should handle undefined filter options from API", async () => {
        useGetAgreementsFilterOptionsQuery.mockReturnValue({
            data: undefined,
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
            expect(screen.getByTestId("fiscal-year-select")).toBeInTheDocument();
        });

        // Should still render without crashing
        expect(screen.getByTestId("agreement-tabs")).toBeInTheDocument();
    });

    it("should use first fiscal year option when current fiscal year is not in options list", async () => {
        // Mock fiscal year options that don't include the current year
        // Assuming current fiscal year is 2025, provide options [2020, 2021, 2022]
        useGetAgreementsFilterOptionsQuery.mockReturnValue({
            data: {
                fiscal_years: [2020, 2021, 2022],
                portfolios: [],
                project_titles: [],
                agreement_types: [],
                agreement_names: [],
                contract_numbers: [],
                research_types: []
            },
            error: undefined,
            isLoading: false
        });

        const mockQuery = vi.fn();
        useGetAgreementsQuery.mockImplementation((params) => {
            mockQuery(params);
            return {
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false
            };
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("fiscal-year-select")).toBeInTheDocument();
        });

        // Verify the query uses the first fiscal year option (2020) instead of current year
        await waitFor(
            () => {
                expect(mockQuery).toHaveBeenCalled();
                const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
                // Should query with first available fiscal year (2020), not current year
                expect(lastCall[0].filters.fiscalYear).toEqual([{ id: 2020, title: 2020 }]);
            },
            { timeout: 3000 }
        );
    });

    it("should send empty fiscalYear filter when 'All' is selected from dropdown", async () => {
        const mockQuery = vi.fn();
        useGetAgreementsQuery.mockImplementation((params) => {
            mockQuery(params);
            return {
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false
            };
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("fiscal-year-select")).toBeInTheDocument();
        });

        // Select "All" from the fiscal year dropdown
        const dropdown = screen.getByTestId("fiscal-year-dropdown");
        dropdown.value = "All";
        dropdown.dispatchEvent(new Event("change", { bubbles: true }));

        await waitFor(() => {
            const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
            expect(lastCall[0].filters.fiscalYear).toEqual([]);
        });
    });

    it("should keep selected fiscal year when it exists in options list", async () => {
        // Mock fiscal year options that include a typical current year
        useGetAgreementsFilterOptionsQuery.mockReturnValue({
            data: {
                fiscal_years: [2023, 2024, 2025],
                portfolios: [],
                project_titles: [],
                agreement_types: [],
                agreement_names: [],
                contract_numbers: [],
                research_types: []
            },
            error: undefined,
            isLoading: false
        });

        const mockQuery = vi.fn();
        useGetAgreementsQuery.mockImplementation((params) => {
            mockQuery(params);
            return {
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false
            };
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("fiscal-year-select")).toBeInTheDocument();
        });

        // The dropdown should maintain a fiscal year from the options
        const dropdown = screen.getByTestId("fiscal-year-dropdown");
        const selectedYear = Number(dropdown.value);
        expect([2023, 2024, 2025]).toContain(selectedYear);
    });
});
