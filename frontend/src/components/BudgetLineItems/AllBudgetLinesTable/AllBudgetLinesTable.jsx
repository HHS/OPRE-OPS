import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import PaginationNav from "../../UI/PaginationNav/PaginationNav";
import Table from "../../UI/Table";
import AllBLIRow from "./AllBLIRow";
import { All_BUDGET_LINES_TABLE_HEADINGS_LIST } from "./AllBudgetLinesTable.constants";
import useAllBudgetLinesTable from "./AllBudgetLinesTable.hooks";

import { ITEMS_PER_PAGE } from "../../../constants";
/**
 * @component
 * @param {Object} props
 * @param {number} props.currentPage - The current page number
 * @param {function} props.setCurrentPage - The function to set the current page number
 * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} props.budgetLineItems - The budget line items to display
 * @param {boolean} props.budgetLineItemsError - The error state of the budget line items
 * @param {boolean} props.budgetLineItemsIsLoading - The loading state of the budget line items
 * @param {string} props.sortConditions - The conditions chosen to sort the table
 * @param {boolean} props.sortDescending - Whether or not the sort condition should be used to sort descending
 * @param {function} props.setSortConditions - The function that the base table uses to set the sort condition and direction
 * @returns {React.ReactElement}
 */
const AllBudgetLinesTable = ({
    currentPage,
    setCurrentPage,
    budgetLineItems,
    budgetLineItemsError,
    budgetLineItemsIsLoading,
    sortConditions,
    sortDescending,
    setSortConditions
}) => {
    const { showModal, setShowModal, modalProps } = useAllBudgetLinesTable(budgetLineItems || []);

    if (budgetLineItemsIsLoading) {
        return <h1>Loading...</h1>;
    }

    if (budgetLineItemsError) {
        return <h1>Oops, an error occurred</h1>;
    }

    const totalPages = budgetLineItems?.length > 0 ? budgetLineItems[0]._meta.number_of_pages : 0;

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <Table
                tableHeadings={All_BUDGET_LINES_TABLE_HEADINGS_LIST}
                selectedHeader={sortConditions}
                onClickHeader={setSortConditions}
                sortDescending={sortDescending}
            >
                {budgetLineItems?.length > 0 &&
                    budgetLineItems.map((budgetLine) => (
                        <AllBLIRow
                            key={budgetLine?.id}
                            budgetLine={budgetLine}
                        />
                    ))}
            </Table>
            {budgetLineItems?.length > 0 && (
                <PaginationNav
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    items={budgetLineItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalPages={totalPages}
                />
            )}
            {budgetLineItems?.length === 0 && (
                <div
                    id="budget-line-items-table-zero-results"
                    className="padding-top-5 display-flex flex-justify-center"
                >
                    There are 0 results based on your filter selections.
                </div>
            )}
        </>
    );
};

export default AllBudgetLinesTable;
