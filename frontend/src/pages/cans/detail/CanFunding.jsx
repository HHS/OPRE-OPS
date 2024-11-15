import CANBudgetByFYCard from "../../../components/CANs/CANBudgetByFYCard/CANBudgetByFYCard";
import CANFundingInfoCard from "../../../components/CANs/CANFundingInfoCard";
import DebugCode from "../../../components/DebugCode";
import BudgetCard from "../../../components/UI/Cards/BudgetCard";

/**
 *  @typedef {import("../../../components/CANs/CANTypes").FundingDetails} FundingDetails
 *  @typedef {import("../../../components/CANs/CANTypes").FundingBudget} FundingBudget
 */

/**
 * @typedef {Object} CanFundingProps
 * @property {FundingDetails} [funding]
 * @property {FundingBudget[]} fundingBudgets
 * @property {number} fiscalYear
 * @property {number} expectedFunding
 * @property {number} receivedFunding
 */

/**
 * @component - The CAN Funding component.
 * @param {CanFundingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanFunding = ({ funding, fundingBudgets, fiscalYear, expectedFunding, receivedFunding }) => {
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
            <div className="display-flex flex-justify margin-top-4">
                <BudgetCard
                    title={`FY ${fiscalYear} Funding Received YTD`}
                    totalSpending={expectedFunding}
                    totalFunding={receivedFunding}
                />
                <CANBudgetByFYCard fundingBudgets={fundingBudgets} />
            </div>
            <DebugCode
                title="can.funding_budgets"
                data={fundingBudgets[0]}
            />
        </div>
    );
};

export default CanFunding;
