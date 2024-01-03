import PropTypes from "prop-types";
import Accordion from "../../UI/Accordion";
import BLIsByFYSummaryCard from "../AgreementDetailsCards/BLIsByFYSummaryCard";
import AgreementTotalCard from "../AgreementDetailsCards/AgreementTotalCard";
import ToggleButton from "../../UI/ToggleButton";
import { draftBudgetLineStatuses } from "../../../helpers/utils";
import { budgetLinesTotal, getBudgetByStatus, getNonDRAFTBudgetLines } from "../../../helpers/budgetLines.helpers";
import { getProcurementShopSubTotal } from "../AgreementsTable/AgreementsTable.helpers";

/**
 * Renders an accordion component for selecting budget lines for an agreement.
 * @param {Object} props - The component props.
 * @param {string} props.title - The title of the accordion.
 * @param {Object[]} props.budgetLineItems - An array of budget line items.
 * @param {React.ReactNode} props.children - Child components to be rendered inside the accordion.
 * @param {Object} props.agreement - The agreement object.
 * @param {boolean} props.afterApproval - Flag indicating whether to show remaining budget after approval.
 * @param {Function} props.setAfterApproval - Function to set the afterApproval flag.
 * @returns {React.JSX.Element} - The rendered accordion component.
 */
function AgreementBLIAccordion({
    title,
    budgetLineItems: selectedBudgetLineItems = [],
    children,
    agreement,
    afterApproval,
    setAfterApproval
}) {
    const notDraftBLIs = getNonDRAFTBudgetLines(agreement.budget_line_items);
    const selectedDRAFTBudgetLines = getBudgetByStatus(selectedBudgetLineItems, draftBudgetLineStatuses);
    const budgetLinesForCards = afterApproval ? [...selectedDRAFTBudgetLines, ...notDraftBLIs] : notDraftBLIs;
    const feesForCards = getProcurementShopSubTotal(agreement, budgetLinesForCards);
    const subTotalForCards = budgetLinesTotal(budgetLinesForCards);
    const totalsForCards = subTotalForCards + getProcurementShopSubTotal(agreement, budgetLinesForCards);

    return (
        <Accordion
            heading={title}
            level={2}
        >
            <p>
                This is a list of all budget lines within this agreement. The budget lines showing In Review Status need
                your approval to change from Draft to Planned Status. Use the toggle to see how your approval would
                change the agreement total.
            </p>
            <div className="display-flex flex-justify-end margin-top-3 margin-bottom-2">
                <ToggleButton
                    btnText="After Approval"
                    handleToggle={() => setAfterApproval(!afterApproval)}
                    isToggleOn={afterApproval}
                />
            </div>
            <div className="display-flex flex-justify">
                <BLIsByFYSummaryCard budgetLineItems={budgetLinesForCards} />
                <AgreementTotalCard
                    total={totalsForCards}
                    subtotal={subTotalForCards}
                    fees={feesForCards}
                    procurementShop={agreement.procurement_shop}
                />
            </div>
            {children}
        </Accordion>
    );
}
AgreementBLIAccordion.propTypes = {
    title: PropTypes.string.isRequired,
    budgetLineItems: PropTypes.arrayOf(PropTypes.object),
    children: PropTypes.node,
    agreement: PropTypes.object,
    afterApproval: PropTypes.bool,
    setAfterApproval: PropTypes.func
};
export default AgreementBLIAccordion;
