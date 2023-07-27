import { create, test, enforce, only, each } from "vest";

const suite = create((data) => {
    only(data);

    // test to ensure at least one budget line item exists
    test("data", "Must have at least one budget line item", () => {
        enforce(data.new_budget_lines).longerThan(0);
    });
    // test budget_line_items array
    each(data.new_budget_lines, (item) => {
        test(`Budget line item (${item.line_description})`, "This is required information", () => {
            enforce(item.line_description).isNotBlank();
            enforce(item.date_needed).isNotBlank();
            enforce(item.can_id).isNotBlank();
            enforce(item.amount).greaterThan(0);
        });
        test(`Budget line item (${item.line_description})`, "Need by date must be in the future", () => {
            const today = new Date().valueOf();
            const dateNeeded = new Date(item.date_needed).valueOf();
            enforce(dateNeeded).greaterThan(today);
        });
    });
});

export default suite;
