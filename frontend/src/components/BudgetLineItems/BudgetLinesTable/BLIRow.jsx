import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation } from "react-router-dom";
import {
    BLILabel,
    canLabel,
    getBudgetLineCreatedDate,
    getClinDisplayValue,
    getNetAmount,
    getProcurementShopFeeTooltip,
    getProcurementShopLabel
} from "../../../helpers/budgetLines.helpers";
import { useGetVersionQuery } from "../../../api/opsAPI";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import { NO_DATA } from "../../../constants";
import { scrollToCenter } from "../../../helpers/scrollToCenter.helper";
import { fiscalYearFromDate, formatDateNeeded } from "../../../helpers/utils";
import { useChangeRequestsForTooltip } from "../../../hooks/useChangeRequests.hooks";
import useGetUserFullNameFromId, { useGetLoggedInUserFullName } from "../../../hooks/user.hooks";
import TableRowExpandable from "../../UI/TableRowExpandable";
import { expandedRowBGColor } from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";
import Tooltip from "../../UI/USWDS/Tooltip";
import deObligationIcon from "../../../images/de-obligation-icon.svg";
import ChangeIcons from "../ChangeIcons";
import { addErrorClassIfNotFound, futureDateErrorClass, isDateOutsidePopRange } from "./BLIRow.helpers";

/**
 * @typedef {Object} BLIRowProps
 * @property {import('../../../types/BudgetLineTypes').BudgetLine} budgetLine - The budget line object.
 * @property {boolean} [isReviewMode] - Whether the user is in review mode.
 * @property {Function} [handleSetBudgetLineForEditing] - The function to set the budget line for editing.
 * @property {Function} [handleDeleteBudgetLine] - The function to delete the budget line.
 * @property {Function} [handleDuplicateBudgetLine] - The function to duplicate the budget line.
 * @property {boolean} [readOnly] - Whether the user is in read only mode.
 * @property {boolean} [isBLIInCurrentWorkflow] - Whether the budget line item is in the current workflow.
 * @property {boolean} [isGrant] - Whether this is a grant budget line (omits Fee/Total cells).
 * @property {boolean} [showClinColumn] - Whether to show the CLIN cell (awarded contract agreements only).
 * @property {boolean} [tracksContractModifications] - Whether edits on this agreement require a
 *   contract modification (OPS-3072): awarded, with the capability on. An Obligated line can only
 *   be edited to de-obligate funds, and only when this is true (OPS-6488).
 * @property {Function} [handleDeObligateBudgetLine] - Starts a de-obligation on this (Obligated) line.
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
    isBLIInCurrentWorkflow = false,
    isGrant = false,
    showClinColumn = false,
    tracksContractModifications = false,
    handleDeObligateBudgetLine = () => {}
}) => {
    const { isExpanded, isRowActive, setIsExpanded, setIsRowActive } = useTableRow();
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const netAmount = getNetAmount(budgetLine);
    const budgetLineTotalPlusFees = (netAmount ?? 0) + (budgetLine?.fees ?? 0);
    const isBudgetLineEditable = budgetLine._meta?.isEditable;
    const isBudgetLineDeletable = budgetLine._meta?.isDeletable ?? isBudgetLineEditable;
    const location = useLocation();
    const isApprovePage = location.pathname.includes("approve");
    const isBLIInReview = budgetLine?.in_review || false;
    const isBudgetLineObe = budgetLine?.is_obe;
    const isApprovePageAndBLIIsNotInPacket = isApprovePage && !isBLIInCurrentWorkflow;
    const isOutsidePopRange = isDateOutsidePopRange(budgetLine);
    const lockedMessage = useChangeRequestsForTooltip(budgetLine);
    const { data: versionData } = useGetVersionQuery();
    const allowPastObligateByDates = versionData?.allow_past_obligate_by_dates ?? false;
    // OPS-6488: the only edit an Obligated line on a tracked, awarded agreement can have is a
    // de-obligation request. Independent of isBudgetLineEditable, which stays false for
    // OBLIGATED (EDITABLE_STATUSES excludes it) -- this is a narrower, separate affordance.
    const canDeObligate = !readOnly && tracksContractModifications && budgetLine?.status === "OBLIGATED";
    const pendingDeObligationAmount = budgetLine?.requested_de_obligation_amount;
    const hasPendingDeObligation = pendingDeObligationAmount != null;

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
            isItemDeletable={isBudgetLineDeletable}
            duplicateIcon={true}
            lockedMessage={lockedMessage}
        />
    );

    const deObligateButton = (
        <Tooltip
            position="top"
            label="De-obligate funding"
        >
            <button
                type="button"
                id={`de-obligate-${budgetLine?.id}`}
                title="De-obligate funding"
                aria-label="De-obligate funding"
                data-cy="de-obligate-row"
                data-testid="de-obligate-row"
                onClick={() => {
                    handleDeObligateBudgetLine(budgetLine?.id);
                }}
            >
                <FontAwesomeIcon
                    title="De-obligate funding"
                    icon={faPen}
                    className="text-primary height-2 width-2 margin-right-1 cursor-pointer"
                    aria-hidden="true"
                />
            </button>
        </Tooltip>
    );

    const TableRowData = (
        <>
            <td>
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
            {showClinColumn && !isGrant && <td>{getClinDisplayValue(budgetLine)}</td>}
            <td
                className={`${futureDateErrorClass(
                    formatDateNeeded(budgetLine?.date_needed),
                    isReviewMode,
                    allowPastObligateByDates
                )} ${addErrorClassIfNotFound(formatDateNeeded(budgetLine?.date_needed), isReviewMode)} ${
                    isReviewMode && isOutsidePopRange ? "table-item-error" : ""
                }`}
            >
                {isReviewMode && isOutsidePopRange ? (
                    <Tooltip
                        label="Obligate By date is outside the agreement’s Period of Performance"
                        position="right"
                    >
                        <span>{formatDateNeeded(budgetLine?.date_needed, budgetLine.is_obe)}</span>
                    </Tooltip>
                ) : (
                    formatDateNeeded(budgetLine?.date_needed, budgetLine.is_obe)
                )}
            </td>
            <td>{fiscalYearFromDate(budgetLine?.date_needed)}</td>
            <td className={addErrorClassIfNotFound(budgetLine?.can?.number, isReviewMode)}>
                {isBudgetLineObe ? "None" : canLabel(budgetLine)}
            </td>
            <td className={isReviewMode && budgetLine?.amount == null ? "table-item-error" : ""}>
                {budgetLine?.amount != null ? formatCurrency(netAmount) : NO_DATA}
                {hasPendingDeObligation && (
                    <Tooltip
                        position="right"
                        label={`Original obligated amount was ${formatCurrency(
                            budgetLine.amount
                        )} with ${formatCurrency(pendingDeObligationAmount)} de-obligated in a modification`}
                    >
                        <img
                            src={deObligationIcon}
                            width={16}
                            height={16}
                            alt="Pending de-obligation"
                            className="margin-left-1 text-middle"
                            data-testid="pending-de-obligation-icon"
                        />
                    </Tooltip>
                )}
            </td>
            {/* Grants have no procurement shop, so no Fee or Total columns. */}
            {!isGrant && (
                <>
                    <td>
                        <Tooltip
                            label={getProcurementShopFeeTooltip(budgetLine)}
                            position="left"
                        >
                            <span>{formatCurrency(budgetLine?.fees)}</span>
                        </Tooltip>
                    </td>
                    <td>{formatCurrency(budgetLineTotalPlusFees)}</td>
                </>
            )}
            <td>
                {isRowActive && !isExpanded && !readOnly ? (
                    <div>{canDeObligate ? deObligateButton : changeIcons}</div>
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

    const createdByDetails = (
        <>
            <dt className="margin-0 text-base-dark">Created By</dt>
            <dd className="margin-0">
                <div id={`created-by-name-${budgetLine?.id}`}>
                    {/* NOTE: Show logged in user name when creating BLIs */}
                    {budgetLine?.created_by ? budgetLineCreatorName : loggedInUserFullName}
                </div>
                <div className="margin-top-2 display-flex flex-align-center text-base-dark text-normal text-no-wrap">
                    <FontAwesomeIcon
                        icon={faClock}
                        className="height-2 width-2 margin-right-1"
                        aria-hidden={true}
                    />
                    {getBudgetLineCreatedDate(budgetLine)}
                </div>
            </dd>
        </>
    );

    // A pending de-obligation adds a second row of details. The modification number and date stay
    // TBD until a Division Director approves the modification and it's created (OPS-6489).
    const DeObligationExpandedData = (
        <td
            colSpan={isGrant ? 7 : showClinColumn ? 10 : 9}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="grid-row grid-gap-4">
                <dl className="grid-col-2 margin-top-0 font-12px">{createdByDetails}</dl>
                <dl className="grid-col-5 margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd className="margin-0 wrap-text">{budgetLine?.line_description}</dd>
                </dl>
                <dl className="grid-col-2 margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    <dd className="margin-0">{getProcurementShopLabel(budgetLine)}</dd>
                </dl>
                <dl className="grid-col-3 margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Original Obligated Amount</dt>
                    <dd className="margin-0">{formatCurrency(budgetLine.amount)}</dd>
                </dl>
            </div>
            <div className="grid-row grid-gap-4 margin-top-1">
                <dl className="grid-col-2 grid-offset-5 margin-y-0 font-12px">
                    <dt className="margin-0 text-base-dark">Modification #</dt>
                    <dd className="margin-0">TBD</dd>
                </dl>
                <dl className="grid-col-2 margin-y-0 font-12px">
                    <dt className="margin-0 text-base-dark">Modification Date</dt>
                    <dd className="margin-0">TBD</dd>
                </dl>
                <dl className="grid-col-2 margin-y-0 font-12px">
                    <dt className="margin-0 text-base-dark">De-obligated Amount</dt>
                    <dd className="margin-0">{`-${formatCurrency(pendingDeObligationAmount)}`}</dd>
                </dl>
                <div className="grid-col-1 display-flex flex-justify-end flex-align-end margin-bottom-1">
                    {!readOnly && (canDeObligate ? deObligateButton : changeIcons)}
                </div>
            </div>
        </td>
    );

    const ExpandedData = (
        <td
            colSpan={isGrant ? 7 : showClinColumn ? 10 : 9}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="grid-row grid-gap-4">
                <dl className="grid-col-auto margin-top-0 font-12px">{createdByDetails}</dl>
                <dl className="grid-col-4 margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd className="margin-0 wrap-text">{budgetLine?.line_description}</dd>
                </dl>
                {/* Grants have no procurement shop. */}
                {!isGrant && (
                    <dl className="grid-col-auto margin-top-0 font-12px">
                        <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                        <dd className="margin-0">{getProcurementShopLabel(budgetLine)}</dd>
                    </dl>
                )}
                <div className="grid-col display-flex flex-justify-end flex-align-end margin-bottom-1">
                    {!readOnly && (canDeObligate ? deObligateButton : changeIcons)}
                </div>
            </div>
        </td>
    );
    return (
        <TableRowExpandable
            tableRowData={TableRowData}
            expandedData={hasPendingDeObligation ? DeObligationExpandedData : ExpandedData}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            setIsRowActive={setIsRowActive}
            className={isApprovePageAndBLIIsNotInPacket ? "text-gray-50" : ""}
            data-testid={`budget-line-row-${budgetLine?.id}`}
        />
    );
};

export default BLIRow;
