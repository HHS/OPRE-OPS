import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import PacmanLoader from "react-spinners/PacmanLoader";
import App from "../../../App";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import PortfolioTable from "../../../components/Portfolios/PortfolioTable";
import PortfolioSummaryCards from "../../../components/Portfolios/PortfolioSummaryCards";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import icons from "../../../uswds/img/sprite.svg";
import PortfolioFiscalYearSelect from "./PortfolioFiscalYearSelect";
import PortfolioTabs from "./PortfolioTabs";
import PortfolioFilterButton from "./PortfolioFilterButton";
import PortfolioFilterTags from "./PortfolioFilterTags";
import { usePortfolioList } from "./PortfolioList.hooks";
import { handlePortfolioExport } from "./PortfolioList.helpers";
import useAlert from "../../../hooks/use-alert.hooks";
import { tableSortCodes } from "../../../helpers/utils";

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
    const [isExporting, setIsExporting] = React.useState(false);
    const { setAlert } = useAlert();

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
        portfoliosWithFunding,
        filteredPortfolios,
        fyBudgetRange,
        isLoading,
        isError
    } = usePortfolioList({ currentUserId, searchParams });

    // Table sorting state - default to static order matching the legend
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions(
        tableSortCodes.portfolioCodes.STATIC_ORDER,
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

    // Show loading spinner during export
    if (isExporting) {
        return (
            <div className="bg-white display-flex flex-column flex-align-center flex-justify-center padding-y-4 height-viewport">
                <h1 className="margin-bottom-2">Exporting...</h1>
                <PacmanLoader
                    size={25}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                />
            </div>
        );
    }

    const subtitle = activeTab === "all" ? "All Portfolios" : "My Portfolios";
    const details =
        activeTab === "all"
            ? "This is a list of all portfolios across OPRE with their budget and spending data for the selected fiscal year."
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
                SummaryCardsSection={
                    activeTab === "all" ? (
                        <PortfolioSummaryCards
                            fiscalYear={fiscalYear}
                            filteredPortfolios={filteredPortfolios}
                        />
                    ) : null
                }
                FilterButton={
                    <div className="display-flex">
                        <div>
                            {portfoliosWithFunding.length > 0 && (
                                <button
                                    style={{ fontSize: "16px" }}
                                    className="usa-button--unstyled text-primary display-flex flex-align-end cursor-pointer"
                                    data-cy="portfolio-export"
                                    onClick={() =>
                                        handlePortfolioExport(
                                            exportTableToXlsx,
                                            setIsExporting,
                                            setAlert,
                                            fiscalYear,
                                            portfoliosWithFunding
                                        )
                                    }
                                >
                                    <svg
                                        className="height-2 width-2 margin-right-05"
                                        style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                                    >
                                        <use href={`${icons}#save_alt`}></use>
                                    </svg>
                                    <span>Export</span>
                                </button>
                            )}
                        </div>
                        <div className="margin-left-205">
                            <PortfolioFilterButton
                                filters={filters}
                                setFilters={setFilters}
                                allPortfolios={allPortfolios || []}
                                fyBudgetRange={fyBudgetRange}
                            />
                        </div>
                    </div>
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
