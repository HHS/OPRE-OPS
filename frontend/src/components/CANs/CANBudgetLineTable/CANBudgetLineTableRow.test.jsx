import { render, screen } from "@testing-library/react";
import CANBudgetLineTableRow from "./CANBudgetLineTableRow";
import { formatDateNeeded } from "../../../helpers/utils";
import { Provider } from "react-redux";
import store from "../../../store";
import { budgetLine } from "../../../tests/data";
import userEvent from "@testing-library/user-event";

const mockBudgetLine = {
    ...budgetLine,
    id: 1,
    date_needed: "2023-10-01",
    fiscal_year: 2023,
    amount: 1000,
    proc_shop_fee_percentage: 0.05,
    status: "Pending",
    in_review: true,
    created_by: 1,
    created_on: "2023-09-01"
};

describe("CANBudgetLineTableRow", () => {
    test("renders table row data correctly", () => {
        render(
            <Provider store={store}>
                <CANBudgetLineTableRow
                    budgetLine={mockBudgetLine}
                    blId={mockBudgetLine.id}
                    agreementName="TBD"
                    obligateDate={formatDateNeeded(mockBudgetLine.date_needed)}
                    fiscalYear={mockBudgetLine.fiscal_year}
                    amount={mockBudgetLine.amount}
                    fee={mockBudgetLine.proc_shop_fee_percentage}
                    percentOfCAN={3}
                    status={mockBudgetLine.status}
                    inReview={mockBudgetLine.in_review}
                    creatorId={mockBudgetLine.created_by}
                    creationDate={mockBudgetLine.created_on}
                    procShopCode="TBD"
                    procShopFeePercentage={mockBudgetLine.proc_shop_fee_percentage}
                />
            </Provider>
        );

        expect(screen.getByText("TBD")).toBeInTheDocument();
        expect(screen.getByText(formatDateNeeded(mockBudgetLine.date_needed))).toBeInTheDocument();
        expect(screen.getByText(mockBudgetLine.fiscal_year)).toBeInTheDocument();
        expect(screen.getByText("$1,050.00")).toBeInTheDocument(); // amount + fee
        expect(screen.getByText("3%")).toBeInTheDocument();
    });

    test("renders expanded data correctly", async () => {
        render(
            <Provider store={store}>
                <CANBudgetLineTableRow
                    budgetLine={mockBudgetLine}
                    blId={mockBudgetLine.id}
                    agreementName="TBD"
                    obligateDate={formatDateNeeded(mockBudgetLine.date_needed)}
                    fiscalYear={mockBudgetLine.fiscal_year}
                    amount={mockBudgetLine.amount}
                    fee={mockBudgetLine.proc_shop_fee_percentage}
                    percentOfCAN={3}
                    status={mockBudgetLine.status}
                    inReview={mockBudgetLine.in_review}
                    creatorId={mockBudgetLine.created_by}
                    creationDate={mockBudgetLine.created_on}
                    procShopCode="TBD"
                    procShopFeePercentage={mockBudgetLine.proc_shop_fee_percentage}
                />
            </Provider>
        );

        // Simulate expanding the row
        await userEvent.click(screen.getByTestId("expand-row"));

        expect(screen.getByText("Created By")).toBeInTheDocument();
        expect(screen.getByText("No Notes added")).toBeInTheDocument();
        expect(screen.getByText("Procurement Shop")).toBeInTheDocument();
        expect(screen.getByText("$1,000.00")).toBeInTheDocument(); // amount
        expect(screen.getByText("$50.00")).toBeInTheDocument(); // fee
    });
});
