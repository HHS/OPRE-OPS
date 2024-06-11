import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DatePicker from "./DatePicker"; // Adjust the import path as necessary

describe("DatePicker component", () => {
    const defaultProps = {
        id: "test-datepicker",
        name: "test-datepicker",
        label: "Test Date",
        onChange: vi.fn()
    };
    it("renders correctly with minimum props", () => {
        render(<DatePicker {...defaultProps} />);
        expect(screen.getByText("Test Date")).toBeInTheDocument();
    });

    it.todo("calls onChange when the date is changed", async () => {
        render(<DatePicker {...defaultProps} />);

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "2023-05-01");

        expect(handleChange).toHaveBeenCalledTimes(10); // Called once for each character typed
    });

    it.todo("respects minDate and maxDate", () => {
        const minDate = "2023-01-01";
        const maxDate = "2023-12-31";
        render(
            <DatePicker
                {...defaultProps}
                minDate={minDate}
                maxDate={maxDate}
            />
        );
        // eslint-disable-next-line testing-library/no-debugging-utils
        screen.debug();

        // eslint-disable-next-line testing-library/no-node-access
        const datePickerDiv = screen.getByRole("textbox").parentElement;
        expect(datePickerDiv).toHaveAttribute("data-min-date", minDate);
        expect(datePickerDiv).toHaveAttribute("data-max-date", maxDate);
    });

    it("displays error messages when provided", () => {
        const errorMessage = "Invalid date";
        render(
            <DatePicker
                {...defaultProps}
                messages={[errorMessage]}
            />
        );

        expect(screen.getByRole("alert")).toHaveTextContent(errorMessage);
    });
});
