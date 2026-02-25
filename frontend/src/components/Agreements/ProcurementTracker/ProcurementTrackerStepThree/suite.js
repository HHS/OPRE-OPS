import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

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

    test("solicitationPeriodStartDate", "Start date must be earlier than end date", () => {
        if (!data.solicitationPeriodStartDate || !data.solicitationPeriodEndDate) return;
        if (!/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(data.solicitationPeriodStartDate)) {
            return; // skip if invalid format
        }
        if (!/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(data.solicitationPeriodEndDate)) {
            return; // skip if invalid format
        }
        const startDate = new Date(data.solicitationPeriodStartDate);
        const endDate = new Date(data.solicitationPeriodEndDate);
        enforce(startDate.getTime()).lessThan(endDate.getTime());
    });
});

export default suite;
