import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("targetCompletionDate", "Date must be MM/DD/YYYY", () => {
        enforce(data.targetCompletionDate || "").matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/);
    });

    test("targetCompletionDate", "Date must be today or later", () => {
        if (!data.targetCompletionDate) return;
        if (!/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(data.targetCompletionDate)) {
            return; // let the format test handle it
        }
        const enteredDate = new Date(data.targetCompletionDate); // MM/DD/YYYY → local
        const today = new Date();
        const enteredDateOnly = new Date(enteredDate.getFullYear(), enteredDate.getMonth(), enteredDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        enforce(enteredDateOnly.getTime()).greaterThanOrEquals(todayDateOnly.getTime());
    });

    test("dateCompleted", "This is required information", () => {
        enforce(data.dateCompleted).isNotEmpty();
    });

    test("dateCompleted", "Date must be MM/DD/YYYY", () => {
        enforce(data.dateCompleted || "").matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/);
    });

    test("dateCompleted", "Date must be today or earlier", () => {
        if (!data.dateCompleted) return;
        if (!/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(data.dateCompleted)) {
            return; // let the format test handle it
        }
        const enteredDate = new Date(data.dateCompleted); // MM/DD/YYYY → local
        const today = new Date();
        const enteredDateOnly = new Date(enteredDate.getFullYear(), enteredDate.getMonth(), enteredDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        enforce(enteredDateOnly.getTime()).lessThanOrEquals(todayDateOnly.getTime());
    });

    test("users", "This is required information", () => {
        enforce(data.users).isNotEmpty();
    });
});

export default suite;
