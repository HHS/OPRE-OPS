import { create, test, enforce, only, each } from "vest";

const suite = create((data) => {
    only(data);
    console.log(`data: ${JSON.stringify(data, null, 2)}`);
    // test to ensure at least one budget line item exists
    test("data", "Must have at least one budget line item", () => {
        enforce(data.new_budget_lines).longerThan(0);
    });
    // test budget_line_items array
    // each(data.budget_line_items, (item, index) => {
    //     test(`Budget line item (${item.line_description})`, "Description cannot be blank", () => {
    //         enforce(item.line_description).isNotBlank();
    //     });
    //     test(`Budget line item (${item.line_description})`, "Need by date is required information", () => {
    //         enforce(item.date_needed).isNotBlank();
    //     });
    //     test(`Budget line item (${item.line_description})`, "Need by date must be in the future", () => {
    //         const today = new Date().valueOf();
    //         const dateNeeded = new Date(item.date_needed).valueOf();
    //         enforce(dateNeeded).greaterThan(today);
    //     });
    //     test(`Budget line item (${item.line_description})`, "CAN is required information", () => {
    //         enforce(item.can_id).isNotBlank();
    //     });
    //     test(`Budget line item (${item.line_description})`, "Amount must be more than $0", () => {
    //         enforce(item.amount).greaterThan(0);
    //     });
    // });
});

export default suite;
