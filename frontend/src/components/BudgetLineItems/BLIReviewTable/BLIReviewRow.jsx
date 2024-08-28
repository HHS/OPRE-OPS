import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import { getBudgetLineCreatedDate, isBudgetLineEditableByStatus } from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import {
    fiscalYearFromDate,
    formatDateNeeded,
    totalBudgetLineAmountPlusFees,
    totalBudgetLineFeeAmount
} from "../../../helpers/utils";
import { useIsUserAllowedToEditAgreement } from "../../../hooks/agreement.hooks";
import { useIsBudgetLineCreator } from "../../../hooks/budget-line.hooks";
import useGetUserFullNameFromId, { useGetLoggedInUserFullName } from "../../../hooks/user.hooks";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";
import { addErrorClassIfNotFound, futureDateErrorClass } from "../BudgetLinesTable/BLIRow.helpers";
import ChangeIcons from "../ChangeIcons";

/**
 * BLIRow component that represents a single row in the Budget Lines table.
 * @component
 * @param {Object} props - The props for the BLIRow component.
 * @param {Object} props.budgetLine - The budget line object.
 * @param {boolean} [props.isReviewMode] - Whether the user is in review mode.
 * @param {Function} [props.handleSetBudgetLineForEditing] - The function to set the budget line for editing.
 * @param {Function} [props.handleDeleteBudgetLine] - The function to delete the budget line.
 * @param {Function} [props.handleDuplicateBudgetLine] - The function to duplicate the budget line.
 * @param {boolean} [props.readOnly] - Whether the user is in read only mode.
 * @param {Function} [props.setSelectedBLIs] - The function to set the selected budget line items.
 * @returns {JSX.Element} The BLIRow component.
 **/
const BLIReviewRow = ({
    budgetLine,
    isReviewMode = false,
    handleSetBudgetLineForEditing = () => {},
    handleDeleteBudgetLine = () => {},
    handleDuplicateBudgetLine = () => {},
    readOnly = false,
    setSelectedBLIs
}) => {
    const { isExpanded, isRowActive, setIsExpanded, setIsRowActive } = useTableRow();
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const feeTotal = totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine?.proc_shop_fee_percentage);
    const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(budgetLine?.amount, feeTotal);
    const isBudgetLineEditableFromStatus = isBudgetLineEditableByStatus(budgetLine);
    const isUserBudgetLineCreator = useIsBudgetLineCreator(budgetLine);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(budgetLine?.agreement_id);
    const isBudgetLineEditable = (canUserEditAgreement || isUserBudgetLineCreator) && isBudgetLineEditableFromStatus;

    const changeIcons = (
        <ChangeIcons
            item={budgetLine}
            handleDeleteItem={handleDeleteBudgetLine}
            handleDuplicateItem={handleDuplicateBudgetLine}
            handleSetItemForEditing={handleSetBudgetLineForEditing}
            isItemEditable={isBudgetLineEditable}
            duplicateIcon={true}
        />
    );
    // styles for the table row
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    let toolTipMsg = "";
    if (!budgetLine?.actionable) {
        toolTipMsg = "This budget line is not selectable";
    }

    const TableRowData = (
        <>
            <th
                scope="row"
                className={`${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                <input
                    className="usa-checkbox__input"
                    id={budgetLine?.id}
                    type="checkbox"
                    name="budget-line-checkbox"
                    value={budgetLine?.id}
                    onChange={(e) => {
                        setSelectedBLIs(e.target.value);
                    }}
                    disabled={!budgetLine.actionable}
                    checked={budgetLine?.selected}
                />
                <label
                    className="usa-checkbox__label usa-tool-tip"
                    htmlFor={budgetLine?.id}
                    data-position="top"
                    title={toolTipMsg}
                >
                    {budgetLine?.id}
                </label>
            </th>
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
                {formatDateNeeded(budgetLine?.date_needed)}
            </td>
            <td
                className={`${
                    (addErrorClassIfNotFound(fiscalYearFromDate(budgetLine?.date_needed)), isReviewMode)
                } ${borderExpandedStyles}`}
                style={bgExpandedStyles}
            >
                {fiscalYearFromDate(budgetLine?.date_needed)}
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
                    value={budgetLine?.amount || 0}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(budgetLine?.amount)}
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
                {isRowActive && !isExpanded && !readOnly ? (
                    <div>{changeIcons}</div>
                ) : (
                    <TableTag
                        status={budgetLine?.status}
                        inReview={budgetLine?.in_review}
                    />
                )}
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
                    <dt className="margin-0 text-base-dark">Notes</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "400px" }}
                    >
                        {budgetLine?.comments ? budgetLine.comments : "No notes added."}
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
            className={`${!budgetLine.actionable ? "text-gray-50" : ""}`}
        />
    );
};

BLIReviewRow.propTypes = {
    budgetLine: PropTypes.object.isRequired,
    canUserEditBudgetLines: PropTypes.bool,
    isReviewMode: PropTypes.bool,
    handleSetBudgetLineForEditing: PropTypes.func,
    handleDeleteBudgetLine: PropTypes.func,
    handleDuplicateBudgetLine: PropTypes.func,
    setSelectedBLIs: PropTypes.func,
    readOnly: PropTypes.bool
};

export default BLIReviewRow;
