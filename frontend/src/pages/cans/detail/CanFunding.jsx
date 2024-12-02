import CANBudgetByFYCard from "../../../components/CANs/CANBudgetByFYCard/CANBudgetByFYCard";
import CANFundingInfoCard from "../../../components/CANs/CANFundingInfoCard";
import CANFundingReceivedTable from "../../../components/CANs/CANFundingReceivedTable";
import Accordion from "../../../components/UI/Accordion";
import ReceivedFundingCard from "../../../components/UI/Cards/BudgetCard/ReceivedFundingCard";

/**
 * @typedef {import("../../../components/CANs/CANTypes").FundingDetails} FundingDetails
 * @typedef {import("../../../components/CANs/CANTypes").FundingBudget} FundingBudget
 * @typedef {import("../../../components/CANs/CANTypes").FundingReceived} FundingReceived
 */

/**
 * @typedef {Object} CanFundingProps
 * @property {FundingDetails} [funding]
 * @property {FundingBudget[]} fundingBudgets
 * @property {number} fiscalYear
 * @property {number} totalFunding
 * @property {number} receivedFunding
 * @property {FundingReceived[]} fundingReceived data for table
 */

/**
 * @component - The CAN Funding component.
 * @param {CanFundingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanFunding = ({ funding, fundingBudgets, fiscalYear, totalFunding, receivedFunding, fundingReceived }) => {
    if (!funding) {
        return <div>No funding information available for this CAN.</div>;
    }

    return (
        <div>
            <h2>CAN Funding</h2>
            <p>The summary below shows the funding for this CAN for the select fiscal year.</p>
            <CANFundingInfoCard
                funding={funding}
                fiscalYear={fiscalYear}
            />
            <section
                id="cards"
                className="margin-bottom-4"
            >
                <div className="display-flex flex-justify margin-top-4">
                    <ReceivedFundingCard
                        title={`FY ${fiscalYear} Funding Received YTD`}
                        totalReceived={receivedFunding}
                        totalFunding={totalFunding}
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
            <Accordion
                heading="Funding Received YTD"
                level={2}
            >
                {fundingReceived.length === 0 ? (
                    <p className="text-center">No funding received data available for this CAN.</p>
                ) : (
                    <CANFundingReceivedTable
                        fundingReceived={fundingReceived}
                        totalFunding={totalFunding}
                    />
                )}
            </Accordion>
        </div>
    );
};

export default CanFunding;
