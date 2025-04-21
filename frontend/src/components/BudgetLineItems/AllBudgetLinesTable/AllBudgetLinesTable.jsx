import { useNavigate } from "react-router-dom";
import { SORT_TYPES, useSortData } from "../../../hooks/use-sortable-data.hooks";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import PaginationNav from "../../UI/PaginationNav/PaginationNav";
import Table from "../../UI/Table";
import { useSetSortConditions } from "../../UI/Table/Table.hooks";
import AllBLIRow from "./AllBLIRow";
import { All_BUDGET_LINES_TABLE_HEADINGS_LIST, BLIS_PER_PAGE } from "./AllBudgetLinesTable.constants";
import useAllBudgetLinesTable from "./AllBudgetLinesTable.hooks";

import App from "../../../App.jsx";
/**
 * @component
 * @param {Object} props
 * * @param {number} props.currentPage - The current page number
 * @param {function} props.setCurrentPage - The function to set the current page number
 * @param {import("../BudgetLineTypes").BudgetLine[]} props.budgetLineItems - The budget line items to display
 * @param {boolean} props.budgetLineItemsError - The error state of the budget line items
 * @param {boolean} props.budgetLineItemsIsLoading - The loading state of the budget line items
 * @returns {JSX.Element}
 */
const AllBudgetLinesTable = ({
    currentPage,
    setCurrentPage,
    budgetLineItems,
    budgetLineItemsError,
    budgetLineItemsIsLoading
}) => {
    const navigate = useNavigate();
    const { showModal, setShowModal, modalProps, handleDeleteBudgetLine } = useAllBudgetLinesTable(
        budgetLineItems || []
    );

    if (budgetLineItemsIsLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }

    if (budgetLineItemsError) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }

    const totalPages = budgetLineItems?.length > 0 ? budgetLineItems[0]._meta.number_of_pages : 0;
    // let budgetLinesPage = _.cloneDeep(budgetLines);
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();

    const budgetLinesPage = useSortData([], sortDescending, sortCondition, SORT_TYPES.ALL_BUDGET_LINES);
    // budgetLinesPage = budgetLinesPage.slice((currentPage - 1) * BLIS_PER_PAGE, currentPage * BLIS_PER_PAGE);
    console.log('holding this to fix linting: ' + budgetLinesPage)

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
                selectedHeader={sortCondition}
                onClickHeader={setSortConditions}
                sortDescending={sortDescending}
            >
                {budgetLineItems?.length > 0 &&
                    budgetLineItems.map((budgetLine) => (
                        <AllBLIRow
                            key={budgetLine?.id}
                            budgetLine={budgetLine}
                            handleDeleteBudgetLine={handleDeleteBudgetLine}
                            handleSetBudgetLineForEditing={() => {
                                navigate(
                                    `/agreements/${budgetLine.agreement_id}/budget-lines?mode=edit&budget-line-id=${budgetLine.id}#budget-lines-header`
                                );
                            }}
                            isReviewMode={false}
                            readOnly={false}
                        />
                    ))}
            </Table>
            {budgetLineItems?.length > 0 && (
                <PaginationNav
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    items={budgetLineItems}
                    itemsPerPage={BLIS_PER_PAGE}
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
