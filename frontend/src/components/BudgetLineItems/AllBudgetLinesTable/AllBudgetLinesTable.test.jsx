import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { describe, it, expect, vi } from "vitest";
import AllBudgetLinesTable from "./AllBudgetLinesTable";
import { ITEMS_PER_PAGE } from "../../../constants";
import { All_BUDGET_LINES_TABLE_HEADINGS_LIST } from "./AllBudgetLinesTable.constants";
import store from "../../../store"; // Adjust the import path to your store

vi.mock("../../../helpers/changeRequests.helpers", () => ({
    hasProcurementShopChange: () => false
}));

vi.mock("../../../hooks/useServicesComponents.hooks", () => ({
    useGetServicesComponentDisplayName: () => "Test SC"
}));

vi.mock("../../../hooks/useChangeRequests.hooks", () => ({
    useChangeRequestsForTooltip: () => null
}));

vi.mock("../../../api/opsAPI", () => ({
    useGetUserByIdQuery: () => ({
        data: { full_name: "Test User" },
        isSuccess: true,
        isLoading: false
    }),
    useGetServicesComponentByIdQuery: () => ({
        data: { id: 1, name: "Test Service Component", display_name: "Test SC" },
        isSuccess: true,
        isLoading: false
    }),
    useGetCansQuery: () => ({
        data: {
            cans: [{ id: 1, number: "123456", display_name: "Test CAN" }],
            count: 1,
            limit: 10,
            offset: 0
        },
        isLoading: false
    }),
    useLazyGetCansQuery: () => [
        vi.fn(() => ({
            unwrap: () => Promise.resolve({ cans: [], count: 0 })
        })),
        { isLoading: false, isError: false }
    ],
    useGetAgreementByIdQuery: () => ({
        data: null,
        isLoading: false,
        isError: false
    }),
    useGetPortfolioByIdQuery: () => ({
        data: { id: 1, name: "Test Portfolio", abbreviation: "TP" },
        isLoading: false,
        isError: false
    })
}));

const mockBudgetLines = [
    {
        _meta: {
            limit: 10,
            number_of_pages: 103,
            offset: 0,
            query_parameters: "{'include_fees': [True], 'limit': [10], 'offset': [0]}",
            total_amount: 4929199326.14,
            total_count: 1029,
            total_draft_amount: 1513348642.215,
            total_in_execution_amount: 773259769.177,
            total_obligated_amount: 1157429504.811,
            total_planned_amount: 1485161409.937
        },
        id: 1,
        agreement: {
            id: 1,
            name: "Agreement 1",
            agreement_type: "CONTRACT",
            awarding_entity_id: 1
        },
        date_needed: "2023-01-01",
        fiscal_year: 2023,
        can: {
            id: 1,
            display_name: "CAN123",
            portfolio_id: 1
        },
        amount: 1000,
        status: "Active",
        services_component_id: 1,
        agreement_id: 1,
        portfolio_id: 1
    }
];

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn()
    };
});

vi.mock("./AllBudgetLinesTable.hooks", () => ({
    default: () => ({
        showModal: false,
        setShowModal: vi.fn(),
        modalProps: {},
        handleDeleteBudgetLine: vi.fn()
    }),
    useSetSortConditions: vi.fn(() => {
        return { sortDescending: true, sortCondition: "", useSetSortConditions: vi.fn() };
    })
}));

describe("AllBudgetLinesTable", () => {
    it("renders table headings", () => {
        render(
            <Provider store={store}>
                <Router>
                    <AllBudgetLinesTable budgetLineItems={mockBudgetLines} />
                </Router>
            </Provider>
        );

        const headings = screen.getAllByRole("columnheader");
        expect(headings).toHaveLength(9); // BL ID #, Agreement, Type, SC, Obligate By, CAN, Portfolio, Total, Status
    });

    it("renders budget lines", () => {
        render(
            <Provider store={store}>
                <Router>
                    <AllBudgetLinesTable budgetLineItems={mockBudgetLines} />
                </Router>
            </Provider>
        );

        const rows = screen.getAllByRole("row");
        expect(rows).toHaveLength(mockBudgetLines.length + 1); // +1 for the header row
    });

    it("displays pagination when budget lines exceed per page limit", () => {
        const manyBudgetLines = Array(ITEMS_PER_PAGE + 1).fill(mockBudgetLines[0]);

        render(
            <Provider store={store}>
                <Router>
                    <AllBudgetLinesTable budgetLineItems={manyBudgetLines} />
                </Router>
            </Provider>
        );

        const pagination = screen.getByRole("navigation");
        expect(pagination).toBeInTheDocument();
    });

    it("displays zero results message when no budget lines are provided", () => {
        render(
            <Provider store={store}>
                <Router>
                    <AllBudgetLinesTable budgetLineItems={[]} />
                </Router>
            </Provider>
        );

        const zeroResultsMessage = screen.getByText(/There are 0 results based on your filter selections./i);
        expect(zeroResultsMessage).toBeInTheDocument();
    });

    it("renders agreement type and portfolio columns", () => {
        render(
            <Provider store={store}>
                <Router>
                    <AllBudgetLinesTable budgetLineItems={mockBudgetLines} />
                </Router>
            </Provider>
        );

        // Verify agreement type is displayed
        expect(screen.getByText("Contract")).toBeInTheDocument();

        // Verify portfolio abbreviation is displayed
        expect(screen.getByText("TP")).toBeInTheDocument();
    });

    describe("Table Sorting", () => {
        it("calls setSortConditions when column header is clicked", async () => {
            const user = userEvent.setup();
            const mockSetSortConditions = vi.fn();

            render(
                <Provider store={store}>
                    <Router>
                        <AllBudgetLinesTable
                            budgetLineItems={mockBudgetLines}
                            currentPage={1}
                            setCurrentPage={vi.fn()}
                            setSortConditions={mockSetSortConditions}
                            sortConditions=""
                            sortDescending={true}
                        />
                    </Router>
                </Provider>
            );

            const blIdHeader = screen.getByTitle("Click to sort by BL ID #");
            await user.click(blIdHeader);

            expect(mockSetSortConditions).toHaveBeenCalledWith(All_BUDGET_LINES_TABLE_HEADINGS_LIST[0].value, false);
        });

        it("toggles sort direction when clicking the same column header twice", async () => {
            const user = userEvent.setup();
            const mockSetSortConditions = vi.fn();

            const { rerender } = render(
                <Provider store={store}>
                    <Router>
                        <AllBudgetLinesTable
                            budgetLineItems={mockBudgetLines}
                            currentPage={1}
                            setCurrentPage={vi.fn()}
                            setSortConditions={mockSetSortConditions}
                            sortConditions=""
                            sortDescending={true}
                        />
                    </Router>
                </Provider>
            );

            const agreementHeader = screen.getByTitle("Click to sort by Agreement");

            // First click - should sort descending (false because it toggles the current true)
            await user.click(agreementHeader);
            expect(mockSetSortConditions).toHaveBeenCalledWith(All_BUDGET_LINES_TABLE_HEADINGS_LIST[1].value, false);

            // Simulate the sort state update
            rerender(
                <Provider store={store}>
                    <Router>
                        <AllBudgetLinesTable
                            budgetLineItems={mockBudgetLines}
                            currentPage={1}
                            setCurrentPage={vi.fn()}
                            setSortConditions={mockSetSortConditions}
                            sortConditions={All_BUDGET_LINES_TABLE_HEADINGS_LIST[1].value}
                            sortDescending={false}
                        />
                    </Router>
                </Provider>
            );

            // Second click - should sort ascending (true)
            const agreementHeaderAfterRerender = screen.getByTitle("Click to sort by Agreement");
            await user.click(agreementHeaderAfterRerender);
            expect(mockSetSortConditions).toHaveBeenCalledWith(All_BUDGET_LINES_TABLE_HEADINGS_LIST[1].value, true);
        });

        it("renders sort arrow when a column is sorted", () => {
            render(
                <Provider store={store}>
                    <Router>
                        <AllBudgetLinesTable
                            budgetLineItems={mockBudgetLines}
                            currentPage={1}
                            setCurrentPage={vi.fn()}
                            setSortConditions={vi.fn()}
                            sortConditions={All_BUDGET_LINES_TABLE_HEADINGS_LIST[0].value}
                            sortDescending={false}
                        />
                    </Router>
                </Provider>
            );

            const blIdHeader = screen.getByTitle("Click to sort by BL ID #");
            // SVG icons have role="img" but are hidden, so we need to include hidden elements
            const sortIcon = within(blIdHeader).queryByRole("img", { hidden: true });

            expect(sortIcon).toBeInTheDocument();
        });

        it("sets correct aria-sort attribute on sorted column", () => {
            render(
                <Provider store={store}>
                    <Router>
                        <AllBudgetLinesTable
                            budgetLineItems={mockBudgetLines}
                            currentPage={1}
                            setCurrentPage={vi.fn()}
                            setSortConditions={vi.fn()}
                            sortConditions={All_BUDGET_LINES_TABLE_HEADINGS_LIST[2].value}
                            sortDescending={true}
                        />
                    </Router>
                </Provider>
            );

            const headers = screen.getAllByRole("columnheader");
            // Agreement Type is the 3rd column (index 2)
            const agreementTypeHeader = headers[2];

            expect(agreementTypeHeader).toHaveAttribute("aria-sort", "descending");
        });

        it("allows sorting by all sortable columns", async () => {
            const user = userEvent.setup();
            const mockSetSortConditions = vi.fn();

            render(
                <Provider store={store}>
                    <Router>
                        <AllBudgetLinesTable
                            budgetLineItems={mockBudgetLines}
                            currentPage={1}
                            setCurrentPage={vi.fn()}
                            setSortConditions={mockSetSortConditions}
                            sortConditions=""
                            sortDescending={true}
                        />
                    </Router>
                </Provider>
            );

            // Test each sortable column by heading text
            const columnHeaders = [
                "BL ID #",
                "Agreement",
                "Type",
                "SC",
                "Obligate By",
                "CAN",
                "Portfolio",
                "Total",
                "Status"
            ];

            for (let i = 0; i < columnHeaders.length; i++) {
                mockSetSortConditions.mockClear();
                const header = screen.getByTitle(`Click to sort by ${columnHeaders[i]}`);
                await user.click(header);

                expect(mockSetSortConditions).toHaveBeenCalledWith(
                    All_BUDGET_LINES_TABLE_HEADINGS_LIST[i].value,
                    false
                );
            }
        });

        it("displays ascending arrow when sorting in ascending order", () => {
            render(
                <Provider store={store}>
                    <Router>
                        <AllBudgetLinesTable
                            budgetLineItems={mockBudgetLines}
                            currentPage={1}
                            setCurrentPage={vi.fn()}
                            setSortConditions={vi.fn()}
                            sortConditions={All_BUDGET_LINES_TABLE_HEADINGS_LIST[7].value}
                            sortDescending={false}
                        />
                    </Router>
                </Provider>
            );

            // Check via aria-sort attribute instead of checking the specific icon
            const headers = screen.getAllByRole("columnheader");
            const totalHeader = headers[7]; // Total is the 8th column

            expect(totalHeader).toHaveAttribute("aria-sort", "ascending");
        });

        it("displays descending arrow when sorting in descending order", () => {
            render(
                <Provider store={store}>
                    <Router>
                        <AllBudgetLinesTable
                            budgetLineItems={mockBudgetLines}
                            currentPage={1}
                            setCurrentPage={vi.fn()}
                            setSortConditions={vi.fn()}
                            sortConditions={All_BUDGET_LINES_TABLE_HEADINGS_LIST[8].value}
                            sortDescending={true}
                        />
                    </Router>
                </Provider>
            );

            // Check via aria-sort attribute instead of checking the specific icon
            const headers = screen.getAllByRole("columnheader");
            const statusHeader = headers[8]; // Status is the 9th column

            expect(statusHeader).toHaveAttribute("aria-sort", "descending");
        });
    });
});
