import React from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useGetCanFundingSummaryQuery, useGetCansQuery } from "../../../api/opsAPI";
import App from "../../../App";
import CANSummaryCards from "../../../components/CANs/CANSummaryCards";
import CANTable from "../../../components/CANs/CANTable";
import CANTags from "../../../components/CANs/CanTabs";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import ErrorPage from "../../ErrorPage";
import CANFilterButton from "./CANFilterButton";
import CANFilterTags from "./CANFilterTags";
import CANFiscalYearSelect from "./CANFiscalYearSelect";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { filterCANsByFiscalYear, getPortfolioOptions, getSortedFYBudgets, sortAndFilterCANs } from "./CanList.helpers";

/**
 * Page for the CAN List.
 * @component
 * @typedef {import("../../../types/CANTypes").CAN} CAN
 * @returns {JSX.Element | boolean} - The component JSX.
 */
const CanList = () => {
    const [searchParams] = useSearchParams();
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();
    const myCANsUrl = searchParams.get("filter") === "my-cans";
    const activeUser = useSelector((state) => state.auth.activeUser);
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());
    const fiscalYear = Number(selectedFiscalYear);
    const [filters, setFilters] = React.useState({
        activePeriod: [],
        transfer: [],
        portfolio: [],
        budget: []
    });
    const { data: canList, isError, isLoading } = useGetCansQuery({ fiscalYear: selectedFiscalYear, sortConditions: sortCondition, sortDescending});

    const activePeriodIds = filters.activePeriod?.map((ap) => ap.id);
    const transferTitles = filters.transfer?.map((t) => {
        return t.title.toUpperCase();
    });
    const portfolioAbbreviations = filters.portfolio?.map((p) => p.abbr);

    const { data: fundingSummaryData, isLoading: fundingSummaryIsLoading } = useGetCanFundingSummaryQuery({
        ids: [0],
        fiscalYear: fiscalYear,
        activePeriod: activePeriodIds,
        transfer: transferTitles,
        portfolio: portfolioAbbreviations,
        fyBudgets: filters.budget
    });

    const filteredCANsByFiscalYear = React.useMemo(() => {
        return filterCANsByFiscalYear(canList, fiscalYear);
    }, [canList, fiscalYear]);
    const sortedCANs = sortAndFilterCANs(filteredCANsByFiscalYear, myCANsUrl, activeUser, filters, fiscalYear) || [];
    const portfolioOptions = getPortfolioOptions(canList);
    const sortedFYBudgets = getSortedFYBudgets(filteredCANsByFiscalYear, fiscalYear);
    const [minFYBudget, maxFYBudget] = [sortedFYBudgets[0], sortedFYBudgets[sortedFYBudgets.length - 1]];

    if (isLoading || fundingSummaryIsLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (isError) {
        return <ErrorPage />;
    }

    return (
        <App breadCrumbName="CANs">
            <TablePageLayout
                title="CANs"
                subtitle={myCANsUrl ? "My CANs" : "All CANs"}
                details={
                    myCANsUrl
                        ? "This is a list of CANs from agreements you are listed as a team member on. Please select filter options to see CANs by Portfolio, Fiscal Year, or other criteria."
                        : "This is a list of all CANs across OPRE that are or were active within the selected Fiscal Year."
                }
                TabsSection={<CANTags />}
                TableSection={
                    <CANTable
                        cans={sortedCANs}
                        fiscalYear={fiscalYear}
                        sortConditions={sortCondition}
                        sortDescending={sortDescending}
                        setSortConditions={setSortConditions}
                    />
                }
                FilterButton={
                    <CANFilterButton
                        filters={filters}
                        setFilters={setFilters}
                        portfolioOptions={portfolioOptions}
                        fyBudgetRange={[minFYBudget, maxFYBudget]}
                        disabled={filteredCANsByFiscalYear.length === 0}
                    />
                }
                FYSelect={
                    <CANFiscalYearSelect
                        fiscalYear={fiscalYear}
                        setSelectedFiscalYear={setSelectedFiscalYear}
                    />
                }
                FilterTags={
                    <CANFilterTags
                        filters={filters}
                        setFilters={setFilters}
                        fyBudgetRange={[minFYBudget, maxFYBudget]}
                    />
                }
                SummaryCardsSection={
                    <CANSummaryCards
                        fiscalYear={fiscalYear}
                        totalBudget={fundingSummaryData?.total_funding}
                        newFunding={fundingSummaryData?.new_funding}
                        carryForward={fundingSummaryData?.carry_forward_funding}
                        plannedFunding={fundingSummaryData?.planned_funding}
                        obligatedFunding={fundingSummaryData?.obligated_funding}
                        inExecutionFunding={fundingSummaryData?.in_execution_funding}
                    />
                }
            />
        </App>
    );
};

export default CanList;
