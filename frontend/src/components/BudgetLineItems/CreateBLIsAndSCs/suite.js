import { create, test, enforce, only, each } from "vest";

const suite = create((data) => {
    only(data);

    // test to ensure at least one budget line item exists
    test("data", "Must have at least one budget line item", () => {
        enforce(data.budgetLines).longerThan(0);
    });
    // test budget_line_items array
    each(data.budgetLines, (item) => {
        test(`Budget line item (${item.id})`, "This is required information", () => {
            enforce(item.date_needed).isNotBlank();
            enforce(item.can_id).isNotBlank();
            enforce(item.amount).greaterThan(0);
        });
        test(`Budget line item (${item.id})`, "Need by date must be in the future", () => {
            const today = new Date().valueOf();
            const dateNeeded = new Date(item.date_needed).valueOf();
            enforce(dateNeeded).greaterThan(today);
        });
    });
});

export default suite;
