import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";

/**
 * CanTableRow component of CANTable
 * @component
 * @param {Object} props
 * @param {string} props.can - CAN name
 * @param {string} props.portfolio - Portfolio abbreviation
 * @param {number} props.FY - Fiscal Year
 * @param {number} props.activePeriod - Active Period
 * @param {string} props.obligateBy - Obligate By
 * @param {string} props.transfer - Method of Transfer
 * @param {number} props.fyBudget - Fiscal Year Budget
 * @param {number} props.canId - CAN ID
 * @returns {JSX.Element}
 */
const CANTableRow = ({ can, portfolio, FY, activePeriod, obligateBy, transfer, fyBudget, canId }) => {
    const availableFunds = useGetCanFundingSummaryQuery(canId).data?.available_funding ?? 0;

    return (
        <tr>
            <th scope="row">
                <Link
                    to={`/cans/${canId}`}
                    className="text-ink text-no-underline"
                >
                    {can}
                </Link>
            </th>
            <td>{portfolio}</td>
            <td>{FY}</td>
            <td>{activePeriod > 1 ? `${activePeriod} years` : `${activePeriod} year`}</td>
            <td>{obligateBy}</td>
            <td>{convertCodeForDisplay("methodOfTransfer", transfer)}</td>
            <td>
                <CurrencyFormat
                    value={fyBudget}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(fyBudget)}
                    fixedDecimalScale={true}
                />
            </td>
            <td>
                <CurrencyFormat
                    value={availableFunds}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(availableFunds)}
                    fixedDecimalScale={true}
                />
            </td>
        </tr>
    );
};

CANTableRow.propTypes = {
    can: PropTypes.string.isRequired,
    portfolio: PropTypes.string.isRequired,
    FY: PropTypes.string.isRequired,
    activePeriod: PropTypes.number.isRequired,
    obligateBy: PropTypes.string.isRequired,
    transfer: PropTypes.string.isRequired,
    fyBudget: PropTypes.number.isRequired,
    canId: PropTypes.number.isRequired
};

export default CANTableRow;
