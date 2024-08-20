import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import DateRangePickerWrapper from "./DateRangePickerWrapper";
import DatePicker from "../DatePicker";
import userEvent from "@testing-library/user-event";

vi.mock("@uswds/uswds/js/usa-date-range-picker", async () => {
    const mock = await import("./DateRangePickerMock");
    return { default: mock.default };
});

const { mockOn, mockOff } = await import("./DateRangePickerMock");

describe("DateRangePickerWrapper", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const defaultProps = {
        id: "test-date-range",
        className: "custom-class"
    };

    const renderComponent = (props = {}) => {
        return render(
            <DateRangePickerWrapper
                {...defaultProps}
                {...props}
            >
                <DatePicker
                    id="pop-start-date"
                    name="pop-start-date"
                    label="Start Date"
                    onChange={() => {}}
                />
                <DatePicker
                    id="pop-end-date"
                    name="pop-end-date"
                    label="End Date"
                    onChange={() => {}}
                />
            </DateRangePickerWrapper>
        );
    };

    it("renders date range picker inputs", () => {
        renderComponent();

        // Use getByRole to find the visible input fields
        const startDateInput = screen.getByRole("textbox", { name: "Start Date" });
        const endDateInput = screen.getByRole("textbox", { name: "End Date" });

        expect(startDateInput).toBeInTheDocument();
        expect(endDateInput).toBeInTheDocument();
    });

    it("displays error if end date is before start date", async () => {
        const { container } = renderComponent();
        const startDateInput = screen.getByRole("textbox", { name: "Start Date" });
        const endDateInput = screen.getByRole("textbox", { name: "End Date" });

        await userEvent.type(startDateInput, "01/01/2020");
        await userEvent.tab();
        await userEvent.type(endDateInput, "01/01/2010");
        await userEvent.tab();

        // Wait for any change in the DOM that might indicate an error
        await waitFor(
            () => {
                expect(container.innerHTML).toMatch(/error|invalid|after/i);
            },
            { timeout: 3000 }
        );
    });

    it('displays error if date is not in the format "MM/DD/YYYY"', async () => {
        renderComponent();
        const startDateInput = screen.getByLabelText("Start Date");

        fireEvent.change(startDateInput, { target: { value: "tacocat" } });
        fireEvent.blur(startDateInput);

        const errorMessage = await screen.findByText("Please enter a valid date in MM/DD/YYYY format");
        expect(errorMessage).toBeInTheDocument();
    });

    it("clears error message when valid dates are entered", async () => {
        const user = userEvent.setup();
        renderComponent();
        const startDateInput = screen.getByRole("textbox", { name: "Start Date" });
        const endDateInput = screen.getByRole("textbox", { name: "End Date" });

        // Enter invalid dates
        await user.type(startDateInput, "01/01/2020");
        await user.tab();
        await user.type(endDateInput, "01/01/2010");
        await user.tab();

        // Wait for any error message to appear
        await waitFor(
            () => {
                const errorElement = screen.queryByRole("alert");
                expect(errorElement).toBeInTheDocument();
            },
            { timeout: 3000 }
        );

        // Enter valid dates
        await user.clear(startDateInput);
        await user.type(startDateInput, "01/01/2020");
        await user.tab();
        await user.clear(endDateInput);
        await user.type(endDateInput, "01/01/2021");
        await user.tab();

        // Wait for the error message to disappear
        await waitFor(
            () => {
                const errorElement = screen.queryByRole("alert");
                expect(errorElement).not.toBeInTheDocument();
            },
            { timeout: 3000 }
        );
    });

    it("initializes and cleans up the USWDS date range picker", () => {
        const { unmount } = renderComponent();

        expect(mockOn).toHaveBeenCalledTimes(1);
        expect(mockOn).toHaveBeenCalledWith(expect.any(HTMLElement));

        unmount();

        expect(mockOff).toHaveBeenCalledTimes(1);
        expect(mockOff).toHaveBeenCalledWith(expect.any(HTMLElement));
    });
});
