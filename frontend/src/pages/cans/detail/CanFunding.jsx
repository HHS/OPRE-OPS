import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CANBudgetByFYCard from "../../../components/CANs/CANBudgetByFYCard/CANBudgetByFYCard";
import CANBudgetForm from "../../../components/CANs/CANBudgetForm";
import CANFundingInfoCard from "../../../components/CANs/CANFundingInfoCard";
import CANFundingReceivedTable from "../../../components/CANs/CANFundingReceivedTable";
import Accordion from "../../../components/UI/Accordion";
import ReceivedFundingCard from "../../../components/UI/Cards/BudgetCard/ReceivedFundingCard";
import { getCurrentFiscalYear } from "../../../helpers/utils";

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
 * @property {boolean} isBudgetTeamMember
 * @property {boolean} isEditMode
 * @property {() => void} toggleEditMode
 */

/**
 * @component - The CAN Funding component.
 * @param {CanFundingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanFunding = ({
    funding,
    fundingBudgets,
    fiscalYear,
    totalFunding,
    receivedFunding,
    fundingReceived,
    isBudgetTeamMember,
    isEditMode,
    toggleEditMode,
    carryForwardFunding
}) => {
    const currentFiscalYear = getCurrentFiscalYear();
    const showButton = isBudgetTeamMember && fiscalYear === Number(currentFiscalYear);

    if (!funding) {
        return <div>No funding information available for this CAN.</div>;
    }

    return (
        <div>
            <div className="display-flex flex-justify">
                <h2>{!isEditMode ? "CAN Funding" : `Review FY ${fiscalYear} Funding Information`}</h2>
                {showButton && (
                    <button
                        id="edit"
                        className="hover:text-underline cursor-pointer"
                        onClick={toggleEditMode}
                    >
                        <FontAwesomeIcon
                            icon={faPen}
                            size="2x"
                            className="text-primary height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                        />
                        <span className="text-primary">Edit</span>
                    </button>
                )}
            </div>
            <p>
                {!isEditMode
                    ? "The summary below shows the funding for this CAN for the select fiscal year."
                    : "Review the new FY Funding Information for this CAN."}
            </p>
            <CANFundingInfoCard
                funding={funding}
                fiscalYear={fiscalYear}
            />
            {!isEditMode ? (
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
                            * For multi-year CANs, the total budget will display in the first year, and the
                            carry-forward will display in every year after
                        </p>
                        <p className="font-12px text-base-dark margin-0">
                            * TBD means the FY Budget has not yet been entered by the Budget Team
                        </p>
                    </div>
                </section>
            ) : (
                <section id="can-budget-form-section">
                    <h2>{`Add FY ${fiscalYear} CAN Budget`}</h2>
                    <p>{`Enter the FY ${fiscalYear} CAN Budget that teams will utilize for planning. For Multi-Year CANs, the Previous FYs Carry-Forward will display for you to review and enter as-is or edit, if needed.`}</p>
                    <CANBudgetForm carryForwardAmount={carryForwardFunding} />
                </section>
            )}
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
