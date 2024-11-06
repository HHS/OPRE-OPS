/**
 * @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 */

// import DebugCode from "../../DebugCode";
import TableRowExpandable from "../../UI/TableRowExpandable";

/**
 * @typedef {Object} CANBudgetLineTableRowProps
 * @property {number} blId
 * @property {string} agreementName
 * @property {string} obligateDate
 * @property {string} fiscalYear
 * @property {number} total
 * @property {number} percentOfCAN
 * @property {string} status
 */

/**
 * @component - The CAN Budget Line Table.
 * @param {CANBudgetLineTableRowProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetLineTableRow = ({ blId, agreementName, obligateDate, fiscalYear, total, percentOfCAN, status }) => {
    const TableRowData = (
        <>
            <th>{blId}</th>
            <td>{agreementName}</td>
            <td>{obligateDate}</td>
            <td>{fiscalYear}</td>
            <td>{total}</td>
            <td>{percentOfCAN}</td>
            <td>{status}</td>
        </>
    );

    const ExpandedData = <p>Expanded Data</p>;

    return (
        <>
            <TableRowExpandable
                tableRowData={TableRowData}
                expandedData={ExpandedData}
                isExpanded={false}
                setIsExpanded={() => {}}
                setIsRowActive={() => {}}
            />
            {/* <DebugCode data={budgetLine} /> */}
        </>
    );
};

export default CANBudgetLineTableRow;
