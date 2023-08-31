import { useState } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import Table from "../Table";
import AllBLIRow from "../AllBLIRow";
import { All_BUDGET_LINES_TABLE_HEADINGS, BLIS_PER_PAGE } from "../../../constants";
import PaginationNav from "../PaginationNav/PaginationNav";

/**
 * TableRow component that represents a single row in the budget lines table.
 * @param {Object} props - The props for the TableRow component.
 * @param {Object[]} props.budgetLines - The budget line data for the row.
 * @returns {React.JSX.Element} The TableRow component.
 */
const AllBudgetLinesTable = ({ budgetLines }) => {
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
                            alert("not implemented");
                        }}
                        isReviewMode={false}
                        readOnly={false}
                        canUserEditBudgetLines={bl?.isAllowedToEdit}
                    />
                ))}
            </Table>
            <PaginationNav currentPage={currentPage} setCurrentPage={setCurrentPage} items={budgetLines} />
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
