import {
    BLI_STATUS,
    budgetLinesTotal,
    getBudgetByStatus,
    getNonDRAFTBudgetLines
} from "../../../helpers/budgetLines.helpers";
import { draftBudgetLineStatuses } from "../../../helpers/utils";
import { selectedAction } from "../../../pages/agreements/review/ReviewAgreement.constants";
import Accordion from "../../UI/Accordion";
import ToggleButton from "../../UI/ToggleButton";
import AgreementTotalCard from "../AgreementDetailsCards/AgreementTotalCard";
import BLIsByFYSummaryCard from "../AgreementDetailsCards/BLIsByFYSummaryCard";
import { getProcurementShopSubTotal } from "../AgreementsTable/AgreementsTable.helpers";
/**
    @typedef {import('../../../components/BudgetLineItems/BudgetLineTypes').BudgetLine} BudgetLine
    @typedef {import('../../../components/Agreements/AgreementTypes').Agreement} Agreement
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
*/

/**
 * @component - an accordion component for reviewing budget line items
 * @param {AgreementBLIAccordionProps} props - The props for the component.
 * @returns {JSX.Element} The AgreementBLIAccordion component.
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
    updatedBudgetLines = []
}) {
    //NOTE: Scenarios to test:
    // 1. Status Changes to DRAFT to PLANNED ✅
    // 2. Budget Changes to PLANNED Budget lines ✅
    // 3. Status Changes to PLANNED to EXECUTING ✅
    // 4. Cannot make Budget Change to EXECUTING Budget lines

    const showToggle = action === selectedAction.DRAFT_TO_PLANNED || action === BLI_STATUS.PLANNED || isApprovePage;
    const isDraftToPlanned = isApprovePage && action === BLI_STATUS.PLANNED;

    // Use the same logic for both !isApprovePage and isDraftToPlanned scenarios
    const notDraftBLIs = getNonDRAFTBudgetLines(agreement.budget_line_items || []);
    const selectedDRAFTBudgetLines = getBudgetByStatus(selectedBudgetLineItems, draftBudgetLineStatuses);
    const updatedBudgetLinesWithoutDrafts = !isDraftToPlanned
        ? updatedBudgetLines.filter((bli) => bli.status !== BLI_STATUS.DRAFT)
        : updatedBudgetLines;
    let budgetLinesForCards, subTotalForCards, feesForCards, totalsForCards;

    if (!isApprovePage || isDraftToPlanned) {
        budgetLinesForCards = afterApproval ? [...selectedDRAFTBudgetLines, ...notDraftBLIs] : notDraftBLIs;
        feesForCards = getProcurementShopSubTotal(agreement, budgetLinesForCards);
        subTotalForCards = budgetLinesTotal(budgetLinesForCards);
        totalsForCards = subTotalForCards + feesForCards;
    } else {
        const diffsForCards = afterApproval ? updatedBudgetLinesWithoutDrafts : notDraftBLIs;
        feesForCards = getProcurementShopSubTotal(agreement, diffsForCards);
        subTotalForCards = budgetLinesTotal(diffsForCards);
        totalsForCards = subTotalForCards + feesForCards;
        budgetLinesForCards = diffsForCards;
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
                    procurementShopAbbr={agreement.procurement_shop?.abbr}
                    procurementShopFee={agreement.procurement_shop?.fee}
                />
                <BLIsByFYSummaryCard budgetLineItems={budgetLinesForCards} />
            </div>
            {children}
        </Accordion>
    );
}

export default AgreementBLIAccordion;
