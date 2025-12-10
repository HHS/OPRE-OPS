import { create, each, enforce, only, test } from "vest";

const suite = create((fieldName) => {
    only(fieldName);

    test("name", "This information is required to submit for approval", () => {
        enforce(fieldName.name).isNotBlank();
    });
    test("type", "This information is required to submit for approval", () => {
        enforce(fieldName.agreement_type).isNotBlank();
    });
    test("description", "This information is required to submit for approval", () => {
        enforce(fieldName.description).isNotBlank();
    });
    test("psc", "This information is required to submit for approval", () => {
        enforce(fieldName.product_service_code?.name).isNotBlank();
    });
    test("procurement-shop", "This information is required to submit for approval", () => {
        enforce(fieldName.procurement_shop?.abbr).isNotBlank();
    });
    test("reason", "This information is required to submit for approval", () => {
        enforce(fieldName.agreement_reason).isNotBlank();
    });
    // vendor is not required
    test("project-officer", "This information is required to submit for approval", () => {
        enforce(fieldName.project_officer_id).isNotBlank();
    });
    test("contract-type", "This information is required to submit for approval", () => {
        enforce(fieldName.contract_type).notEquals("-Select an option-");
        enforce(fieldName.contract_type).isNotEmpty();
    });
    test("team-members", "This information is required to submit for approval", () => {
        enforce(fieldName.team_members).longerThan(0);
    });
    // test to ensure at least one budget line item exists
    test("budget-line-items", "Must have at least one budget line item", () => {
        enforce(fieldName.budget_line_items).longerThan(0);
    });

    // test budget_line_items array - grouped by field type
    each(fieldName.budget_line_items, (item) => {
        test("Budget Line Amount", () => {
            enforce(item.amount).greaterThan(0);
        });

        test("Budget Line CAN", () => {
            enforce(item.can_id).isNotBlank();
        });

        test("Budget lines need to be assigned to a services component to change their status", () => {
            enforce(item.services_component_id).isNotBlank();
        });

        test("Budget Line Obligate By Date", () => {
            enforce(item.date_needed).isNotBlank();
        });

        test("Budget Line Obligate By Date must be in the future", () => {
            const today = new Date().valueOf();
            const dateNeeded = new Date(item.date_needed);
            enforce(dateNeeded.getTime()).greaterThan(today);
        });
    });
});

export default suite;
