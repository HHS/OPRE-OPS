import React, { useEffect } from "react";
import { ITEMS_PER_PAGE, NO_DATA } from "../../../constants";
import { calculatePercent, formatDateNeeded } from "../../../helpers/utils";
import PaginationNav from "../../UI/PaginationNav";
import Table from "../../UI/Table";
import { CAN_HEADERS, PORTFOLIO_HEADERS } from "./CANBudgetLineTable.constants";
import { useSetSortConditions } from "../../UI/Table/Table.hooks";
import CANBudgetLineTableRow from "./CANBudgetLineTableRow";

import { SORT_TYPES, useSortData } from "../../../hooks/use-sortable-data.hooks";
/**
 * @typedef {import("../../../types/BudgetLineTypes").BudgetLine} BudgetLine
 */

/**
 * @typedef {Object} CANBudgetLineTableProps
 * @property {BudgetLine[]} budgetLines
 * @property {number} totalFunding
 * @property {number} fiscalYear
 * @property {'portfolio' | 'can'} [tableType]
 */

/**
 * @component - The CAN Budget Line Table.
 * @param {CANBudgetLineTableProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetLineTable = ({ budgetLines, totalFunding, fiscalYear, tableType = "can" }) => {
    const { sortCondition, sortDescending, setSortConditions } = useSetSortConditions();
    const [currentPage, setCurrentPage] = React.useState(1);
    let visibleBudgetLines = budgetLines.filter((budgetLine) => !budgetLine.is_obe);
    visibleBudgetLines = useSortData(
        visibleBudgetLines,
        sortDescending,
        sortCondition,
        SORT_TYPES.CAN_BLI,
        totalFunding
    );
    visibleBudgetLines = visibleBudgetLines.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [fiscalYear]);

    if (visibleBudgetLines.length === 0) {
        return <p className="text-center">No budget lines have been added to this CAN.</p>;
    }

    const TABLE_HEADERS = tableType === "can" ? CAN_HEADERS : PORTFOLIO_HEADERS;

    return (
        <>
            <Table
                tableHeadings={TABLE_HEADERS}
                onClickHeader={setSortConditions}
                sortDescending={sortDescending}
                selectedHeader={sortCondition}
            >
                {visibleBudgetLines.map((budgetLine) => (
                    <CANBudgetLineTableRow
                        key={budgetLine.id}
                        budgetLine={budgetLine}
                        blId={budgetLine.id}
                        agreementName={budgetLine.agreement?.name ?? NO_DATA}
                        obligateDate={formatDateNeeded(budgetLine?.date_needed ?? "")}
                        fiscalYear={budgetLine.fiscal_year || NO_DATA}
                        amount={budgetLine.amount ?? 0}
                        percentOfCAN={calculatePercent(budgetLine.amount ?? 0, totalFunding)}
                        status={budgetLine.status}
                        inReview={budgetLine.in_review}
                        creatorId={budgetLine.created_by}
                        creationDate={budgetLine.created_on}
                        procShopId={budgetLine.agreement?.awarding_entity_id ?? -1}
                        description={budgetLine?.line_description ?? ""}
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
