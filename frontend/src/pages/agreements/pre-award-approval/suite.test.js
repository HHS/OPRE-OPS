import { describe, expect, it } from "vitest";
import suite, { validateBudgetLineItems } from "./suite";

const validAgreement = {
    name: "Test Agreement",
    agreement_type: "CONTRACT",
    description: "Test description",
    product_service_code: { name: "PSC 123" },
    procurement_shop: { abbr: "GCS" },
    agreement_reason: "NEW_REQ",
    project_officer_id: 42,
    contract_type: "FIRM_FIXED_PRICE",
    team_members: [{ id: 1 }],
    budget_line_items: [{ id: 1 }]
};

const futureDateISO = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
};

describe("Pre-Award Approval validation suite (reused from review flow)", () => {
    it("exports a vest suite runtime", () => {
        expect(suite).toBeDefined();
        expect(typeof suite.run).toBe("function");
        expect(typeof suite.reset).toBe("function");
    });

    it("passes for a fully-populated agreement", () => {
        const result = suite.run(validAgreement);
        expect(result.hasErrors()).toBe(false);
    });

    it("reports agreement-level errors when required fields are missing", () => {
        const result = suite.run({ ...validAgreement, name: "" });
        expect(result.hasErrors("name")).toBe(true);
    });

    it("requires vendor when agreement_reason is RECOMPETE", () => {
        const result = suite.run({ ...validAgreement, agreement_reason: "RECOMPETE" });
        expect(result.hasErrors("vendor")).toBe(true);
    });
});

describe("validateBudgetLineItems (reused)", () => {
    it("returns valid for a BLI with all fields populated", () => {
        const result = validateBudgetLineItems([
            {
                id: 1,
                amount: 100,
                can_id: 5,
                services_component_id: 2,
                date_needed: futureDateISO()
            }
        ]);
        expect(result[0].isValid).toBe(true);
    });

    it("returns invalid for a BLI missing a CAN", () => {
        const result = validateBudgetLineItems([
            {
                id: 1,
                amount: 100,
                can_id: null,
                services_component_id: 2,
                date_needed: futureDateISO()
            }
        ]);
        expect(result[0].isValid).toBe(false);
    });
});
