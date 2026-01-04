import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import App from "../../../App";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import PortfolioTable from "../../../components/Portfolios/PortfolioTable";
import PortfolioSummaryCards from "../../../components/Portfolios/PortfolioSummaryCards";
import { tableSortCodes } from "../../../helpers/utils";
import PortfolioFiscalYearSelect from "./PortfolioFiscalYearSelect";
import PortfolioTabs from "./PortfolioTabs";
import PortfolioFilterButton from "./PortfolioFilterButton";
import PortfolioFilterTags from "./PortfolioFilterTags";
import { usePortfolioList } from "./PortfolioList.hooks";

/**
 * @typedef {import("../../../types/PortfolioTypes").Portfolio} Portfolio
 */

/**
 * @component that displays a list of portfolios in a table grouped by division
 * @returns {React.ReactElement} The rendered component
 */
const PortfolioList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get current user for "My Portfolios" filtering
    const activeUser = useSelector((state) => state?.userSlice?.activeUser);
    const currentUserId = activeUser?.id;

    // Custom hook for managing portfolio list state and data
    const {
        setSelectedFiscalYear,
        activeTab,
        setActiveTab,
        filters,
        setFilters,
        fiscalYear,
        allPortfolios,
        filteredPortfolios,
        fyBudgetRange,
        isLoading,
        isError
    } = usePortfolioList({ currentUserId, searchParams });

    // Table sorting state
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions(
        tableSortCodes.portfolioCodes.DIVISION,
        false
    );

    // Handle error navigation in useEffect to avoid setState during render
    React.useEffect(() => {
        if (isError) {
            navigate("/error");
        }
    }, [isError, navigate]);

    // Handle loading state
    if (isLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }

    if (isError) {
        return null;
    }

    const subtitle = activeTab === "all" ? "All Portfolios" : "My Portfolios";
    const details =
        activeTab === "all"
            ? "This is a list of all portfolios across OPRE."
            : "This is a list of portfolios where you are a team leader.";

    return (
        <App breadCrumbName="Portfolios">
            <TablePageLayout
                title="Portfolios"
                subtitle={subtitle}
                details={details}
                FYSelect={
                    <PortfolioFiscalYearSelect
                        fiscalYear={fiscalYear}
                        setSelectedFiscalYear={setSelectedFiscalYear}
                    />
                }
                TabsSection={
                    <PortfolioTabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                }
                SummaryCardsSection={<PortfolioSummaryCards />}
                FilterButton={
                    <PortfolioFilterButton
                        filters={filters}
                        setFilters={setFilters}
                        allPortfolios={allPortfolios || []}
                        fyBudgetRange={fyBudgetRange}
                    />
                }
                FilterTags={
                    <PortfolioFilterTags
                        filters={filters}
                        setFilters={setFilters}
                    />
                }
                TableSection={
                    <PortfolioTable
                        portfolios={filteredPortfolios}
                        fiscalYear={fiscalYear}
                        sortConditions={sortCondition}
                        sortDescending={sortDescending}
                        setSortConditions={setSortConditions}
                    />
                }
            />
        </App>
    );
};

export default PortfolioList;
