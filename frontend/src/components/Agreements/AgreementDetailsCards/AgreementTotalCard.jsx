import PropTypes from "prop-types";
import { ResponsiveBar } from "@nivo/bar";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import { fiscalYearFromDate } from "../../../helpers/utils";
import constants from "../../../constants";
import CurrencyFormat from "react-currency-format";
const { barChartColors } = constants;

/**
 * A component that displays the totals for an agreement, and it's procurement shop.
 * @param total
 * @param subtotal
 * @param fees
 * @param procurementShop
 * @returns {JSX.Element}
 * @constructor
 */
const AgreementTotalCard = ({ total, subtotal, fees, procurementShop }) => {
    const headerText = "Agreement Total";
    console.log("procurementShop", procurementShop);
    return (
        <CurrencySummaryCard
            headerText={headerText}
            amount={total}
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
                    {/*<dt className="margin-0 text-base-dark grid-col-5">Fees</dt>*/}
                    {/*<dd className="text-semibold margin-0 grid-col-5">*/}
                    {/*    <CurrencyFormat*/}
                    {/*        value={fees}*/}
                    {/*        displayType={"text"}*/}
                    {/*        thousandSeparator={true}*/}
                    {/*        decimalScale={2}*/}
                    {/*        fixedDecimalScale={true}*/}
                    {/*        prefix={"$"}*/}
                    {/*    />*/}
                    {/*</dd>*/}
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
