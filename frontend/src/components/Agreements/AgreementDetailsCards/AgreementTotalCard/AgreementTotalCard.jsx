import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../../helpers/currencyFormat.helpers";
import CurrencyCard from "../../../UI/Cards/CurrencyCard";

/**
 * Renders a card displaying the agreement total, subtotal, fees, and procurement shop information.
 * @param {Object} props - The component props.
 * @param {number} props.total - The total amount of the agreement.
 * @param {number} props.subtotal - The subtotal amount of the agreement.
 * @param {number} props.fees - The fees amount of the agreement.
 * @param {string} [props.procurementShopAbbr] - The abbreviation of the procurement shop.
 * @returns {React.ReactElement} - The JSX element representing the agreement total card.
 */
const AgreementTotalCard = ({ total, subtotal, fees, procurementShopAbbr = "TBD" }) => {
    return (
        <div data-cy="currency-summary-card-total">
            <CurrencyCard
                headerText="Agreement Total"
                amount={total}
                className="margin-top-neg-105"
            >
                <h4 className="margin-0 margin-top-2 margin-bottom-1 font-12px text-base-dark text-normal">
                    Agreement Subtotal
                </h4>
                <div
                    data-cy="currency-summary-card-subtotal"
                    className="text-semibold"
                >
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
                        <h4 className="margin-0 margin-top-2 margin-bottom-1 font-12px text-base-dark text-normal">
                            Fees
                        </h4>
                        <div
                            data-cy="currency-summary-card-fees"
                            className="text-semibold"
                        >
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
                        <div className="text-semibold">{procurementShopAbbr}</div>
                    </div>
                </div>
            </CurrencyCard>
        </div>
    );
};

export default AgreementTotalCard;
