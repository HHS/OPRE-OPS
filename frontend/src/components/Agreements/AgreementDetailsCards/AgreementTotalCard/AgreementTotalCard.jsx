import PropTypes from "prop-types";
import CurrencySummaryCard from "../../../UI/CurrencySummaryCard/CurrencySummaryCard";
import CurrencyFormat from "react-currency-format";

/**
 * Renders a card displaying the agreement total, subtotal, fees, and procurement shop information.
 * @param {Object} props - The component props.
 * @param {number} props.total - The total amount of the agreement.
 * @param {number} props.subtotal - The subtotal amount of the agreement.
 * @param {number} props.fees - The fees amount of the agreement.
 * @param {Object} props.procurementShop - The procurement shop information object.
 * @param {string} props.procurementShop.abbr - The abbreviation of the procurement shop.
 * @param {number} props.procurementShop.fee - The fee rate of the procurement shop.
 * @returns {React.JSX.Element} - The JSX element representing the agreement total card.
 */
const AgreementTotalCard = ({ total, subtotal, fees, procurementShop }) => {
    "Agreement Total";
    return (
        <CurrencySummaryCard
            headerText="Agreement Total"
            amount={total}
            className="margin-top-neg-205"
        >
            <h4 className="margin-0 margin-top-2 margin-bottom-1 font-12px text-base-dark text-normal">
                Agreement Subtotal
            </h4>
            <div className="text-semibold">
                <CurrencyFormat
                    value={subtotal}
                    displayType={"text"}
                    thousandSeparator={true}
                    decimalScale={2}
                    fixedDecimalScale={true}
                    prefix={"$"}
                />
            </div>
            <div className="display-flex flex-justify">
                <div>
                    <h4 className="margin-0 margin-top-2 margin-bottom-1 font-12px text-base-dark text-normal">Fees</h4>
                    <div className="text-semibold">
                        <CurrencyFormat
                            value={fees}
                            displayType={"text"}
                            thousandSeparator={true}
                            decimalScale={2}
                            fixedDecimalScale={true}
                            prefix={"$"}
                        />
                    </div>
                </div>
                <div>
                    <h4 className="margin-0 margin-top-2 margin-bottom-1 font-12px text-base-dark text-normal">
                        Procurement Shop
                    </h4>
                    <div className="text-semibold">
                        {procurementShop?.abbr} - Fee Rate: {procurementShop?.fee * 100}%
                    </div>
                </div>
            </div>
        </CurrencySummaryCard>
    );
};

AgreementTotalCard.propTypes = {
    total: PropTypes.number.isRequired,
    subtotal: PropTypes.number.isRequired,
    fees: PropTypes.number.isRequired,
    procurementShop: PropTypes.object
};

export default AgreementTotalCard;
