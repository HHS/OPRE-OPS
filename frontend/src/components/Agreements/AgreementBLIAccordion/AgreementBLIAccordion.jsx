import { NO_DATA } from "../../../constants";
import { calculateTotal } from "../../../helpers/agreement.helpers";
import {
    BLI_STATUS,
    budgetLinesTotal,
    getBudgetByStatus,
    getNonDRAFTBudgetLines
} from "../../../helpers/budgetLines.helpers";
import { draftBudgetLineStatuses } from "../../../helpers/utils";
import { selectedAction } from "../../../pages/agreements/review/ReviewAgreement.constants";
import { CHANGE_REQUEST_SLUG_TYPES } from "../../ChangeRequests/ChangeRequests.constants";
import Accordion from "../../UI/Accordion";
import ToggleButton from "../../UI/ToggleButton";
import AgreementTotalCard from "../AgreementDetailsCards/AgreementTotalCard";
import BLIsByFYSummaryCard from "../AgreementDetailsCards/BLIsByFYSummaryCard";
import { getProcurementShopSubTotal } from "../AgreementsTable/AgreementsTable.helpers";
/**
    @typedef {import('../../../types/BudgetLineTypes').BudgetLine} BudgetLine
    @typedef {import('../../../types/AgreementTypes').Agreement} Agreement
*/

/**
@typedef AgreementBLIAccordionProps
@property {string} title - The title of the accordion.
@property {string} instructions - The instructions for the accordion.
@property {BudgetLine[]} budgetLineItems - The budget line items.
@property {React.ReactNode} children - The children to render.
@property {Agreement} agreement - The agreement object.
@property {boolean} afterApproval - Flag indicating whether to show remaining budget after approval.
@property {Function} setAfterApproval - Function to set the afterApproval flag.
@property {string} action - The action to perform.
@property {boolean} [isApprovePage=false] - Flag indicating if the page is the approve page.
@property {BudgetLine[]} [updatedBudgetLines=[]] - The updated budget lines.
@property {CHANGE_REQUEST_SLUG_TYPES} [changeRequestType]
@property { import("../../../types/AgreementTypes").ProcurementShop | null | undefined }[newAwardingEntity]
@property { import("../../../types/AgreementTypes").ProcurementShop | null | undefined }[oldAwardingEntity]
*/

/**
 * @component - an accordion component for reviewing budget line items
 * @param {AgreementBLIAccordionProps} props - The props for the component.
 * @returns {React.ReactElement} The AgreementBLIAccordion component.
 */
function AgreementBLIAccordion({
    title,
    instructions,
    budgetLineItems: selectedBudgetLineItems = [],
    children,
    agreement,
    afterApproval,
    setAfterApproval,
    action,
    isApprovePage = false,
    updatedBudgetLines = [],
    changeRequestType = undefined,
    newAwardingEntity = undefined,
    oldAwardingEntity = undefined
}) {
    const showToggle =
        action === selectedAction.DRAFT_TO_PLANNED ||
        action === BLI_STATUS.PLANNED ||
        changeRequestType === CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP ||
        isApprovePage;
    const isDraftToPlanned = isApprovePage && action === BLI_STATUS.PLANNED;

    // Use the same logic for both !isApprovePage and isDraftToPlanned scenarios
    const notDraftBLIs = getNonDRAFTBudgetLines(agreement.budget_line_items || []);
    const selectedDRAFTBudgetLines = getBudgetByStatus(selectedBudgetLineItems, draftBudgetLineStatuses);
    const updatedBudgetLinesWithoutDrafts = !isDraftToPlanned
        ? updatedBudgetLines.filter((bli) => bli.status !== BLI_STATUS.DRAFT)
        : updatedBudgetLines;
    let budgetLinesForCards, subTotalForCards, feesForCards, totalsForCards;
    let procurementShopAbbr = agreement.procurement_shop?.abbr;

    if (!isApprovePage || isDraftToPlanned) {
        budgetLinesForCards = afterApproval ? [...selectedDRAFTBudgetLines, ...notDraftBLIs] : notDraftBLIs;
        feesForCards = getProcurementShopSubTotal(agreement, budgetLinesForCards, afterApproval);
        subTotalForCards = budgetLinesTotal(budgetLinesForCards);
        totalsForCards = subTotalForCards + feesForCards;
    } else if (changeRequestType !== CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP) {
        budgetLinesForCards = afterApproval ? updatedBudgetLinesWithoutDrafts : notDraftBLIs;
        feesForCards = getProcurementShopSubTotal(agreement, budgetLinesForCards, afterApproval);
        subTotalForCards = budgetLinesTotal(budgetLinesForCards);
        totalsForCards = subTotalForCards + feesForCards;
    } else {
        budgetLinesForCards = afterApproval ? updatedBudgetLinesWithoutDrafts : notDraftBLIs;
        feesForCards = afterApproval
            ? calculateTotal(budgetLinesForCards, (newAwardingEntity?.fee_percentage ?? 0) / 100, true)
            : calculateTotal(budgetLinesForCards, (oldAwardingEntity?.fee_percentage ?? 0) / 100);
        subTotalForCards = budgetLinesTotal(budgetLinesForCards);
        totalsForCards = subTotalForCards + feesForCards;
        procurementShopAbbr = afterApproval
            ? (newAwardingEntity?.abbr ?? NO_DATA)
            : (oldAwardingEntity?.abbr ?? NO_DATA);
    }

    return (
        <Accordion
            heading={title}
            level={2}
        >
            <p>{instructions}</p>
            <div className="display-flex flex-justify-end margin-top-3 margin-bottom-2">
                {showToggle && (
                    <ToggleButton
                        btnText="After Approval"
                        handleToggle={() => setAfterApproval(!afterApproval)}
                        isToggleOn={afterApproval}
                    />
                )}
            </div>
            <div className="display-flex flex-justify">
                <AgreementTotalCard
                    total={totalsForCards}
                    subtotal={subTotalForCards}
                    fees={feesForCards}
                    procurementShopAbbr={procurementShopAbbr}
                />
                <BLIsByFYSummaryCard budgetLineItems={budgetLinesForCards} />
            </div>
            {children}
        </Accordion>
    );
}

export default AgreementBLIAccordion;
