import { create, test, enforce, only } from "vest";

// Date validation constants and helpers
const DATE_FORMAT_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
const DATE_FIELDS = ["draftSolicitationDate", "targetCompletionDate", "dateCompleted"];

const isValidDateFormat = (dateString) => DATE_FORMAT_REGEX.test(dateString);

const getDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const compareDateToToday = (dateString, comparison) => {
    if (!dateString || !isValidDateFormat(dateString)) return;

    const enteredDate = new Date(dateString);
    const today = new Date();
    const enteredDateOnly = getDateOnly(enteredDate);
    const todayDateOnly = getDateOnly(today);

    if (comparison === "greaterThanOrEquals") {
        enforce(enteredDateOnly.getTime()).greaterThanOrEquals(todayDateOnly.getTime());
    } else if (comparison === "lessThanOrEquals") {
        enforce(enteredDateOnly.getTime()).lessThanOrEquals(todayDateOnly.getTime());
    }
};

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    // dateCompleted: required validation must run first
    test("dateCompleted", "This is required information", () => {
        enforce(data.dateCompleted).isNotEmpty();
    });

    // Apply date format validation to all date fields (only if they have a value)
    DATE_FIELDS.forEach((field) => {
        test(field, "Date must be MM/DD/YYYY", () => {
            if (!data[field]) return; // Skip validation if field is empty (for optional fields)
            enforce(data[field]).matches(DATE_FORMAT_REGEX);
        });
    });

    // Field-specific date range validations
    test("targetCompletionDate", "Date must be today or later", () => {
        compareDateToToday(data.targetCompletionDate, "greaterThanOrEquals");
    });

    test("dateCompleted", "Date must be today or earlier", () => {
        compareDateToToday(data.dateCompleted, "lessThanOrEquals");
    });

    test("users", "This is required information", () => {
        enforce(data.users).isNotEmpty();
    });
});

export default suite;
