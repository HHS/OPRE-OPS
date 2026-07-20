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
            // Compare date-only (no time) to avoid UTC-vs-local false failures where
            // "2026-07-18" parsed as UTC midnight falls before the current local time.
            const today = new Date();
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const d = new Date(item.date_needed);
            const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            enforce(dateOnly.getTime()).greaterThanOrEquals(todayOnly.getTime());
        });
    });
});

export default suite;
