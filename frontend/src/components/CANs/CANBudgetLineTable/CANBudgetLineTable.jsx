import React, { useEffect } from "react";
import { calculatePercent, formatDateNeeded } from "../../../helpers/utils";
import Table from "../../UI/Table";
import { CAN_HEADERS, PORTFOLIO_HEADERS } from "./CANBudgetLineTable.constants";
import { useSetSortConditions } from "./CANBudgetLineTable.hooks";
import CANBudgetLineTableRow from "./CANBudgetLineTableRow";
import PaginationNav from "../../UI/PaginationNav";
import { SORT_TYPES, useSortData } from "../../../hooks/use-sortable-data.hooks";
/**
 * @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
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
    const ITEMS_PER_PAGE = import.meta.env.MODE === "production" ? 25 : 3;
    const [currentPage, setCurrentPage] = React.useState(1);
    let visibleBudgetLines = [...budgetLines];
    visibleBudgetLines = useSortData(visibleBudgetLines, sortDescending, sortCondition, SORT_TYPES.CAN_BLI);
    visibleBudgetLines = visibleBudgetLines.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [fiscalYear]);

    if (budgetLines.length === 0) {
        return <p className="text-center">No budget lines have been added to this CAN.</p>;
    }

    const TABLE_HEADERS = tableType === "can" ? CAN_HEADERS : PORTFOLIO_HEADERS;

    return (
        <>
            <Table
                tableHeadings={TABLE_HEADERS}
                onClickHeader={setSortConditions}
                sortDescending={sortDescending}
                selectedHeader={sortCondition}>
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
                        procShopId={budgetLine.agreement.awarding_entity_id ?? -1}
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
