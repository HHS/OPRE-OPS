import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import Tag from "../../UI/Tag";
import { getActivePortfolioTagTextColor } from "./PortfolioSummaryCards.helpers";
import styles from "./PortfolioLegend.module.scss";

/**
 * @typedef {Object} PortfolioLegendProps
 * @property {Array} data - Portfolio data with label, value, color, percent, abbreviation
 * @property {number} activeId - Currently hovered portfolio ID
 */

/**
 * Multi-column legend for portfolio budget display
 * @component
 * @param {PortfolioLegendProps} props
 * @returns {JSX.Element}
 */
const PortfolioLegend = ({ data, activeId = 0 }) => {
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div
            className={styles.legendGrid}
            data-cy="portfolio-legend"
            data-testid="portfolio-legend"
        >
            {data.map((item) => {
                // Skip rendering placeholder items but keep them in grid for positioning
                if (item.isPlaceholder) {
                    return (
                        <div
                            key={item.id}
                            className={styles.placeholder}
                            aria-hidden="true"
                        />
                    );
                }

                const isActive = activeId === item.id;
                // percent is already normalised by transformPortfoliosToChartData:
                // 99 when dominant with non-zero peers (Figma: plain 99%, not >99%),
                // "<1" for sub-1% non-zero, 0 for truly zero, or a plain integer otherwise.
                const displayPercent = item.percent;

                // Portfolios with light backgrounds need dark text for readability
                const textColor = getActivePortfolioTagTextColor(item.abbreviation);

                return (
                    <div
                        key={item.id}
                        className={`${styles.legendItem} ${isActive ? styles.active : ""} display-flex flex-justify align-center`}
                        data-cy={`portfolio-legend-item-${item.abbreviation}`}
                        data-testid={`portfolio-legend-item-${item.abbreviation}`}
                    >
                        <div className={styles.iconAndLabel}>
                            <FontAwesomeIcon
                                icon={faCircle}
                                className={styles.colorDot}
                                style={{ color: item.color }}
                                aria-hidden="true"
                            />
                            <span className={`${styles.abbreviation} ${isActive ? "fake-bold" : ""}`}>
                                {item.abbreviation}
                            </span>
                        </div>
                        <div className={styles.valueAndPercent}>
                            <span className={isActive ? "fake-bold" : ""}>{formatCurrency(item.value)}</span>
                            <Tag
                                className={`${styles.percentTag} ${isActive ? "fake-bold" : ""}`}
                                tagStyle="darkTextWhiteBackground"
                                text={`${displayPercent}%`}
                                label={item.abbreviation}
                                active={isActive}
                                style={
                                    isActive
                                        ? {
                                              backgroundColor: item.color,
                                              color: textColor
                                          }
                                        : {}
                                }
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PortfolioLegend;
