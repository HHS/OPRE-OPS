import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { Link } from "react-router-dom";

const CANTableRow = ({ can, portfolio, FY, activePeriod, obligateBy, transfer, fyBudget, canId }) => {
    const availableFunds = useGetCanFundingSummaryQuery(canId).data?.available_funding ?? 0;
    return (
        <tr>
            <th scope="row">
                <Link to={`/cans/${canId}`}>{can}</Link>
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
                    renderText={(value) => value}
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
                    renderText={(value) => value}
                />
            </td>
        </tr>
    );
};

export default CANTableRow;
