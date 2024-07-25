import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";
import { useGetAgreementByIdQuery, useGetCansQuery, useGetUserByIdQuery } from "../../../api/opsAPI";
import store from "../../../store";
import { agreement } from "../../../tests/data";
import BLIDiffTable from "./BLIDiffTable";

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
        proc_shop_fee_percentage: 0.05,
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
        proc_shop_fee_percentage: 0.07,
        status: "OBLIGATED",
        created_by: "2",
        comments: "Note 2"
    }
];

function customRender(ui, store) {
    return render(
        <Router location="/agreements/approve/1?type=budget-change">
            <Provider store={store}>{ui}</Provider>
        </Router>
    );
}

useGetUserByIdQuery.mockReturnValue({ data: "John Doe" });
useGetAgreementByIdQuery.mockReturnValue({ data: agreement });
useGetCansQuery.mockReturnValue({ data: [{ id: 1, code: "CAN 1", name: "CAN 1" }] });
vi.mock("../../../api/opsAPI");

describe("PreviewTable", () => {
    test("renders rows for budget lines", async () => {
        customRender(
            <BLIDiffTable
                budgetLines={mockBudgetLinesOne}
                changeType="Budget Change"
            />,
            store
        );

        await waitFor(() => {
            mockBudgetLinesOne.forEach((bl) => {
                expect(screen.getByText(bl.id)).toBeInTheDocument();
            });
        });
        screen.getByRole("columnheader", { name: "BL ID #" });
        screen.getByRole("columnheader", { name: "Obligated By" });
        screen.getByRole("columnheader", { name: "FY" });
        screen.getByRole("columnheader", { name: "CAN" });
        screen.getByRole("columnheader", { name: "Amount" });
        screen.getByRole("columnheader", { name: "Fee" });
        screen.getByRole("columnheader", { name: "Status" });
        expect(screen.getAllByRole("row")).toHaveLength(2);
    });

    test("renders multiple rows", async () => {
        customRender(
            <BLIDiffTable
                budgetLines={mockBudgetLines}
                changeType="Budget Change"
            />,
            store
        );
        await waitFor(() => {
            mockBudgetLinesOne.forEach((bl) => {
                expect(screen.getByText(bl.id)).toBeInTheDocument();
            });
        });

        expect(screen.getAllByRole("row")).toHaveLength(3);
        expect(screen.getByText("Draft")).toBeInTheDocument();
        expect(screen.getByText("$2,000.00")).toBeInTheDocument();
        expect(screen.getByText("$140.00")).toBeInTheDocument();
        expect(screen.getByText("$2,140.00")).toBeInTheDocument();
        expect(screen.getByText("Obligated")).toBeInTheDocument();
        expect(screen.getByText("$1,200.00")).toBeInTheDocument();
        expect(screen.getByText("$60.00")).toBeInTheDocument();
        expect(screen.getByText("$1,260.00")).toBeInTheDocument();
    });
});
