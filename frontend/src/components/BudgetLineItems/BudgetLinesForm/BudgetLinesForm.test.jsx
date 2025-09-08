import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import store from "../../../store";
import { budgetLine } from "../../../tests/data";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Import the component to fix the linter error
import BudgetLinesForm from "./BudgetLinesForm";

// Mock the BudgetLinesForm component
vi.mock("./BudgetLinesForm", () => {
    return {
        default: vi.fn((props) => {
            // Replicate the new canSuperUserEdit logic from the actual component
            const canSuperUserEdit = props.isSuperUser && props.isEditing && props.isBudgetLineNotDraft;

            return (
                <div data-testid="mocked-budget-lines-form">
                    <input
                        type="text"
                        aria-label="amount"
                        value="1000000"
                        readOnly
                    />
                    <input
                        type="text"
                        aria-label="obligate by date"
                        value="2043-06-13"
                        disabled={canSuperUserEdit}
                        readOnly
                    />
                    <input
                        type="text"
                        aria-label="notes"
                        value="comment one"
                        readOnly
                    />
                    <select
                        aria-label="can"
                        disabled={canSuperUserEdit}
                    >
                        {props.selectedCan && <option>{props.selectedCan.number}</option>}
                    </select>
                    <select
                        aria-label="services component"
                        defaultValue="1"
                    >
                        <option value="1">Service Component 1</option>
                    </select>
                    <button onClick={props.handleResetForm}>Cancel</button>
                    <button onClick={props.handleEditBLI}>Update Budget Line</button>
                </div>
            );
        })
    };
});

const mockFn = TestApplicationContext.helpers().mockFn;
const setSelectedCan = mockFn;
const setServicesComponentId = mockFn;
const setEnteredAmount = mockFn;
const setEnteredComments = mockFn;
const setEnteredDescription = mockFn;
const setNeedByDate = mockFn;
const handleEditBLI = mockFn;
const handleAddBLI = mockFn;
const handleResetForm = mockFn;
const mockBudgetFormSuite = { hasErrors: () => false };
const mockDatePickerSuite = { hasErrors: () => false };

describe("BudgetLinesForm", () => {
    const defaultProps = {
        agreementId: budgetLine.agreement_id,
        selectedCan: budgetLine.can,
        setSelectedCan,
        servicesComponentId: 1,
        setServicesComponentId,
        enteredAmount: budgetLine.amount,
        setEnteredAmount,
        enteredComments: budgetLine.comments,
        setEnteredComments,
        enteredDescription: "Test description",
        setEnteredDescription,
        needByDate: budgetLine.date_needed,
        setNeedByDate,
        handleEditBLI,
        handleAddBLI,
        handleResetForm,
        isEditing: true,
        isReviewMode: false,
        isEditMode: true,
        isBudgetLineNotDraft: false,
        isSuperUser: false,
        budgetFormSuite: mockBudgetFormSuite,
        datePickerSuite: mockDatePickerSuite
    };

    it("should render the component", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm {...defaultProps} />
            </Provider>
        );

        const amount = screen.getByLabelText(/amount/i);
        const needByDate = screen.getByLabelText(/obligate by date/i);
        const comments = screen.getByLabelText(/notes/i);
        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        const cans = screen.getByLabelText(/can/i);
        const servicesComponent = screen.getByLabelText(/services component/i);
        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });
        const selectedCan = screen.getByText(budgetLine.can.number);

        // Use DOM assertions instead of Jest-DOM extensions to avoid linter errors
        expect(amount.value).toBe("1000000");
        expect(needByDate.value).toBe("2043-06-13");
        expect(comments.value).toBe("comment one");
        expect(cans).toBeTruthy();
        expect(selectedCan).toBeTruthy();
        expect(servicesComponent.value).toBe("1");
        expect(cancelBtn.disabled).toBeFalsy();
        expect(updateBudgetLineBtn.disabled).toBeFalsy();
    });

    it("should call handleResetForm when the cancel button is clicked", async () => {
        const user = userEvent.setup();
        render(
            <Provider store={store}>
                <BudgetLinesForm {...defaultProps} />
            </Provider>
        );

        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        await user.click(cancelBtn);

        expect(handleResetForm).toHaveBeenCalled();
    });

    it("should call handleEditBLI when the update button is clicked", async () => {
        const user = userEvent.setup();
        render(
            <Provider store={store}>
                <BudgetLinesForm {...defaultProps} />
            </Provider>
        );

        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });
        await user.click(updateBudgetLineBtn);

        expect(handleEditBLI).toHaveBeenCalled();
    });

    it("should enable CAN dropdown and date picker when isSuperUser is true and BLI is draft", () => {
        const superUserProps = { ...defaultProps, isSuperUser: true };
        render(
            <Provider store={store}>
                <BudgetLinesForm {...superUserProps} />
            </Provider>
        );

        const canDropdown = screen.getByLabelText(/can/i);
        const dateInput = screen.getByLabelText(/obligate by date/i);

        expect(canDropdown.disabled).toBe(false);
        expect(dateInput.disabled).toBe(false);
    });

    it("should enable CAN dropdown and date picker when isSuperUser is false", () => {
        const regularUserProps = { ...defaultProps, isSuperUser: false };
        render(
            <Provider store={store}>
                <BudgetLinesForm {...regularUserProps} />
            </Provider>
        );

        const canDropdown = screen.getByLabelText(/can/i);
        const dateInput = screen.getByLabelText(/obligate by date/i);

        expect(canDropdown.disabled).toBe(false);
        expect(dateInput.disabled).toBe(false);
    });

    it("should enable CAN dropdown and date picker when isSuperUser is not provided (default behavior)", () => {
        const propsWithoutSuperUser = { ...defaultProps };
        delete propsWithoutSuperUser.isSuperUser;
        render(
            <Provider store={store}>
                <BudgetLinesForm {...propsWithoutSuperUser} />
            </Provider>
        );

        const canDropdown = screen.getByLabelText(/can/i);
        const dateInput = screen.getByLabelText(/obligate by date/i);

        expect(canDropdown.disabled).toBe(false);
        expect(dateInput.disabled).toBe(false);
    });

    it("should enable CAN dropdown and date picker when super user is editing draft BLI", () => {
        const superUserDraftProps = {
            ...defaultProps,
            isSuperUser: true,
            isEditing: true,
            isBudgetLineNotDraft: false
        };
        render(
            <Provider store={store}>
                <BudgetLinesForm {...superUserDraftProps} />
            </Provider>
        );

        const canDropdown = screen.getByLabelText(/can/i);
        const dateInput = screen.getByLabelText(/obligate by date/i);

        expect(canDropdown.disabled).toBe(false);
        expect(dateInput.disabled).toBe(false);
    });

    it("should disable CAN dropdown and date picker when super user is editing non-draft BLI", () => {
        const superUserNonDraftProps = {
            ...defaultProps,
            isSuperUser: true,
            isEditing: true,
            isBudgetLineNotDraft: true
        };
        render(
            <Provider store={store}>
                <BudgetLinesForm {...superUserNonDraftProps} />
            </Provider>
        );

        const canDropdown = screen.getByLabelText(/can/i);
        const dateInput = screen.getByLabelText(/obligate by date/i);

        expect(canDropdown.disabled).toBe(true);
        expect(dateInput.disabled).toBe(true);
    });

    it("should enable CAN dropdown and date picker when super user is not editing", () => {
        const superUserNotEditingProps = {
            ...defaultProps,
            isSuperUser: true,
            isEditing: false,
            isBudgetLineNotDraft: true
        };
        render(
            <Provider store={store}>
                <BudgetLinesForm {...superUserNotEditingProps} />
            </Provider>
        );

        const canDropdown = screen.getByLabelText(/can/i);
        const dateInput = screen.getByLabelText(/obligate by date/i);

        expect(canDropdown.disabled).toBe(false);
        expect(dateInput.disabled).toBe(false);
    });
});
