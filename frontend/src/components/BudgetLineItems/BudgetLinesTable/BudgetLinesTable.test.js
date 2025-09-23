import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";
import store from "../../../store";
import BudgetLinesTable from "./BudgetLinesTable";

const mockBudgetLinesOne = [
    {
        id: 1,
        display_name: "BudgetLineItem#1",
        created_on: "2021-08-20",
        date_needed: "2021-09-15",
        can: { number: "001" },
        amount: 1200,
        proc_shop_fee_percentage: 0.05,
        status: "DRAFT",
        created_by: "1",
        comments: "Note 1",
        _meta: { isEditable: true }
    }
];
const mockBudgetLines = [
    {
        id: 1,
        display_name: "BudgetLineItem#1",
        created_on: "2021-08-20",
        date_needed: "2021-09-15",
        can: { number: "001" },
        amount: 1200,
        proc_shop_fee_percentage: 0.05,
        status: "DRAFT",
        created_by: "1",
        comments: "Note 1",
        _meta: { isEditable: true }
    },
    {
        id: 2,
        display_name: "BudgetLineItem#2",
        created_on: "2021-09-01",
        date_needed: "2021-10-30",
        can: { number: "002" },
        amount: 2000,
        proc_shop_fee_percentage: 0.07,
        status: "OBLIGATED",
        created_by: "2",
        comments: "Note 2",
        _meta: { isEditable: false }
    }
];

const procurementShop = {
    id: 1,
    name: "General Services",
    abbr: "GCS",
    fee_percentage: 0.05
};

function customRender(ui, store) {
    return render(
        <Router location="/">
            <Provider store={store}>{ui}</Provider>
        </Router>
    );
}

describe("PreviewTable", () => {
    test("renders rows for budget lines", async () => {
        customRender(
            <BudgetLinesTable
                canUserEditBudgetLines={false}
                budgetLines={mockBudgetLinesOne}
                handleSetBudgetLineForEditing={() => {}}
                handleDeleteBudgetLine={() => {}}
                handleDuplicateBudgetLine={() => {}}
                isReviewMode={true}
                readOnly={true}
                procurementShop={procurementShop}
            />,
            store
        );
        await waitFor(() => {
            mockBudgetLinesOne.forEach((bl) => {
                expect(screen.getByText(bl.id)).toBeInTheDocument();
            });
        });
    });

    test("status changes based on input", () => {
        customRender(
            <BudgetLinesTable
                canUserEditBudgetLines={false}
                budgetLines={mockBudgetLines}
                handleSetBudgetLineForEditing={() => {}}
                handleDeleteBudgetLine={() => {}}
                handleDuplicateBudgetLine={() => {}}
                isReviewMode={true}
                readOnly={true}
                procurementShop={procurementShop}
            />,
            store
        );
        expect(screen.getByText("Draft")).toBeInTheDocument();
        expect(screen.getByText("Obligated")).toBeInTheDocument();
    });
});
