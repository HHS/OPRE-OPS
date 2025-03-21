import PropTypes from "prop-types";
import "../../BudgetLineItems/BudgetLinesTable/BudgetLinesTable.scss";
import Table from "../../UI/Table";
import _ from "lodash"
import BLIReviewRow from "./BLIReviewRow";
import { BUDGET_LINE_TABLE_HEADERS_LIST } from "./BLIReviewTable.constants";
import { SORT_TYPES, useSortData } from "../../../hooks/use-sortable-data.hooks";
import { useSetSortConditions } from "./BLIReviewTable.hooks";
/**
 * A table component that displays budget lines.
 * @component
 * @param {Object} props - The component props.
 * @param {Array<any>} [props.budgetLines] - An array of budget lines to display. - optional
 * @param {Function} [props.handleSetBudgetLineForEditing ]- A function to handle editing a budget line. - optional
 * @param {Function} [props.handleDeleteBudgetLine] - A function to handle deleting a budget line. - optional
 * @param {Function} [props.handleDuplicateBudgetLine] - A function to handle duplicating a budget line. - optional
 * @param {Boolean} [props.readOnly] - A flag to indicate if the table is read-only.
 * @param {Boolean} [props.isReviewMode] - A flag to indicate if the table is in review mode.
 * @param {Function} [props.setSelectedBLIs] - A function to set the selected budget line items.
 * @param {Function} [props.toggleSelectActionableBLIs] - A function to toggle the selection of actionable budget line items.
 * @param {Boolean} [props.mainToggleSelected] - A flag to indicate if the main toggle is selected.
 * @param {Function} [props.setMainToggleSelected] - A function to set the main toggle selected.
 * @param {Number} props.servicesComponentId - The ID of the services component.
 * @returns {JSX.Element} - The rendered table component.
 */
const AgreementBLIReviewTable = ({
    budgetLines = [],
    handleSetBudgetLineForEditing = () => {},
    handleDeleteBudgetLine = () => {},
    handleDuplicateBudgetLine = () => {},
    readOnly = false,
    isReviewMode = false,
    setSelectedBLIs,
    toggleSelectActionableBLIs = () => {},
    mainToggleSelected,
    setMainToggleSelected = () => {},
    servicesComponentId
}) => {
    const {sortDescending, sortCondition, setSortConditions} = useSetSortConditions();

    const sortedBudgetLines = budgetLines
        .slice()
        .sort((a, b) => Date.parse(a.created_on) - Date.parse(b.created_on))
        .reverse();

    let copiedBudgetLines = _.cloneDeep(sortedBudgetLines);

    copiedBudgetLines = useSortData(copiedBudgetLines, sortDescending, sortCondition, SORT_TYPES.BLI_REVIEW)

    const areSomeBudgetLinesActionable = budgetLines.some((budgetLine) => budgetLine.actionable);
    const firstHeadingSlot = (
        <th>
            <input
                className="usa-checkbox__input"
                id={`check-all-${servicesComponentId}`} // Use unique ID
                type="checkbox"
                name="budget-line-checkbox"
                value="check-all"
                onChange={() => {
                    toggleSelectActionableBLIs(servicesComponentId);
                    setMainToggleSelected(!mainToggleSelected);
                }}
                disabled={!areSomeBudgetLinesActionable}
                checked={mainToggleSelected}
                data-cy="check-all"
            />
            <label
                className="usa-checkbox__label usa-tool-tip text-bold"
                htmlFor={`check-all-${servicesComponentId}`} // Use unique ID
                data-position="top"
                title={`${!areSomeBudgetLinesActionable ? "disabled" : ""}`}
            >
                BL ID #
            </label>
        </th>
    );

    return (
        <>
            <Table
                tableHeadings={BUDGET_LINE_TABLE_HEADERS_LIST}
                firstHeadingSlot={firstHeadingSlot}
                selectedHeader={sortCondition}
                sortDescending={sortDescending}
                onClickHeader={setSortConditions}
            >
                {copiedBudgetLines.map((budgetLine) => (
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
    setSelectedBLIs: PropTypes.func,
    toggleSelectActionableBLIs: PropTypes.func,
    mainToggleSelected: PropTypes.bool,
    setMainToggleSelected: PropTypes.func,
    servicesComponentId: PropTypes.number.isRequired
};

export default AgreementBLIReviewTable;
