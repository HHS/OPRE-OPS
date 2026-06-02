import { useState } from "react";
import { DesiredAwardDate } from "./DesiredAwardDate";

const mockResNoErrors = {
    getErrorsByGroup: () => ({}),
    getErrors: () => []
};

const mockResWithFieldErrors = {
    getErrorsByGroup: () => ({}),
    getErrors: (field) => {
        if (field === "enteredDay") return ["Day must be between 1 and 31"];
        if (field === "enteredYear") return ["Year is required"];
        return [];
    }
};

const mockResWithGroupErrors = {
    getErrorsByGroup: () => ({ allDates: ["Date must be in the future"] }),
    getErrors: () => []
};

const noopCn = () => "";

const fieldErrorCn = (field) => {
    if (field === "enteredDay" || field === "enteredYear") return "usa-form-group--error";
    return "";
};

export default {
    title: "UI/Form/DesiredAwardDate",
    component: DesiredAwardDate,
    parameters: {
        docs: {
            description: {
                component:
                    "Composite date input with Month/Day/Year fields. Uses Vest v6 validation to display " +
                    "field-level and group-level errors. Stories use mock validation result objects to " +
                    "demonstrate error states without wiring up a full Vest suite."
            }
        }
    }
};

export const Default = {
    render: () => {
        const [month, setMonth] = useState(0);
        const [day, setDay] = useState("");
        const [year, setYear] = useState("");
        return (
            <DesiredAwardDate
                enteredMonth={month}
                setEnteredMonth={setMonth}
                enteredDay={day}
                setEnteredDay={setDay}
                enteredYear={year}
                setEnteredYear={setYear}
                isReviewMode={false}
                runValidate={() => {}}
                res={mockResNoErrors}
                cn={noopCn}
            />
        );
    }
};

export const WithValues = {
    render: () => {
        const [month, setMonth] = useState(9);
        const [day, setDay] = useState("15");
        const [year, setYear] = useState("2025");
        return (
            <DesiredAwardDate
                enteredMonth={month}
                setEnteredMonth={setMonth}
                enteredDay={day}
                setEnteredDay={setDay}
                enteredYear={year}
                setEnteredYear={setYear}
                isReviewMode={false}
                runValidate={() => {}}
                res={mockResNoErrors}
                cn={noopCn}
            />
        );
    }
};

export const WithFieldErrors = {
    render: () => {
        const [month, setMonth] = useState(3);
        const [day, setDay] = useState("35");
        const [year, setYear] = useState("");
        return (
            <DesiredAwardDate
                enteredMonth={month}
                setEnteredMonth={setMonth}
                enteredDay={day}
                setEnteredDay={setDay}
                enteredYear={year}
                setEnteredYear={setYear}
                isReviewMode={true}
                runValidate={() => {}}
                res={mockResWithFieldErrors}
                cn={fieldErrorCn}
            />
        );
    }
};

export const WithGroupErrors = {
    render: () => {
        const [month, setMonth] = useState(1);
        const [day, setDay] = useState("15");
        const [year, setYear] = useState("2020");
        return (
            <DesiredAwardDate
                enteredMonth={month}
                setEnteredMonth={setMonth}
                enteredDay={day}
                setEnteredDay={setDay}
                enteredYear={year}
                setEnteredYear={setYear}
                isReviewMode={true}
                runValidate={() => {}}
                res={mockResWithGroupErrors}
                cn={noopCn}
            />
        );
    }
};
