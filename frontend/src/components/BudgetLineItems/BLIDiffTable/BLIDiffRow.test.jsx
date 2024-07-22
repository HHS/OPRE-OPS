import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";
import { vi } from "vitest";
import { useGetAgreementByIdQuery, useGetCansQuery, useGetUserByIdQuery } from "../../../api/opsAPI";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import store from "../../../store";
import { agreement, budgetLine } from "../../../tests/data";
import BLIDiffRow from "./BLIDiffRow";

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
                <BLIDiffRow
                    budgetLine={budgetLine}
                    canUserEditBudgetLines={true}
                    handleDeleteBudgetLine={handleDeleteBudgetLine}
                    handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                    handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                    isBLIInCurrentWorkflow={false}
                    isReviewMode={false}
                    readOnly={false}
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
        const createdBy = screen.getByText("unknown");
        const createdDate = screen.getByText("May 27, 2024");
        const notes = screen.getByText(/comment/i);

        expect(expandedRow).toBeInTheDocument();
        expect(createdBy).toBeInTheDocument();
        expect(createdDate).toBeInTheDocument();
        expect(notes).toBeInTheDocument();
    });
});
