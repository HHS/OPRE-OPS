import { useState } from "react";
import CurrencyFormat from "react-currency-format";
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
                            className="display-flex flex-row margin-top-1"
                            style={{ gap: "2rem" }}
                            data-cy="project-funding-portfolio-legend"
                            data-testid="project-funding-portfolio-legend"
                        >
                            {chartData.map((item) => {
                                const isActive = activeId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        className="display-flex align-center"
                                        style={{ gap: "0.4rem", fontSize: "12px", whiteSpace: "nowrap" }}
                                        data-testid={`portfolio-legend-item-${item.abbreviation}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCircle}
                                            style={{ color: item.color, width: "0.625rem", height: "0.625rem" }}
                                            aria-hidden="true"
                                        />
                                        <span className={isActive ? "fake-bold" : ""}>{item.abbreviation}</span>
                                        <CurrencyFormat
                                            value={item.value}
                                            displayType="text"
                                            thousandSeparator=","
                                            prefix="$"
                                            decimalScale={2}
                                            fixedDecimalScale
                                            renderText={(value) => (
                                                <span className={isActive ? "fake-bold" : ""}>{value}</span>
                                            )}
                                        />
                                        <span className={isActive ? "fake-bold" : ""}>{item.percent}%</span>
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
