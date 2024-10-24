import PropTypes from "prop-types";
import CurrencySummaryCard from "../../../UI/SummaryCard/CurrencySummaryCard";
import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../../helpers/currencyFormat.helpers";

/**
 * Renders a card displaying the agreement total, subtotal, fees, and procurement shop information.
 * @param {Object} props - The component props.
 * @param {number} props.total - The total amount of the agreement.
 * @param {number} props.subtotal - The subtotal amount of the agreement.
 * @param {number} props.fees - The fees amount of the agreement.
 * @param {string} props.procurementShopAbbr - The abbreviation of the procurement shop.
 * @param {number} props.procurementShopFee - The fee rate of the procurement shop.
 * @returns {React.JSX.Element} - The JSX element representing the agreement total card.
 */
const AgreementTotalCard = ({ total, subtotal, fees, procurementShopAbbr = "TBD", procurementShopFee = 0 }) => {
    return (
        <CurrencySummaryCard
            headerText="Agreement Total"
            amount={total}
            className="margin-top-neg-105"
        >
            <h4 className="margin-0 margin-top-2 margin-bottom-1 font-12px text-base-dark text-normal">
                Agreement Subtotal
            </h4>
            <div className="text-semibold">
                <CurrencyFormat
                    value={subtotal}
                    displayType={"text"}
                    thousandSeparator={true}
                    decimalScale={getDecimalScale(subtotal)}
                    fixedDecimalScale={true}
                    prefix={"$"}
                />
            </div>
            <div className="display-flex">
                <div>
                    <h4 className="margin-0 margin-top-2 margin-bottom-1 font-12px text-base-dark text-normal">Fees</h4>
                    <div className="text-semibold">
                        <CurrencyFormat
                            value={fees}
                            displayType={"text"}
                            thousandSeparator={true}
                            decimalScale={getDecimalScale(fees)}
                            fixedDecimalScale={true}
                            prefix={"$"}
                        />
                    </div>
                </div>
                <div className="margin-left-10">
                    <h4 className="margin-0 margin-top-2 margin-bottom-1 font-12px text-base-dark text-normal">
                        Procurement Shop
                    </h4>
                    <div className="text-semibold">
                        {procurementShopAbbr} - Fee Rate: {procurementShopFee * 100}%
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
    procurementShopAbbr: PropTypes.string.isRequired,
    procurementShopFee: PropTypes.number.isRequired
};

export default AgreementTotalCard;
