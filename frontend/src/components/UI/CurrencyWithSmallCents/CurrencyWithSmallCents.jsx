import PropTypes from "prop-types";
import { getCents } from "./util";

/**
 * CurrencyWithSmallCents component
 * @param {Object} props - Properties passed to component
 * @param {number} props.amount - The amount to display
 * @param {string} [props.dollarsClasses] - CSS classes for the dollar value
 * @param {string} [props.centsClasses] - CSS classes for the cents value
 * @param {Object} [props.centsStyles] - CSS styles for the cents value
 * @returns {React.JSX.Element} - The rendered component
 */
const CurrencyWithSmallCents = ({ amount, dollarsClasses, centsClasses, centsStyles }) => {
    const dollarValue = parseInt(amount) === 0 || isNaN(amount) ? "0" : parseInt(amount).toString();
    const centsValue = getCents(amount);

    const displayCents = dollarValue !== "0" || centsValue !== "00";

    const isNegative = parseInt(dollarValue) < 0;
    const formattedDollars = new Intl.NumberFormat("en-US").format(Math.abs(parseInt(dollarValue)));
    const sign = isNegative ? "-" : "";

    return (
        <div>
            <span className={`${dollarsClasses} text-bold margin-bottom-0`}>
                {sign}$ {formattedDollars}
            </span>
            {displayCents && (
                <span
                    className={`${centsClasses} text-bold margin-bottom-0`}
                    style={centsStyles}
                >
                    .{centsValue}
                </span>
            )}
        </div>
    );
};

CurrencyWithSmallCents.propTypes = {
    amount: PropTypes.number.isRequired,
    dollarsClasses: PropTypes.string,
    centsClasses: PropTypes.string,
    centsStyles: PropTypes.object
};
export default CurrencyWithSmallCents;
