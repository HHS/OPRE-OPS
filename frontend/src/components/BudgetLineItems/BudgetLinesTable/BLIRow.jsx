import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { useLocation } from "react-router-dom";
import {
    BLILabel,
    canLabel,
    getBudgetLineCreatedDate,
    getProcurementShopFeeTooltip
} from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { scrollToCenter } from "../../../helpers/scrollToCenter.helper";
import { fiscalYearFromDate, formatDateNeeded } from "../../../helpers/utils";
import { useChangeRequestsForTooltip } from "../../../hooks/useChangeRequests.hooks";
import useGetUserFullNameFromId, { useGetLoggedInUserFullName } from "../../../hooks/user.hooks";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    expandedRowBGColor,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";
import Tooltip from "../../UI/USWDS/Tooltip";
import ChangeIcons from "../ChangeIcons";
import { addErrorClassIfNotFound, futureDateErrorClass } from "./BLIRow.helpers";

/**
 * @typedef {Object} BLIRowProps
 * @property {import('../../../types/BudgetLineTypes').BudgetLine} budgetLine - The budget line object.
 * @property {boolean} [isReviewMode] - Whether the user is in review mode.
 * @property {Function} [handleSetBudgetLineForEditing] - The function to set the budget line for editing.
 * @property {Function} [handleDeleteBudgetLine] - The function to delete the budget line.
 * @property {Function} [handleDuplicateBudgetLine] - The function to duplicate the budget line.
 * @property {boolean} [readOnly] - Whether the user is in read only mode.
 * @property {boolean} [isBLIInCurrentWorkflow] - Whether the budget line item is in the current workflow.
 * @property {boolean} [isAgreementAwarded] - Whether the agreement is awarded.
 */

/**
 * @component BLIRow component that represents a single row in the Budget Lines table.
 * @param {BLIRowProps} props - The props for the BLIRow component.
 * @returns {React.ReactElement} The BLIRow component.
 **/
const BLIRow = ({
    budgetLine,
    isReviewMode = false,
    handleSetBudgetLineForEditing = () => {},
    handleDeleteBudgetLine = () => {},
    handleDuplicateBudgetLine = () => {},
    readOnly = false,
    isBLIInCurrentWorkflow = false
}) => {
    const { isExpanded, isRowActive, setIsExpanded, setIsRowActive } = useTableRow();
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const budgetLineTotalPlusFees = (budgetLine?.amount ?? 0) + (budgetLine?.fees ?? 0);
    const isBudgetLineEditable = budgetLine._meta?.isEditable;
    const location = useLocation();
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const isApprovePage = location.pathname.includes("approve");
    const isBLIInReview = budgetLine?.in_review || false;
    const isBudgetLineObe = budgetLine?.is_obe;
    const isApprovePageAndBLIIsNotInPacket = isApprovePage && !isBLIInCurrentWorkflow;
    const lockedMessage = useChangeRequestsForTooltip(budgetLine);

    const changeIcons = (
        <ChangeIcons
            item={budgetLine}
            handleDeleteItem={handleDeleteBudgetLine}
            handleDuplicateItem={handleDuplicateBudgetLine}
            handleSetItemForEditing={() => {
                handleSetBudgetLineForEditing(budgetLine?.id);
                scrollToCenter("budget-line-form");
            }}
            isItemEditable={isBudgetLineEditable}
            duplicateIcon={true}
            lockedMessage={lockedMessage}
        />
    );

    const TableRowData = (
        <>
            <td
                className={`${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {isApprovePageAndBLIIsNotInPacket ? (
                    <Tooltip
                        label="This budget line was not sent for approval"
                        position="right"
                    >
                        <span>{budgetLine?.id}</span>
                    </Tooltip>
                ) : (
                    BLILabel(budgetLine)
                )}
            </td>
            <td
                className={`${futureDateErrorClass(
                    formatDateNeeded(budgetLine?.date_needed),
                    isReviewMode
                )} ${addErrorClassIfNotFound(
                    formatDateNeeded(budgetLine?.date_needed),
                    isReviewMode
                )} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {formatDateNeeded(budgetLine?.date_needed, budgetLine.is_obe)}
            </td>
            <td style={bgExpandedStyles}>{fiscalYearFromDate(budgetLine?.date_needed)}</td>
            <td
                className={`${addErrorClassIfNotFound(budgetLine?.can?.number, isReviewMode)} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {isBudgetLineObe ? "None" : canLabel(budgetLine)}
            </td>
            <td
                className={`${addErrorClassIfNotFound(budgetLine?.amount, isReviewMode)} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                <CurrencyFormat
                    value={budgetLine?.amount || 0}
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
                <Tooltip
                    label={getProcurementShopFeeTooltip(budgetLine)}
                    position="left"
                >
                    <span>
                        <CurrencyFormat
                            value={budgetLine?.fees}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => value}
                            decimalScale={getDecimalScale(budgetLine?.fees || 0)}
                            fixedDecimalScale={true}
                        />
                    </span>
                </Tooltip>
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
                    decimalScale={getDecimalScale(budgetLineTotalPlusFees || 0)}
                    fixedDecimalScale={true}
                    renderText={(value) => value}
                />
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {isRowActive && !isExpanded && !readOnly ? (
                    <div>{changeIcons}</div>
                ) : (
                    <TableTag
                        inReview={isBLIInReview}
                        status={budgetLine?.status}
                        isObe={budgetLine?.is_obe}
                        lockedMessage={lockedMessage}
                    />
                )}
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
                <div className="flex-align-self-end margin-left-auto margin-bottom-1">{!readOnly && changeIcons}</div>
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
            className={isApprovePageAndBLIIsNotInPacket ? "text-gray-50" : ""}
            data-testid={`budget-line-row-${budgetLine?.id}`}
        />
    );
};

export default BLIRow;
