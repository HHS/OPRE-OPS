import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import {
    useGetAgreementsQuery,
    useGetAgreementsFilterOptionsQuery,
    useLazyGetUserQuery,
    useLazyGetAgreementsQuery,
    useGetChangeRequestsListQuery
} from "../../../api/opsAPI";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { tableSortCodes } from "../../../helpers/utils";
import store from "../../../store";
import AgreementsList from "./AgreementsList";

// Mock the API hooks
vi.mock("../../../api/opsAPI");

// Mock the table hooks
vi.mock("../../../components/UI/Table/Table.hooks");

// Mock the xlsx export helper: the real implementation calls jszip under the
// hood, which fails with "Cannot read properties of undefined (reading
// 'nodebuffer')" inside jsdom. These tests only verify the batching behavior
// around the click — the actual file generation isn't the subject under test.
vi.mock("../../../helpers/tableExport.helpers", () => ({
    exportTableToXlsx: vi.fn()
}));

// Mock the App component to avoid router complexity
vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-mock">{children}</div>
}));

// Mock complex child components to avoid cascading API dependencies
vi.mock("../../../components/Agreements/AgreementsTable", () => ({
    default: ({ agreements, selectedFiscalYear }) => (
        <div
            data-testid="agreements-table"
            data-fiscal-year={selectedFiscalYear}
        >
            {agreements && agreements.map((agreement) => <div key={agreement.id}>{agreement.name}</div>)}
        </div>
    )
}));

vi.mock("./AgreementsTabs", () => ({
    default: () => <div data-testid="agreement-tabs">All Agreements</div>
}));

vi.mock("./AgreementsFilterButton/AgreementsFilterButton", () => ({
    default: ({ isLoadingOptions }) => (
        <button
            data-testid="filter-button"
            data-loading-options={String(isLoadingOptions)}
        >
            Filter
        </button>
    )
}));

// Mocked with real removeFilter/setFilters wiring (not a static stub) so tests can
// exercise the actual tag-removal codepath that drives AgreementsList's FY revert logic.
vi.mock("./AgreementsFilterTags/AgreementsFilterTags", async () => {
    const { removeFilter } = await vi.importActual("./AgreementsFilterTags/AgreementsFilterTags.hooks");
    return {
        default: ({ filters, setFilters }) => (
            <div data-testid="filter-tags">
                Filter Tags
                <button
                    type="button"
                    data-testid="seed-fy-tag"
                    onClick={() => setFilters((prev) => ({ ...prev, fiscalYear: [{ id: 2025, title: 2025 }] }))}
                >
                    Seed FY tag
                </button>
                <button
                    type="button"
                    data-testid="seed-fy-tag-outside-window"
                    onClick={() => setFilters((prev) => ({ ...prev, fiscalYear: [{ id: 2010, title: 2010 }] }))}
                >
                    Seed FY tag outside default window
                </button>
                {(filters?.fiscalYear ?? []).map((fy) => (
                    <button
                        type="button"
                        key={fy.id}
                        data-testid={`remove-fy-tag-${fy.id}`}
                        onClick={() => removeFilter({ filter: "fiscalYear", tagText: `FY ${fy.title}` }, setFilters)}
                    >
                        Remove FY {fy.title}
                    </button>
                ))}
            </div>
        )
    };
});

vi.mock("../../../components/UI/PaginationNav/PaginationNav", () => ({
    default: ({ currentPage, totalPages }) => (
        <nav data-testid="pagination-nav">
            Page {currentPage} of {totalPages}
        </nav>
    )
}));

vi.mock("../../../components/UI/FiscalYear", () => ({
    default: ({ fiscalYear, handleChangeFiscalYear, fiscalYears = [], showAllOption }) => {
        // Simulate real component fallback: use generated fiscal years when no fiscalYears provided
        const now = new Date();
        const currentFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
        const fallbackYears = Array.from({ length: 11 }, (_, i) => currentFY + 5 - i);
        const years = fiscalYears.length > 0 ? fiscalYears : fallbackYears;

        return (
            <div data-testid="fiscal-year-select">
                <select
                    data-testid="fiscal-year-dropdown"
                    value={fiscalYear}
                    onChange={(e) => handleChangeFiscalYear(e.target.value)}
                >
                    {years.map((fy) => (
                        <option
                            key={fy}
                            value={fy}
                        >
                            {fy}
                        </option>
                    ))}
                    {showAllOption && <option value="All">All</option>}
                </select>
            </div>
        );
    }
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

        useLazyGetAgreementsQuery.mockReturnValue([vi.fn(), {}]);

        // Mock the change requests query (used by AgreementTabs)
        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: [], count: 0, limit: 10, offset: 0 },
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
            sortCondition: tableSortCodes.agreementCodes.AGREEMENT,
            setSortConditions: vi.fn()
        });
    });

    describe("Initial State", () => {
        it("should render loading state initially", () => {
            useGetAgreementsQuery.mockReturnValue({
                data: undefined,
                error: undefined,
                isLoading: true,
                isFetching: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            expect(screen.getByRole("table", { name: "Loading agreements" })).toBeInTheDocument();
            expect(screen.getByRole("columnheader", { name: /agreement/i })).toBeInTheDocument();
        });

        it("should render skeleton while refetching", () => {
            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false,
                isFetching: true
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            expect(screen.getByRole("table", { name: "Loading agreements" })).toBeInTheDocument();
        });

        it("should display agreements when data is loaded", async () => {
            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false,
                isFetching: false
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

        it("passes filter option loading state to the filter button", async () => {
            useGetAgreementsFilterOptionsQuery.mockReturnValue({
                data: undefined,
                error: undefined,
                isLoading: true
            });

            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false,
                isFetching: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                expect(screen.getByTestId("filter-button")).toHaveAttribute("data-loading-options", "true");
            });
        });
    });

    describe("Data Extraction from Wrapped Response", () => {
        it("should extract agreements array from wrapped response", async () => {
            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false,
                isFetching: false
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
                isLoading: false,
                isFetching: false
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
                isLoading: false,
                isFetching: false
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
                expect(screen.getByRole("navigation")).toBeInTheDocument();
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
                isLoading: false,
                isFetching: false
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
                isLoading: false,
                isFetching: false
            });

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                expect(screen.getByText("Export")).toBeInTheDocument();
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
                isLoading: false,
                isFetching: false
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
                isLoading: false,
                isFetching: false
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

            const mockUserTrigger = vi.fn(() => ({
                unwrap: () => Promise.resolve({ id: 500, full_name: "Test User" })
            }));

            useLazyGetAgreementsQuery.mockReturnValue([mockGetAllAgreementsTrigger, {}]);
            useLazyGetUserQuery.mockReturnValue([mockUserTrigger, {}]);

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await waitFor(() => {
                expect(screen.getByText("Export")).toBeInTheDocument();
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

        it("should pass 'Lifetime Obligated' column header to exportTableToXlsx when All FYs selected", async () => {
            const { exportTableToXlsx } = await import("../../../helpers/tableExport.helpers");

            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false,
                isFetching: false
            });

            useLazyGetAgreementsQuery.mockReturnValue([
                vi.fn(() => ({ unwrap: () => Promise.resolve(mockAgreementsResponse) })),
                {}
            ]);
            useLazyGetUserQuery.mockReturnValue([
                vi.fn(() => ({ unwrap: () => Promise.resolve({ id: 1, display_name: "COR" }) })),
                {}
            ]);

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            fireEvent.click(await screen.findByRole("button", { name: /export/i }));

            await waitFor(() => expect(exportTableToXlsx).toHaveBeenCalled());

            const headers = exportTableToXlsx.mock.calls[0][0].headers;
            expect(headers).toContain("Lifetime Obligated");
            expect(headers.filter((h) => h === "Lifetime Obligated")).toHaveLength(1);
            expect(headers.some((h) => /FY\d{2} Obligated/.test(h))).toBe(false);
        });

        it("should pass year-specific FY column header to exportTableToXlsx when a specific year is selected", async () => {
            const { exportTableToXlsx } = await import("../../../helpers/tableExport.helpers");
            exportTableToXlsx.mockClear();

            useGetAgreementsQuery.mockReturnValue({
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false,
                isFetching: false
            });

            useLazyGetAgreementsQuery.mockReturnValue([
                vi.fn(() => ({ unwrap: () => Promise.resolve(mockAgreementsResponse) })),
                {}
            ]);
            useLazyGetUserQuery.mockReturnValue([
                vi.fn(() => ({ unwrap: () => Promise.resolve({ id: 1, display_name: "COR" }) })),
                {}
            ]);

            render(
                <Provider store={store}>
                    <BrowserRouter>
                        <AgreementsList />
                    </BrowserRouter>
                </Provider>
            );

            await screen.findByTestId("fiscal-year-select");

            // Switch to a specific year using the same pattern as other tests in this file
            const dropdown = screen.getByTestId("fiscal-year-dropdown");
            dropdown.value = "2025";
            dropdown.dispatchEvent(new Event("change", { bubbles: true }));

            fireEvent.click(await screen.findByRole("button", { name: /export/i }));

            await waitFor(() => expect(exportTableToXlsx).toHaveBeenCalled());

            const headers = exportTableToXlsx.mock.calls[0][0].headers;
            expect(headers[5]).toBe("FY25 Obligated");
            expect(headers[10]).toBe("Lifetime Obligated");
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
                isLoading: false,
                isFetching: false
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
                expect(screen.getByRole("navigation")).toBeInTheDocument();
            });
        });
    });
});

describe("AgreementsList - Fiscal Year Filtering", () => {
    beforeEach(() => {
        // Mock the lazy query hooks
        useLazyGetUserQuery.mockReturnValue([vi.fn(), {}]);

        useLazyGetAgreementsQuery.mockReturnValue([vi.fn(), {}]);

        // Mock the change requests query
        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: [], count: 0, limit: 10, offset: 0 },
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
            sortCondition: tableSortCodes.agreementCodes.AGREEMENT,
            setSortConditions: vi.fn()
        });

        // Mock agreements query
        useGetAgreementsQuery.mockReturnValue({
            data: mockAgreementsResponse,
            error: undefined,
            isLoading: false,
            isFetching: false
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

    it("should default to all fiscal years", async () => {
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
        expect(dropdown.value).toBe("All");
    });

    it("should pass fiscal years from API to query params when no filters applied", async () => {
        const mockQuery = vi.fn();
        useGetAgreementsQuery.mockImplementation((params) => {
            mockQuery(params);
            return {
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false,
                isFetching: false
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

    it("should send empty fiscalYear filter by default (all fiscal years)", async () => {
        const mockQuery = vi.fn();
        useGetAgreementsQuery.mockImplementation((params) => {
            mockQuery(params);
            return {
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false,
                isFetching: false
            };
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(
            () => {
                expect(mockQuery).toHaveBeenCalled();
            },
            { timeout: 3000 }
        );

        const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
        expect(lastCall[0].filters.fiscalYear).toEqual([]);
    });

    it("should default to All regardless of which fiscal year options the API returns", async () => {
        useGetAgreementsFilterOptionsQuery.mockReturnValue({
            data: {
                fiscal_years: [2020, 2021, 2022, 2023, 2024, 2025],
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

        const dropdown = screen.getByTestId("fiscal-year-dropdown");
        expect(dropdown.value).toBe("All");
    });
});

describe("AgreementsList - FY Obligated sort preserved when switching to All FYs", () => {
    beforeEach(() => {
        useLazyGetUserQuery.mockReturnValue([vi.fn(), {}]);
        useLazyGetAgreementsQuery.mockReturnValue([vi.fn(), {}]);
        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: [], count: 0, limit: 10, offset: 0 },
            isLoading: false
        });
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
            isLoading: false
        });
        useGetAgreementsQuery.mockReturnValue({
            data: mockAgreementsResponse,
            error: undefined,
            isLoading: false,
            isFetching: false
        });
    });

    it("preserves FY_OBLIGATED sort when switching to All FYs (backend handles lifetime sort)", async () => {
        const setSortConditionsMock = vi.fn();
        useSetSortConditions.mockReturnValue({
            sortDescending: false,
            sortCondition: tableSortCodes.agreementCodes.FY_OBLIGATED,
            setSortConditions: setSortConditionsMock
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("fiscal-year-dropdown")).toBeInTheDocument();
        });

        // Switch to "All" while the active sort is FY_OBLIGATED
        fireEvent.change(screen.getByTestId("fiscal-year-dropdown"), { target: { value: "All" } });

        // Sort should NOT be reset — FY_OBLIGATED is valid under All FYs (backend sorts by lifetime_obligated)
        expect(setSortConditionsMock).not.toHaveBeenCalled();
    });
});

describe("AgreementsList - Export Lifetime Obligated value under All FYs", () => {
    beforeEach(() => {
        useLazyGetUserQuery.mockReturnValue([
            vi.fn(() => ({ unwrap: () => Promise.resolve({ id: 1, display_name: "COR" }) })),
            {}
        ]);
        useLazyGetAgreementsQuery.mockReturnValue([
            vi.fn(() => ({
                unwrap: () =>
                    Promise.resolve({
                        agreements: [
                            {
                                ...mockAgreementsResponse.agreements[0],
                                fy_obligated: "50000"
                            }
                        ],
                        count: 1
                    })
            })),
            {}
        ]);
        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: [], count: 0, limit: 10, offset: 0 },
            isLoading: false
        });
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
            isLoading: false
        });
        useGetAgreementsQuery.mockReturnValue({
            data: { ...mockAgreementsResponse, count: 1 },
            error: undefined,
            isLoading: false,
            isFetching: false
        });
    });

    it("emits lifetime_obligated for the Lifetime Obligated cell in the export when All FYs is selected", async () => {
        const { exportTableToXlsx } = await import("../../../helpers/tableExport.helpers");
        exportTableToXlsx.mockClear();

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        fireEvent.click(await screen.findByRole("button", { name: /export/i }));

        await waitFor(() => expect(exportTableToXlsx).toHaveBeenCalled(), { timeout: 5000 });

        const rowMapper = exportTableToXlsx.mock.calls[0][0].rowMapper;
        const row = rowMapper({
            ...mockAgreementsResponse.agreements[0],
            fy_obligated: "50000",
            lifetime_obligated: 75000
        });

        // "Lifetime Obligated" is the 6th column (index 5) when All FYs is selected.
        // The export must emit lifetime_obligated, not fy_obligated.
        expect(row[5]).toBe(75000);
    });
});

// ─── PR 2: Model B FY filter behavior (OPS-6256) ────────────────────────────

describe("AgreementsList - Model B FY behavior (OPS-6256)", () => {
    const baseBeforeEach = () => {
        useLazyGetUserQuery.mockReturnValue([vi.fn(), {}]);
        useLazyGetAgreementsQuery.mockReturnValue([vi.fn(), {}]);
        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: [], count: 0, limit: 10, offset: 0 },
            isLoading: false
        });
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
            isLoading: false
        });
        useSetSortConditions.mockReturnValue({
            sortDescending: false,
            sortCondition: tableSortCodes.agreementCodes.AGREEMENT,
            setSortConditions: vi.fn()
        });
        useGetAgreementsQuery.mockReturnValue({
            data: mockAgreementsResponse,
            error: undefined,
            isLoading: false,
            isFetching: false
        });
    };

    it("dropdown-only FY change passes correct year to query via resolveForAPI", async () => {
        baseBeforeEach();
        const mockQuery = vi.fn();
        useGetAgreementsQuery.mockImplementation((params) => {
            mockQuery(params);
            return { data: mockAgreementsResponse, error: undefined, isLoading: false, isFetching: false };
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await screen.findByTestId("fiscal-year-dropdown");

        // Change dropdown to a specific year
        fireEvent.change(screen.getByTestId("fiscal-year-dropdown"), { target: { value: "2024" } });

        await waitFor(() => {
            const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
            // resolveForAPI should return the dropdown year when compareFYs is empty
            expect(lastCall[0].filters.fiscalYear).toEqual([{ id: 2024, title: 2024 }]);
        });
    });

    it("dropdown value reflects AgreementsTable selectedFiscalYear prop (dropdownValue wired)", async () => {
        baseBeforeEach();
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await screen.findByTestId("fiscal-year-dropdown");

        // Default: "All"
        expect(screen.getByTestId("agreements-table").dataset.fiscalYear).toBe("All");

        // Change to a specific year
        fireEvent.change(screen.getByTestId("fiscal-year-dropdown"), { target: { value: "2025" } });

        await waitFor(() => {
            expect(screen.getByTestId("agreements-table").dataset.fiscalYear).toBe("2025");
        });
    });

    it("changing dropdown clears only filters.fiscalYear, not other filters", async () => {
        baseBeforeEach();
        const queryParams = [];
        useGetAgreementsQuery.mockImplementation((params) => {
            queryParams.push(params);
            return { data: mockAgreementsResponse, error: undefined, isLoading: false, isFetching: false };
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await screen.findByTestId("fiscal-year-dropdown");

        // Capture query params before the dropdown change
        const callsBefore = queryParams.length;
        expect(callsBefore).toBeGreaterThan(0);
        const paramsBefore = queryParams[callsBefore - 1];

        // Change dropdown — should only clear filters.fiscalYear
        fireEvent.change(screen.getByTestId("fiscal-year-dropdown"), { target: { value: "2024" } });

        await waitFor(() => expect(queryParams.length).toBeGreaterThan(callsBefore));
        const paramsAfter = queryParams[queryParams.length - 1];

        // fiscalYear changes to the selected year
        expect(paramsAfter.filters.fiscalYear).toEqual([{ id: 2024, title: 2024 }]);

        // All non-FY filter keys must be identical to before the change (not wiped)
        expect(paramsAfter.filters.portfolio).toEqual(paramsBefore.filters.portfolio);
        expect(paramsAfter.filters.projectTitle).toEqual(paramsBefore.filters.projectTitle);
        expect(paramsAfter.filters.agreementType).toEqual(paramsBefore.filters.agreementType);
        expect(paramsAfter.filters.agreementName).toEqual(paramsBefore.filters.agreementName);
        expect(paramsAfter.filters.contractNumber).toEqual(paramsBefore.filters.contractNumber);
        expect(paramsAfter.filters.awardType).toEqual(paramsBefore.filters.awardType);
    });

    it("default query sends empty fiscalYear with All selected (resolveForAPI: All → [])", async () => {
        baseBeforeEach();
        const mockQuery = vi.fn();
        useGetAgreementsQuery.mockImplementation((params) => {
            mockQuery(params);
            return { data: mockAgreementsResponse, error: undefined, isLoading: false, isFetching: false };
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => expect(mockQuery).toHaveBeenCalled());
        const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
        expect(lastCall[0].filters.fiscalYear).toEqual([]);
    });

    it("removing the last FY tag reverts the dropdown to All, not the stale pre-Compare-FYs dropdown year", async () => {
        baseBeforeEach();
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );
        await screen.findByTestId("fiscal-year-dropdown");

        // Set the dropdown shortcut to a specific year first (selectedFiscalYear = "2024").
        fireEvent.change(screen.getByTestId("fiscal-year-dropdown"), { target: { value: "2024" } });
        await waitFor(() => expect(screen.getByTestId("fiscal-year-dropdown").value).toBe("2024"));

        // Now apply a Compare FYs selection (filters.fiscalYear), which takes precedence
        // over the dropdown shortcut and should override the displayed value to 2025.
        fireEvent.click(screen.getByTestId("seed-fy-tag"));
        await waitFor(() => expect(screen.getByTestId("fiscal-year-dropdown").value).toBe("2025"));

        // Remove the FY 2025 tag via the real removeFilter/handleFYTagRemoval codepath
        // (not a re-implementation), driving filters.fiscalYear from non-empty back to [].
        fireEvent.click(screen.getByTestId("remove-fy-tag-2025"));

        // Compare FYs is now empty, so the dropdown falls back to selectedFiscalYear.
        // The revert-to-"All" effect must have reset it — otherwise this would show the
        // stale "2024" the dropdown shortcut was left on before Compare FYs took over.
        await waitFor(() => expect(screen.getByTestId("fiscal-year-dropdown").value).toBe("All"));
    });

    it("renders an <option> for a Compare FY outside the default rolling window", async () => {
        baseBeforeEach();
        // 2010 is well outside constants.fiscalYears' current-year±5 window, but it's a
        // real year returned by the filter-options API (e.g. an old agreement's FY).
        useGetAgreementsFilterOptionsQuery.mockReturnValue({
            data: {
                fiscal_years: [2010, 2023, 2024, 2025],
                portfolios: [],
                project_titles: [],
                agreement_types: [],
                agreement_names: [],
                contract_numbers: [],
                research_types: []
            },
            isLoading: false
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );
        await screen.findByTestId("fiscal-year-dropdown");

        fireEvent.click(screen.getByTestId("seed-fy-tag-outside-window"));

        await waitFor(() => expect(screen.getByTestId("fiscal-year-dropdown").value).toBe("2010"));
        // The dropdown's value must match a rendered <option> — otherwise the <select>
        // silently shows blank instead of the selected Compare FY.
        expect(screen.getByRole("option", { name: "2010" })).toBeInTheDocument();
    });
});
