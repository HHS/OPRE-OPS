import { useMemo } from "react";
import { SORT_TYPES, useSortData } from "../../../hooks/use-sortable-data.hooks";
import "../../BudgetLineItems/BudgetLinesTable/BudgetLinesTable.scss";
import Table from "../../UI/Table";
import { useSetSortConditions } from "../../UI/Table/Table.hooks";
import BLIReviewRow from "./BLIReviewRow";
import { BUDGET_LINE_TABLE_HEADERS_LIST } from "./BLIReviewTable.constants";
/**
 * A table component that displays budget lines.
 * @component
 * @param {Object} props - The component props.
 * @param {Array<any>} [props.budgetLines] - An array of budget lines to display. - optional
 * @param {Function} [props.handleSetBudgetLineForEditing ] - A function to handle editing a budget line. - optional
 * @param {Function} [props.handleDeleteBudgetLine] - A function to handle deleting a budget line. - optional
 * @param {Function} [props.handleDuplicateBudgetLine] - A function to handle duplicating a budget line. - optional
 * @param {Boolean} [props.readOnly] - A flag to indicate if the table is read-only.
 * @param {Boolean} [props.isReviewMode] - A flag to indicate if the table is in review mode.
 * @param {Function} [props.setSelectedBLIs] - A function to set the selected budget line items.
 * @param {Function} [props.toggleSelectActionableBLIs] - A function to toggle the selection of actionable budget line items.
 * @param {Boolean} [props.mainToggleSelected] - A flag to indicate if the main toggle is selected.
 * @param {Function} [props.setMainToggleSelected] - A function to set the main toggle selected.
 * @param {Number} props.servicesComponentNumber - The Number of the services component.
 * @param {string} props.action - The action of the review
 * @param {string[]} [props.errorStatuses] - When provided, inline error styling applies to rows whose status is in this list (regardless of row selection). When omitted, the original selection-gated behavior is preserved: errors only show when the row is selected (Review Agreement page behavior).
 * @param {import('./BLIReviewRow').BLIReviewClinConfig} [props.clin] - CLIN column display configuration. Omit to hide the column.
 * @returns {React.ReactElement} - The rendered table component.
 */
const AgreementBLIReviewTable = ({
    budgetLines = [],
    isReviewMode = false,
    setSelectedBLIs,
    toggleSelectActionableBLIs = () => {},
    mainToggleSelected,
    setMainToggleSelected = () => {},
    servicesComponentNumber,
    action,
    readOnly = false,
    errorStatuses,
    clin = {}
}) => {
    const {
        showColumn: showCLINColumn = false,
        assignments: clinAssignments,
        onAddClick: onAddCLINClick,
        readOnly: clinReadOnly = false
    } = clin;
    // Stabilize the config object identity so the memoized BLIReviewRow can bail out of
    // re-renders (callers pass an inline `clin={{...}}` literal on every parent render).
    const rowClin = useMemo(
        () => ({
            showColumn: showCLINColumn,
            assignments: clinAssignments,
            onAddClick: onAddCLINClick,
            readOnly: clinReadOnly
        }),
        [showCLINColumn, clinAssignments, onAddCLINClick, clinReadOnly]
    );
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();

    // Memoize initial sorting by creation date to avoid re-sorting on every render
    const sortedBudgetLines = useMemo(
        () =>
            budgetLines
                .slice()
                .sort((a, b) => Date.parse(a.created_on) - Date.parse(b.created_on))
                .reverse(),
        [budgetLines]
    );

    // Pass local (possibly unsaved) CLIN assignments so sorting by the CLIN column matches the
    // displayed value rather than only the persisted backend clin.number.
    const sortContext = useMemo(() => ({ clinAssignments: clinAssignments ?? {} }), [clinAssignments]);

    // Use shallow copy instead of deep clone - useSortData doesn't mutate nested properties
    const copiedBudgetLines = useSortData(
        [...sortedBudgetLines],
        sortDescending,
        sortCondition,
        SORT_TYPES.BLI_REVIEW,
        sortContext
    );

    const areSomeBudgetLinesActionable = budgetLines.some((budgetLine) => budgetLine.actionable);
    const showCheckboxes = !!setSelectedBLIs;

    // Filter headers based on showCLINColumn flag
    const tableHeaders = useMemo(() => {
        if (showCLINColumn) {
            return BUDGET_LINE_TABLE_HEADERS_LIST;
        }
        // Remove CLIN column header when showCLINColumn is false
        return BUDGET_LINE_TABLE_HEADERS_LIST.filter((header) => header.heading !== "CLIN");
    }, [showCLINColumn]);

    const firstHeadingSlot = showCheckboxes ? (
        <th>
            <input
                className="usa-checkbox__input"
                id={`check-all-${servicesComponentNumber}`}
                type="checkbox"
                name="budget-line-checkbox"
                value="check-all"
                onChange={() => {
                    toggleSelectActionableBLIs(servicesComponentNumber);
                    setMainToggleSelected(!mainToggleSelected);
                }}
                disabled={!areSomeBudgetLinesActionable}
                checked={mainToggleSelected}
                data-cy="check-all"
            />
            <label
                className="usa-checkbox__label usa-tooltip text-bold"
                htmlFor={`check-all-${servicesComponentNumber}`}
                data-position="top"
                title={`${!areSomeBudgetLinesActionable ? "disabled" : ""}`}
                data-cy="check-all-label"
            >
                BL ID #
            </label>
        </th>
    ) : (
        <th className="text-bold">BL ID #</th>
    );

    return (
        <>
            <Table
                tableHeadings={tableHeaders}
                firstHeadingSlot={firstHeadingSlot}
                selectedHeader={sortCondition}
                sortDescending={sortDescending}
                onClickHeader={setSortConditions}
            >
                {copiedBudgetLines.map((budgetLine) => (
                    <BLIReviewRow
                        key={budgetLine.id}
                        budgetLine={budgetLine}
                        isReviewMode={isReviewMode}
                        setSelectedBLIs={setSelectedBLIs}
                        action={action}
                        showCheckbox={showCheckboxes}
                        readOnly={readOnly}
                        errorStatuses={errorStatuses}
                        clin={rowClin}
                    />
                ))}
            </Table>
        </>
    );
};

export default AgreementBLIReviewTable;
