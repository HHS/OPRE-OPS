import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import Tag from "../../UI/Tag";
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
                const displayPercent = item.percent < 1 && item.percent > 0 ? "<1" : item.percent;

                // Portfolios with light backgrounds need dark text for readability
                const lightBackgroundPortfolios = ["CC", "HS", "HMRF", "HV", "DD", "Non-OPRE", "OCDO", "OTIP"];
                const textColor = lightBackgroundPortfolios.includes(item.abbreviation) ? "#1B1B1B" : "#FFFFFF";

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
                                title={`${item.abbreviation} indicator`}
                                aria-label={`${item.abbreviation} indicator`}
                                role="img"
                            />
                            <span className={`${styles.abbreviation} ${isActive ? "fake-bold" : ""}`}>
                                {item.abbreviation}
                            </span>
                        </div>
                        <div className={styles.valueAndPercent}>
                            <CurrencyFormat
                                value={item.value}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={item.value === 0 ? 0 : 2}
                                renderText={(value) => <span className={isActive ? "fake-bold" : ""}>{value}</span>}
                                fixedDecimalScale
                            />
                            <Tag
                                className={`${styles.percentTag}`}
                                tagStyle="darkTextWhiteBackground"
                                text={`${displayPercent}%`}
                                label={item.abbreviation}
                                active={isActive}
                                style={
                                    isActive
                                        ? {
                                              backgroundColor: item.color,
                                              color: textColor,
                                              fontWeight: "bold"
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
