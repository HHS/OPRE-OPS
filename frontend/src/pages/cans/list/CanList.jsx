import React from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useGetCansQuery } from "../../../api/opsAPI";
import App from "../../../App";
import CANSummaryCards from "../../../components/CANs/CANSummaryCards";
import CANTable from "../../../components/CANs/CANTable";
import CANTags from "../../../components/CANs/CanTabs";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { setSelectedFiscalYear } from "../../../pages/cans/detail/canDetailSlice";
import ErrorPage from "../../ErrorPage";
import CANFilterButton from "./CANFilterButton";
import CANFilterTags from "./CANFilterTags";
import CANFiscalYearSelect from "./CANFiscalYearSelect";
import { getPortfolioOptions, getSortedFYBudgets, sortAndFilterCANs } from "./CanList.helpers";

/**
 * Page for the CAN List.
 * @component
 * @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
 * @returns {JSX.Element | boolean} - The component JSX.
 */
const CanList = () => {
    const [searchParams] = useSearchParams();
    const myCANsUrl = searchParams.get("filter") === "my-cans";
    const { data: canList, isError, isLoading } = useGetCansQuery({});
    const activeUser = useSelector((state) => state.auth.activeUser);
    const selectedFiscalYear = useSelector((state) => state.canDetail.selectedFiscalYear);
    const fiscalYear = Number(selectedFiscalYear.value);
    const [filters, setFilters] = React.useState({
        activePeriod: [],
        transfer: [],
        portfolio: [],
        budget: []
    });
    const filteredCANsByFiscalYear = React.useMemo(() => {
        if (!fiscalYear || !canList) return [];
        return canList.filter(
            /** @param {CAN} can */
            (can) => can.funding_details?.fiscal_year === fiscalYear
        );
    }, [canList, fiscalYear]);
    const sortedCANs = sortAndFilterCANs(filteredCANsByFiscalYear, myCANsUrl, activeUser, filters) || [];
    const portfolioOptions = getPortfolioOptions(canList);
    const sortedFYBudgets = getSortedFYBudgets(filteredCANsByFiscalYear);
    const [minFYBudget, maxFYBudget] = [sortedFYBudgets[0], sortedFYBudgets[sortedFYBudgets.length - 1]];

    if (isLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (isError) {
        return <ErrorPage />;
    }

    // TODO: remove flag once CANS are ready
    return (
        import.meta.env.DEV && (
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
                    SummaryCardsSection={<CANSummaryCards fiscalYear={fiscalYear} />}
                />
            </App>
        )
    );
};

export default CanList;
