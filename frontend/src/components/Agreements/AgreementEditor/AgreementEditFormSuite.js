import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName); // only run the tests for the field that changed

    test("agreement_type", "Contract is the only available type for now", () => {
        enforce(data.agreement_type).equals("CONTRACT");
    });
    test("name", "This is required information", () => {
        enforce(data.name).isNotBlank();
    });
    test("service_requirement_type", "This is required information", () => {
        enforce(data.service_requirement_type).notEquals("-Select Service Requirement Type-");
    });
    test("description", "This is required information", () => {
        enforce(data.description).isNotBlank();
    });
    test("product_service_code_id", "This is required information", () => {
        enforce(data.product_service_code_id).greaterThan(0);
    });
    test("agreement_reason", "This is required information", () => {
        enforce(data.agreement_reason).isNotBlank();
        enforce(data.agreement_reason).notEquals("0");
    });
    test("vendor", "This is required information", () => {
        if (
            (data.agreement_reason && data.agreement_reason === "RECOMPETE") ||
            data.agreement_reason === "LOGICAL_FOLLOW_ON"
        ) {
            enforce(data.vendor).isNotBlank();
        }
    });
    test("project_officer", "This is required information", () => {
        enforce(data.project_officer_id).greaterThan(0);
    });
    test("contract-type", "This is required information", () => {
        enforce(data.contract_type).notEquals("-Select an option-");
        enforce(data.contract_type).isNotEmpty();
    });
    test("team-members", "This is required information", () => {
        enforce(data.team_members).lengthNotEquals(0);
    });
});

export default suite;
