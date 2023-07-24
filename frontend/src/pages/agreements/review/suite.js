import { create, test, enforce, only, each } from "vest";

const suite = create((fieldName) => {
    only(fieldName);

    test("name", "This is required information", () => {
        enforce(fieldName.name).isNotBlank();
    });
    test("type", "This is required information", () => {
        enforce(fieldName.agreement_type).isNotBlank();
    });
    test("description", "This is required information", () => {
        enforce(fieldName.description).isNotBlank();
    });
    test("psc", "This is required information", () => {
        enforce(fieldName.product_service_code?.name).isNotBlank();
    });
    test("naics", "This is required information", () => {
        enforce(fieldName.product_service_code?.naics).isNotBlank();
    });
    test("program-support-code", "This is required information", () => {
        enforce(fieldName.product_service_code?.support_code).isNotBlank();
    });
    test("procurement-shop", "This is required information", () => {
        enforce(fieldName.procurement_shop?.abbr).isNotBlank();
    });
    test("reason", "This is required information", () => {
        enforce(fieldName.agreement_reason).isNotBlank();
    });
    // incumbent is not required
    test("project-officer", "This is required information", () => {
        enforce(fieldName.project_officer).isNotBlank();
    });
    // test to ensure at least one budget line item exists
    test("budget-line-items", "Must have at least one budget line item", () => {
        enforce(fieldName.budget_line_items).longerThan(0);
    });
    // test budget_line_items array
    each(fieldName.budget_line_items, (item) => {
        test(`Budget line item (${item.line_description})`, "Description cannot be blank", () => {
            enforce(item.line_description).isNotBlank();
        });
        test(`Budget line item (${item.line_description})`, "Need by date is required information", () => {
            enforce(item.date_needed).isNotBlank();
        });
        test(`Budget line item (${item.line_description})`, "Need by date must be in the future", () => {
            const today = new Date().valueOf();
            const dateNeeded = new Date(item.date_needed).valueOf();
            enforce(dateNeeded).greaterThan(today);
        });
        test(`Budget line item (${item.line_description})`, "CAN is required information", () => {
            enforce(item.can_id).isNotBlank();
        });
        test(`Budget line item (${item.line_description})`, "Amount must be more than $0", () => {
            enforce(item.amount).greaterThan(0);
        });
    });
});

export default suite;
