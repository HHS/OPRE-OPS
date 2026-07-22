import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { useState } from "react";
import "@testing-library/jest-dom";
import CurrencyInput from "./CurrencyInput";

// Test wrapper that manages state like a real parent component
const ControlledCurrencyInput = ({ initialValue = "", onSetEnteredAmount, onOnChange, ...props }) => {
    const [value, setValue] = useState(initialValue);

    const handleChange = (name, val) => {
        setValue(val);
        if (onOnChange) onOnChange(name, val);
    };

    return (
        <CurrencyInput
            {...props}
            value={value}
            onChange={handleChange}
            setEnteredAmount={onSetEnteredAmount}
        />
    );
};

describe("CurrencyInput", () => {
    it("allows typing a decimal point mid-entry", async () => {
        const setEnteredAmount = vi.fn();
        const onChange = vi.fn();

        render(
            <ControlledCurrencyInput
                name="amount"
                initialValue=""
                onSetEnteredAmount={setEnteredAmount}
                onOnChange={onChange}
            />
        );

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "5.");

        expect(input).toHaveDisplayValue(/5\./);
    });

    it("calls setEnteredAmount with the float value on change", async () => {
        const setEnteredAmount = vi.fn();
        const onChange = vi.fn();

        render(
            <ControlledCurrencyInput
                name="amount"
                initialValue=""
                onSetEnteredAmount={setEnteredAmount}
                onOnChange={onChange}
            />
        );

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "5.50");

        expect(setEnteredAmount).toHaveBeenLastCalledWith(5.5);
    });

    it("calls onChange with the input name and string value", async () => {
        const setEnteredAmount = vi.fn();
        const onChange = vi.fn();

        render(
            <ControlledCurrencyInput
                name="amount"
                initialValue=""
                onSetEnteredAmount={setEnteredAmount}
                onOnChange={onChange}
            />
        );

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "5");

        expect(onChange).toHaveBeenLastCalledWith("amount", expect.any(String));
    });

    it("clears the input when parent resets value after user typed", async () => {
        const setEnteredAmount = vi.fn();

        const ResettableWrapper = () => {
            const [value, setValue] = useState("");
            return (
                <>
                    <CurrencyInput
                        name="amount"
                        value={value}
                        setEnteredAmount={(v) => {
                            setEnteredAmount(v);
                            setValue(v ?? "");
                        }}
                        onChange={() => {}}
                    />
                    <button onClick={() => setValue("")}>reset</button>
                </>
            );
        };

        render(<ResettableWrapper />);
        const input = screen.getByRole("textbox");
        await userEvent.type(input, "1000000");
        expect(input).toHaveDisplayValue("$1,000,000");

        await userEvent.click(screen.getByText("reset"));
        expect(input).toHaveDisplayValue("");
    });

    it("clears the input when parent resets value to empty", () => {
        const setEnteredAmount = vi.fn();
        const onChange = vi.fn();

        const { rerender } = render(
            <CurrencyInput
                name="amount"
                value={500}
                setEnteredAmount={setEnteredAmount}
                onChange={onChange}
            />
        );

        rerender(
            <CurrencyInput
                name="amount"
                value=""
                setEnteredAmount={setEnteredAmount}
                onChange={onChange}
            />
        );

        expect(screen.getByRole("textbox")).toHaveDisplayValue("");
    });
});
