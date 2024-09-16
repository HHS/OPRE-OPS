import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";

const CANTableRow = ({ can, portfolio, FY, activePeriod, obligateBy, transfer, fyBudget, availableFunds }) => {
    return (
        <tr>
            <th scope="row">{can}</th>
            <td>{portfolio}</td>
            <td>{FY}</td>
            <td>{activePeriod > 1 ? `${activePeriod} years` : `${activePeriod} year`}</td>
            <td>{obligateBy}</td>
            <td>{transfer}</td>
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
            <td>{availableFunds}</td>
        </tr>
    );
};

export default CANTableRow;
