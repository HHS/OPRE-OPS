import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import {
    formatDateToMonthDayYear,
    totalBudgetLineAmountPlusFees,
    totalBudgetLineFeeAmount
} from "../../../helpers/utils";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    expandedRowBGColor,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";

/**
 * @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 */

/**
 * @typedef {Object} CANBudgetLineTableRowProps
 * @property {number} blId
 * @property {string} agreementName - TODO
 * @property {string} obligateDate
 * @property {number | string } fiscalYear
 * @property {number} amount
 * @property {number} fee
 * @property {number} percentOfCAN - TODO
 * @property {string} status
 * @property {boolean} inReview
 * @property {number} creatorId
 * @property {string} creationDate
 * @property {string} procShopCode - TODO
 * @property {number} procShopFeePercentage
 */

/**
 * @component - The CAN Budget Line Table.
 * @param {CANBudgetLineTableRowProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetLineTableRow = ({
    blId,
    agreementName,
    obligateDate,
    fiscalYear,
    amount,
    fee,
    percentOfCAN,
    status,
    inReview,
    creatorId,
    creationDate,
    procShopCode,
    procShopFeePercentage
}) => {
    const { isExpanded, setIsRowActive, setIsExpanded } = useTableRow();
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const budgetLineCreatorName = useGetUserFullNameFromId(creatorId);
    const feeTotal = totalBudgetLineFeeAmount(amount, fee);
    const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(amount, feeTotal);
    const displayCreatedDate = formatDateToMonthDayYear(creationDate);

    const TableRowData = (
        <>
            <th
                scope="row"
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {blId}
            </th>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {agreementName}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {obligateDate}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {fiscalYear}
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
                    decimalScale={2}
                    fixedDecimalScale={true}
                />
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {percentOfCAN}%
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                <TableTag
                    status={status}
                    inReview={inReview}
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
                        id={`created-by-name-${blId}`}
                        className="margin-0"
                    >
                        {budgetLineCreatorName}
                    </dd>
                    <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                        <FontAwesomeIcon
                            icon={faClock}
                            className="height-2 width-2 margin-right-1"
                        />
                        {displayCreatedDate}
                    </dt>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "9.0625rem" }}
                >
                    <dt className="margin-0 text-base-dark">Notes</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "25rem" }}
                    >
                        No Notes added
                    </dd>
                </dl>
                <div
                    className="font-12px"
                    style={{ marginLeft: "15rem" }}
                >
                    <dl className="margin-bottom-0">
                        <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                        <dd
                            className="margin-0"
                            style={{ maxWidth: "25rem" }}
                        >
                            {`${procShopCode}-Fee Rate: ${procShopFeePercentage * 100}%`}
                        </dd>
                    </dl>
                    <div className="font-12px display-flex margin-top-1">
                        <dl className="margin-0">
                            <dt className="margin-0 text-base-dark">SubTotal</dt>
                            <dd className="margin-0">
                                <CurrencyFormat
                                    value={amount}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                    decimalScale={2}
                                    fixedDecimalScale={true}
                                />
                            </dd>
                        </dl>
                        <dl className=" margin-0 margin-left-2">
                            <dt className="margin-0 text-base-dark">Fees</dt>
                            <dd className="margin-0">
                                <CurrencyFormat
                                    value={feeTotal}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                    decimalScale={2}
                                    fixedDecimalScale={true}
                                />
                            </dd>
                        </dl>
                    </div>
                </div>
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

export default CANBudgetLineTableRow;
