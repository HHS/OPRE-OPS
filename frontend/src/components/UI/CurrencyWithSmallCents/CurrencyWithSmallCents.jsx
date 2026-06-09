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
    const numericAmount = Number(amount);
    const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
    // Derive sign from the raw amount, not the truncated dollar value: for
    // amounts in (-1, 0) like -0.5, parseInt(-0.5) is 0 and the sign would be lost.
    const isNegative = safeAmount < 0;
    const absDollars = Math.trunc(Math.abs(safeAmount));
    const dollarValue = absDollars.toString();
    const centsValue = getCents(safeAmount);

    const displayCents = dollarValue !== "0" || centsValue !== "00";
    const formattedDollars = new Intl.NumberFormat("en-US").format(absDollars);
    // Render the sign outside the "$ " prefix to preserve the "-$ 1,234" format
    // that legacy callers (canDetail.cy.js) rely on.
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
