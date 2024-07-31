import PropTypes from "prop-types";
import {
    BLI_STATUS,
    budgetLinesTotal,
    getBudgetByStatus,
    getNonDRAFTBudgetLines
} from "../../../helpers/budgetLines.helpers";
import { draftBudgetLineStatuses } from "../../../helpers/utils";
import Accordion from "../../UI/Accordion";
import ToggleButton from "../../UI/ToggleButton";
import AgreementTotalCard from "../AgreementDetailsCards/AgreementTotalCard";
import BLIsByFYSummaryCard from "../AgreementDetailsCards/BLIsByFYSummaryCard";
import { getProcurementShopSubTotal } from "../AgreementsTable/AgreementsTable.helpers";

/**
 * Renders an accordion component for reviewing budget line items.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.title - The title of the accordion.
 * @param {string} props.instructions - The instructions for the accordion.
 * @param {Object[]} props.budgetLineItems - The budget line items.
 * @param {React.ReactNode} props.children - The children to render.
 * @param {Object} props.agreement - The agreement object.
 * @param {boolean} props.afterApproval - Flag indicating whether to show remaining budget after approval.
 * @param {Function} props.setAfterApproval - Function to set the afterApproval flag.
 * @param {string} props.action - The action to perform.
 * @param {boolean} [props.isApprovePage=false] - Flag indicating if the page is the approve page.
 * @param {Object[]} [props.updatedBudgetLines=[]] - The updated budget lines.
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
    const showToggle = action === BLI_STATUS.PLANNED || isApprovePage;

    const isDraftToPlanned = isApprovePage && action === BLI_STATUS.PLANNED;

    // Use the same logic for both !isApprovePage and isDraftToPlanned scenarios
    const notDraftBLIs = getNonDRAFTBudgetLines(agreement.budget_line_items);
    const selectedDRAFTBudgetLines = getBudgetByStatus(selectedBudgetLineItems, draftBudgetLineStatuses);

    let budgetLinesForCards, subTotalForCards, feesForCards, totalsForCards;

    if (!isApprovePage || isDraftToPlanned) {
        budgetLinesForCards = afterApproval ? [...selectedDRAFTBudgetLines, ...notDraftBLIs] : notDraftBLIs;
        feesForCards = getProcurementShopSubTotal(agreement, budgetLinesForCards);
        subTotalForCards = budgetLinesTotal(budgetLinesForCards);
        totalsForCards = subTotalForCards + feesForCards;
    } else {
        const diffsForCards = afterApproval ? updatedBudgetLines : selectedBudgetLineItems;
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
                <BLIsByFYSummaryCard budgetLineItems={budgetLinesForCards} />
                <AgreementTotalCard
                    total={totalsForCards}
                    subtotal={subTotalForCards}
                    fees={feesForCards}
                    procurementShopAbbr={agreement.procurement_shop?.abbr}
                    procurementShopFee={agreement.procurement_shop?.fee}
                />
            </div>
            {children}
        </Accordion>
    );
}

AgreementBLIAccordion.propTypes = {
    title: PropTypes.string.isRequired,
    instructions: PropTypes.string.isRequired,
    budgetLineItems: PropTypes.arrayOf(PropTypes.object),
    children: PropTypes.node,
    agreement: PropTypes.object,
    afterApproval: PropTypes.bool,
    setAfterApproval: PropTypes.func,
    action: PropTypes.string,
    isApprovePage: PropTypes.bool,
    updatedBudgetLines: PropTypes.arrayOf(PropTypes.object)
};

export default AgreementBLIAccordion;
