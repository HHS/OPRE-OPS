import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import Tooltip from "../../UI/USWDS/Tooltip";
import { displayActivePeriod } from "./CANTableRow.helpers";

/**
 * CanTableRow component of CANTable
 * @component
 * @param {Object} props
 * @param {number} props.activePeriod - Active Period in years
 * @param {number} props.canId - CAN ID
 * @param {number} props.fiscalYear - Selected Fiscal Year
 * @param {string} props.name - CAN name
 * @param {string} props.nickname - CAN nickname
 * @param {string} props.obligateBy - Obligate By Date
 * @param {string} props.portfolio - Portfolio abbreviation
 * @returns {JSX.Element}
 */
const CANTableRow = ({ activePeriod, canId, fiscalYear, name, nickname, obligateBy, portfolio }) => {
    const {
        data: fundingSummary,
        isError,
        isLoading
    } = useGetCanFundingSummaryQuery({ ids: [canId], fiscalYear: fiscalYear, refetchOnMountOrArgChange: true });
    const totalFunding = fundingSummary?.total_funding ?? 0;
    const fundingReceived = fundingSummary?.received_funding ?? 0;
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
            <td>
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
            </td>
            <td>{portfolio}</td>
            <td>{displayActivePeriod(activePeriod)}</td>
            <td>{obligateBy}</td>
            <td>
                <CurrencyFormat
                    value={totalFunding}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(totalFunding)}
                    fixedDecimalScale={true}
                />
            </td>
            {fundingReceived === 0 ? (
                <td>TBD</td>
            ) : (
                <td>
                    <CurrencyFormat
                        value={fundingReceived}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        decimalScale={getDecimalScale(fundingReceived)}
                        fixedDecimalScale={true}
                    />
                </td>
            )}
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

export default CANTableRow;
