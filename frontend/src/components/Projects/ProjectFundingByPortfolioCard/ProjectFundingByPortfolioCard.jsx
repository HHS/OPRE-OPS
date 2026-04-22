import { useState } from "react";
import PortfolioLegend from "../../Portfolios/PortfolioSummaryCards/PortfolioLegend";
import CurrencyCard from "../../UI/Cards/CurrencyCard";
import HorizontalStackedBar from "../../UI/DataViz/HorizontalStackedBar/HorizontalStackedBar";
import styles from "../../Portfolios/PortfolioSummaryCards/PortfolioSummaryCards.module.scss";
import { buildPortfolioChartData } from "./ProjectFundingByPortfolioCard.helpers";

/**
 * @typedef {Object} FundingByPortfolioItem
 * @property {number} portfolio_id
 * @property {string} portfolio - Full portfolio name
 * @property {number} amount
 */

/**
 * Full-width card showing FY project funding broken down by portfolio.
 * Colors and abbreviations are resolved via portfolioAbbrevMap (portfolioId → abbreviation)
 * which is built from the portfolios API in the parent.
 *
 * @component
 * @param {Object} props
 * @param {number} props.fiscalYear - Selected fiscal year
 * @param {FundingByPortfolioItem[]} props.fundingByPortfolio
 * @param {Map<number, string>} props.portfolioAbbrevMap - portfolioId → abbreviation
 * @returns {JSX.Element}
 */
const ProjectFundingByPortfolioCard = ({ fiscalYear, fundingByPortfolio = [], portfolioAbbrevMap }) => {
    const [activeId, setActiveId] = useState(0);

    const total = fundingByPortfolio.reduce((sum, item) => sum + item.amount, 0);
    const chartData = buildPortfolioChartData(fundingByPortfolio, portfolioAbbrevMap);

    return (
        <div className={styles.fullWidthCard}>
            <CurrencyCard
                headerText={`FY ${fiscalYear} Project Funding by Portfolio`}
                amount={total}
                dataCy="project-funding-by-portfolio-card"
            >
                {total > 0 && (
                    <div className="margin-top-2">
                        <HorizontalStackedBar
                            data={chartData}
                            setActiveId={setActiveId}
                        />
                    </div>
                )}
                <PortfolioLegend
                    data={chartData}
                    activeId={activeId}
                />
            </CurrencyCard>
        </div>
    );
};

export default ProjectFundingByPortfolioCard;
