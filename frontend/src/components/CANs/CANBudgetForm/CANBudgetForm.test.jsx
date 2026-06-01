import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CANBudgetForm from "./CANBudgetForm";

describe("CANBudgetForm", () => {
    const defaultProps = {
        showCarryForwardCard: true,
        budgetAmount: 0,
        totalFunding: 10_000_000,
        cn: (name) => name,
        res: { getErrors: () => [] },
        fiscalYear: 2024,
        handleAddBudget: vi.fn(),
        runValidate: vi.fn(() => ({ hasErrors: () => false })),
        clearValidationError: vi.fn(),
        setBudgetAmount: vi.fn()
    };

    test("renders with required props", () => {
        render(<CANBudgetForm {...defaultProps} />);
        expect(screen.getByLabelText(/FY 2024 CAN Budget/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /update fy budget/i })).toBeInTheDocument();
    });

    test("calls runValidate on blur", () => {
        render(<CANBudgetForm {...defaultProps} />);

        fireEvent.blur(screen.getByLabelText(/FY 2024 CAN Budget/i), {
            target: { value: "1,000" }
        });

        expect(defaultProps.runValidate).toHaveBeenCalledWith("budget-amount", "1,000");
    });

    test("calls handleAddBudget when validation passes on submit", async () => {
        const user = userEvent.setup();
        const props = {
            ...defaultProps,
            handleAddBudget: vi.fn(),
            runValidate: vi.fn(() => ({ hasErrors: () => false }))
        };
        render(
            <CANBudgetForm
                {...props}
                budgetAmount={1000}
            />
        );

        await user.click(screen.getByRole("button", { name: /update fy budget/i }));

        expect(props.runValidate).toHaveBeenCalledWith("budget-amount", "1000");
        expect(props.handleAddBudget).toHaveBeenCalled();
    });

    test("blocks handleAddBudget when validation fails on submit", async () => {
        const user = userEvent.setup();
        const props = {
            ...defaultProps,
            handleAddBudget: vi.fn(),
            runValidate: vi.fn(() => ({ hasErrors: () => true }))
        };
        render(
            <CANBudgetForm
                {...props}
                budgetAmount={500}
            />
        );

        await user.click(screen.getByRole("button", { name: /update fy budget/i }));

        expect(props.runValidate).toHaveBeenCalledWith("budget-amount", "500");
        expect(props.handleAddBudget).not.toHaveBeenCalled();
    });

    test("does not call runValidate on input change", () => {
        const props = {
            ...defaultProps,
            runValidate: vi.fn(() => ({ hasErrors: () => false })),
            clearValidationError: vi.fn()
        };
        render(<CANBudgetForm {...props} />);

        fireEvent.change(screen.getByLabelText(/FY 2024 CAN Budget/i), {
            target: { value: "1000" }
        });

        expect(props.runValidate).not.toHaveBeenCalled();
    });

    test("clears validation error on input change", () => {
        const props = {
            ...defaultProps,
            clearValidationError: vi.fn()
        };
        render(<CANBudgetForm {...props} />);

        fireEvent.change(screen.getByLabelText(/FY 2024 CAN Budget/i), {
            target: { value: "1000" }
        });

        expect(props.clearValidationError).toHaveBeenCalledWith("budget-amount");
    });

    test("displays validation errors when present", () => {
        const propsWithError = {
            ...defaultProps,
            res: { getErrors: () => ["This is required information"] }
        };

        render(<CANBudgetForm {...propsWithError} />);
        expect(screen.getByText("This is required information")).toBeInTheDocument();
    });
});
