import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import { BLI_STATUS, BLILabel, canLabel, getBudgetLineCreatedDate } from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import {
    fiscalYearFromDate,
    formatDateNeeded,
    totalBudgetLineAmountPlusFees,
    totalBudgetLineFeeAmount
} from "../../../helpers/utils";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { CHANGE_REQUEST_TYPES, KEY_NAMES } from "../../ChangeRequests/ChangeRequests.constants";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";
import { addErrorClassIfNotFound } from "./BLIDiffRow.helpers";

/**
 * BLIRow component that represents a single row in the Budget Lines table.
 * @component
 * @param {Object} props - The props for the BLIRow component.
 * @param {Object} props.budgetLine - The budget line object.
 * @param {boolean} [props.isReviewMode] - Whether the user is in review mode.
 * @param {string} props.changeType - The type of change request.
 * @param {string} [props.statusChangeTo=""] - The status change to.
 *
 * @returns {JSX.Element} The BLIRow component.
 **/
const BLIDiffRow = ({ budgetLine, isReviewMode = false, changeType, statusChangeTo = "" }) => {
    const { isExpanded, setIsExpanded, setIsRowActive } = useTableRow();
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const feeTotal = totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine?.proc_shop_fee_percentage);
    const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(budgetLine?.amount, feeTotal);
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const changeRequestStatus = statusChangeTo === "EXECUTING" ? BLI_STATUS.EXECUTING : BLI_STATUS.PLANNED;
    const isBLIInReview = budgetLine?.in_review || false;
    const budgetChangeType = changeType === CHANGE_REQUEST_TYPES.BUDGET;
    const isStatusChange = changeType === CHANGE_REQUEST_TYPES.STATUS;

    /**
     * Get budget change requests
     * @param {import("../../ChangeRequests/ChangeRequestsList/ChangeRequests").ChangeRequest[]} changeRequests - The change requests
     * @returns {string[]} The budget change requests
     */
    const getBudgetChangeRequests = (changeRequests) => {
        return changeRequests
            .filter((changeRequest) => changeRequest.has_budget_change)
            .flatMap((changeRequest) => Object.keys(changeRequest.requested_change_data));
    };
    /**
     * Get status change requests
     * @param {import("../../ChangeRequests/ChangeRequestsList/ChangeRequests").ChangeRequest[]} changeRequests - The change requests
     * @param {string} status - The status
     */
    const getStatusChangeRequests = (changeRequests, status) => {
        return changeRequests
            .filter(
                (changeRequest) =>
                    changeRequest.has_status_change && changeRequest.requested_change_data.status === status
            )
            .flatMap((changeRequest) => Object.keys(changeRequest.requested_change_data));
    };

    let changeRequestTypes = [];
    if (budgetChangeType) {
        changeRequestTypes = isBLIInReview ? getBudgetChangeRequests(budgetLine?.change_requests_in_review) : [];
    } else if (isStatusChange) {
        changeRequestTypes = isBLIInReview
            ? getStatusChangeRequests(budgetLine?.change_requests_in_review, changeRequestStatus)
            : [];
    }

    const TableRowData = (
        <>
            <th
                scope="row"
                className={`${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {BLILabel(budgetLine)}
            </th>
            <td
                className={`${addErrorClassIfNotFound(
                    formatDateNeeded(budgetLine?.date_needed),
                    isReviewMode
                )} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {formatDateNeeded(budgetLine?.date_needed)}
                {changeRequestTypes.includes(KEY_NAMES.DATE_NEEDED) && <span>🔴</span>}
            </td>
            <td
                className={`${addErrorClassIfNotFound(
                    fiscalYearFromDate(budgetLine?.date_needed),
                    isReviewMode
                )} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {fiscalYearFromDate(budgetLine?.date_needed)}
            </td>
            <td
                className={`${addErrorClassIfNotFound(budgetLine?.can?.number, isReviewMode)} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {canLabel(budgetLine)}
                {changeRequestTypes.includes(KEY_NAMES.CAN) && <span>🔴</span>}
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
                    decimalScale={getDecimalScale(budgetLine?.amount)}
                    fixedDecimalScale={true}
                    renderText={(value) => value}
                />
                {changeRequestTypes.includes(KEY_NAMES.AMOUNT) && <span>🔴</span>}
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
                <TableTag status={budgetLine?.status} />
                {changeRequestTypes.includes(KEY_NAMES.STATUS) && <span>🔴</span>}
            </td>
        </>
    );

    const ExpandedData = (
        <td
            colSpan={9}
            className="border-top-none"
            style={{ backgroundColor: "var(--neutral-lightest)" }}
        >
            <div className="display-flex padding-right-9">
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Created By</dt>
                    <dd
                        id={`created-by-name-${budgetLine?.id}`}
                        className="margin-0"
                    >
                        {budgetLineCreatorName}
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
                    <dt className="margin-0 text-base-dark">Notes</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "400px" }}
                    >
                        {budgetLine?.comments ? budgetLine.comments : "No notes added."}
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
        />
    );
};

BLIDiffRow.propTypes = {
    budgetLine: PropTypes.object.isRequired,
    isReviewMode: PropTypes.bool,
    changeType: PropTypes.string.isRequired,
    statusChangeTo: PropTypes.string
};

export default BLIDiffRow;
