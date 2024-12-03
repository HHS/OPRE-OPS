import React from "react";
import { calculatePercent, formatDateNeeded } from "../../../helpers/utils";
import Table from "../../UI/Table";
import { TABLE_HEADERS } from "./CABBudgetLineTable.constants";
import CANBudgetLineTableRow from "./CANBudgetLineTableRow";
import PaginationNav from "../../UI/PaginationNav";
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
    // TODO: once in prod, change this to 25
    const ITEMS_PER_PAGE = 3;
    const [currentPage, setCurrentPage] = React.useState(1);
    let visibleBudgetLines = [...budgetLines];
    visibleBudgetLines = visibleBudgetLines.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    console.log({budgetLines})

    if (budgetLines.length === 0) {
        return <p className="text-center">No budget lines have been added to this CAN.</p>;
    }

    return (
        <>
            <Table tableHeadings={TABLE_HEADERS}>
                {visibleBudgetLines.map((budgetLine) => (
                    <CANBudgetLineTableRow
                        key={budgetLine.id}
                        budgetLine={budgetLine}
                        blId={budgetLine.id}
                        agreementName={budgetLine.agreement.name ?? "TBD"}
                        obligateDate={formatDateNeeded(budgetLine.date_needed || "")}
                        fiscalYear={budgetLine.fiscal_year || "TBD"}
                        amount={budgetLine.amount ?? 0}
                        fee={budgetLine.proc_shop_fee_percentage}
                        percentOfCAN={calculatePercent(budgetLine.amount ?? 0, totalFunding)}
                        status={budgetLine.status}
                        inReview={budgetLine.in_review}
                        creatorId={budgetLine.created_by}
                        creationDate={budgetLine.created_on}
                        procShopCode={budgetLine.agreement.awarding_entity_id}
                        procShopFeePercentage={budgetLine.proc_shop_fee_percentage}
                        notes={budgetLine.comments || "No Notes added"}
                    />
                ))}
            </Table>
            {budgetLines.length > ITEMS_PER_PAGE && (
                <PaginationNav
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    items={budgetLines}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            )}
        </>
    );
};

export default CANBudgetLineTable;
