import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import DatePicker from "./DatePicker";

describe("DatePicker", () => {
    const defaultProps = {
        id: "test-datepicker",
        name: "test-datepicker",
        label: "Test Date",
        onChange: vi.fn()
    };

    const getExternalInput = () => {
        return screen.getByRole("textbox", { name: "Test Date" });
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders correctly with minimum props", () => {
        render(<DatePicker {...defaultProps} />);
        expect(screen.getByText("Test Date")).toBeInTheDocument();
        expect(getExternalInput()).toBeInTheDocument();
    });

    it("calls onChange with the correct value when a valid date is entered", async () => {
        render(<DatePicker {...defaultProps} />);
        const input = getExternalInput();

        await userEvent.type(input, "01/01/2048");
        fireEvent.blur(input);

        await waitFor(() => {
            expect(defaultProps.onChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    target: expect.objectContaining({
                        name: "test-datepicker",
                        value: "01/01/2048"
                    })
                })
            );
        });

        // Check that the last call to onChange has the correct value
        const lastCall = defaultProps.onChange.mock.calls[defaultProps.onChange.mock.calls.length - 1];
        expect(lastCall[0].target.value).toBe("01/01/2048");
    });

    it("calls onChange with the entered value even when an invalid date is entered", async () => {
        render(<DatePicker {...defaultProps} />);
        const input = getExternalInput();

        await userEvent.type(input, "invalid");
        fireEvent.blur(input);

        await waitFor(() => {
            expect(defaultProps.onChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    target: expect.objectContaining({
                        name: "test-datepicker",
                        value: "invalid"
                    })
                })
            );
        });
    });

    it("handles error messages correctly", async () => {
        const { rerender } = render(<DatePicker {...defaultProps} />);

        // No error message initially
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();

        // Rerender with an error message
        rerender(
            <DatePicker
                {...defaultProps}
                messages={["Invalid date"]}
            />
        );

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Invalid date");
        });

        // Rerender without error message
        rerender(<DatePicker {...defaultProps} />);

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should disable the input when isDisabled is true", () => {
        render(<DatePicker {...defaultProps} isDisabled={true} />);
        const input = getExternalInput();
        expect(input).toBeDisabled();
    });

    it("should enable the input when isDisabled is false", () => {
        render(<DatePicker {...defaultProps} isDisabled={false} />);
        const input = getExternalInput();
        expect(input).not.toBeDisabled();
    });

    it("should enable the input when isDisabled is not provided (default behavior)", () => {
        render(<DatePicker {...defaultProps} />);
        const input = getExternalInput();
        expect(input).not.toBeDisabled();
    });

    it("should not allow user interaction when disabled", async () => {
        render(<DatePicker {...defaultProps} isDisabled={true} />);
        const input = getExternalInput();

        // Try to type in the disabled input
        await userEvent.type(input, "01/01/2048");

        // The value should remain empty since the input is disabled
        expect(input.value).toBe("");
        expect(defaultProps.onChange).not.toHaveBeenCalled();
    });

    it("should allow user interaction when not disabled", async () => {
        render(<DatePicker {...defaultProps} isDisabled={false} />);
        const input = getExternalInput();

        await userEvent.type(input, "01/01/2048");
        fireEvent.blur(input);

        await waitFor(() => {
            expect(defaultProps.onChange).toHaveBeenCalled();
        });
    });
});
