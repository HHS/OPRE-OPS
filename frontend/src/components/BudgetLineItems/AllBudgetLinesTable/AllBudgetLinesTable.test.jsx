import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { describe, it, expect, vi } from "vitest";
import AllBudgetLinesTable from "./AllBudgetLinesTable";
import { BLIS_PER_PAGE } from "./AllBudgetLinesTable.constants";
import store from "../../../store"; // Adjust the import path to your store

const mockBudgetLines = [
    {
        id: 1,
        agreement_name: "Agreement 1",
        date_needed: "2023-01-01",
        fiscal_year: 2023,
        can_number: "CAN123",
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
    })
}));

describe("AllBudgetLinesTable", () => {
    it("renders table headings", () => {
        render(
            <Provider store={store}>
                <Router>
                    <AllBudgetLinesTable budgetLines={mockBudgetLines} />
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
                    <AllBudgetLinesTable budgetLines={mockBudgetLines} />
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
                    <AllBudgetLinesTable budgetLines={manyBudgetLines} />
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
                    <AllBudgetLinesTable budgetLines={[]} />
                </Router>
            </Provider>
        );

        const zeroResultsMessage = screen.getByText(/There are 0 results based on your filter selections./i);
        expect(zeroResultsMessage).toBeInTheDocument();
    });
});
