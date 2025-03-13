import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import _ from "lodash";
import Table from "../../UI/Table";
import AllBLIRow from "./AllBLIRow";
import PaginationNav from "../../UI/PaginationNav/PaginationNav";
import { All_BUDGET_LINES_TABLE_HEADINGS_LIST, BLIS_PER_PAGE } from "./AllBudgetLinesTable.constants";
import useAllBudgetLinesTable, { useSetSortConditions } from "./AllBudgetLinesTable.hooks";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import { SORT_TYPES, useSortData } from "../../../hooks/use-sortable-data.hooks";

/**
 * TableRow component that represents a single row in the budget lines table.
 * @component
 * @typedef {import("../../BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 * @param {Object} props - The props for the TableRow component.
 * @param {BudgetLine[]} props.budgetLines - The budget line data for the row.
 * @returns {JSX.Element} The TableRow component.
 */
const AllBudgetLinesTable = ({ budgetLines }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    let budgetLinesPage = _.cloneDeep(budgetLines);
    const {sortDescending, sortCondition, setSortConditions} = useSetSortConditions();

    budgetLinesPage = useSortData(budgetLinesPage, sortDescending, sortCondition, SORT_TYPES.BUDGET_LINES)
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
            <Table
                tableHeadings={All_BUDGET_LINES_TABLE_HEADINGS_LIST}
                selectedHeader={sortCondition}
                onClickHeader={setSortConditions}
                sortDescending={sortDescending}>
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

AllBudgetLinesTable.propTypes = {
    budgetLines: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            line_description: PropTypes.string.isRequired,
            agreement_name: PropTypes.string.isRequired,
            date_needed: PropTypes.string,
            fiscal_year: PropTypes.number,
            can_number: PropTypes.string,
            amount: PropTypes.number,
            status: PropTypes.string.isRequired
        })
    )
};

export default AllBudgetLinesTable;
