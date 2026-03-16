import { create, test, enforce, only } from "vest";

// Date validation constants and helpers
const DATE_FORMAT_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
const DATE_FIELDS = ["targetCompletionDate", "dateCompleted"];

const isValidDateFormat = (dateString) => DATE_FORMAT_REGEX.test(dateString);

const getDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseDateString = (dateString) => {
    if (!dateString || !isValidDateFormat(dateString)) return null;

    const [month, day, year] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    // Verify the parsed date matches the input (catches invalid calendar dates)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null; // Invalid calendar date (e.g., 02/31/2024)
    }

    return date;
};

const compareDateToToday = (dateString, comparison) => {
    const enteredDate = parseDateString(dateString);
    if (!enteredDate) return;

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
    // Normalize null/undefined to empty object
    data = data ?? {};
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

        test(field, "Date must be a valid calendar date", () => {
            if (!data[field]) return; // Skip validation if field is empty (for optional fields)
            if (!isValidDateFormat(data[field])) return; // Skip if format is already invalid
            const parsed = parseDateString(data[field]);
            enforce(parsed).isNotEmpty(); // Will fail if parseDateString returns null
        });
    });

    // Field-specific date range validations
    test("targetCompletionDate", "Date cannot be in the past", () => {
        compareDateToToday(data.targetCompletionDate, "greaterThanOrEquals");
    });

    test("dateCompleted", "Date must be today or earlier", () => {
        compareDateToToday(data.dateCompleted, "lessThanOrEquals");
    });

    // Required: Task Completed By
    test("users", "This is required information", () => {
        enforce(data.users).isNotEmpty();
    });
});

export default suite;
