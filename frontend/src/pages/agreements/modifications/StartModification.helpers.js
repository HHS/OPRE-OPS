import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { isBudgetLineInCurrentFiscalYear } from "../review/ReviewAgreement.helpers";

export const MOD_BLI_DISABLED_REASONS = {
    NOT_PLANNED: "Only Budget Lines in Planned Status can be changed to Executing Status",
    CANNOT_CHANGE: "Budget lines in Obligated Status cannot be changed",
    NOT_CURRENT_FY: "Only current FY Budget Lines can be changed from Planned to Executing Status",
    IN_REVIEW: "Budget lines In Review Status cannot be changed until they have been approved or declined",
    SC_AWAITING_APPROVAL:
        "Budget lines in a Services Component that is awaiting approval cannot be changed until it has been approved or declined"
};

/**
 * Why a budget line can't be selected to execute in a contract modification, or null when it can.
 * Mirrors the backend check in ContractModificationRequestService.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLine
 * @param {{id: number, awaiting_add_approval?: boolean}[]} [servicesComponents] - The agreement's services components
 * @returns {string | null}
 */
export const getModBudgetLineDisabledReason = (budgetLine, servicesComponents = []) => {
    switch (budgetLine.status) {
        case BLI_STATUS.DRAFT:
            return MOD_BLI_DISABLED_REASONS.NOT_PLANNED;
        case BLI_STATUS.PLANNED:
            break;
        default:
            // Executing and Obligated budget lines are already on the contract.
            return MOD_BLI_DISABLED_REASONS.CANNOT_CHANGE;
    }
    if (budgetLine.in_review) {
        return MOD_BLI_DISABLED_REASONS.IN_REVIEW;
    }
    if (!isBudgetLineInCurrentFiscalYear(budgetLine)) {
        return MOD_BLI_DISABLED_REASONS.NOT_CURRENT_FY;
    }
    const servicesComponent = servicesComponents.find((sc) => sc.id === budgetLine.services_component_id);
    if (servicesComponent?.awaiting_add_approval) {
        return MOD_BLI_DISABLED_REASONS.SC_AWAITING_APPROVAL;
    }
    return null;
};
