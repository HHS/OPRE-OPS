import { create, test, enforce, only } from "vest";
import { AGREEMENT_TYPES } from "../../ServicesComponents/ServicesComponents.constants";

const suite = create((data = {}, fieldName) => {
    if (fieldName) {
        only(fieldName);
    }

    // REVIEW: NEW — derived flag used to skip contract-only tests below.
    // Placed after the only() call so it's computed every run regardless of which field is being validated.
    const isGrant = data.agreement_type === AGREEMENT_TYPES.GRANT;

    test("agreement_type", "This is required information", () => {
        enforce(data.agreement_type).notEquals("-Select Agreement Type-");
    });
    // REVIEW: CHANGED — removed `.notEquals(AGREEMENT_TYPES.GRANT)` from both "not yet available" tests.
    // IAA and DIRECT_OBLIGATION remain blocked. The test registrations are kept intact (not deleted)
    // so vest's error-key registry stays stable — no label/convertCodeForDisplay changes needed.
    test("agreement-type-filter", "This Agreement type is not yet available", () => {
        enforce(data["agreement-type-filter"]).notEquals(AGREEMENT_TYPES.IAA);
        enforce(data["agreement-type-filter"]).notEquals(AGREEMENT_TYPES.DIRECT_OBLIGATION);
    });
    test("agreement_type", "This Agreement type is not yet available", () => {
        enforce(data.agreement_type).notEquals(AGREEMENT_TYPES.IAA);
        enforce(data.agreement_type).notEquals(AGREEMENT_TYPES.DIRECT_OBLIGATION);
    });
    // REVIEW: UNCHANGED — name and project_id are required for all agreement types including GRANT.
    test("name", "This is required information", () => {
        enforce(data.name).isNotBlank();
    });
    test("project_id", "This is required information", () => {
        enforce(data.project_id).greaterThan(0);
    });
    // REVIEW: CHANGED — each of the following 8 tests now early-returns for GRANT.
    // Early-return keeps the test registered (vest v6 requirement) but makes it pass immediately,
    // clearing any stale error state from a previous type selection.
    test("service_requirement_type", "This is required information", () => {
        if (isGrant) return;
        enforce(data.service_requirement_type).notEquals("-Select Service Requirement Type-");
    });
    test("description", "This is required information", () => {
        if (isGrant) return;
        enforce(data.description).isNotBlank();
    });
    test("product_service_code_id", "This is required information", () => {
        if (isGrant) return;
        enforce(data.product_service_code_id).greaterThan(0);
    });
    test("agreement_reason", "This is required information", () => {
        if (isGrant) return;
        enforce(data.agreement_reason).isNotBlank();
        enforce(data.agreement_reason).notEquals("0");
    });
    test("vendor", "This is required information", () => {
        if (isGrant) return;
        if (
            data.agreement_reason &&
            (data.agreement_reason === "RECOMPETE" || data.agreement_reason === "LOGICAL_FOLLOW_ON")
        ) {
            enforce(data.vendor).isNotBlank();
        }
    });
    test("project_officer", "This is required information", () => {
        if (isGrant) return;
        enforce(data.project_officer_id).greaterThan(0);
    });
    test("contract-type", "This is required information", () => {
        if (isGrant) return;
        enforce(data.contract_type).notEquals("-Select an option-");
        enforce(data.contract_type).isNotEmpty();
    });
    test("procurement-shop-select", "This is required information", () => {
        if (isGrant) return;
        enforce(data["procurement-shop-select"]).isNotEmpty();
        enforce(data["procurement-shop-select"]?.id).greaterThan(0);
    });
    // REVIEW: NEW — NOFO Number is required for GRANT only. Inverse-guard pattern (if (!isGrant) return;),
    // the mirror image of the contract-only guards above.
    test("nofo_number", "This is required information", () => {
        if (!isGrant) return;
        enforce(data.nofo_number).isNotBlank();
    });
    // REVIEW: UNCHANGED — requesting_agency / servicing_agency remain AA-only; no change needed.
    test("requesting_agency", "This is required information", () => {
        if (data.agreement_type === AGREEMENT_TYPES.AA) {
            enforce(data["requesting_agency"]).isNotNullish();
        }
    });
    test("servicing_agency", "This is required information", () => {
        if (data.agreement_type === AGREEMENT_TYPES.AA) {
            enforce(data["servicing_agency"]).isNotNullish();
        }
    });
});

export default suite;
