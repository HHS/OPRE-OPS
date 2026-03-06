import App from "../../App";
import BigBudgetCard from "../../components/UI/Cards/BudgetCard/BigBudgetCard";
import FiscalYear from "../../components/UI/FiscalYear/FiscalYear";
import { useReportingPageData } from "./ReportingPage.hooks";

const ReportingPage = () => {
    const { fiscalYear, selectedFiscalYear, setSelectedFiscalYear, totalFunding, totalSpending, isLoading } =
        useReportingPageData();

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
                <BigBudgetCard
                    title={`FY ${fiscalYear} Available OPRE Budget *`}
                    totalSpending={totalSpending}
                    totalFunding={totalFunding}
                />
            )}
        </App>
    );
};

export default ReportingPage;
