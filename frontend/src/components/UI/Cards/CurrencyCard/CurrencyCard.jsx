import PropTypes from "prop-types";
import CurrencyWithSmallCents from "../../CurrencyWithSmallCents/CurrencyWithSmallCents";
import Card from "../Card";

/**
 * @description Renders a summary card for a currency with a header text and an amount.
 * @param {Object} props - The component props.
 * @param {string} props.headerText - The header text to display on the card.
 * @param {number} props.amount - The amount of currency to display on the card.
 * @param {React.ReactNode}[props.children] - The children of the component.
 * @param {Object} [props.rest] - The rest of the props to be spread on the root div element.
 * @returns {JSX.Element} - The CurrencySummaryCard component.
 */
const CurrencyCard = ({ headerText, amount, children, ...rest }) => {
    return (
        <Card
            title={headerText}
            dataCy="currency-summary-card"
            style={{ padding: "20px 30px 30px 30px", height: "232px" }}
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
        </Card>
    );
};

CurrencyCard.propTypes = {
    headerText: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    children: PropTypes.node
};

export default CurrencyCard;
