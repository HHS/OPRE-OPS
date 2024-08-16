import { render, screen } from "@testing-library/react";
import { vi, beforeEach } from "vitest";
import DateRangePickerWrapper from "./DateRangePickerWrapper";
import DatePicker from "../DatePicker";

describe("DateRangePickerWrapper", () => {
    let mockOn;
    let mockOff;

    beforeEach(() => {
        // Define mock functions inside beforeEach to avoid hoisting issues
        mockOn = vi.fn();
        mockOff = vi.fn();

        vi.doMock("@uswds/uswds/js/usa-date-range-picker", () => ({
            default: {
                on: mockOn,
                off: mockOff
            }
        }));
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
                    id="start-date"
                    name="start-date"
                    label="Start Date"
                    onChange={() => {}}
                />
                <DatePicker
                    id="end-date"
                    name="end-date"
                    label="End Date"
                    onChange={() => {}}
                />
            </DateRangePickerWrapper>
        );
    };

    const getWrapper = () => screen.getByTestId("test-date-range");

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders correctly with child DatePicker components", () => {
        renderComponent();

        const startDateLabel = screen.getByText("Start Date");
        expect(startDateLabel).toBeInTheDocument();
        expect(startDateLabel).toHaveAttribute("for", "start-date");

        const endDateLabel = screen.getByText("End Date");
        expect(endDateLabel).toBeInTheDocument();
        expect(endDateLabel).toHaveAttribute("for", "end-date");

        expect(screen.getByRole("textbox", { name: "Start Date" })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: "End Date" })).toBeInTheDocument();
    });

    it("applies the correct class names", () => {
        renderComponent();

        const wrapper = getWrapper();
        expect(wrapper).toHaveClass("usa-date-range-picker");
        expect(wrapper).toHaveClass("custom-class");
    });

    it("sets the correct id", () => {
        renderComponent();

        const wrapper = getWrapper();
        expect(wrapper).toHaveAttribute("id", "test-date-range");
    });

    it("initializes and cleans up the USWDS date range picker", () => {
        const { unmount } = renderComponent();

        expect(mockOn).toHaveBeenCalledTimes(1);
        expect(mockOn).toHaveBeenCalledWith(expect.any(HTMLElement));

        unmount();

        expect(mockOff).toHaveBeenCalledTimes(1);
        expect(mockOff).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it("renders children correctly", () => {
        renderComponent({
            children: <div data-testid="custom-child">Custom Child</div>
        });

        const customChild = screen.getByTestId("custom-child");
        expect(customChild).toBeInTheDocument();
        expect(customChild).toHaveTextContent("Custom Child");
    });
});
