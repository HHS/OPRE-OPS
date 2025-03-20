import PropTypes from "prop-types";
import Table from "../../UI/Table";
import _ from "lodash";
import BLIDiffRow from "./BLIDiffRow";
import { useSetSortConditions } from "./BLIDiffTable.hooks";
import { BUDGET_LINE_TABLE_HEADERS_LIST } from "./BLIDiffTable.constants";
import { SORT_TYPES, useSortData } from "../../../hooks/use-sortable-data.hooks";
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
    const {sortDescending, sortCondition, setSortConditions} = useSetSortConditions();

    const sortedBudgetLines = budgetLines
        .slice()
        .sort((a, b) => Date.parse(a.created_on) - Date.parse(b.created_on))
        .reverse();

    let copiedBudgetLines = _.cloneDeep(sortedBudgetLines);

    copiedBudgetLines = useSortData(copiedBudgetLines, sortDescending, sortCondition, SORT_TYPES.BLI_DIFF);
    return (
        <Table
            tableHeadings={BUDGET_LINE_TABLE_HEADERS_LIST}
            selectedHeader={sortCondition}
            onClickHeader={setSortConditions}
            sortDescending={sortDescending}>
            {copiedBudgetLines.map((budgetLine) => (
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
