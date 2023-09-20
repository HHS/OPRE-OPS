import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import _ from "lodash";
import Table from "../../UI/Table";
import AllBLIRow from "../AllBLIRow";
import { All_BUDGET_LINES_TABLE_HEADINGS, BLIS_PER_PAGE } from "../../../constants";
import PaginationNav from "../../UI/PaginationNav/PaginationNav";

/**
 * TableRow component that represents a single row in the budget lines table.
 * @param {Object} props - The props for the TableRow component.
 * @param {Object[]} props.budgetLines - The budget line data for the row.
 * @returns {React.JSX.Element} The TableRow component.
 */
const AllBudgetLinesTable = ({ budgetLines }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    let budgetLinesPage = _.cloneDeep(budgetLines);
    budgetLinesPage = budgetLinesPage.slice((currentPage - 1) * BLIS_PER_PAGE, currentPage * BLIS_PER_PAGE);

    return (
        <>
            <Table tableHeadings={All_BUDGET_LINES_TABLE_HEADINGS}>
                {budgetLinesPage.map((bl) => (
                    <AllBLIRow
                        key={bl?.id}
                        bl={bl}
                        handleDeleteBudgetLine={() => {
                            alert("not implemented");
                        }}
                        handleSetBudgetLineForEditing={() => {
                            navigate(`/agreements/${bl.agreement_id}/budget-lines?mode=edit&budget-line-id=${bl.id}`);
                        }}
                        isReviewMode={false}
                        readOnly={false}
                    />
                ))}
            </Table>
            {budgetLines.length > 0 && (
                <PaginationNav currentPage={currentPage} setCurrentPage={setCurrentPage} items={budgetLines} />
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
            status: PropTypes.string.isRequired,
        })
    ),
};

export default AllBudgetLinesTable;
