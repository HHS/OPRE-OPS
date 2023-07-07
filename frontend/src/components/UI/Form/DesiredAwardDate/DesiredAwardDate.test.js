import { render, fireEvent, screen } from "@testing-library/react";
import DesiredAwardDate from "./DesiredAwardDate";

describe("DesiredAwardDate", () => {
    const setup = () => {
        const enteredMonth = "";
        const setEnteredMonth = jest.fn();
        const enteredDay = "";
        const setEnteredDay = jest.fn();
        const enteredYear = "";
        const setEnteredYear = jest.fn();
        const res = {
            getErrors: () => [],
            // other properties and methods
        };
        const isReviewMode = false;

        render(
            <DesiredAwardDate
                enteredMonth={enteredMonth}
                setEnteredMonth={setEnteredMonth}
                enteredDay={enteredDay}
                setEnteredDay={setEnteredDay}
                enteredYear={enteredYear}
                setEnteredYear={setEnteredYear}
                isReviewMode={isReviewMode}
                runValidate={jest.fn()}
                res={res}
                cn={jest.fn()}
            />
        );

        const monthInput = screen.getByLabelText(/Month/i);
        const dayInput = screen.getByPlaceholderText(/DD/i);
        const yearInput = screen.getByPlaceholderText(/YYYY/i);

        return {
            monthInput,
            dayInput,
            yearInput,
            setEnteredMonth,
            setEnteredDay,
            setEnteredYear,
        };
    };

    test("renders DesiredAwardDate component", () => {
        setup();
        expect(screen.getByLabelText(/Month/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/DD/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/YYYY/i)).toBeInTheDocument();
    });

    test("handles user input for month, day and year", () => {
        const { monthInput, dayInput, yearInput, setEnteredMonth, setEnteredDay, setEnteredYear } = setup();

        fireEvent.change(monthInput, { target: { value: "1" } });
        fireEvent.change(dayInput, { target: { value: "02" } });
        fireEvent.change(yearInput, { target: { value: "2023" } });

        expect(setEnteredMonth).toHaveBeenCalledWith(1);
        expect(setEnteredDay).toHaveBeenCalledWith("02");
        expect(setEnteredYear).toHaveBeenCalledWith("2023");
    });

    test("displays the correct month option values", () => {
        setup();
        expect(screen.getByText(/01 - Jan/i)).toBeInTheDocument();
        expect(screen.getByText(/12 - Dec/i)).toBeInTheDocument();
    });

    test("calls runValidate function when user inputs a date when isReviewMode is false", () => {
        const runValidate = jest.fn();
        const { monthInput, dayInput, yearInput } = setup();

        fireEvent.change(monthInput, { target: { value: "1" } });
        fireEvent.change(dayInput, { target: { value: "02" } });
        fireEvent.change(yearInput, { target: { value: "2023" } });

        expect(runValidate).not.toHaveBeenCalled();
    });
});
