import { create, test, enforce, only, group, skip } from "vest";

const suite = create((data, fieldName) => {
    // uncomment to test only one field at a time which breaks the group validation
    // only(fieldName);
    if (!data.enteredDay || !data.enteredMonth || !data.enteredYear) skip.group("allDates");

    test("enteredDescription", "This is required information", () => {
        enforce(data.enteredDescription).isNotBlank();
    });
    test("selectedCan", "This is required information", () => {
        enforce(data.selectedCan).isNotBlank();
    });
    test("selectedCan", "This is required information", () => {
        enforce(data.selectedCan.id).greaterThan(0);
    });
    test("enteredMonth", "This is required information", () => {
        enforce(data.enteredMonth).greaterThan(0);
    });
    test("enteredDay", "This is required information", () => {
        enforce(data.enteredDay).isNotBlank();
    });
    test("enteredDay", "Must be between 1 and 31", () => {
        enforce(data.enteredDay).isBetween(1, 31);
    });
    test("enteredYear", "This is required information", () => {
        enforce(data.enteredYear).isNotBlank();
    });
    test("enteredYear", "Must be 4 digits", () => {
        enforce(data.enteredYear).matches(/^\d{4}$/);
    });
    test("enteredYear", "Must be the current year or in the future", () => {
        const currentYear = new Date().getFullYear();
        const enteredYear = data.enteredYear;
        enforce(enteredYear).greaterThanOrEquals(currentYear);
    });
    test("enteredAmount", "This is required information", () => {
        enforce(data.enteredAmount).isNotBlank();
    });
    test("enteredAmount", "This is required information", () => {
        enforce(data.enteredAmount).isNotEmpty();
    });
    group("allDates", () => {
        const today = new Date();
        const enteredDate = new Date(Date.UTC(data.enteredYear, data.enteredMonth - 1, data.enteredDay));
        test("enteredDate", "Date must be in the future", () => {
            enforce(enteredDate.getTime()).greaterThan(today.getTime());
        });
    });
});

export default suite;
