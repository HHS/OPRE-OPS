import { create, enforce, only, test } from "vest";

const suite = create((data = {}, fieldName = undefined) => {
    only(fieldName);

    test("name", "This information is required to submit for approval", () => {
        enforce(data.name).isNotBlank();
    });
    test("type", "This information is required to submit for approval", () => {
        enforce(data.agreement_type).isNotBlank();
    });
    test("description", "This information is required to submit for approval", () => {
        enforce(data.description).isNotBlank();
    });
    test("psc", "This information is required to submit for approval", () => {
        enforce(data.product_service_code?.name).isNotBlank();
    });
    test("procurement-shop", "This information is required to submit for approval", () => {
        enforce(data.procurement_shop?.abbr).isNotBlank();
    });
    test("reason", "This information is required to submit for approval", () => {
        enforce(data.agreement_reason).isNotBlank();
    });
    // vendor is not required
    test("project-officer", "This information is required to submit for approval", () => {
        enforce(data.project_officer_id).isNotBlank();
    });
    test("contract-type", "This information is required to submit for approval", () => {
        enforce(data.contract_type).notEquals("-Select an option-");
        enforce(data.contract_type).isNotEmpty();
    });
    test("team-members", "This information is required to submit for approval", () => {
        const teamMembers = Array.isArray(data.team_members) ? data.team_members : [];
        enforce(teamMembers).longerThan(0);
    });
    // test to ensure at least one budget line item exists
    test("budget-line-items", "Must have at least one budget line item", () => {
        const budgetLines = Array.isArray(data.budget_line_items) ? data.budget_line_items : [];
        enforce(budgetLines).longerThan(0);
    });
});

const budgetLineSuite = create((budgetLine = {}, fieldName) => {
    only(fieldName);

    test("Budget Line Amount", "Budget Line Amount must be greater than 0", () => {
        const amount = Number(budgetLine.amount ?? 0);
        enforce(amount).greaterThan(0);
    });

    test("Budget Line CAN", "This information is required to submit for approval", () => {
        enforce(budgetLine.can_id).isNotBlank();
    });

    test("Budget lines need to be assigned to a services component to change their status", () => {
        enforce(budgetLine.services_component_id).isNotBlank();
    });

    test("Budget Line Obligate By Date", "This information is required to submit for approval", () => {
        enforce(budgetLine.date_needed).isNotBlank();
    });

    test("Budget Line Obligate By Date must be in the future", () => {
        const today = new Date().valueOf();
        const dateNeeded = new Date(budgetLine.date_needed ?? null);
        enforce(dateNeeded.getTime()).greaterThan(today);
    });
});

/**
 * Validate a single budget line item.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLine
 * @param {string} [fieldName]
 * @returns {import("vest").VestResult} - Vest result for the provided budget line
 */
export const validateBudgetLineItem = (budgetLine, fieldName) => {
    budgetLineSuite.reset();
    budgetLineSuite(budgetLine, fieldName);
    return budgetLineSuite.get();
};

/**
 * Validate one or more budget line items independently from the agreement.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine | import("../../../types/BudgetLineTypes").BudgetLine[]} budgetLines
 * @returns {{ id: number | null, result: import("vest").VestResult }[]} - Collection of budget line validation results
 */
export const validateBudgetLineItems = (budgetLines = []) => {
    const items = Array.isArray(budgetLines) ? budgetLines : [budgetLines];
    return items.map((budgetLine) => ({
        id: budgetLine?.id ?? null,
        result: validateBudgetLineItem(budgetLine)
    }));
};

export default suite;
