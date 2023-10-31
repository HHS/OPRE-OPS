import PropTypes from "prop-types";
import Accordion from "../../UI/Accordion";
import BLIsByFYSummaryCard from "../AgreementDetailsCards/BLIsByFYSummaryCard";
import AgreementTotalCard from "../AgreementDetailsCards/AgreementTotalCard";
import { getAgreementSubTotal, getProcurementShopSubTotal } from "../../../helpers/agreement.helpers";
import ToggleButton from "../../UI/ToggleButton";

/**
 * Renders an accordion component for selecting budget lines for an agreement.
 * @param {Object} props - The component props.
 * @param {Object[]} props.budgetLineItems - An array of budget line items.
 * @param {React.ReactNode} props.children - Child components to be rendered inside the accordion.
 * @param {Object} props.agreement - The agreement object.
 * @param {boolean} props.afterApproval - Flag indicating whether to show remaining budget after approval.
 * @param {Function} props.setAfterApproval - Function to set the afterApproval flag.
 * @returns {React.JSX.Element} - The rendered accordion component.
 */
function AgreementBLIAccordion({ budgetLineItems = [], children, agreement, afterApproval, setAfterApproval }) {
    const agreementSubtotal = getAgreementSubTotal(agreement);
    const agreementFees = getProcurementShopSubTotal(agreement);
    const agreementTotal = agreementSubtotal + agreementFees;
    const selectedBLISubtotal = budgetLineItems?.reduce((acc, { amount }) => acc + amount, 0);
    const selectedBLIFees = budgetLineItems?.reduce(
        (acc, { amount }) => acc + amount * (agreement.procurement_shop ? agreement.procurement_shop.fee : 0),
        0
    );
    const selectedBLITotal = selectedBLISubtotal + selectedBLIFees;
    const totalAfterApproval = afterApproval ? selectedBLITotal : agreementTotal - selectedBLITotal;
    const budgetLinesAfterApproval = afterApproval ? budgetLineItems : agreement.budget_lines;
    const feesAfterApproval = afterApproval ? selectedBLIFees : agreementFees - selectedBLIFees;
    const subTotalAfterApproval = afterApproval ? selectedBLISubtotal : agreementSubtotal - selectedBLISubtotal;
    return (
        <Accordion
            heading="Select Budget Lines"
            level={2}
        >
            <p>
                Select the budget lines you’d like this action to apply to. The agreement will be sent to your Division
                Director to review and approve before changes are made. Use the toggle to see how your request would
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
                <BLIsByFYSummaryCard budgetLineItems={budgetLinesAfterApproval} />
                <AgreementTotalCard
                    total={totalAfterApproval}
                    subtotal={subTotalAfterApproval}
                    fees={feesAfterApproval}
                    procurementShop={agreement.procurement_shop}
                />
            </div>
            {children}
        </Accordion>
    );
}
AgreementBLIAccordion.propTypes = {
    budgetLineItems: PropTypes.arrayOf(PropTypes.object),
    children: PropTypes.node,
    agreement: PropTypes.object,
    afterApproval: PropTypes.bool,
    setAfterApproval: PropTypes.func
};
export default AgreementBLIAccordion;
