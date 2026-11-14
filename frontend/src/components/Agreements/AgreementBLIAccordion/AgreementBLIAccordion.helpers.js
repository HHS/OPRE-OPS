import { getProcurementShopFees } from "../../../helpers/agreement.helpers";
import { budgetLinesTotal, getBudgetByStatus, getNonDRAFTBudgetLines } from "../../../helpers/budgetLines.helpers";
import { draftBudgetLineStatuses } from "../../../helpers/utils";

/**
 * The budget lines and totals behind the Agreement Total card when reviewing budget lines (not on
 * an approval page, or a Draft to Planned approval): the agreement's non-Draft budget lines, plus
 * the selected Draft ones after the change. Shared with Start Modification's Award Total (#3269),
 * so the two always show the same number.
 * @param {import("../../../types/AgreementTypes").Agreement} agreement
 * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} selectedBudgetLineItems
 * @param {boolean} afterApproval - Whether to include the selected Draft budget lines.
 * @returns {{budgetLines: import("../../../types/BudgetLineTypes").BudgetLine[], subtotal: number, fees: number, total: number}}
 */
export const getAgreementTotalCardValues = (agreement, selectedBudgetLineItems = [], afterApproval = false) => {
    const notDraftBLIs = getNonDRAFTBudgetLines(agreement?.budget_line_items || []);
    const selectedDRAFTBudgetLines = getBudgetByStatus(selectedBudgetLineItems, draftBudgetLineStatuses);
    const budgetLines = afterApproval ? [...selectedDRAFTBudgetLines, ...notDraftBLIs] : notDraftBLIs;
    const fees = getProcurementShopFees(agreement, budgetLines, afterApproval);
    const subtotal = budgetLinesTotal(budgetLines);
    return { budgetLines, subtotal, fees, total: subtotal + fees };
};
