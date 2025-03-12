import { useState } from "react";
import { useNavigate } from "react-router-dom";
import _ from "lodash";
import Table from "../../UI/Table";
import AllBLIRow from "./AllBLIRow";
import PaginationNav from "../../UI/PaginationNav/PaginationNav";
import { All_BUDGET_LINES_TABLE_HEADINGS, BLIS_PER_PAGE } from "./AllBudgetLinesTable.constants";
import useAllBudgetLinesTable from "./AllBudgetLinesTable.hooks";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";

/**
 * @typedef {Object} BudgetLine
 * @property {number} id
 * @property {string} agreement_name
 * @property {string} [date_needed]
 * @property {number} [fiscal_year]
 * @property {string} [can_number]
 * @property {number} [amount]
 * @property {string} status
 * @property {number} [services_component_id]
 */

/**
 * TableRow component that represents a single row in the budget lines table.
 * @component
 * @param {Object} props - The props for the TableRow component.
 * @param {BudgetLine[]} props.budgetLines - The budget line data for the row.
 * @returns {JSX.Element} The TableRow component.
 */

const AllBudgetLinesTable = ({ budgetLines }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    let budgetLinesPage = _.cloneDeep(budgetLines);
    budgetLinesPage = budgetLinesPage.slice((currentPage - 1) * BLIS_PER_PAGE, currentPage * BLIS_PER_PAGE);
    const { showModal, setShowModal, modalProps, handleDeleteBudgetLine } = useAllBudgetLinesTable(budgetLines);

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
            <Table tableHeadings={All_BUDGET_LINES_TABLE_HEADINGS}>
                {budgetLinesPage.map((budgetLine) => (
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
            {budgetLines.length > 0 && (
                <PaginationNav
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    items={budgetLines}
                />
            )}
            {budgetLines.length === 0 && (
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
