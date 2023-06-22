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
    // must have at least one team member
    test("team-member", "Must have at least one team member", () => {
        enforce(fieldName.team_members).isNotEmptyArray();
    });
});

export default suite;
