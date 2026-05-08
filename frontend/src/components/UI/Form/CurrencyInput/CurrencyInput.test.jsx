import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import CurrencyInput from "./CurrencyInput";

describe("CurrencyInput", () => {
    it("allows typing a decimal point mid-entry", async () => {
        const setEnteredAmount = vi.fn();
        const onChange = vi.fn();

        render(
            <CurrencyInput
                name="amount"
                value=""
                setEnteredAmount={setEnteredAmount}
                onChange={onChange}
            />
        );

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "5.");

        // The input should visually show the decimal (not strip it)
        expect(input).toHaveDisplayValue(/5\./);
    });

    it("calls setEnteredAmount with the float value on change", async () => {
        const setEnteredAmount = vi.fn();
        const onChange = vi.fn();

        render(
            <CurrencyInput
                name="amount"
                value=""
                setEnteredAmount={setEnteredAmount}
                onChange={onChange}
            />
        );

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "5.50");

        expect(setEnteredAmount).toHaveBeenLastCalledWith(5.5);
    });

    it("does not strip a trailing decimal when the parent re-renders with the same float", async () => {
        const setEnteredAmount = vi.fn();
        const onChange = vi.fn();

        const { rerender } = render(
            <CurrencyInput
                name="amount"
                value=""
                setEnteredAmount={setEnteredAmount}
                onChange={onChange}
            />
        );

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "5.");

        // userEvent.type flushes all effects before returning, so skipNextSyncRef.current
        // is true when rerender delivers value={5}. The effect fires, sees the flag, and
        // skips the sync — preserving the trailing decimal.
        rerender(
            <CurrencyInput
                name="amount"
                value={5}
                setEnteredAmount={setEnteredAmount}
                onChange={onChange}
            />
        );

        expect(input).toHaveDisplayValue(/5\./);

        // Simulate the parent then pushing a genuinely new value (no user typing).
        // The guard should allow this through and update the display.
        rerender(
            <CurrencyInput
                name="amount"
                value={7}
                setEnteredAmount={setEnteredAmount}
                onChange={onChange}
            />
        );

        expect(input).toHaveDisplayValue("7");
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
