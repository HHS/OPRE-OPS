import { create, test, enforce, each } from "vest";

const suite = create((data) => {
    // test to ensure at least one budget line item exists
    test("data", "Must have at least one budget line", () => {
        enforce(data.budgetLines.length).greaterThan(0);
    });
    // test budget_line_items array
    each(data.budgetLines, (item) => {
        test(`Budget line item (${item.id})`, "This is required information", () => {
            enforce(item.date_needed).isNotBlank();
            enforce(item.can_id).isNotNullish().greaterThan(0);
            enforce(item.amount).greaterThan(0);
        });
        test(`Budget line item (${item.id})`, "Need by date must be in the future", () => {
            // Parse the ISO date string directly via split to avoid the UTC-midnight pitfall:
            // new Date("YYYY-MM-DD") is UTC, and getDate() in a negative-offset timezone returns
            // the prior local day. Splitting gives the calendar date the user intended.
            const today = new Date();
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const [y, mo, d] = (item.date_needed ?? "").split("-").map(Number);
            const dateOnly = (isNaN(y) || isNaN(mo) || isNaN(d)) ? new Date(0) : new Date(y, mo - 1, d);
            enforce(dateOnly.getTime()).greaterThan(todayOnly.getTime());
        });
    });
});

export default suite;
