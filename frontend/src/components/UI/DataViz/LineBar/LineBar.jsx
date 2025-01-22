import CurrencyFormat from "react-currency-format";
import { NO_DATA } from "../../../../constants";
import { getDecimalScale } from "../../../../helpers/currencyFormat.helpers";
import styles from "./LineBar.styles.module.css";

/**
 * @typedef {Object} LineBarProps
 * @property {string} title - The title text to display
 * @property {number} ratio - The ratio value that determines the bar length
 * @property {string} color - The background color of the bar
 * @property {number} total - The total amount to display formatted as currency
 * @property {number} iterator - The index of the current item in the list
 */

/**
 * @component A line bar component that displays a title, a colored bar based on ratio, and a currency formatted total value
 * @param {LineBarProps} props
 * @returns {JSX.Element} A line bar component
 */
const LineBar = ({ title, ratio, color, total, iterator }) => {
    return (
        <div className={styles.container}>
            <span className={styles.title}>{title}</span>
            <div className={styles.barContainer}>
                <div
                    className={styles.bar}
                    style={{ backgroundColor: color, width: `${ratio * 100}%` }}
                />
            </div>
            <div className={styles.amount}>
                {total === 0 && iterator === 0 ? (
                    NO_DATA
                ) : (
                    <CurrencyFormat
                        value={total}
                        displayType="text"
                        thousandSeparator=","
                        prefix="$"
                        decimalScale={getDecimalScale(total)}
                        fixedDecimalScale={true}
                    />
                )}
            </div>
        </div>
    );
};

export default LineBar;
