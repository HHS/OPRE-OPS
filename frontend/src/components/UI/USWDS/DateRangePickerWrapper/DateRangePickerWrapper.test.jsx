import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DatePicker from "../DatePicker";
import DateRangePickerWrapper from "./DateRangePickerWrapper";

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

    it("initializes and cleans up the USWDS date range picker", () => {
        const { unmount } = renderComponent();

        expect(mockOn).toHaveBeenCalledTimes(1);
        expect(mockOn).toHaveBeenCalledWith(expect.any(HTMLElement));

        unmount();

        expect(mockOff).toHaveBeenCalledTimes(1);
        expect(mockOff).toHaveBeenCalledWith(expect.any(HTMLElement));
    });
});
