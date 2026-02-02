import CurrencyWithSmallCents from "../../CurrencyWithSmallCents/CurrencyWithSmallCents";
import Card from "../Card";

/**
 * @typedef {Object} CurrencyCardProps
 * @property {string} headerText - The header text to display on the card.
 * @property {number} amount - The amount of currency to display on the card.
 * @property {React.ReactNode} [children] - The children of the component.
 * @property {string} [dataCy] - Data test id for cypress testing.
 * @property {Object} [style] - Style object for the component.
 * @property {Object} [rest] - Additional props to be spread on the root div element.
 */

/**
 * @component CurrencyCard component.
 * @param {CurrencyCardProps} props - The props of the CurrencyCard component.
 * @returns {JSX.Element} - The CurrencySummaryCard component.
 */
const CurrencyCard = ({ headerText, amount, children, ...rest }) => {
    return (
        <Card
            title={headerText}
            dataCy={`${rest.dataCy ? rest.dataCy : "currency-summary-card"}`}
            style={{ padding: "20px 30px 30px 30px", minHeight: "232px" }}
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

export default CurrencyCard;
