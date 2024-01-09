import PropTypes from "prop-types";
import Table from "../../UI/Table";
import TotalSummaryCard from "../TotalSummaryCard";
import BLIReviewRow from "./BLIReviewRow";
import { BUDGET_LINE_TABLE_HEADERS } from "./BLIReviewTable.constants";
import "../../BudgetLineItems/BudgetLinesTable/BudgetLinesTable.scss";

/**
 * A table component that displays budget lines.
 * @param {Object} props - The component props.
 * @param {Array<any>} [props.budgetLines] - An array of budget lines to display. - optional
 * @param {Function} [props.handleSetBudgetLineForEditing ]- A function to handle editing a budget line. - optional
 * @param {Function} [props.handleDeleteBudgetLine] - A function to handle deleting a budget line. - optional
 * @param {Function} [props.handleDuplicateBudgetLine] - A function to handle duplicating a budget line. - optional
 * @param {Boolean} [props.readOnly] - A flag to indicate if the table is read-only.
 * @param {Boolean} [props.isReviewMode] - A flag to indicate if the table is in review mode.
 * @param {Boolean} [props.showTotalSummaryCard] - A flag to indicate if the total summary card should be displayed.
 * @param {Function} [props.setSelectedBLIs] - A function to set the selected budget line items.
 * @param {Function} [props.toggleSelectActionableBLIs] - A function to toggle the selection of actionable budget line items.
 * @param {Boolean} [props.mainToggleSelected] - A flag to indicate if the main toggle is selected.
 * @param {Function} [props.setMainToggleSelected] - A function to set the main toggle selected.
 * @returns {JSX.Element} - The rendered table component.
 */
const AgreementBLIReviewTable = ({
    budgetLines = [],
    handleSetBudgetLineForEditing = () => {},
    handleDeleteBudgetLine = () => {},
    handleDuplicateBudgetLine = () => {},
    readOnly = false,
    isReviewMode = false,
    showTotalSummaryCard = true,
    setSelectedBLIs,
    toggleSelectActionableBLIs = () => {},
    mainToggleSelected,
    setMainToggleSelected = () => {}
}) => {
    const sortedBudgetLines = budgetLines
        .slice()
        .sort((a, b) => Date.parse(a.created_on) - Date.parse(b.created_on))
        .reverse();

    const areSomeBudgetLinesActionable = budgetLines.some((budgetLine) => budgetLine.actionable);
    const firstHeadingSlot = (
        <th>
            <input
                className="usa-checkbox__input"
                id="check-all"
                type="checkbox"
                name="budget-line-checkbox"
                value="check-all"
                onChange={() => {
                    toggleSelectActionableBLIs();
                    setMainToggleSelected(!mainToggleSelected);
                }}
                disabled={!areSomeBudgetLinesActionable}
                checked={mainToggleSelected}
                data-cy="check-all"
            />
            <label
                className="usa-checkbox__label usa-tool-tip text-bold"
                htmlFor="check-all"
                data-position="top"
                title={`${!areSomeBudgetLinesActionable ? "disabled" : ""}`}
            >
                Description
            </label>
        </th>
    );

    return (
        <>
            <Table
                tableHeadings={BUDGET_LINE_TABLE_HEADERS}
                firstHeadingSlot={firstHeadingSlot}
            >
                {sortedBudgetLines.map((budgetLine) => (
                    <BLIReviewRow
                        key={budgetLine.id}
                        budgetLine={budgetLine}
                        handleDeleteBudgetLine={handleDeleteBudgetLine}
                        handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                        handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                        isReviewMode={isReviewMode}
                        readOnly={readOnly}
                        setSelectedBLIs={setSelectedBLIs}
                    />
                ))}
            </Table>
            {showTotalSummaryCard && <TotalSummaryCard budgetLines={sortedBudgetLines}></TotalSummaryCard>}
            {/* <pre className="border border-1">{JSON.stringify(budgetLines, null, 2)}</pre> */}
        </>
    );
};

AgreementBLIReviewTable.propTypes = {
    budgetLines: PropTypes.arrayOf(PropTypes.object),
    canUserEditBudgetLines: PropTypes.bool,
    handleSetBudgetLineForEditing: PropTypes.func,
    handleDeleteBudgetLine: PropTypes.func,
    handleDuplicateBudgetLine: PropTypes.func,
    readOnly: PropTypes.bool,
    errors: PropTypes.arrayOf(PropTypes.array),
    isReviewMode: PropTypes.bool,
    showTotalSummaryCard: PropTypes.bool,
    setSelectedBLIs: PropTypes.func,
    toggleSelectActionableBLIs: PropTypes.func,
    mainToggleSelected: PropTypes.bool,
    setMainToggleSelected: PropTypes.func
};

export default AgreementBLIReviewTable;
