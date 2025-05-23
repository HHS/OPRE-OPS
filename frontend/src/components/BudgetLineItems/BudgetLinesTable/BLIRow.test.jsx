import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Router } from "react-router-dom";
import { useGetUserByIdQuery, useGetAgreementByIdQuery, useGetCansQuery } from "../../../api/opsAPI";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import store from "../../../store";
import BLIRow from "./BLIRow";
import { budgetLine, agreement } from "../../../tests/data";

const mockFn = TestApplicationContext.helpers().mockFn;

const renderComponent = () => {
    useGetUserByIdQuery.mockReturnValue({ data: { full_name: "John Doe" } });
    useGetAgreementByIdQuery.mockReturnValue({ data: agreement });
    useGetCansQuery.mockReturnValue({ data: [{ id: 1, code: "CAN 1", name: "CAN 1" }] });

    const handleDeleteBudgetLine = mockFn;
    const handleDuplicateBudgetLine = mockFn;
    const handleSetBudgetLineForEditing = mockFn;
    render(
        <Router location="/">
            <Provider store={store}>
                <BLIRow
                    budgetLine={budgetLine}
                    canUserEditBudgetLines={true}
                    handleDeleteBudgetLine={handleDeleteBudgetLine}
                    handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                    handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                    isBLIInCurrentWorkflow={false}
                    isReviewMode={false}
                    readOnly={false}
                    duplicateIcon={true}
                />
            </Provider>
        </Router>
    );
};

vi.mock("../../../api/opsAPI");
describe("BLIRow", () => {
    it("should render the BLIRow component", () => {
        renderComponent();

        const needByDate = screen.getByRole("cell", { name: "6/13/2043" });
        const FY = screen.getByRole("cell", { name: "2043" });
        const status = screen.getByRole("cell", { name: "Draft" });
        const dollarAmount = screen.queryAllByText("$1,000,000.00");

        expect(needByDate).toBeInTheDocument();
        expect(FY).toBeInTheDocument();
        expect(status).toBeInTheDocument();
        expect(dollarAmount).toHaveLength(2);
    });
    it("should be expandable", async () => {
        renderComponent();

        const user = userEvent.setup();
        const expandButton = screen.getByTestId("expand-row");
        await user.click(expandButton);
        const expandedRow = screen.getByTestId("expanded-data");
        const createdBy = screen.getByText("TBD");
        const createdDate = screen.getByText("May 27, 2024");
        const notes = screen.getByText(/li 1/i);

        expect(expandedRow).toBeInTheDocument();
        expect(createdBy).toBeInTheDocument();
        expect(createdDate).toBeInTheDocument();
        expect(notes).toBeInTheDocument();
    });
    it("should render edit icons when mouse over when agreement is not read-only", async () => {
        renderComponent();

        const user = userEvent.setup();
        const tag = screen.getByText("Draft");
        expect(tag).toBeInTheDocument();
        await user.hover(tag);

        const editBtn = screen.getByLabelText("Edit");
        const deleteBtn = screen.getByLabelText("Delete");
        const duplicateBtn = screen.getByLabelText("Duplicate");

        expect(tag).not.toBeInTheDocument();
        expect(editBtn).toBeInTheDocument();
        expect(deleteBtn).toBeInTheDocument();
        expect(duplicateBtn).toBeInTheDocument();
    });
});
