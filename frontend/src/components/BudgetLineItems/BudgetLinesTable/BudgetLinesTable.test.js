import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
        proc_shop_fee_percentage: 5.0,
        status: "DRAFT",
        created_by: "1",
        comments: "Note 1"
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
        proc_shop_fee_percentage: 5.0,
        status: "DRAFT",
        created_by: "1",
        comments: "Note 1"
    },
    {
        id: 2,
        display_name: "BudgetLineItem#2",
        created_on: "2021-09-01",
        date_needed: "2021-10-30",
        can: { number: "002" },
        amount: 2000,
        proc_shop_fee_percentage: 7.0,
        status: "OBLIGATED",
        created_by: "2",
        comments: "Note 2"
    }
];

const procurementShop = {
    id: 1,
    name: "General Services",
    abbr: "GCS",
    fee_percentage: 5.0
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

    test("renders Fee and Total columns for non-grant budget lines", () => {
        customRender(
            <BudgetLinesTable
                budgetLines={mockBudgetLinesOne}
                readOnly={true}
            />,
            store
        );
        expect(screen.getByText("Fee")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
    });

    test("omits Fee and Total columns for grant budget lines", () => {
        customRender(
            <BudgetLinesTable
                budgetLines={mockBudgetLinesOne}
                readOnly={true}
                isGrant={true}
            />,
            store
        );
        expect(screen.queryByText("Fee")).not.toBeInTheDocument();
        expect(screen.queryByText("Total")).not.toBeInTheDocument();
        // Grant tables still show the core columns
        expect(screen.getByText("Amount")).toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
    });

    test("omits the CLIN column by default", () => {
        customRender(
            <BudgetLinesTable
                budgetLines={mockBudgetLinesOne}
                readOnly={true}
            />,
            store
        );
        expect(screen.queryByText("CLIN")).not.toBeInTheDocument();
    });

    test("renders the CLIN column when showClinColumn is true", () => {
        customRender(
            <BudgetLinesTable
                budgetLines={mockBudgetLinesOne}
                readOnly={true}
                showClinColumn={true}
            />,
            store
        );
        expect(screen.getByText("CLIN")).toBeInTheDocument();
        // Fee/Total are still present for non-grant awarded contracts
        expect(screen.getByText("Fee")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
    });

    test("renders the CLIN header as a sortable button when the column is shown", () => {
        customRender(
            <BudgetLinesTable
                budgetLines={mockBudgetLinesOne}
                readOnly={true}
                showClinColumn={true}
            />,
            store
        );
        expect(screen.getByRole("button", { name: /CLIN/ })).toBeInTheDocument();
    });

    test("sorts by CLIN numerically when the CLIN header is clicked, pinning CLIN-less rows last", () => {
        const clinBudgetLines = [
            { id: 1, created_on: "2021-08-01", status: "PLANNED", can: { number: "001" }, clin: { number: 10 } },
            { id: 2, created_on: "2021-08-02", status: "PLANNED", can: { number: "002" }, clin: { number: 2 } },
            { id: 3, created_on: "2021-08-03", status: "PLANNED", can: { number: "003" }, clin: null },
            { id: 4, created_on: "2021-08-04", status: "DRAFT", can: { number: "004" }, clin: { number: 5 } }
        ];

        customRender(
            <BudgetLinesTable
                budgetLines={clinBudgetLines}
                readOnly={true}
                showClinColumn={true}
            />,
            store
        );

        // Reads the CLIN cell (second column, after BL ID #) of every data row, top to bottom.
        const clinColumnOrder = () =>
            screen
                .getAllByRole("row")
                .slice(1) // drop the header row
                .map((row) => within(row).getAllByRole("cell")[1]?.textContent);

        // First click on a new header sorts descending (useSetSortConditions forces descending
        // when the sort column changes): 10, 2, then "TBD" (non-draft, no CLIN) and "N/A" (Draft) last.
        fireEvent.click(screen.getByRole("button", { name: /CLIN/ }));
        const descending = clinColumnOrder();
        expect(descending.slice(0, 2)).toEqual(["10", "2"]);
        expect(descending.slice(2)).toEqual(expect.arrayContaining(["TBD", "N/A"]));

        // Second click flips to ascending but keeps CLIN-less rows pinned last.
        fireEvent.click(screen.getByRole("button", { name: /CLIN/ }));
        const ascending = clinColumnOrder();
        expect(ascending.slice(0, 2)).toEqual(["2", "10"]);
        expect(ascending.slice(2)).toEqual(expect.arrayContaining(["TBD", "N/A"]));
    });
});
