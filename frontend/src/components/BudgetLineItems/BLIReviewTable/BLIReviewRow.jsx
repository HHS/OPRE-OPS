import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { getBudgetLineCreatedDate } from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import {
    convertCodeForDisplay,
    fiscalYearFromDate,
    formatDateNeeded,
    totalBudgetLineAmountPlusFees
} from "../../../helpers/utils";
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
    const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(budgetLine?.amount || 0, feeTotal);

    // console.log({ status: budgetLine.status, action });

    // styles for the table row
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);

    const toolTipMsg = React.useMemo(() => {
        if (budgetLine?.actionable) return "";

        // If no action is selected yet, return empty string to avoid showing misleading tooltip
        if (!action || action === "") {
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
        return `This budget line is in ${convertCodeForDisplay("budgetLineStatus", budgetLine.status)} status`;
    }, [budgetLine, action]);

    const TableRowData = (
        <>
            <td
                className={`${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {!budgetLine?.actionable ? (
                    toolTipMsg ? (
                        <Tooltip
                            label={toolTipMsg}
                            position="right"
                        >
                            <label
                                className="usa-checkbox__label text-gray-50 checkbox-disabled"
                                htmlFor={budgetLine?.id.toString()}
                                style={{
                                    cursor: "not-allowed"
                                }}
                            >
                                {budgetLine?.id}
                            </label>
                        </Tooltip>
                    ) : (
                        <label
                            className="usa-checkbox__label text-gray-50 checkbox-disabled"
                            htmlFor={budgetLine?.id.toString()}
                            style={{
                                cursor: "not-allowed"
                            }}
                        >
                            {budgetLine?.id}
                        </label>
                    )
                ) : (
                    <>
                        <input
                            className="usa-checkbox__input"
                            id={budgetLine?.id.toString()}
                            type="checkbox"
                            name="budget-line-checkbox"
                            value={budgetLine?.id}
                            onChange={(e) => {
                                setSelectedBLIs(e.target.value);
                            }}
                            disabled={false}
                            checked={budgetLine?.selected}
                        />
                        <label
                            className="usa-checkbox__label"
                            htmlFor={budgetLine?.id.toString()}
                        >
                            {budgetLine?.id}
                        </label>
                    </>
                )}
            </td>
            <td
                className={`${futureDateErrorClass(
                    formatDateNeeded(budgetLine?.date_needed ?? null) === NO_DATA
                        ? null
                        : formatDateNeeded(budgetLine?.date_needed ?? null),
                    isReviewMode
                )} ${addErrorClassIfNotFound(
                    formatDateNeeded(budgetLine?.date_needed ?? null) === NO_DATA
                        ? null
                        : formatDateNeeded(budgetLine?.date_needed ?? null),
                    isReviewMode
                )} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {formatDateNeeded(budgetLine?.date_needed ?? null)}
            </td>
            <td
                className={`${addErrorClassIfNotFound(fiscalYearFromDate(budgetLine?.date_needed || ""), isReviewMode)} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {fiscalYearFromDate(budgetLine?.date_needed || "")}
            </td>
            <td
                className={`${addErrorClassIfNotFound(budgetLine?.can?.number, isReviewMode)} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {budgetLine?.can?.number}
            </td>
            <td
                className={`${addErrorClassIfNotFound(budgetLine?.amount, isReviewMode)} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                <CurrencyFormat
                    value={budgetLine?.amount}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(budgetLine?.amount || 0)}
                    fixedDecimalScale={true}
                    renderText={(value) => value}
                />
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                <CurrencyFormat
                    value={feeTotal}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(feeTotal)}
                    fixedDecimalScale={true}
                    renderText={(value) => value}
                />
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                <CurrencyFormat
                    value={budgetLineTotalPlusFees}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(budgetLineTotalPlusFees)}
                    fixedDecimalScale={true}
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
