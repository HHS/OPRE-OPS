import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import BudgetLinesForm from "./BudgetLinesForm";
import suite from "./suite";
import { USER_ROLES } from "../../Users/User.constants";

// Create mock store with different user roles for testing
const createMockStore = (userRoles = [], is_superuser = false) => {
    return configureStore({
        reducer: {
            auth: (state = { activeUser: { roles: userRoles, is_superuser } }) => state
        },
        preloadedState: {
            auth: {
                activeUser: {
                    roles: userRoles,
                    is_superuser
                }
            }
        }
    });
};

// Mock external components to focus on validation logic
vi.mock("../../CANs/CanComboBox", () => ({
    default: ({ messages, className }) => (
        <div
            data-testid="can-combobox"
            data-messages={JSON.stringify(messages)}
            className={className}
        >
            CAN ComboBox
        </div>
    )
}));

vi.mock("../../ServicesComponents/AllServicesComponentSelect", () => ({
    default: ({ messages, className }) => (
        <div
            data-testid="services-component-select"
            data-messages={JSON.stringify(messages)}
            className={className}
        >
            Services Component Select
        </div>
    )
}));

vi.mock("../../UI/Form/CurrencyInput", () => ({
    default: ({ messages, className }) => (
        <div
            data-testid="currency-input"
            data-messages={JSON.stringify(messages)}
            className={className}
        >
            Currency Input
        </div>
    )
}));

vi.mock("../../UI/USWDS/DatePicker", () => ({
    default: ({ messages, className }) => (
        <div
            data-testid="date-picker"
            data-messages={JSON.stringify(messages)}
            className={className}
        >
            Date Picker
        </div>
    )
}));

vi.mock("../../UI/Form/TextArea/TextArea", () => ({
    default: () => <div data-testid="text-area">Text Area</div>
}));

describe("BudgetLinesForm Validation Integration", () => {
    const mockFn = vi.fn();

    const defaultProps = {
        agreementId: 1,
        selectedCan: { id: 1, number: "G123456" },
        setSelectedCan: mockFn,
        servicesComponentId: 1,
        servicesComponentNumber: 10,
        setServicesComponentId: mockFn,
        setServicesComponentNumber: mockFn,
        enteredAmount: 1000,
        setEnteredAmount: mockFn,
        enteredDescription: "Test description",
        setEnteredDescription: mockFn,
        needByDate: "12/31/2026",
        setNeedByDate: mockFn,
        handleEditBLI: mockFn,
        handleAddBLI: mockFn,
        handleResetForm: mockFn,
        isEditing: true,
        isReviewMode: true,
        budgetFormSuite: suite,
        datePickerSuite: suite,
        isBudgetLineNotDraft: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Regular User Validation", () => {
        it("should show validation errors for regular users with invalid data", () => {
            const regularUserStore = createMockStore(
                [{ id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }],
                false
            );
            const propsWithInvalidData = {
                ...defaultProps,
                selectedCan: null,
                servicesComponentNumber: null,
                enteredAmount: null,
                needByDate: ""
            };

            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm {...propsWithInvalidData} />
                </Provider>
            );

            // Check that validation error classes are applied
            const canComboBox = screen.getByTestId("can-combobox");
            const servicesSelect = screen.getByTestId("services-component-select");
            const currencyInput = screen.getByTestId("currency-input");
            const datePicker = screen.getByTestId("date-picker");

            expect(canComboBox).toHaveClass("usa-form-group--error");
            expect(servicesSelect).toHaveClass("usa-form-group--error");
            expect(currencyInput).toHaveClass("usa-form-group--error");
            expect(datePicker).toHaveClass("usa-form-group--error");
        });

        it("should show success classes for regular users with valid data", () => {
            const regularUserStore = createMockStore([{ id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }]);

            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm {...defaultProps} />
                </Provider>
            );

            // Check that success classes are applied
            const canComboBox = screen.getByTestId("can-combobox");
            const servicesSelect = screen.getByTestId("services-component-select");
            const currencyInput = screen.getByTestId("currency-input");
            const datePicker = screen.getByTestId("date-picker");

            expect(canComboBox).toHaveClass("success");
            expect(servicesSelect).toHaveClass("success");
            expect(currencyInput).toHaveClass("success");
            expect(datePicker).toHaveClass("success");
        });
    });

    describe("SUPER_USER Validation Bypass", () => {
        it("should bypass validation for SUPER_USER with invalid data", () => {
            const superUserStore = createMockStore([{ id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true }], true);
            const propsWithInvalidData = {
                ...defaultProps,
                selectedCan: null,
                servicesComponentId: null,
                enteredAmount: null,
                needByDate: ""
            };

            render(
                <Provider store={superUserStore}>
                    <BudgetLinesForm {...propsWithInvalidData} />
                </Provider>
            );

            // For SUPER_USER, validation suite bypasses all tests (returns early)
            // This means classnames returns empty string, not "success"
            const canComboBox = screen.getByTestId("can-combobox");
            const servicesSelect = screen.getByTestId("services-component-select");
            const currencyInput = screen.getByTestId("currency-input");
            const datePicker = screen.getByTestId("date-picker");

            // When validation is bypassed, classnames returns empty string
            expect(canComboBox).not.toHaveClass("usa-form-group--error");
            expect(servicesSelect).not.toHaveClass("usa-form-group--error");
            expect(currencyInput).not.toHaveClass("usa-form-group--error");
            expect(datePicker).not.toHaveClass("usa-form-group--error");

            // Check that no error messages are passed to components
            expect(canComboBox.getAttribute("data-messages")).toBe("[]");
            expect(servicesSelect.getAttribute("data-messages")).toBe("[]");
            expect(currencyInput.getAttribute("data-messages")).toBe("[]");
            expect(datePicker.getAttribute("data-messages")).toBe("[]");
        });

        it("should enable update button for SUPER_USER even with invalid data", () => {
            const superUserStore = createMockStore([{ id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true }], true);
            const propsWithInvalidData = {
                ...defaultProps,
                selectedCan: null,
                servicesComponentId: null,
                enteredAmount: null,
                needByDate: ""
            };

            render(
                <Provider store={superUserStore}>
                    <BudgetLinesForm {...propsWithInvalidData} />
                </Provider>
            );

            const updateButton = screen.getByText("Update Budget Line");
            expect(updateButton).not.toBeDisabled();
        });
    });

    describe("Mixed Role Scenarios", () => {
        it("should bypass validation when SUPER_USER is present with other roles", () => {
            const mixedRolesStore = createMockStore(
                [
                    { id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false },
                    { id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true },
                    { id: 4, name: USER_ROLES.BUDGET_TEAM, is_superuser: false }
                ],
                true
            );
            const propsWithInvalidData = {
                ...defaultProps,
                selectedCan: null,
                servicesComponentId: null,
                enteredAmount: null,
                needByDate: ""
            };

            render(
                <Provider store={mixedRolesStore}>
                    <BudgetLinesForm {...propsWithInvalidData} />
                </Provider>
            );

            // Should still bypass validation (no error classes)
            const canComboBox = screen.getByTestId("can-combobox");
            expect(canComboBox).not.toHaveClass("usa-form-group--error");
        });
    });

    describe("Non-editing and Non-review Mode", () => {
        it("should not validate when not in editing mode (new budget line creation)", () => {
            const regularUserStore = createMockStore([{ id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }]);
            const propsNotEditing = {
                ...defaultProps,
                isEditing: false,
                isReviewMode: true,
                isBudgetLineNotDraft: true,
                servicesComponentId: null,
                selectedCan: null,
                enteredAmount: null,
                needByDate: ""
            };

            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm {...propsNotEditing} />
                </Provider>
            );

            // Should show success classes since validation doesn't run when not editing
            const canComboBox = screen.getByTestId("can-combobox");
            expect(canComboBox).toHaveClass("success");
        });

        it("should not validate when not in review mode and is draft", () => {
            const regularUserStore = createMockStore([{ id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }]);
            const propsNotReviewMode = {
                ...defaultProps,
                isReviewMode: false,
                isBudgetLineNotDraft: false,
                selectedCan: null,
                servicesComponentId: null,
                enteredAmount: null,
                needByDate: ""
            };

            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm {...propsNotReviewMode} />
                </Provider>
            );

            // Should show success classes since validation doesn't run
            const canComboBox = screen.getByTestId("can-combobox");
            expect(canComboBox).toHaveClass("success");
        });
    });
});
