import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CANBudgetForm from "./CANBudgetForm";

describe("CANBudgetForm", () => {
    const defaultProps = {
        budgetAmount: "",
        cn: (name) => name,
        res: { getErrors: () => [] },
        fiscalYear: 2024,
        handleAddBudget: vi.fn(),
        runValidate: vi.fn(),
        setBudgetAmount: vi.fn()
    };

    test("renders with required props", () => {
        render(<CANBudgetForm {...defaultProps} />);
        expect(screen.getByLabelText(/FY 2024 CAN Budget/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /add fy budget/i })).toBeInTheDocument();
    });

    test("button is disabled when budgetAmount is empty", () => {
        render(<CANBudgetForm {...defaultProps} />);
        expect(screen.getByRole("button", { name: /add fy budget/i })).toBeDisabled();
    });

    test("button is enabled when budgetAmount has value", () => {
        render(
            <CANBudgetForm
                {...defaultProps}
                budgetAmount="1000"
            />
        );
        expect(screen.getByRole("button", { name: /add fy budget/i })).toBeEnabled();
    });

    test("calls handleAddBudget and setBudgetAmount on form submission", async () => {
        const user = userEvent.setup();
        render(
            <CANBudgetForm
                {...defaultProps}
                budgetAmount="1000"
            />
        );

        await user.click(screen.getByRole("button", { name: /add fy budget/i }));

        expect(defaultProps.handleAddBudget).toHaveBeenCalled();
        expect(defaultProps.setBudgetAmount).toHaveBeenCalledWith("");
    });

    test("calls runValidate when currency input changes", () => {
        render(<CANBudgetForm {...defaultProps} />);

        fireEvent.change(screen.getByLabelText(/FY 2024 CAN Budget/i), {
            target: { value: "1000" }
        });

        expect(defaultProps.runValidate).toHaveBeenCalledWith("budget-amount", "1,000");
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
