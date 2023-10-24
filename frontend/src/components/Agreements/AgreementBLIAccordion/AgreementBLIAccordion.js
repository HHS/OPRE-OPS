import PropTypes from "prop-types";
import Accordion from "../../UI/Accordion";
import BLIsByFYSummaryCard from "../AgreementDetailsCards/BLIsByFYSummaryCard";
import AgreementTotalCard from "../AgreementDetailsCards/AgreementTotalCard";
import { getAgreementSubTotal, getProcurementShopSubTotal } from "../../../helpers/agreement.helpers";

/**
 * Renders an accordion component for selecting budget lines for an agreement.
 * @param {Object} props - The component props.
 * @param {Object[]} props.budgetLineItems - An array of budget line items.
 * @param {React.ReactNode} props.children - Child components to be rendered inside the accordion.
 * @param {Object} props.agreement - The agreement object.
 * @returns {React.JSX.Element} - The rendered accordion component.
 */
function AgreementBLIAccordion({ budgetLineItems = [], children, agreement }) {
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
            <div className="display-flex flex-justify">
                <BLIsByFYSummaryCard budgetLineItems={budgetLineItems} />
                <AgreementTotalCard
                    total={getAgreementSubTotal(agreement) + getProcurementShopSubTotal(agreement)}
                    subtotal={getAgreementSubTotal(agreement)}
                    fees={getProcurementShopSubTotal(agreement)}
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
    agreement: PropTypes.object
};
export default AgreementBLIAccordion;
