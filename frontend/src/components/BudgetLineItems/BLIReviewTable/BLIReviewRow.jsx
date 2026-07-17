import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getBudgetLineCreatedDate, getProcurementShopLabel } from "../../../helpers/budgetLines.helpers";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import { fiscalYearFromDate, formatDateNeeded } from "../../../helpers/utils";
import useGetUserFullNameFromId, { useGetLoggedInUserFullName } from "../../../hooks/user.hooks";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    expandedRowBGColor,
    removeBorderBottomIfExpanded,
    changeBgColorIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";
import { addErrorClassIfNotFound, futureDateErrorClass } from "../BudgetLinesTable/BLIRow.helpers";
import { NO_DATA } from "../../../constants";
import Tooltip from "../../UI/USWDS/Tooltip";
import { actionOptions } from "../../../pages/agreements/review/ReviewAgreement.constants";
import { BUDGET_LINE_STATUSES } from "./BLIReviewTable.constants";
import React, { memo } from "react";
/**
 * @typedef {import('../../../types/BudgetLineTypes').BudgetLine} BudgetLine
 */

/**
 * @typedef BLIReviewRowProps
 * @property {BudgetLine} budgetLine - The budget line object.
 * @property {boolean} [isReviewMode] - Whether the user is in review mode.
 * @property {boolean} [readOnly] - Whether the user is in read only mode.
 * @property {Function} [setSelectedBLIs] - The function to set the selected budget line items.
 * @property {string} action
 * @property {boolean} [showCheckbox] - Whether to show the checkbox for selection.
 * @property {Function} [onAddCLINClick] - Callback when "+ CLIN" button is clicked with budgetLine.id
 * @property {boolean} [showCLINColumn] - Whether to show the CLIN column
 * @property {Object} [clinAssignments] - Map of budgetLineId to CLIN number assignments
 * @property {string[]} [errorStatuses] - When provided, inline error styling applies to rows whose status is in this list (regardless of row selection). When omitted, the original selection-gated behavior is preserved: errors only show when the row is selected (Review Agreement page behavior).
 */

/**
 * @component - BLIRow component that represents a single row in the review table
 * @param {BLIReviewRowProps} props - The props of the BLIRow component.
 * @returns {JSX.Element} The BLIRow component.
 **/
const BLIReviewRow = ({
    budgetLine,
    isReviewMode = false,
    setSelectedBLIs,
    action,
    showCheckbox = true,
    readOnly = false,
    onAddCLINClick = () => {},
    showCLINColumn = false,
    clinAssignments = {},
    errorStatuses
}) => {
    // When errorStatuses is provided, inline errors only apply to rows whose status is in the list.
    // Suppress by pretending we're not in review mode — the existing helpers gate all error styling on that flag.
    const rowInReviewMode = isReviewMode && (!errorStatuses || errorStatuses.includes(budgetLine?.status));

    const statusScopedErrors = Array.isArray(errorStatuses);
    const showCellErrors = statusScopedErrors ? rowInReviewMode : budgetLine?.selected;
    // Row-level error class for a missing services component. Only used in selection-gated
    // mode (Review Agreement) where highlighting the whole row is correct. In errorStatuses
    // mode (pre-award), table-item-error on the <tr> would cascade color:#b50909 to every
    // child <td> including cells with valid data — use cell-level errors only there.
    const missingServicesComponentClass =
        !statusScopedErrors && showCellErrors && !budgetLine?.services_component_id ? "table-item-error" : "";

    const { isExpanded, setIsExpanded, isRowActive, setIsRowActive } = useTableRow();
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const loggedInUserFullName = useGetLoggedInUserFullName();

    const feeTotal = budgetLine?.fees;
    const budgetLineTotalPlusFees = budgetLine?.total ?? 0;

    const toolTipMsg = React.useMemo(() => {
        if (budgetLine?.actionable) return "";

        // If no action is selected yet, return empty string to avoid showing misleading tooltip
        if (!action) {
            return "";
        }

        // Not actionable: derive message by action + status
        if (action === actionOptions.CHANGE_DRAFT_TO_PLANNED) {
            if (budgetLine?.status === BUDGET_LINE_STATUSES.DRAFT && budgetLine?.in_review) {
                return "Budget lines In Review Status cannot be sent for status changes until the budget changes have been approved or declined";
            }
            if (budgetLine?.status === BUDGET_LINE_STATUSES.PLANNED) {
                return "This budget line is already in Planned Status";
            }
            if (budgetLine?.status === BUDGET_LINE_STATUSES.IN_EXECUTION) {
                return "Budget lines in Executing Status cannot be changed to Planned Status";
            }
        } else if (action === actionOptions.CHANGE_PLANNED_TO_EXECUTING) {
            if (budgetLine?.status === BUDGET_LINE_STATUSES.PLANNED && budgetLine?.in_review) {
                return "Budget lines In Review Status cannot be sent for status changes until the budget changes have been approved or declined";
            }
            if (budgetLine?.status === BUDGET_LINE_STATUSES.IN_EXECUTION) {
                return "This budget line is already in Executing Status";
            }
        }
        if (budgetLine?.status === BUDGET_LINE_STATUSES.OBLIGATED) {
            return "Budget lines in Obligated Status cannot be changed to another Status";
        }
        // default return empty string
        return "";
    }, [budgetLine, action]);

    const renderCheckboxCell = () => {
        if (!showCheckbox) {
            return (
                <td
                    className={removeBorderBottomIfExpanded(isExpanded)}
                    style={changeBgColorIfExpanded(isExpanded)}
                >
                    {budgetLine?.id}
                </td>
            );
        }

        const checkboxId = budgetLine?.id.toString();
        const isDisabled = !budgetLine?.actionable;

        const input = (
            <input
                className="usa-checkbox__input"
                id={checkboxId}
                type="checkbox"
                name="budget-line-checkbox"
                value={budgetLine?.id}
                onChange={isDisabled ? undefined : (e) => setSelectedBLIs(e.target.value)}
                disabled={isDisabled}
                checked={budgetLine?.selected}
            />
        );

        const labelContent = (
            <label
                className={`usa-checkbox__label ${isDisabled && !readOnly ? "text-gray-50 checkbox-disabled" : ""}`}
                htmlFor={checkboxId}
                style={isDisabled ? { cursor: "not-allowed" } : undefined}
            >
                {budgetLine?.id}
            </label>
        );

        const label = toolTipMsg ? (
            <Tooltip
                label={toolTipMsg}
                position="right"
            >
                {labelContent}
            </Tooltip>
        ) : (
            labelContent
        );

        return (
            <td>
                {input}
                {label}
            </td>
        );
    };

    const TableRowData = (() => {
        // showCellErrors and statusScopedErrors are computed at the component level
        // (above the IIFE) so they are also available for the row className.

        const dateNeeded = budgetLine?.date_needed ?? null;
        const dateNeededFormatted = formatDateNeeded(dateNeeded);
        const dateNeededErrorValue = dateNeededFormatted === NO_DATA ? null : dateNeededFormatted;
        const dateErrorClasses = `${futureDateErrorClass(dateNeededErrorValue, rowInReviewMode)} ${addErrorClassIfNotFound(dateNeededErrorValue, rowInReviewMode)}`;
        const dateNeededClasses = showCellErrors ? dateErrorClasses : "";

        const fiscalYear = fiscalYearFromDate(dateNeeded || "") ?? NO_DATA;

        // Use local assignment if available, otherwise fall back to backend clin.number
        const assignedClinNumber = clinAssignments[budgetLine.id];
        const isDraftStatus = budgetLine?.status === BUDGET_LINE_STATUSES.DRAFT;

        // Draft BLIs show "N/A", non-Draft show "CLIN X" or "TBD"
        const clinNumber = isDraftStatus
            ? "N/A"
            : assignedClinNumber
              ? `CLIN ${assignedClinNumber}`
              : (budgetLine?.clin?.number ?? NO_DATA);

        // Only apply error styling to non-Draft BLIs with missing CLIN
        const clinErrorClasses = !isDraftStatus ? `${addErrorClassIfNotFound(clinNumber, rowInReviewMode)}` : "";
        // For CLIN column, show error in review mode regardless of selection (Award Approval page)
        // For other columns, only show error when selected (Review Agreement page)
        const clinClasses = rowInReviewMode ? clinErrorClasses : budgetLine.selected ? clinErrorClasses : "";

        const canNumber = budgetLine?.can?.number ?? NO_DATA;
        const canNumberErrorClasses = `${addErrorClassIfNotFound(canNumber, rowInReviewMode)}`;
        const canNumberClasses = showCellErrors ? canNumberErrorClasses : "";

        const amount = budgetLine?.amount ?? 0;
        const amountErrorClasses = `${addErrorClassIfNotFound(amount, rowInReviewMode)}`;
        const amountClasses = showCellErrors ? amountErrorClasses : "";

        const feeValue = feeTotal || 0;
        const totalWithFees = budgetLineTotalPlusFees || 0;

        return (
            <>
                {renderCheckboxCell()}
                {showCLINColumn && <td className={clinClasses}>{clinNumber}</td>}
                <td className={dateNeededClasses}>{dateNeededFormatted}</td>
                <td>{fiscalYear}</td>
                <td className={canNumberClasses}>{canNumber}</td>
                <td className={amountClasses}>{formatCurrency(amount)}</td>
                <td>{formatCurrency(feeValue)}</td>
                <td>{formatCurrency(totalWithFees)}</td>
                <td>
                    {isRowActive && onAddCLINClick && showCLINColumn && !isDraftStatus ? (
                        <button
                            className="usa-button usa-button--unstyled text-primary"
                            onClick={() => onAddCLINClick(budgetLine.id)}
                            data-cy="add-clin-hover-button"
                        >
                            <FontAwesomeIcon
                                icon={faPen}
                                className="height-2 width-2"
                            />
                            CLIN
                        </button>
                    ) : (
                        <TableTag
                            status={budgetLine?.status}
                            inReview={budgetLine?.in_review}
                        />
                    )}
                </td>
            </>
        );
    })();

    const ExpandedData = (
        <td
            colSpan={showCLINColumn ? 10 : 9}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="grid-row grid-gap-4">
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Created By</dt>
                    <dd className="margin-0">
                        <div id={`created-by-name-${budgetLine?.id}`}>
                            {/* NOTE: Show logged in user name when creating BLIs */}
                            {budgetLine?.created_by ? budgetLineCreatorName : loggedInUserFullName}
                        </div>
                        <div className="margin-top-2 display-flex flex-align-center text-base-dark text-normal">
                            <FontAwesomeIcon
                                icon={faClock}
                                className="height-2 width-2 margin-right-1"
                                aria-hidden={true}
                            />
                            {getBudgetLineCreatedDate(budgetLine)}
                        </div>
                    </dd>
                </dl>
                <dl className="grid-col-4 margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd className="margin-0 wrap-text">{budgetLine?.line_description}</dd>
                </dl>
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    <dd className="margin-0">{getProcurementShopLabel(budgetLine)}</dd>
                </dl>
            </div>
        </td>
    );
    return (
        <>
            <TableRowExpandable
                tableRowData={TableRowData}
                expandedData={ExpandedData}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
                setIsRowActive={setIsRowActive}
                className={`${!readOnly && !budgetLine.actionable ? "text-gray-50" : ""} ${missingServicesComponentClass}`.trim()}
            />
        </>
    );
};

// Memoize to prevent re-renders when parent table re-renders
export default memo(BLIReviewRow);
