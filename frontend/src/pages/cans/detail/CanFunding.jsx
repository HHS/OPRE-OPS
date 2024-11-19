import CANBudgetByFYCard from "../../../components/CANs/CANBudgetByFYCard/CANBudgetByFYCard";
import CANFundingInfoCard from "../../../components/CANs/CANFundingInfoCard";
import BudgetCard from "../../../components/UI/Cards/BudgetCard";

/**
 *  @typedef {import("../../../components/CANs/CANTypes").FundingDetails} FundingDetails
 *  @typedef {import("../../../components/CANs/CANTypes").FundingBudget} FundingBudget
 * @typedef {import("../../../components/CANs/CANTypes").FundingReceived} FundingReceived
 */

/**
 * @typedef {Object} CanFundingProps
 * @property {FundingDetails} [funding]
 * @property {FundingBudget[]} fundingBudgets
 * @property {number} fiscalYear
 * @property {number} expectedFunding
 * @property {number} receivedFunding
 * @property {FundingReceived[]} fundingReceived
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
            <section id="cards">
                <div className="display-flex flex-justify margin-top-4">
                    <BudgetCard
                        title={`FY ${fiscalYear} Funding Received YTD`}
                        totalSpending={expectedFunding}
                        totalFunding={receivedFunding}
                    />
                    <CANBudgetByFYCard fundingBudgets={fundingBudgets} />
                </div>
                <div className="margin-top-05">
                    <p className="font-12px text-base-dark margin-0">
                        * For multi-year CANs, the total budget will display in the first year, and the carry-forward
                        will display in every year after
                    </p>
                    <p className="font-12px text-base-dark margin-0">
                        * TBD means the FY Budget has not yet been entered by the Budget Team
                    </p>
                </div>
            </section>
        </div>
    );
};

export default CanFunding;
