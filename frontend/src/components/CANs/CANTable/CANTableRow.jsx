import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import Tooltip from "../../UI/USWDS/Tooltip";
import { displayActivePeriod } from "./CANTableRow.helpers";

/**
 * CanTableRow component of CANTable
 * @component
 * @param {Object} props
 * @param {number} props.activePeriod - Active Period in years
 * @param {number} props.canId - CAN ID
 * @param {number} props.fiscalYear - Fiscal Year
 * @param {number} props.fyBudget - Fiscal Year Budget
 * @param {string} props.name - CAN name
 * @param {string} props.nickname - CAN nickname
 * @param {string} props.obligateBy - Obligate By Date
 * @param {string} props.portfolio - Portfolio abbreviation
 * @param {string} props.transfer - Method of Transfer
 * @returns {JSX.Element}
 */
const CANTableRow = ({
    activePeriod,
    canId,
    fiscalYear,
    fyBudget,
    name,
    nickname,
    obligateBy,
    portfolio,
    transfer
}) => {
    const { data: fundingSummary, isError, isLoading } = useGetCanFundingSummaryQuery(canId);
    const availableFunds = fundingSummary?.available_funding ?? 0;
    const displayFiscalYear = fiscalYear > 0 ? fiscalYear : "TBD";

    if (isLoading)
        return (
            <tr>
                <td colSpan={8}>Loading...</td>
            </tr>
        );
    if (isError)
        return (
            <tr>
                <td colSpan={8}>Error: {isError.valueOf()}</td>
            </tr>
        );

    return (
        <tr>
            <th scope="row">
                <Tooltip
                    label={nickname}
                    position="right"
                >
                    <Link
                        to={`/cans/${canId}`}
                        className="text-ink text-no-underline"
                    >
                        {name}
                    </Link>
                </Tooltip>
            </th>
            <td>{portfolio}</td>
            <td>{displayFiscalYear}</td>
            <td>{displayActivePeriod(activePeriod)}</td>
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
    activePeriod: PropTypes.number.isRequired,
    canId: PropTypes.number.isRequired,
    fiscalYear: PropTypes.number.isRequired,
    fyBudget: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    obligateBy: PropTypes.string.isRequired,
    portfolio: PropTypes.string.isRequired,
    transfer: PropTypes.string.isRequired
};

export default CANTableRow;
