import { useState, useMemo } from "react";
import CurrencyCard from "../../UI/Cards/CurrencyCard";
import HorizontalStackedBar from "../../UI/DataViz/HorizontalStackedBar/HorizontalStackedBar";
import PortfolioLegend from "./PortfolioLegend";
import {
    calculateTotalBudget,
    sortPortfoliosByStaticOrder,
    transformPortfoliosToChartData
} from "./PortfolioSummaryCards.helpers";
import styles from "./PortfolioSummaryCards.module.scss";

/**
 * @typedef {Object} PortfolioSummaryCardsProps
 * @property {number} fiscalYear - The selected fiscal year
 * @property {Array} filteredPortfolios - Portfolios after applying filters
 */

/**
 * PortfolioSummaryCards component - displays FY budget distribution across portfolios
 * Shows a horizontal stacked bar graph with portfolio funding breakdown
 * @component
 * @param {PortfolioSummaryCardsProps} props
 * @returns {JSX.Element} - The rendered component
 */
const PortfolioSummaryCards = ({ fiscalYear, filteredPortfolios = [] }) => {
    const [activeId, setActiveId] = useState(0);

    // Calculate total budget across all filtered portfolios
    const totalBudget = useMemo(() => calculateTotalBudget(filteredPortfolios), [filteredPortfolios]);

    // Sort portfolios by static order (DCFD, DFS, DEI, OD, Non-OPRE, OCDO)
    const sortedPortfolios = useMemo(() => sortPortfoliosByStaticOrder(filteredPortfolios), [filteredPortfolios]);

    // Transform to chart data format
    const chartData = useMemo(
        () => transformPortfoliosToChartData(sortedPortfolios, totalBudget),
        [sortedPortfolios, totalBudget]
    );

    // Handle empty or zero budget state
    if (!filteredPortfolios || filteredPortfolios.length === 0 || totalBudget === 0) {
        return (
            <div className={styles.fullWidthCard}>
                <CurrencyCard
                    headerText={`FY ${fiscalYear} Budget Across Portfolios`}
                    amount={0}
                    dataCy="portfolio-budget-summary-card"
                >
                    <div className="margin-top-6">
                        <p className="text-base-dark text-center font-12px margin-0">
                            No budget data available for FY {fiscalYear}
                        </p>
                    </div>
                </CurrencyCard>
            </div>
        );
    }

    return (
        <div className={styles.fullWidthCard}>
            <CurrencyCard
                headerText={`FY ${fiscalYear} Budget Across Portfolios`}
                amount={totalBudget}
                dataCy="portfolio-budget-summary-card"
            >
                <div className="margin-top-2">
                    <HorizontalStackedBar
                        data={chartData}
                        setActiveId={setActiveId}
                    />
                </div>
                <PortfolioLegend
                    data={chartData}
                    activeId={activeId}
                />
            </CurrencyCard>
        </div>
    );
};

export default PortfolioSummaryCards;
