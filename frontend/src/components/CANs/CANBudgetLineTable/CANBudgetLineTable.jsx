import { formatDateNeeded } from "../../../helpers/utils";
import Table from "../../UI/Table";
import { TABLE_HEADERS } from "./CABBudgetLineTable.constants";
import CANBudgetLineTableRow from "./CANBudgetLineTableRow";
import { calculatePercent } from "../../../helpers/utils";
/**
 * @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 */

/**
 * @typedef {Object} CANBudgetLineTableProps
 * @property {BudgetLine[]} budgetLines
 * @property {number} totalFunding
 */

/**
 * @component - The CAN Budget Line Table.
 * @param {CANBudgetLineTableProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetLineTable = ({ budgetLines, totalFunding }) => {
    if (budgetLines.length === 0) {
        return <p className="text-center">No budget lines have been added to this CAN.</p>;
    }

    return (
        <Table tableHeadings={TABLE_HEADERS}>
            {budgetLines.map((budgetLine) => (
                <CANBudgetLineTableRow
                    key={budgetLine.id}
                    budgetLine={budgetLine}
                    blId={budgetLine.id}
                    agreementName="TBD"
                    obligateDate={formatDateNeeded(budgetLine.date_needed || "")}
                    fiscalYear={budgetLine.fiscal_year || "TBD"}
                    amount={budgetLine.amount ?? 0}
                    fee={budgetLine.proc_shop_fee_percentage}
                    percentOfCAN={calculatePercent(budgetLine.amount ?? 0, totalFunding)}
                    status={budgetLine.status}
                    inReview={budgetLine.in_review}
                    creatorId={budgetLine.created_by}
                    creationDate={budgetLine.created_on}
                    procShopCode="TBD"
                    procShopFeePercentage={budgetLine.proc_shop_fee_percentage}
                    notes={budgetLine.comments || "No Notes added"}
                />
            ))}
        </Table>
    );
};

export default CANBudgetLineTable;
