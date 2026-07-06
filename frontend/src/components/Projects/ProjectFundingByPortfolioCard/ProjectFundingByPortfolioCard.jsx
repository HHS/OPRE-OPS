import { useState } from "react";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import CurrencyCard from "../../UI/Cards/CurrencyCard";
import HorizontalStackedBar from "../../UI/DataViz/HorizontalStackedBar/HorizontalStackedBar";
import styles from "../../Portfolios/PortfolioSummaryCards/PortfolioSummaryCards.module.scss";
import { buildPortfolioChartData } from "./ProjectFundingByPortfolioCard.helpers";

/**
 * @typedef {Object} FundingByPortfolioItem
 * @property {number} portfolio_id
 * @property {string} portfolio - Full portfolio name
 * @property {number} amount
 * @property {string|null} abbreviation
 */

/**
 * Full-width card showing FY project funding broken down by portfolio.
 * Colors are resolved from PORTFOLIO_ORDER by abbreviation, which comes
 * directly from the project funding API response (item.abbreviation).
 * The legend renders as a single horizontal row matching the Figma design,
 * rather than the 4-column grid used by PortfolioSummaryCards.
 *
 * @component
 * @param {Object} props
 * @param {number} props.fiscalYear - Selected fiscal year
 * @param {FundingByPortfolioItem[]} props.fundingByPortfolio
 * @returns {JSX.Element}
 */
// Portfolio color vars with light fills that need dark text for readability
// when used as the active percentage-tag background (mirrors the
// lightBackgroundPortfolios list in PortfolioLegend, keyed by color instead of
// abbreviation since this card assigns colors sequentially).
const LIGHT_BACKGROUND_COLORS = new Set([
    "var(--portfolio-bar-graph-cc)",
    "var(--portfolio-bar-graph-hs)",
    "var(--portfolio-bar-graph-hmrf)",
    "var(--portfolio-bar-graph-hv)",
    "var(--portfolio-bar-graph-dd)",
    "var(--portfolio-bar-graph-none-opre)",
    "var(--portfolio-bar-graph-ocdo)",
    "var(--portfolio-bar-graph-otip)"
]);

const ProjectFundingByPortfolioCard = ({ fiscalYear, fundingByPortfolio = [] }) => {
    const [activeId, setActiveId] = useState(0);

    const total = fundingByPortfolio.reduce((sum, item) => sum + item.amount, 0);
    const chartData = buildPortfolioChartData(fundingByPortfolio);

    return (
        <div className={styles.fullWidthCard}>
            <CurrencyCard
                headerText={`FY ${fiscalYear} Project Funding by Portfolio`}
                amount={total}
                dataCy="project-funding-by-portfolio-card"
            >
                {total > 0 && (
                    <>
                        <div className="margin-top-2">
                            <HorizontalStackedBar
                                data={chartData}
                                setActiveId={setActiveId}
                            />
                        </div>
                        <div
                            className="display-flex flex-row margin-top-2"
                            style={{ gap: "0.75rem 2rem", flexWrap: "wrap" }}
                            data-cy="project-funding-portfolio-legend"
                            data-testid="project-funding-portfolio-legend"
                        >
                            {chartData.map((item) => {
                                const isActive = activeId === item.id;
                                const activeTextColor = LIGHT_BACKGROUND_COLORS.has(item.color) ? "#1B1B1B" : "#FFFFFF";
                                return (
                                    <div
                                        key={item.id}
                                        className="display-flex flex-align-baseline"
                                        style={{ gap: "0.4rem", fontSize: "12px", whiteSpace: "nowrap" }}
                                        data-testid={`portfolio-legend-item-${item.abbreviation}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCircle}
                                            style={{ color: item.color, width: "0.625rem", height: "0.625rem" }}
                                            aria-hidden="true"
                                        />
                                        <span className={isActive ? "fake-bold" : ""}>{item.abbreviation}</span>
                                        <span className={isActive ? "fake-bold" : ""}>
                                            {formatCurrency(item.value)}
                                        </span>
                                        <span
                                            className={
                                                "bg-white text-brand-neutral-dark" + (isActive ? " fake-bold" : "")
                                            }
                                            style={{
                                                padding: "0.25rem 0.5rem",
                                                borderRadius: "0.25rem",
                                                fontSize: "12px",
                                                ...(isActive
                                                    ? { backgroundColor: item.color, color: activeTextColor }
                                                    : {})
                                            }}
                                        >
                                            {item.percent}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </CurrencyCard>
        </div>
    );
};

export default ProjectFundingByPortfolioCard;
