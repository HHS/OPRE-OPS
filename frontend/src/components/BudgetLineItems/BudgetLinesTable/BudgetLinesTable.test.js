import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import BudgetLinesTable from "./BudgetLinesTable";
import store from "../../../store";

const dummyBudgetLines = [
    {
        id: 1,
        line_description: "Description 1",
        created_on: "2021-08-20",
        date_needed: "2021-09-15",
        can: { number: "001" },
        amount: 1200,
        psc_fee_amount: 0.05,
        status: "DRAFT",
        created_by: "1",
        comments: "Note 1"
    },
    {
        id: 2,
        line_description: "Description 2",
        created_on: "2021-09-01",
        date_needed: "2021-10-30",
        can: { number: "002" },
        amount: 2000,
        psc_fee_amount: 0.07,
        status: "OBLIGATED",
        created_by: "2",
        comments: "Note 2"
    }
];

function customRender(ui, store) {
    return render(<Provider store={store}>{ui}</Provider>);
}

describe("PreviewTable", () => {
    test("renders rows for budget lines", () => {
        customRender(
            <BudgetLinesTable
                canUserEditBudgetLines={false}
                budgetLinesAdded={dummyBudgetLines}
                handleSetBudgetLineForEditing={() => {}}
                handleDeleteBudgetLine={() => {}}
                handleDuplicateBudgetLine={() => {}}
                isReviewMode={true}
                readOnly={true}
            />,
            store
        );
        dummyBudgetLines.forEach((bl) => {
            expect(screen.getByText(bl.line_description)).toBeInTheDocument();
        });
    });

    test("status changes based on input", () => {
        customRender(
            <BudgetLinesTable
                canUserEditBudgetLines={false}
                budgetLinesAdded={dummyBudgetLines}
                handleSetBudgetLineForEditing={() => {}}
                handleDeleteBudgetLine={() => {}}
                handleDuplicateBudgetLine={() => {}}
                isReviewMode={true}
                readOnly={true}
            />,
            store
        );
        expect(screen.getByText("Draft")).toBeInTheDocument();
        expect(screen.getByText("Obligated")).toBeInTheDocument();
    });
});
