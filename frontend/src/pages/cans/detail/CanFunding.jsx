import CANFundingInfoCard from "../../../components/CANs/CANFundingInfoCard";
import DebugCode from "../../../components/DebugCode";

/**
 *  @typedef {import("../../../components/CANs/CANTypes").FundingDetails} FundingDetails
 *  @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 */

/**
 * @typedef {Object} CanFundingProps
 * @property {FundingDetails} [funding]
 * @property {number} fiscalYear
 */

/**
 * @component - The CAN Funding component.
 * @param {CanFundingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanFunding = ({ funding, fiscalYear }) => {
    if (!funding) {
        return <div>No funding information available for this CAN.</div>;
    }
    return (
        <div>
            <h2>Can Funding</h2>
            <p>The summary below shows the funding for this CAN for the select fiscal year.</p>
            <CANFundingInfoCard
                funding={funding}
                fiscalYear={fiscalYear}
            />
            <DebugCode
                title="can.funding_details"
                data={funding}
            />
        </div>
    );
};

export default CanFunding;
