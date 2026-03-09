import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import App from "../../App";
import AgreementSpendingCards from "../../components/Agreements/AgreementSpendingCards";
import AgreementSpendingSummaryCard from "../../components/Agreements/AgreementSpendingSummaryCard";
import BLIStatusSummaryCard from "../../components/BudgetLineItems/BLIStatusSummaryCard";
import PortfolioSummaryCards from "../../components/Portfolios/PortfolioSummaryCards";
import ReportingCountCard from "../../components/Reporting/ReportingCountCard";
import BigBudgetCard from "../../components/UI/Cards/BudgetCard/BigBudgetCard";
import FiscalYear from "../../components/UI/FiscalYear/FiscalYear";
import { useReportingPageData } from "./ReportingPage.hooks";

const ReportingPage = () => {
    const navigate = useNavigate();
    const {
        fiscalYear,
        selectedFiscalYear,
        setSelectedFiscalYear,
        totalFunding,
        totalSpending,
        portfoliosWithFunding,
        agreementSpendingData,
        reportingSummaryData,
        bliStatusSpending,
        isLoading,
        isError
    } = useReportingPageData();

    useEffect(() => {
        if (isError) {
            navigate("/error");
        }
    }, [isError, navigate]);

    return (
        <App breadCrumbName="OPRE Budget Reporting">
            <div className="display-flex flex-justify flex-align-center">
                <h1 className="margin-0 margin-bottom-2 text-brand-primary font-sans-2xl">OPRE Budget Reporting</h1>
                <FiscalYear
                    fiscalYear={selectedFiscalYear}
                    handleChangeFiscalYear={setSelectedFiscalYear}
                />
            </div>
            <p className="margin-top-0">All Portfolios</p>

            <h2 className="margin-bottom-1">Budget Summary</h2>
            <p>This is a summary of OPRE&apos;s budget for the selected FY and applied filters.</p>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <BigBudgetCard
                        title={`FY ${fiscalYear} Available OPRE Budget *`}
                        totalSpending={totalSpending}
                        totalFunding={totalFunding}
                    />
                    <div className="margin-top-4">
                        <PortfolioSummaryCards
                            fiscalYear={fiscalYear}
                            filteredPortfolios={portfoliosWithFunding}
                        />
                    </div>
                </>
            )}
            <h2 className="margin-bottom-1">Spending Summary</h2>
            <p>This is a summary of OPRE&apos;s spending for the selected FY and applied filters.</p>
            {!isLoading && (
                <>
                    <div className="margin-top-4">
                        <AgreementSpendingCards
                            fiscalYear={fiscalYear}
                            spendingData={agreementSpendingData}
                        />
                    </div>
                    <div className="margin-top-4">
                        <ReportingCountCard
                            fiscalYear={fiscalYear}
                            counts={reportingSummaryData}
                        />
                    </div>
                    <div className="margin-top-4 display-flex flex-justify gap-4">
                        <AgreementSpendingSummaryCard
                            titlePrefix={`FY ${fiscalYear}`}
                            contractTotal={
                                agreementSpendingData?.agreement_types?.find((t) => t.type === "CONTRACT")?.total ?? 0
                            }
                            partnerTotal={
                                agreementSpendingData?.agreement_types?.find((t) => t.type === "PARTNER")?.total ?? 0
                            }
                            grantTotal={
                                agreementSpendingData?.agreement_types?.find((t) => t.type === "GRANT")?.total ?? 0
                            }
                            directObligationTotal={
                                agreementSpendingData?.agreement_types?.find((t) => t.type === "DIRECT_OBLIGATION")
                                    ?.total ?? 0
                            }
                        />
                        <BLIStatusSummaryCard
                            titlePrefix={`FY ${fiscalYear}`}
                            totalDraftAmount={bliStatusSpending.draft}
                            totalPlannedAmount={bliStatusSpending.planned}
                            totalExecutingAmount={bliStatusSpending.inExecution}
                            totalObligatedAmount={bliStatusSpending.obligated}
                            totalAmount={bliStatusSpending.total}
                        />
                    </div>
                </>
            )}
        </App>
    );
};

export default ReportingPage;
