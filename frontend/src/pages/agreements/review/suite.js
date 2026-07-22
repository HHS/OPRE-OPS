import { create, enforce, only, test } from "vest";

const suite = create((data = {}, fieldName = undefined) => {
    if (fieldName) {
        only(fieldName);
    }

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
    test("vendor", "This information is required to submit for approval", () => {
        if (
            data.agreement_reason &&
            (data.agreement_reason === "RECOMPETE" || data.agreement_reason === "LOGICAL_FOLLOW_ON")
        ) {
            enforce(data.vendor).isNotBlank();
        }
    });
    test("project-officer", "This information is required to submit for approval", () => {
        enforce(Number(data.project_officer_id)).greaterThan(0);
    });
    test("contract-type", "This information is required to submit for approval", () => {
        enforce(data.contract_type).notEquals("-Select an option-");
        enforce(data.contract_type).isNotEmpty();
    });
    // test to ensure at least one budget line item exists
    test("budget-line-items", "Must have at least one budget line item", () => {
        const budgetLines = Array.isArray(data.budget_line_items) ? data.budget_line_items : [];
        enforce(budgetLines).longerThan(0);
    });
});

const budgetLineSuite = create((budgetLine = {}, fieldName) => {
    if (fieldName) {
        only(fieldName);
    }

    test("Budget Line Amount", "Budget Line Amount must be greater than 0", () => {
        const amount = Number(budgetLine.amount ?? 0);
        enforce(amount).greaterThan(0);
    });

    test("Budget Line CAN", "This information is required to submit for approval", () => {
        const canId = Number(budgetLine.can_id ?? 0);
        enforce(canId).greaterThan(0);
    });

    test("Budget lines need to be assigned to a services component to change their status", () => {
        const servicesComponentId = Number(budgetLine.services_component_id ?? 0);
        enforce(servicesComponentId).greaterThan(0);
    });

    test("Budget Line Obligate By Date", "This information is required to submit for approval", () => {
        enforce(budgetLine.date_needed).isNotBlank();
    });

    test("Budget Line Obligate By Date must be in the future", () => {
        // Parse the ISO date string directly via split to avoid the UTC-midnight pitfall:
        // new Date("YYYY-MM-DD") is UTC, and getDate() in a negative-offset timezone returns
        // the prior local day. Splitting gives the calendar date the user intended.
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const [y, mo, d] = (budgetLine.date_needed ?? "").split("-").map(Number);
        const dateOnly = (isNaN(y) || isNaN(mo) || isNaN(d)) ? new Date(0) : new Date(y, mo - 1, d);
        enforce(dateOnly.getTime()).greaterThan(todayOnly.getTime());
    });
});

/**
 * Map from raw budgetLineSuite test() keys → normalized field ids used by
 * convertCodeForDisplay("validation", key) in the error banner.
 * The vest test keys are verbose strings; the normalized ids are short, consistent,
 * and registered in the validation display map in src/helpers/utils.js.
 */
const BLI_ERROR_KEY_MAP = {
    "Budget Line Amount": "amount",
    "Budget Line CAN": "can",
    "Budget lines need to be assigned to a services component to change their status": "services_component",
    "Budget Line Obligate By Date": "date_needed",
    "Budget Line Obligate By Date must be in the future": "date_needed"
};

/**
 * Remap raw budgetLineSuite error keys to normalized ids.
 * Multiple raw keys may map to the same normalized id (e.g. both date tests → date_needed);
 * the first message wins, matching the de-dup behavior in the callers' seen-set loops.
 */
const normalizeErrors = (rawErrors = {}) => {
    return Object.entries(rawErrors).reduce((acc, [key, value]) => {
        const normalizedKey = BLI_ERROR_KEY_MAP[key] ?? key;
        if (!Object.prototype.hasOwnProperty.call(acc, normalizedKey)) {
            acc[normalizedKey] = Array.isArray(value) ? [...value] : value;
        }
        return acc;
    }, {});
};

/**
 * Validate a single budget line item.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLine
 * @param {string} [fieldName]
 * @returns {{ isValid: boolean, errors: Record<string, string[]> }} - Result summary for the provided budget line
 */
export const validateBudgetLineItem = (budgetLine, fieldName) => {
    budgetLineSuite.reset();
    budgetLineSuite.run(budgetLine, fieldName);
    const result = budgetLineSuite.get();
    return {
        isValid: result.isValid(),
        errors: normalizeErrors(result.getErrors())
    };
};

/**
 * Validate one or more budget line items independently from the agreement.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine | import("../../../types/BudgetLineTypes").BudgetLine[]} budgetLines
 * @returns {{ id: number | null, isValid: boolean, errors: Record<string, string[]> }[]} - Collection of budget line validation results
 */
export const validateBudgetLineItems = (budgetLines = []) => {
    const items = Array.isArray(budgetLines) ? budgetLines : [budgetLines];

    return items.map((budgetLine) => ({
        id: budgetLine?.id ?? null,
        ...validateBudgetLineItem(budgetLine)
    }));
};

export default suite;
