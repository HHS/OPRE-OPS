import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import TableRowExpandable from "../../UI/TableRowExpandable";
import { totalBudgetLineAmountPlusFees, totalBudgetLineFeeAmount } from "../../../helpers/utils";
/**
 * @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 */

/**
 * @typedef {Object} CANBudgetLineTableRowProps
 * @property {number} blId
 * @property {string} agreementName
 * @property {string} obligateDate
 * @property {number | string } fiscalYear
 * @property {number} amount
 * @property {number} fee
 * @property {number} percentOfCAN
 * @property {string} status
 */

/**
 * @component - The CAN Budget Line Table.
 * @param {CANBudgetLineTableRowProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetLineTableRow = ({
    blId,
    agreementName,
    obligateDate,
    fiscalYear,
    amount,
    fee,
    percentOfCAN,
    status
}) => {
    const feeTotal = totalBudgetLineFeeAmount(amount, fee);
    const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(amount, feeTotal);

    const TableRowData = (
        <>
            <th>{blId}</th>
            <td>{agreementName}</td>
            <td>{obligateDate}</td>
            <td>{fiscalYear}</td>
            <td>
                <CurrencyFormat
                    value={budgetLineTotalPlusFees}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(budgetLineTotalPlusFees)}
                    fixedDecimalScale={true}
                />
            </td>
            <td>{percentOfCAN}</td>
            <td>{status}</td>
        </>
    );

    const ExpandedData = <p>Expanded Data</p>;

    return (
        <TableRowExpandable
            tableRowData={TableRowData}
            expandedData={ExpandedData}
            isExpanded={false}
            setIsExpanded={() => {}}
            setIsRowActive={() => {}}
        />
    );
};

export default CANBudgetLineTableRow;
