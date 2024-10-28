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
    removeBorderBottomIfExpanded,
    expandedRowBGColor
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";
import { addDiffClass, doesDateNeededChangeFY, getChangeRequestTypes } from "./BLIDiffRow.helpers";

/**
 * @typedef {import('../../../components/BudgetLineItems/BudgetLineTypes').BudgetLine} BudgetLine
 */

/**
 * @component BLIRow component that represents a single row in the Budget Lines table.
 * @param {Object} props - The props for the BLIRow component.
 * @param {BudgetLine} props.budgetLine - The budget line object.
 * @param {string} props.changeType - The type of change request.
 * @param {string} [props.statusChangeTo=""] - The status change to.
 *
 * @returns {JSX.Element} The BLIRow component.
 **/
const BLIDiffRow = ({ budgetLine, changeType, statusChangeTo = "" }) => {
    const { isExpanded, setIsExpanded, setIsRowActive } = useTableRow();
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const feeTotal = totalBudgetLineFeeAmount(budgetLine?.amount || 0, budgetLine?.proc_shop_fee_percentage);
    const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(budgetLine?.amount || 0, feeTotal);
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const changeRequestStatus = statusChangeTo === "EXECUTING" ? BLI_STATUS.EXECUTING : BLI_STATUS.PLANNED;
    const isBLIInReview = budgetLine?.in_review || false;
    const isBudgetChange = changeType === CHANGE_REQUEST_TYPES.BUDGET;
    const isStatusChange = changeType === CHANGE_REQUEST_TYPES.STATUS;
    const changeRequestTypes = getChangeRequestTypes(
        isBudgetChange,
        isBLIInReview,
        budgetLine,
        isStatusChange,
        changeRequestStatus
    );

    if (!budgetLine) {
        return (
            <tr>
                <td colSpan={9}>Error: Budget line is not present</td>
            </tr>
        );
    }

    const TableRowData = (
        <>
            <th
                scope="row"
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {BLILabel(budgetLine)}
            </th>
            <td
                className={`${addDiffClass(
                    changeRequestTypes.includes(KEY_NAMES.DATE_NEEDED)
                )} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {formatDateNeeded(budgetLine?.date_needed || "")}
            </td>
            <td
                className={`${addDiffClass(doesDateNeededChangeFY(budgetLine))} borderExpandedStyles`}
                style={bgExpandedStyles}
            >
                {fiscalYearFromDate(budgetLine?.date_needed || "")}
            </td>
            <td
                className={`${addDiffClass(changeRequestTypes.includes(KEY_NAMES.CAN))} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {canLabel(budgetLine)}
            </td>
            <td
                className={`${addDiffClass(changeRequestTypes.includes(KEY_NAMES.AMOUNT))} ${borderExpandedStyles}`}
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
                className={`${addDiffClass(changeRequestTypes.includes(KEY_NAMES.AMOUNT))} ${borderExpandedStyles}`}
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
                className={`${addDiffClass(changeRequestTypes.includes(KEY_NAMES.AMOUNT))} ${borderExpandedStyles}`}
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
                className={`${addDiffClass(changeRequestTypes.includes(KEY_NAMES.STATUS))} ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                <TableTag status={budgetLine?.status} />
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
    changeType: PropTypes.string.isRequired,
    statusChangeTo: PropTypes.string
};

export default BLIDiffRow;
