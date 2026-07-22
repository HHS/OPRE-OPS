import { describe, it, expect, afterEach } from "vitest";
import suite from "./AgreementEditFormSuite";

afterEach(() => {
    suite.reset();
});

const validGrantData = {
    agreement_type: "GRANT",
    "agreement-type-filter": "GRANT",
    name: "My Grant",
    project_id: 5,
    nofo_number: "NOFO-123"
};

const validContractData = {
    agreement_type: "CONTRACT",
    "agreement-type-filter": "CONTRACT",
    name: "My Contract",
    project_id: 5,
    service_requirement_type: "SEVERABLE",
    description: "A description",
    product_service_code_id: 1,
    agreement_reason: "NEW_REQ",
    project_officer_id: 1,
    contract_type: "FIRM_FIXED_PRICE",
    "procurement-shop-select": { id: 2 }
};

describe("AgreementEditFormSuite — GRANT", () => {
    it("passes with only the required grant fields (name, project_id, nofo_number)", () => {
        const result = suite.run(validGrantData);
        expect(result.hasErrors()).toBe(false);
    });

    it("fails when nofo_number is blank", () => {
        const result = suite.run({ ...validGrantData, nofo_number: "" });
        expect(result.hasErrors("nofo_number")).toBe(true);
    });

    it("passes nofo_number when provided", () => {
        const result = suite.run(validGrantData);
        expect(result.hasErrors("nofo_number")).toBe(false);
    });

    it("passes even when contract-only fields are missing", () => {
        const result = suite.run({ ...validGrantData });
        expect(result.hasErrors("contract-type")).toBe(false);
        expect(result.hasErrors("procurement-shop-select")).toBe(false);
        expect(result.hasErrors("service_requirement_type")).toBe(false);
        expect(result.hasErrors("product_service_code_id")).toBe(false);
        expect(result.hasErrors("agreement_reason")).toBe(false);
        expect(result.hasErrors("project_officer")).toBe(false);
    });

    it("still fails when name is missing", () => {
        const result = suite.run({ ...validGrantData, name: "" });
        expect(result.hasErrors("name")).toBe(true);
    });

    it("still fails when project_id is missing", () => {
        const result = suite.run({ ...validGrantData, project_id: 0 });
        expect(result.hasErrors("project_id")).toBe(true);
    });
});

describe("AgreementEditFormSuite — CONTRACT regression", () => {
    it("passes with all required contract fields", () => {
        const result = suite.run(validContractData);
        expect(result.hasErrors()).toBe(false);
    });

    it("fails contract-type when missing", () => {
        const result = suite.run({ ...validContractData, contract_type: undefined });
        expect(result.hasErrors("contract-type")).toBe(true);
    });

    it("fails procurement-shop-select when missing", () => {
        const result = suite.run({ ...validContractData, "procurement-shop-select": undefined });
        expect(result.hasErrors("procurement-shop-select")).toBe(true);
    });

    it("fails service_requirement_type when missing", () => {
        const result = suite.run({
            ...validContractData,
            service_requirement_type: "-Select Service Requirement Type-"
        });
        expect(result.hasErrors("service_requirement_type")).toBe(true);
    });

    it("does not require nofo_number for contracts", () => {
        const result = suite.run(validContractData);
        expect(result.hasErrors("nofo_number")).toBe(false);
    });
});

describe("AgreementEditFormSuite — IAA still blocked", () => {
    it("blocks IAA agreement type", () => {
        const result = suite.run({ agreement_type: "IAA", "agreement-type-filter": "IAA", name: "X", project_id: 1 });
        expect(result.hasErrors("agreement_type")).toBe(true);
    });
});
