import { create, test, enforce, only } from "vest";

const DATE_FORMAT_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    // Optional: Target Completion Date (format validation only if provided)
    test("targetCompletionDate", "Date must be MM/DD/YYYY", () => {
        if (!data.targetCompletionDate) return;
        enforce(data.targetCompletionDate).matches(DATE_FORMAT_REGEX);
    });

    test("targetCompletionDate", "Date cannot be in the past", () => {
        if (!data.targetCompletionDate || !DATE_FORMAT_REGEX.test(data.targetCompletionDate)) return;
        const targetDate = new Date(data.targetCompletionDate);
        const today = new Date();
        const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        enforce(targetDateOnly.getTime()).greaterThanOrEquals(todayDateOnly.getTime());
    });

    // Required: Date Completed
    test("dateCompleted", "This is required information", () => {
        enforce(data.dateCompleted).isNotEmpty();
    });

    test("dateCompleted", "Date must be MM/DD/YYYY", () => {
        enforce(data.dateCompleted || "").matches(DATE_FORMAT_REGEX);
    });

    test("dateCompleted", "Date must be today or earlier", () => {
        if (!data.dateCompleted || !DATE_FORMAT_REGEX.test(data.dateCompleted)) return;
        const enteredDate = new Date(data.dateCompleted);
        const today = new Date();
        const enteredDateOnly = new Date(enteredDate.getFullYear(), enteredDate.getMonth(), enteredDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        enforce(enteredDateOnly.getTime()).lessThanOrEquals(todayDateOnly.getTime());
    });

    // Required: Task Completed By
    test("users", "This is required information", () => {
        enforce(data.users).isNotEmpty();
    });
});

export default suite;
