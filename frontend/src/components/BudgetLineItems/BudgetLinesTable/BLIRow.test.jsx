import { Provider } from "react-redux";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Router } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import {
    useGetUserByIdQuery,
    useGetAgreementByIdQuery,
    useGetCansQuery,
    useGetProcurementShopsQuery
} from "../../../api/opsAPI";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import authSlice from "../../../components/Auth/authSlice";
import BLIRow from "./BLIRow";
import { budgetLine, agreement } from "../../../tests/data";
import { USER_ROLES } from "../../Users/User.constants";

const mockFn = TestApplicationContext.helpers().mockFn;

const createMockStore = (userRoles = []) => {
    return configureStore({
        reducer: {
            auth: authSlice
        },
        preloadedState: {
            auth: {
                activeUser: {
                    id: 1,
                    roles: userRoles
                }
            }
        }
    });
};

const renderComponent = (userRoles = [], canUserEditBudgetLines = true, budgetLineOverrides = {}) => {
    useGetUserByIdQuery.mockReturnValue({ data: { full_name: "John Doe" } });
    useGetAgreementByIdQuery.mockReturnValue({ data: agreement });
    useGetCansQuery.mockReturnValue({ data: [{ id: 1, code: "CAN 1", name: "CAN 1" }] });
    useGetProcurementShopsQuery.mockReturnValue({ data: [], isSuccess: true });

    const mockStore = createMockStore(userRoles);
    const handleDeleteBudgetLine = mockFn;
    const handleDuplicateBudgetLine = mockFn;
    const handleSetBudgetLineForEditing = mockFn;

    const testBli = { ...budgetLine, fees: 1.23456, ...budgetLineOverrides };
    render(
        <Router location="/">
            <Provider store={mockStore}>
                <BLIRow
                    budgetLine={testBli}
                    isEditable={canUserEditBudgetLines}
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

vi.mock("../../../api/opsAPI", () => ({
    useGetUserByIdQuery: vi.fn(),
    useGetAgreementByIdQuery: vi.fn(),
    useGetCansQuery: vi.fn(),
    useGetProcurementShopsQuery: vi.fn()
}));
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
        expect(dollarAmount).toHaveLength(1);
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

        const editBtn = screen.getByTestId("edit-row");
        const deleteBtn = screen.getByTestId("delete-row");
        const duplicateBtn = screen.getByTestId("duplicate-row");

        expect(tag).not.toBeInTheDocument();
        expect(editBtn).toBeInTheDocument();
        expect(deleteBtn).toBeInTheDocument();
        expect(duplicateBtn).toBeInTheDocument();
    });

    it("should allow super user to edit budget lines regardless of agreement edit permissions when not in review", async () => {
        renderComponent([USER_ROLES.SUPER_USER], false, { in_review: false, _meta: { isEditable: true } }); // Super user with no agreement edit permissions, not in review

        const user = userEvent.setup();
        const tag = screen.getByText("Draft");
        await user.hover(tag);

        const editBtn = screen.getByTestId("edit-row");
        expect(editBtn).toBeInTheDocument();
        expect(editBtn).not.toBeDisabled();
    });

    it("should not allow super user to edit budget lines when in review", async () => {
        renderComponent([USER_ROLES.SUPER_USER], false, { in_review: true, _meta: { isEditable: false } }); // Super user with budget line in review

        const user = userEvent.setup();
        const tag = screen.getByText("In Review");
        await user.hover(tag);

        const editBtn = screen.getByTestId("edit-row");
        expect(editBtn).toBeInTheDocument();
        expect(editBtn).toBeDisabled();
    });

    it("should allow super user to edit budget lines when not in review", async () => {
        renderComponent([USER_ROLES.SUPER_USER], true, { in_review: false }); // Super user with budget line not in review

        const user = userEvent.setup();
        const tag = screen.getByText("Draft");
        await user.hover(tag);

        const editBtn = screen.getByTestId("edit-row");
        expect(editBtn).toBeInTheDocument();
        expect(editBtn).not.toBeDisabled();
    });

    it("should not allow regular user to edit when agreement edit permissions are false", async () => {
        renderComponent([USER_ROLES.VIEWER_EDITOR], false, { _meta: { isEditable: false } }); // Regular user with no agreement edit permissions

        const user = userEvent.setup();
        const tag = screen.getByText("Draft");
        await user.hover(tag);

        // Edit button should be disabled for regular users without edit permissions
        const editBtn = screen.getByTestId("edit-row");
        expect(editBtn).toBeDisabled();
    });

    it("should allow regular user to edit when they have agreement edit permissions and budget line is editable", async () => {
        renderComponent([USER_ROLES.VIEWER_EDITOR], true, { in_review: false }); // Regular user with agreement edit permissions

        const user = userEvent.setup();
        const tag = screen.getByText("Draft");
        await user.hover(tag);

        const editBtn = screen.getByTestId("edit-row");
        expect(editBtn).toBeInTheDocument();
        expect(editBtn).not.toBeDisabled();
    });

    it("should not allow regular user to edit when budget line is in review", async () => {
        renderComponent([USER_ROLES.VIEWER_EDITOR], true, { in_review: true, _meta: { isEditable: false } }); // Regular user with budget line in review

        const user = userEvent.setup();
        const tag = screen.getByText("In Review");
        await user.hover(tag);

        const editBtn = screen.getByTestId("edit-row");
        expect(editBtn).toBeInTheDocument();
        expect(editBtn).toBeDisabled();
    });

    it("should allow super user to edit budget lines with any status when not in review", async () => {
        // Create a budget line with executed status (normally not editable) but not in review
        const executedBudgetLine = {
            ...budgetLine,
            status: "IN_EXECUTION",
            in_review: false,
            _meta: { isEditable: true }
        };

        useGetUserByIdQuery.mockReturnValue({ data: { full_name: "John Doe" } });
        useGetAgreementByIdQuery.mockReturnValue({ data: agreement });
        useGetCansQuery.mockReturnValue({ data: [{ id: 1, code: "CAN 1", name: "CAN 1" }] });
        useGetProcurementShopsQuery.mockReturnValue({ data: [], isSuccess: true });

        const mockStore = createMockStore([USER_ROLES.SUPER_USER]);
        const handleDeleteBudgetLine = mockFn;
        const handleDuplicateBudgetLine = mockFn;
        const handleSetBudgetLineForEditing = mockFn;

        render(
            <Router location="/">
                <Provider store={mockStore}>
                    <BLIRow
                        budgetLine={executedBudgetLine}
                        isEditable={true}
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

        const user = userEvent.setup();
        const tag = screen.getByText("Executing");
        await user.hover(tag);

        // Super user should be able to edit even executed budget lines when not in review
        const editBtn = screen.getByTestId("edit-row");
        expect(editBtn).toBeInTheDocument();
        expect(editBtn).not.toBeDisabled();
    });

    it("should not allow super user to edit budget lines with any status when in review", async () => {
        // Create a budget line with executed status and in review
        const executedBudgetLineInReview = {
            ...budgetLine,
            status: "IN_EXECUTION",
            in_review: true,
            _meta: { isEditable: false }
        };

        useGetUserByIdQuery.mockReturnValue({ data: { full_name: "John Doe" } });
        useGetAgreementByIdQuery.mockReturnValue({ data: agreement });
        useGetCansQuery.mockReturnValue({ data: [{ id: 1, code: "CAN 1", name: "CAN 1" }] });
        useGetProcurementShopsQuery.mockReturnValue({ data: [], isSuccess: true });

        const mockStore = createMockStore([USER_ROLES.SUPER_USER]);
        const handleDeleteBudgetLine = mockFn;
        const handleDuplicateBudgetLine = mockFn;
        const handleSetBudgetLineForEditing = mockFn;

        render(
            <Router location="/">
                <Provider store={mockStore}>
                    <BLIRow
                        budgetLine={executedBudgetLineInReview}
                        isEditable={true}
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

        const user = userEvent.setup();
        const tag = screen.getByText("In Review");
        await user.hover(tag);

        // Super user should NOT be able to edit budget lines when in review, even with executed status
        const editBtn = screen.getByTestId("edit-row");
        expect(editBtn).toBeInTheDocument();
        expect(editBtn).toBeDisabled();
    });
    it("should display all BIL amount with correct rounded decimal", async () => {
        renderComponent();

        const bliRow = screen.getByTestId("budget-line-row-1");
        const cells = within(bliRow).getAllByRole("cell");
        const amountCell = cells[4];
        const feeCell = cells[5];
        const totalCell = cells[6];

        expect(amountCell).toHaveTextContent(/\$1,000,000\.00/);
        expect(feeCell).toHaveTextContent(/\$1\.23/);
        expect(totalCell).toHaveTextContent(/\$1,000,001\.23/);
    });
});
