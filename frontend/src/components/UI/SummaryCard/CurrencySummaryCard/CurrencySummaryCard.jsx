import PropTypes from "prop-types";
import CurrencyWithSmallCents from "../../CurrencyWithSmallCents/CurrencyWithSmallCents";
import SummaryCard from "../SummaryCard";

/**
 * @description Renders a summary card for a currency with a header text and an amount.
 * @param {Object} props - The component props.
 * @param {string} props.headerText - The header text to display on the card.
 * @param {number} props.amount - The amount of currency to display on the card.
 * @param {React.ReactNode}[props.children] - The children of the component.
 * @param {Object} [props.rest] - The rest of the props to be spread on the root div element.
 * @returns {JSX.Element} - The CurrencySummaryCard component.
 */
const CurrencySummaryCard = ({ headerText, amount, children, ...rest }) => {
    return (
        <SummaryCard
            title={headerText}
            dataCy="currency-summary-card"
        >
            <div {...rest}>
                {(amount || amount === 0) && (
                    <CurrencyWithSmallCents
                        dollarsClasses="font-sans-xl"
                        centsClasses="font-sans-3xs"
                        amount={amount}
                    />
                )}
            </div>
            {children}
        </SummaryCard>
    );
};

CurrencySummaryCard.propTypes = {
    headerText: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    children: PropTypes.node
};

export default CurrencySummaryCard;
