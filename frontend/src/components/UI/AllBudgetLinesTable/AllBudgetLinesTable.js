import PropTypes from "prop-types";
import Table from "../Table";
import AllBLIRow from "../AllBLIRow";
import { All_BUDGET_LINES_TABLE_HEADINGS } from "../../../constants";

/**
 * TableRow component that represents a single row in the budget lines table.
 * @param {Object} props - The props for the TableRow component.
 * @param {Object[]} props.budgetLines - The budget line data for the row.
 * } props.budgetLines - The budget line data for the row.
 * @returns {React.JSX.Element} The TableRow component.
 */
const AllBudgetLinesTable = ({ budgetLines }) => {
    return (
        <>
            <Table tableHeadings={All_BUDGET_LINES_TABLE_HEADINGS}>
                {budgetLines.map((bl) => (
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
            <pre>{JSON.stringify(budgetLines, null, 2)}</pre>
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
