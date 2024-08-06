import { render, screen, fireEvent } from "@testing-library/react";
import DesiredAwardDate from "./DesiredAwardDate";
import { vi } from "vitest";
import TestApplicationContext from "../../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

describe("DesiredAwardDate", () => {
    let mockSetEnteredMonth, mockSetEnteredDay, mockSetEnteredYear, mockRunValidate, mockRes;

    beforeEach(() => {
        mockSetEnteredMonth = mockFn;
        mockSetEnteredDay = mockFn;
        mockSetEnteredYear = mockFn;
        mockRunValidate = vi.fn();
        mockRes = {
            getErrorsByGroup: mockFn.mockReturnValue([]),
            getErrors: mockFn
        };
    });

    it("renders without errors", () => {
        render(
            <DesiredAwardDate
                enteredMonth={1}
                setEnteredMonth={mockSetEnteredMonth}
                enteredDay="01"
                setEnteredDay={mockSetEnteredDay}
                enteredYear="2022"
                setEnteredYear={mockSetEnteredYear}
                isReviewMode={false}
                runValidate={mockRunValidate}
                res={mockRes}
                cn={() => {}}
            />
        );
        const legendElement = screen.getByText(/Obligate By Date/i);
        expect(legendElement).toBeInTheDocument();
    });

    it("handles user input for month, day, and year", () => {
        render(
            <DesiredAwardDate
                enteredMonth={1}
                setEnteredMonth={mockSetEnteredMonth}
                enteredDay="01"
                setEnteredDay={mockSetEnteredDay}
                enteredYear="2022"
                setEnteredYear={mockSetEnteredYear}
                isReviewMode={false}
                runValidate={mockRunValidate}
                res={mockRes}
                cn={() => {}}
            />
        );
        const monthInput = screen.getByLabelText(/Month/i);
        const dayInput = screen.getByLabelText(/Day/i);
        const yearInput = screen.getByLabelText(/Year/i);
        fireEvent.change(monthInput, { target: { value: "2" } });
        fireEvent.change(dayInput, { target: { value: "15" } });
        fireEvent.change(yearInput, { target: { value: "2023" } });
        expect(mockSetEnteredMonth).toHaveBeenCalledWith("2");
        expect(mockSetEnteredDay).toHaveBeenCalledWith("15");
        expect(mockSetEnteredYear).toHaveBeenCalledWith("2023");
    });
    it("displays the correct month option values", () => {
        render(
            <DesiredAwardDate
                enteredMonth={1}
                setEnteredMonth={mockSetEnteredMonth}
                enteredDay="01"
                setEnteredDay={mockSetEnteredDay}
                enteredYear="2022"
                setEnteredYear={mockSetEnteredYear}
                isReviewMode={false}
                runValidate={mockRunValidate}
                res={mockRes}
                cn={() => {}}
            />
        );
        expect(screen.getByText(/01 - Jan/i)).toBeInTheDocument();
        expect(screen.getByText(/12 - Dec/i)).toBeInTheDocument();
    });
    it("doesn't call runValidate function when user inputs a date when isReviewMode is false", () => {
        render(
            <DesiredAwardDate
                enteredMonth={1}
                setEnteredMonth={mockSetEnteredMonth}
                enteredDay="01"
                setEnteredDay={mockSetEnteredDay}
                enteredYear="2022"
                setEnteredYear={mockSetEnteredYear}
                isReviewMode={false}
                runValidate={mockRunValidate}
                res={mockRes}
                cn={() => {}}
            />
        );
        const monthInput = screen.getByLabelText(/Month/i);
        const dayInput = screen.getByLabelText(/Day/i);
        const yearInput = screen.getByLabelText(/Year/i);
        fireEvent.change(monthInput, { target: { value: "2" } });
        fireEvent.change(dayInput, { target: { value: "15" } });
        fireEvent.change(yearInput, { target: { value: "2023" } });
        expect(mockRunValidate).not.toHaveBeenCalled();
    });
});
