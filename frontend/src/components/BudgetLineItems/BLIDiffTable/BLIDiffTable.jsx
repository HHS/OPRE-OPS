import PropTypes from "prop-types";
import Table from "../../UI/Table";
import BLIDiffRow from "./BLIDiffRow";
import { BUDGET_LINE_TABLE_HEADERS } from "./BLIDiffTable.constants";
import "./BLIDiffTable.scss";

/**
 * A table component that displays budget lines.
 * @typedef {import("../../BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 * @param {Object} props - The component props.
 * @param {BudgetLine[]} [props.budgetLines=[]] - The budget lines to display.
 * @param {string} props.changeType - The type of change request.
 * @param {string} [props.statusChangeTo=""] - The status change to.
 * @returns {JSX.Element} The rendered table component.
 */
const BLIDiffTable = ({ budgetLines = [], changeType, statusChangeTo = "" }) => {
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
                    changeType={changeType}
                    statusChangeTo={statusChangeTo}
                />
            ))}
        </Table>
    );
};

BLIDiffTable.propTypes = {
    budgetLines: PropTypes.arrayOf(PropTypes.object),
    changeType: PropTypes.string,
    statusChangeTo: PropTypes.string
};

export default BLIDiffTable;
