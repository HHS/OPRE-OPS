import suite, { validateBudgetLineItem, validateBudgetLineItems } from "./suite";

describe("Agreement Review Suite", () => {
    const validData = {
        name: "Agreement Name",
        agreement_type: "Type A",
        description: "A description",
        product_service_code: { name: "PSC" },
        procurement_shop: { abbr: "SHOP" },
        agreement_reason: "Reason",
        project_officer_id: 1,
        contract_type: "Firm Fixed Price",
        team_members: [{ id: 1, name: "Member" }],
        budget_line_items: [{ id: 1 }]
    };

    it("passes validation with all required fields", () => {
        suite.reset();
        suite(validData);
        const result = suite.get();
        expect(result.isValid()).toBe(true);
        expect(result.getErrors()).toEqual({});
    });

    it("fails validation if required fields are missing", () => {
        suite.reset();
        suite({});
        const result = suite.get();
        expect(result.isValid()).toBe(false);
        expect(result.getErrors()).toHaveProperty("name");
        expect(result.getErrors()).toHaveProperty("type");
        expect(result.getErrors()).toHaveProperty("description");
        expect(result.getErrors()).toHaveProperty("psc");
        expect(result.getErrors()).toHaveProperty("procurement-shop");
        expect(result.getErrors()).toHaveProperty("reason");
        expect(result.getErrors()).toHaveProperty("project-officer");
        expect(result.getErrors()).toHaveProperty("contract-type");
        expect(result.getErrors()).toHaveProperty("team-members");
        expect(result.getErrors()).toHaveProperty("budget-line-items");
    });

    it("validates only a single field when fieldName is provided", () => {
        suite.reset();
        suite({}, "name");
        const result = suite.get();
        expect(Object.keys(result.getErrors())).toEqual(["name"]);
        expect(result.isValid()).toBe(false);
    });

    it("does not require vendor", () => {
        const data = { ...validData };
        delete data.vendor;
        suite.reset();
        suite(data);
        const result = suite.get();
        expect(result.isValid()).toBe(true);
    });

    it("fails if contract_type is '-Select an option-'", () => {
        const data = { ...validData, contract_type: "-Select an option-" };
        suite.reset();
        suite(data);
        const result = suite.get();
        expect(result.isValid()).toBe(false);
        expect(result.getErrors()).toHaveProperty("contract-type");
    });

    it("fails if team_members is empty", () => {
        const data = { ...validData, team_members: [] };
        suite.reset();
        suite(data);
        const result = suite.get();
        expect(result.isValid()).toBe(false);
        expect(result.getErrors()).toHaveProperty("team-members");
    });

    it("fails if budget_line_items is empty", () => {
        const data = { ...validData, budget_line_items: [] };
        suite.reset();
        suite(data);
        const result = suite.get();
        expect(result.isValid()).toBe(false);
        expect(result.getErrors()).toHaveProperty("budget-line-items");
    });
});

describe("Budget Line Suite", () => {
    const futureDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().slice(0, 10);
    };

    const validBudgetLine = {
        id: 1,
        amount: 1000,
        can_id: "CAN123",
        services_component_id: "SC1",
        date_needed: futureDate()
    };

    it("passes validation with all required fields", () => {
        const result = validateBudgetLineItem(validBudgetLine);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
    });

    it("fails if amount is 0 or negative", () => {
        const result = validateBudgetLineItem({ ...validBudgetLine, amount: 0 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveProperty("Budget Line Amount");
    });

    it("fails if can_id is blank", () => {
        const result = validateBudgetLineItem({ ...validBudgetLine, can_id: "" });
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveProperty("Budget Line CAN");
    });

    it("fails if services_component_id is blank", () => {
        const result = validateBudgetLineItem({ ...validBudgetLine, services_component_id: "" });
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveProperty(
            "Budget lines need to be assigned to a services component to change their status"
        );
    });

    it("fails if date_needed is blank", () => {
        const result = validateBudgetLineItem({ ...validBudgetLine, date_needed: "" });
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveProperty("Budget Line Obligate By Date");
    });

    it("fails if date_needed is in the past", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 2);
        const result = validateBudgetLineItem({ ...validBudgetLine, date_needed: pastDate.toISOString().slice(0, 10) });
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveProperty("Budget Line Obligate By Date must be in the future");
    });

    it("validates only a single field when fieldName is provided", () => {
        const result = validateBudgetLineItem({}, "Budget Line Amount");
        expect(result.isValid).toBe(false);
        expect(Object.keys(result.errors)).toContain("Budget Line Amount");
        expect(Object.keys(result.errors).length).toBe(1);
    });
});

describe("validateBudgetLineItems", () => {
    const validBudgetLine = {
        id: 1,
        amount: 100,
        can_id: "CAN",
        services_component_id: "SC",
        date_needed: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return d.toISOString().slice(0, 10);
        })()
    };

    it("returns array of results for multiple budget lines", () => {
        const lines = [validBudgetLine, { ...validBudgetLine, id: 2, amount: 0 }];
        const results = validateBudgetLineItems(lines);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        expect(results[0].isValid).toBe(true);
        expect(results[1].isValid).toBe(false);
        expect(results[1].errors).toHaveProperty("Budget Line Amount");
    });

    it("handles single object input", () => {
        const result = validateBudgetLineItems(validBudgetLine);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0].isValid).toBe(true);
    });

    it("returns id as null if not present", () => {
        const result = validateBudgetLineItems({ amount: 0 });
        expect(result[0].id).toBeNull();
    });
});
