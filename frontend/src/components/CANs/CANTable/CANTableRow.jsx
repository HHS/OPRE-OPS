import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import Tooltip from "../../UI/USWDS/Tooltip";

/**
 * CanTableRow component of CANTable
 * @component
 * @param {Object} props
 * @param {string} props.name - CAN name
 * @param {string} props.nickname - CAN nickname
 * @param {string} props.portfolio - Portfolio abbreviation
 * @param {number} props.fiscalYear - Fiscal Year
 * @param {number} props.activePeriod - Active Period in years
 * @param {string} props.obligateBy - Obligate By Date
 * @param {string} props.transfer - Method of Transfer
 * @param {number} props.fyBudget - Fiscal Year Budget
 * @param {number} props.canId - CAN ID
 * @returns {JSX.Element}
 */
const CANTableRow = ({
    name,
    nickname,
    portfolio,
    fiscalYear,
    activePeriod,
    obligateBy,
    transfer,
    fyBudget,
    canId
}) => {
    const { data: fundingSummary, isError, isLoading } = useGetCanFundingSummaryQuery(canId);
    const availableFunds = fundingSummary?.available_funding ?? 0;

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
            <td>{fiscalYear}</td>
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
    name: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    portfolio: PropTypes.string.isRequired,
    fiscalYear: PropTypes.number.isRequired,
    activePeriod: PropTypes.number.isRequired,
    obligateBy: PropTypes.string.isRequired,
    transfer: PropTypes.string.isRequired,
    fyBudget: PropTypes.number.isRequired,
    canId: PropTypes.number.isRequired
};

export default CANTableRow;