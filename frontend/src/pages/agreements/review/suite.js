import { create, test, enforce, only } from "vest";

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
    test("team-member", "Must have at least one team member", () => {
        enforce(fieldName.team_members).longerThan(0);
    });
    // test budget_line_items array
    test("budget-line-items", "Must have at least one budget line item", () => {
        enforce(fieldName.budget_line_items).longerThan(0);
    });
    test("budget-line-items", "Budget Lines description cannot be blank", () => {
        fieldName.budget_line_items.forEach((item) => {
            enforce(item.line_description).isNotBlank();
        });
    });
    test("budget-line-items", "Need by date is required information", () => {
        fieldName.budget_line_items.forEach((item) => {
            enforce(item.date_needed).isNotBlank();
        });
    });
    // need by date must be in the future
    test("budget-line-items", "Need by date must be in the future", () => {
        fieldName.budget_line_items.forEach((item) => {
            const today = new Date().valueOf();
            const dateNeeded = new Date(item.date_needed).valueOf();
            enforce(dateNeeded).greaterThan(today);
        });
    });
    test("budget-line-items", "CAN is required information", () => {
        fieldName.budget_line_items.forEach((item) => {
            enforce(item.can_id).isNotBlank();
        });
    });
    test("budget-line-items", "Amount must be more than $0", () => {
        fieldName.budget_line_items.forEach((item) => {
            enforce(item.amount).greaterThan(0);
        });
    });
});

export default suite;
