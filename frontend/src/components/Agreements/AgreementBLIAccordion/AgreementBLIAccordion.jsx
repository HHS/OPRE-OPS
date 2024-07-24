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
 * Renders an accordion component for selecting budget lines for an agreement.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.title - The title of the accordion.
 * @param {string} props.instructions - The instructions for the accordion.
 * @param {Object[]} props.budgetLineItems - An array of budget line items.
 * @param {React.ReactNode} props.children - Child components to be rendered inside the accordion.
 * @param {Object} props.agreement - The agreement object.
 * @param {boolean} props.afterApproval - Flag indicating whether to show remaining budget after approval.
 * @param {Function} props.setAfterApproval - Function to set the afterApproval flag.
 * @param {string} props.action - The action to perform.
 * @param {boolean} [props.isApprovePage=false] - Flag indicating if the page is the approve page.
 * @param {Object[]} [props.updatedBudgetLines=[]] - An array of updated budget lines.
 * @returns {JSX.Element} - The rendered accordion component.
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
    const notDraftBLIs = getNonDRAFTBudgetLines(agreement.budget_line_items);
    const selectedDRAFTBudgetLines = getBudgetByStatus(selectedBudgetLineItems, draftBudgetLineStatuses);
    const budgetLinesForCards = afterApproval ? [...selectedDRAFTBudgetLines, ...notDraftBLIs] : notDraftBLIs;
    const feesForCards = getProcurementShopSubTotal(agreement, budgetLinesForCards);
    const subTotalForCards = budgetLinesTotal(budgetLinesForCards);
    const totalsForCards = subTotalForCards + getProcurementShopSubTotal(agreement, budgetLinesForCards);
    const showToggle = action === BLI_STATUS.PLANNED || isApprovePage;
    // TODO: Consider refactoring to be more DRY
    const diffsForCards = afterApproval ? updatedBudgetLines : selectedBudgetLineItems;
    const feesForDiffCards = getProcurementShopSubTotal(agreement, diffsForCards);
    const subTotalForDiffCards = budgetLinesTotal(diffsForCards);
    const totalsForDiffCards = subTotalForDiffCards + feesForDiffCards;

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
                {isApprovePage && (
                    <>
                        <BLIsByFYSummaryCard budgetLineItems={diffsForCards} />
                        <AgreementTotalCard
                            total={totalsForDiffCards}
                            subtotal={subTotalForDiffCards}
                            fees={feesForDiffCards}
                            procurementShopAbbr={agreement.procurement_shop?.abbr}
                            procurementShopFee={agreement.procurement_shop?.fee}
                        />
                    </>
                )}
                {!isApprovePage && (
                    <>
                        <BLIsByFYSummaryCard budgetLineItems={budgetLinesForCards} />
                        <AgreementTotalCard
                            total={totalsForCards}
                            subtotal={subTotalForCards}
                            fees={feesForCards}
                            procurementShopAbbr={agreement.procurement_shop?.abbr}
                            procurementShopFee={agreement.procurement_shop?.fee}
                        />
                    </>
                )}
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
