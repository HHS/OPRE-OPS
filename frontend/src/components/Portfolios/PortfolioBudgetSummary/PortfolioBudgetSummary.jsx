import AgreementSpendingCards from "../../Agreements/AgreementSpendingCards";
import AgreementSpendingSummaryCard from "../../Agreements/AgreementSpendingSummaryCard";
import BLIStatusSummaryCard from "../../BudgetLineItems/BLIStatusSummaryCard";
import ReportingCountCard from "../../Reporting/ReportingCountCard";
import BigBudgetCard from "../../UI/Cards/BudgetCard/BigBudgetCard";

/**
 * @typedef {Object} PortfolioBudgetSummaryProps
 * @property {number} fiscalYear
 * @property {number} totalFunding
 * @property {number} inExecutionFunding
 * @property {number} obligatedFunding
 * @property {number} plannedFunding
 * @property {number} inDraftFunding
 * @property {Object} [spendingData]
 * @property {Object} [counts]
 */

/**
 * @component
 * @param {PortfolioBudgetSummaryProps} props
 * @returns {JSX.Element}
 */

const PortfolioBudgetSummary = ({
    fiscalYear,
    inDraftFunding,
    totalFunding,
    inExecutionFunding,
    obligatedFunding,
    plannedFunding,
    spendingData,
    counts
}) => {
    const totalSpending = Number(plannedFunding) + Number(obligatedFunding) + Number(inExecutionFunding);
    const totalBLIAmount =
        Number(inDraftFunding) + Number(plannedFunding) + Number(inExecutionFunding) + Number(obligatedFunding);

    const agreementTypes = spendingData?.agreement_types ?? [];
    const contractTotal = agreementTypes.find((t) => t.type === "CONTRACT")?.total ?? 0;
    const partnerTotal = agreementTypes.find((t) => t.type === "PARTNER")?.total ?? 0;
    const grantTotal = agreementTypes.find((t) => t.type === "GRANT")?.total ?? 0;
    const directObligationTotal = agreementTypes.find((t) => t.type === "DIRECT_OBLIGATION")?.total ?? 0;

    return (
        <section>
            <BigBudgetCard
                title={`FY ${fiscalYear} Available Portfolio Budget *`}
                totalSpending={totalSpending}
                totalFunding={totalFunding}
            />
            <div className="margin-top-4">
                <AgreementSpendingCards
                    fiscalYear={fiscalYear}
                    spendingData={spendingData}
                />
            </div>
            <div className="margin-top-4">
                <ReportingCountCard
                    fiscalYear={fiscalYear}
                    counts={counts}
                />
            </div>
            <div className="margin-top-4 margin-bottom-10 display-flex flex-justify gap-4">
                <AgreementSpendingSummaryCard
                    titlePrefix={`FY ${fiscalYear}`}
                    contractTotal={contractTotal}
                    partnerTotal={partnerTotal}
                    grantTotal={grantTotal}
                    directObligationTotal={directObligationTotal}
                />
                <BLIStatusSummaryCard
                    titlePrefix={`FY ${fiscalYear}`}
                    totalDraftAmount={inDraftFunding}
                    totalPlannedAmount={plannedFunding}
                    totalExecutingAmount={inExecutionFunding}
                    totalObligatedAmount={obligatedFunding}
                    totalAmount={totalBLIAmount}
                />
            </div>
        </section>
    );
};

export default PortfolioBudgetSummary;
