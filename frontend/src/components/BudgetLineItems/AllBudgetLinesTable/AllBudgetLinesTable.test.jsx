import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { describe, it, expect, vi } from "vitest";
import AllBudgetLinesTable from "./AllBudgetLinesTable";
import { BLIS_PER_PAGE } from "./AllBudgetLinesTable.constants";
import store from "../../../store"; // Adjust the import path to your store

vi.mock("../../../helpers/changeRequests.helpers", () => ({
    hasProcurementShopChange: () => false
}));

vi.mock("../../../api/opsAPI", () => ({
    useGetProcurementShopsQuery: () => ({
        data: [{ id: 1, abbr: "TEST", fee_percentage: 0.1 }],
        isLoading: false
    }),
    useGetUserByIdQuery: () => ({
        isSuccess: true,
        isLoading: false
    }),
    useGetServicesComponentByIdQuery: () => ({
        data: { id: 1, name: "Test Service Component" },
        isLoading: false
    }),
    useGetCansQuery: () => ({
        data: [{ id: 1, number: "123456", display_name: "Test CAN" }],
        isLoading: false
    }),
    useGetAgreementByIdQuery: () => ({
        data: null,
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
            awarding_entity_id: 1
        },
        date_needed: "2023-01-01",
        fiscal_year: 2023,
        can: {
            display_name: "CAN123"
        },
        amount: 1000,
        status: "Active",
        services_component_id: 1,
        agreement_id: 1
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
        expect(headings).toHaveLength(8); // Adjust based on the number of headings
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
        const manyBudgetLines = Array(BLIS_PER_PAGE + 1).fill(mockBudgetLines[0]);

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
});
