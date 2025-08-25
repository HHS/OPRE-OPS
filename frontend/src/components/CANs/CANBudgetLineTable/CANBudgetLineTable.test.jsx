import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import CANBudgetLineTable from "./CANBudgetLineTable";
import store from "../../../store";
import { budgetLine } from "../../../tests/data";
import { BrowserRouter } from "react-router-dom";

describe("CANBudgetLineTable", () => {
    const mockBudgetLines = [
        { ...budgetLine, status: "Approved", amount: 1000, fees: 0 },
        { ...budgetLine, status: "Pending", amount: 2000, fees: 0 }
    ];

    it("renders 'No budget lines have been added to this CAN.' when there are no budget lines", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <CANBudgetLineTable budgetLines={[]} />
                </BrowserRouter>
            </Provider>
        );
        expect(screen.getByText("No budget lines have been added to this CAN.")).toBeInTheDocument();
    });

    it("renders table with budget lines", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <CANBudgetLineTable budgetLines={mockBudgetLines} />
                </BrowserRouter>
            </Provider>
        );
        expect(screen.getByText("Approved")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText("$1,000.00")).toBeInTheDocument();
        expect(screen.getByText("$2,000.00")).toBeInTheDocument();
    });
});
