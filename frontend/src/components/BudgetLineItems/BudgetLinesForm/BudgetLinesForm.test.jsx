import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import BudgetLinesForm from "./BudgetLinesForm";
import suite from "./suite";
import datePickerSuite from "./datePickerSuite";
import { USER_ROLES } from "../../Users/User.constants";

const POP_ERROR = "Date must fit within the agreement's start and end dates.";

// Returns YYYY-MM-DD n days from today.
const isoFromToday = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// Returns MM/DD/YYYY n days from today.
const screenFromToday = (n) => {
    const iso = isoFromToday(n);
    const [year, month, day] = iso.split("-");
    return `${month}/${day}/${year}`;
};

// Convert YYYY-MM-DD → MM/DD/YYYY.
const isoToScreen = (iso) => {
    const [year, month, day] = iso.split("-");
    return `${month}/${day}/${year}`;
};

// Mount-tracking counters for DatePicker stability regression test.
// A bug where a `React.memo(DatePicker)` wrapper is recreated inside the
// component body causes React to unmount and remount the DatePicker on every
// parent re-render, which produced a Cypress race on `#need-by-date`.
const datePickerMountTracker = { mounts: 0, unmounts: 0 };

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

vi.mock("../../UI/USWDS/DatePicker", async () => {
    const { useEffect } = await import("react");
    const DatePickerMock = ({ messages, className }) => {
        useEffect(() => {
            datePickerMountTracker.mounts += 1;
            return () => {
                datePickerMountTracker.unmounts += 1;
            };
        }, []);
        return (
            <div
                data-testid="date-picker"
                data-messages={JSON.stringify(messages)}
                className={className}
            >
                Date Picker
            </div>
        );
    };
    // Mirror the real module — its default export is itself memoized.
    return { default: DatePickerMock };
});

vi.mock("../../UI/Form/TextArea/TextArea", () => ({
    default: () => <div data-testid="text-area">Text Area</div>
}));

describe("BudgetLinesForm Validation Integration", () => {
    const mockFn = vi.fn();

    // Generate a date that's always in the future for validation tests
    // Use 90 days to ensure it's well into the future even with timezone differences
    const getFutureDate = () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 90);
        const month = String(futureDate.getMonth() + 1).padStart(2, "0");
        const day = String(futureDate.getDate()).padStart(2, "0");
        const year = futureDate.getFullYear();
        return `${month}/${day}/${year}`;
    };

    // Reset suite state before each test to prevent stale validation errors
    beforeEach(() => {
        suite.reset();
        datePickerSuite.reset();
    });

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
        needByDate: getFutureDate(),
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
            const servicesFormGroup = screen.getByTestId("services-component-form-group");
            const currencyInput = screen.getByTestId("currency-input");
            const datePicker = screen.getByTestId("date-picker");

            expect(canComboBox).toHaveClass("usa-form-group--error");
            expect(servicesFormGroup).toHaveClass("usa-form-group--error");
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
            const servicesFormGroup = screen.getByTestId("services-component-form-group");
            const currencyInput = screen.getByTestId("currency-input");
            const datePicker = screen.getByTestId("date-picker");

            expect(canComboBox).toHaveClass("success");
            expect(servicesFormGroup).toHaveClass("success");
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

        it("should keep the DatePicker mounted across parent re-renders", () => {
            // Regression for the inline `React.memo(DatePicker)` wrapper that
            // was recreated on every render and caused the DatePicker to
            // unmount/remount on each parent state change. That race made
            // `cy.clear()` on `#need-by-date` time out in Cypress whenever a
            // sibling field (e.g. `#enteredAmount`) updated parent state.
            const regularUserStore = createMockStore([{ id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }]);
            datePickerMountTracker.mounts = 0;
            datePickerMountTracker.unmounts = 0;

            const { rerender } = render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm {...defaultProps} />
                </Provider>
            );
            expect(datePickerMountTracker.mounts).toBe(1);

            // Simulate sibling-state churn (e.g. user typing into the amount).
            rerender(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...defaultProps}
                        enteredAmount={1500}
                    />
                </Provider>
            );
            rerender(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...defaultProps}
                        enteredAmount={2000}
                    />
                </Provider>
            );

            expect(datePickerMountTracker.mounts).toBe(1);
            expect(datePickerMountTracker.unmounts).toBe(0);
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

    describe("PoP boundary validation — DRAFT BLI is exempt", () => {
        // SC window: opens 30 days out, closes 120 days out.
        const SC_START = isoFromToday(30);
        const SC_END = isoFromToday(120);

        const regularUserStore = createMockStore([{ id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }]);

        // Base props: DRAFT, editing, not review mode — datePickerSuite is active.
        const popBaseProps = {
            ...defaultProps,
            budgetFormSuite: suite,
            datePickerSuite,
            isEditing: true,
            isReviewMode: false,
            isBudgetLineNotDraft: false,
            scStartDate: SC_START,
            scEndDate: SC_END
        };

        it("does not show PoP error when date is before scStartDate", () => {
            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...popBaseProps}
                        needByDate={screenFromToday(15)}
                    />
                </Provider>
            );
            const datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).not.toContain(POP_ERROR);
        });

        it("does not show PoP error when date is after scEndDate", () => {
            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...popBaseProps}
                        needByDate={screenFromToday(130)}
                    />
                </Provider>
            );
            const datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).not.toContain(POP_ERROR);
        });

        it("does not show PoP error when date equals scStartDate exactly", () => {
            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...popBaseProps}
                        needByDate={isoToScreen(SC_START)}
                    />
                </Provider>
            );
            const datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).not.toContain(POP_ERROR);
        });

        it("does not show PoP error when date equals scEndDate exactly", () => {
            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...popBaseProps}
                        needByDate={isoToScreen(SC_END)}
                    />
                </Provider>
            );
            const datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).not.toContain(POP_ERROR);
        });

        it("does not show PoP error when date falls inside the window", () => {
            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...popBaseProps}
                        needByDate={screenFromToday(60)}
                    />
                </Provider>
            );
            const datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).not.toContain(POP_ERROR);
        });

        it("does not show PoP error when needByDate is null", () => {
            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...popBaseProps}
                        needByDate={null}
                    />
                </Provider>
            );
            const datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).not.toContain(POP_ERROR);
        });
    });

    describe("PoP boundary validation — PLANNED BLI", () => {
        const SC_START = isoFromToday(30);
        const SC_END = isoFromToday(120);

        const regularUserStore = createMockStore([{ id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }]);

        // PLANNED BLI: isBudgetLineNotDraft=true, isReviewMode=false
        const plannedBaseProps = {
            ...defaultProps,
            budgetFormSuite: suite,
            datePickerSuite,
            isEditing: true,
            isReviewMode: false,
            isBudgetLineNotDraft: true,
            scStartDate: SC_START,
            scEndDate: SC_END
        };

        it("shows PoP error when date is before scStartDate on a PLANNED BLI", () => {
            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...plannedBaseProps}
                        needByDate={screenFromToday(15)}
                    />
                </Provider>
            );
            const datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).toContain(POP_ERROR);
        });

        it("does not show PoP error when date falls on the boundary of a PLANNED BLI", () => {
            render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...plannedBaseProps}
                        needByDate={isoToScreen(SC_START)}
                    />
                </Provider>
            );
            const datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).not.toContain(POP_ERROR);
        });
    });

    describe("PoP boundary re-validation when the SC window changes elsewhere", () => {
        // Editing a budget line's Services Component (e.g. shrinking its date range on the
        // SC form) doesn't touch this component's own fields — the parent just re-renders
        // BudgetLinesForm with new scStartDate/scEndDate props. The effect in
        // BudgetLinesForm.jsx re-runs datePickerSuite on that prop change specifically so a
        // previously-valid date_needed gets re-flagged without the user touching the date field.
        const regularUserStore = createMockStore([{ id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }]);
        const ORIGINAL_SC_START = isoFromToday(30);
        const ORIGINAL_SC_END = isoFromToday(120);
        // A date valid under the original window but before the narrowed window's new start.
        const NEED_BY_DATE = screenFromToday(45);

        it("flags a previously-valid date once the SC window is edited to exclude it (PLANNED BLI)", () => {
            const baseProps = {
                ...defaultProps,
                budgetFormSuite: suite,
                datePickerSuite,
                isEditing: true,
                isReviewMode: false,
                isBudgetLineNotDraft: true,
                needByDate: NEED_BY_DATE,
                scStartDate: ORIGINAL_SC_START,
                scEndDate: ORIGINAL_SC_END
            };

            const { rerender } = render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm {...baseProps} />
                </Provider>
            );

            // Date starts out inside the window — no error yet.
            let datePicker = screen.getByTestId("date-picker");
            expect(JSON.parse(datePicker.getAttribute("data-messages"))).not.toContain(POP_ERROR);

            // The SC is edited elsewhere so the agreement's window narrows to start AFTER
            // the budget line's existing need-by date. The parent passes the new bounds down;
            // the user has not touched this form's own fields.
            const narrowedStartIso = isoFromToday(60);
            rerender(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...baseProps}
                        scStartDate={narrowedStartIso}
                    />
                </Provider>
            );

            datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).toContain(POP_ERROR);
        });

        it("flags an out-of-window date the moment a DRAFT budget line changes status to PLANNED", () => {
            // The date was always outside the SC window, but DRAFT BLIs are exempt from the
            // PoP check. When the user changes status out of DRAFT (isBudgetLineNotDraft flips
            // to true), the same date must now be flagged without any edit to the date itself.
            const outOfWindowDate = screenFromToday(15); // before ORIGINAL_SC_START (30 days out)
            const baseProps = {
                ...defaultProps,
                budgetFormSuite: suite,
                datePickerSuite,
                isEditing: true,
                isReviewMode: false,
                needByDate: outOfWindowDate,
                scStartDate: ORIGINAL_SC_START,
                scEndDate: ORIGINAL_SC_END
            };

            const { rerender } = render(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...baseProps}
                        isBudgetLineNotDraft={false}
                    />
                </Provider>
            );

            // DRAFT: out-of-window date is exempt, no error.
            let datePicker = screen.getByTestId("date-picker");
            expect(JSON.parse(datePicker.getAttribute("data-messages"))).not.toContain(POP_ERROR);

            // Status change out of DRAFT — no date field touched.
            rerender(
                <Provider store={regularUserStore}>
                    <BudgetLinesForm
                        {...baseProps}
                        isBudgetLineNotDraft={true}
                    />
                </Provider>
            );

            datePicker = screen.getByTestId("date-picker");
            const messages = JSON.parse(datePicker.getAttribute("data-messages"));
            expect(messages).toContain(POP_ERROR);
        });
    });
});
