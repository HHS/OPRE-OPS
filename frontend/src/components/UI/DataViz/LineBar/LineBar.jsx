import CurrencyFormat from "react-currency-format";
import styles from "./LineBar.styles.module.css";
import { getDecimalScale } from "../../../../helpers/currencyFormat.helpers";

/**
 * @typedef {Object} LineBarProps
 * @property {string} title - The title text to display
 * @property {number} ratio - The ratio value that determines the bar length
 * @property {string} color - The background color of the bar
 * @property {number} total - The total amount to display formatted as currency
 */

/**
 * @component A line bar component that displays a title, a colored bar based on ratio, and a currency formatted total value
 * @param {LineBarProps} props
 * @returns {JSX.Element} A line bar component
 */
const LineBar = ({ title, ratio, color, total }) => {
    return (
        <div className="display-flex margin-y-105 font-12px">
            <span>{title}</span>
            <div
                className="margin-x-1"
                style={{ flex: ratio }}
            >
                <div
                    className={styles.bar}
                    style={{ backgroundColor: color }}
                />
            </div>
            <CurrencyFormat
                value={total}
                displayType="text"
                thousandSeparator=","
                prefix="$"
                decimalScale={getDecimalScale(total)}
                fixedDecimalScale={true}
            />
        </div>
    );
};

export default LineBar;
