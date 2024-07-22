import PropTypes from "prop-types";
import Table from "../../UI/Table";
import BLIDiffRow from "./BLIDiffRow";
import { BUDGET_LINE_TABLE_HEADERS } from "./BLIDiffTable.constants";
import "./BLIDiffTable.scss";

/**
 * A table component that displays budget lines.
 * @param {Object} props - The component props.
 * @param {Array<any>} [props.budgetLines] - An array of budget lines to display. - optional
 * @param {Function} [props.handleSetBudgetLineForEditing ]- A function to handle editing a budget line. - optional
 * @param {Function} [props.handleDeleteBudgetLine] - A function to handle deleting a budget line. - optional
 * @param {Function} [props.handleDuplicateBudgetLine] - A function to handle duplicating a budget line. - optional
 * @param {Boolean} [props.readOnly] - A flag to indicate if the table is read-only.
 * @param {Boolean} [props.isReviewMode] - A flag to indicate if the table is in review mode.
 * @param {Array<number>} [props.budgetLineIdsInReview] - an array of budget line IDs that are in review.
 * @returns {JSX.Element} - The rendered table component.
 */
const BLIDiffTable = ({
    budgetLines = [],
    handleSetBudgetLineForEditing = () => {},
    handleDeleteBudgetLine = () => {},
    handleDuplicateBudgetLine = () => {},
    readOnly = false,
    isReviewMode = false,
    budgetLineIdsInReview = []
}) => {
    const sortedBudgetLines = budgetLines
        .slice()
        .sort((a, b) => Date.parse(a.created_on) - Date.parse(b.created_on))
        .reverse();

    return (
        <Table tableHeadings={BUDGET_LINE_TABLE_HEADERS}>
            {sortedBudgetLines.map((budgetLine) => (
                <BLIDiffRow
                    key={budgetLine.id}
                    budgetLine={budgetLine}
                    handleDeleteBudgetLine={handleDeleteBudgetLine}
                    handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                    handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                    isReviewMode={isReviewMode}
                    readOnly={readOnly}
                    isBLIInCurrentWorkflow={budgetLineIdsInReview && budgetLineIdsInReview.includes(budgetLine.id)}
                />
            ))}
        </Table>
    );
};

BLIDiffTable.propTypes = {
    budgetLines: PropTypes.arrayOf(PropTypes.object),
    canUserEditBudgetLines: PropTypes.bool,
    handleSetBudgetLineForEditing: PropTypes.func,
    handleDeleteBudgetLine: PropTypes.func,
    handleDuplicateBudgetLine: PropTypes.func,
    readOnly: PropTypes.bool,
    errors: PropTypes.arrayOf(PropTypes.array),
    isReviewMode: PropTypes.bool,
    budgetLineIdsInReview: PropTypes.arrayOf(PropTypes.number)
};

export default BLIDiffTable;
