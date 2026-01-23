import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { getBudgetLineCreatedDate } from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { fiscalYearFromDate, formatDateNeeded } from "../../../helpers/utils";
import useGetUserFullNameFromId, { useGetLoggedInUserFullName } from "../../../hooks/user.hooks";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    expandedRowBGColor,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";
import { addErrorClassIfNotFound, futureDateErrorClass } from "../BudgetLinesTable/BLIRow.helpers";
import { NO_DATA } from "../../../constants";
import Tooltip from "../../UI/USWDS/Tooltip";
import { actionOptions } from "../../../pages/agreements/review/ReviewAgreement.constants";
import { BUDGET_LINE_STATUSES } from "./BLIReviewTable.constants";
import React from "react";
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
 */

/**
 * @component - BLIRow component that represents a single row in the review table
 * @param {BLIReviewRowProps} props - The props of the BLIRow component.
 * @returns {JSX.Element} The BLIRow component.
 **/
const BLIReviewRow = ({ budgetLine, isReviewMode = false, setSelectedBLIs, action }) => {
    const { isExpanded, setIsExpanded, setIsRowActive } = useTableRow();
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const feeTotal = budgetLine?.fees;
    const budgetLineTotalPlusFees = budgetLine?.total ?? 0;

    // styles for the table row
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);

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
                className={`usa-checkbox__label ${isDisabled ? "text-gray-50 checkbox-disabled" : ""}`}
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
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {input}
                {label}
            </td>
        );
    };

    const TableRowData = (() => {
        const dateNeeded = budgetLine?.date_needed ?? null;
        const dateNeededFormatted = formatDateNeeded(dateNeeded);
        const dateNeededErrorValue = dateNeededFormatted === NO_DATA ? null : dateNeededFormatted;
        const dateErrorClasses = `${futureDateErrorClass(dateNeededErrorValue, isReviewMode)} ${addErrorClassIfNotFound(dateNeededErrorValue, isReviewMode)}`;
        const dateNeededClasses = `${budgetLine.selected ? dateErrorClasses : ""} ${borderExpandedStyles}`;

        const fiscalYear = fiscalYearFromDate(dateNeeded || "") ?? NO_DATA;

        const canNumber = budgetLine?.can?.number ?? NO_DATA;
        const canNumberErrorClasses = `${addErrorClassIfNotFound(canNumber, isReviewMode)}`;
        const canNumberClasses = `${budgetLine.selected ? canNumberErrorClasses : ""} ${borderExpandedStyles}`;

        const amount = budgetLine?.amount ?? 0;
        const amountErrorClasses = `${addErrorClassIfNotFound(amount, isReviewMode)}`;
        const amountClasses = `${budgetLine.selected ? amountErrorClasses : ""} ${borderExpandedStyles}`;

        const feeValue = feeTotal || 0;
        const totalWithFees = budgetLineTotalPlusFees || 0;

        return (
            <>
                {renderCheckboxCell()}
                <td
                    className={dateNeededClasses}
                    style={bgExpandedStyles}
                >
                    {dateNeededFormatted}
                </td>
                <td style={bgExpandedStyles}>{fiscalYear}</td>
                <td
                    className={canNumberClasses}
                    style={bgExpandedStyles}
                >
                    {canNumber}
                </td>
                <td
                    className={amountClasses}
                    style={bgExpandedStyles}
                >
                    <CurrencyFormat
                        value={amount}
                        displayType="text"
                        thousandSeparator
                        prefix="$"
                        decimalScale={getDecimalScale(amount)}
                        fixedDecimalScale
                        renderText={(value) => value}
                    />
                </td>
                <td
                    className={borderExpandedStyles}
                    style={bgExpandedStyles}
                >
                    <CurrencyFormat
                        value={feeValue}
                        displayType="text"
                        thousandSeparator
                        prefix="$"
                        decimalScale={getDecimalScale(feeValue)}
                        fixedDecimalScale
                        renderText={(value) => value}
                    />
                </td>
                <td
                    className={borderExpandedStyles}
                    style={bgExpandedStyles}
                >
                    <CurrencyFormat
                        value={totalWithFees}
                        displayType="text"
                        thousandSeparator
                        prefix="$"
                        decimalScale={getDecimalScale(totalWithFees)}
                        fixedDecimalScale
                        renderText={(value) => value}
                    />
                </td>
                <td
                    className={borderExpandedStyles}
                    style={bgExpandedStyles}
                >
                    <TableTag
                        status={budgetLine?.status}
                        inReview={budgetLine?.in_review}
                    />
                </td>
            </>
        );
    })();

    const ExpandedData = (
        <td
            colSpan={9}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="display-flex padding-right-9">
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Created By</dt>
                    <dd
                        id={`created-by-name-${budgetLine?.id}`}
                        className="margin-0"
                    >
                        {/* NOTE: Show logged in user name when creating BLIs */}
                        {budgetLine?.created_by ? budgetLineCreatorName : loggedInUserFullName}
                    </dd>
                    <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                        <FontAwesomeIcon
                            icon={faClock}
                            className="height-2 width-2 margin-right-1"
                        />
                        {getBudgetLineCreatedDate(budgetLine)}
                    </dt>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "9.0625rem" }}
                >
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd
                        className="margin-0 wrap-text"
                        style={{ maxWidth: "400px" }}
                    >
                        {budgetLine?.line_description}
                    </dd>
                </dl>
            </div>
        </td>
    );
    return (
        <TableRowExpandable
            tableRowData={TableRowData}
            expandedData={ExpandedData}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            setIsRowActive={setIsRowActive}
            className={`${!budgetLine.actionable ? "text-gray-50" : ""}`}
        />
    );
};

export default BLIReviewRow;
