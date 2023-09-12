import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import CurrencyFormat from "react-currency-format";
import TableTag from "../TableTag";
import ChangeIcons from "../ChangeIcons";
import TableRowExpandable from "../TableRowExpandable";
import {
    formatDateNeeded,
    formatDateToMonthDayYear,
    displayFeePercent,
    totalBudgetLineFeeAmount,
    totalBudgetLineAmountPlusFees,
} from "../../../helpers/utils";
import useGetUserFullNameFromId from "../../../helpers/user-hooks";
import { useIsBudgetLineEditableByStatus, useIsBudgetLineCreator } from "../../../helpers/budget-line-hooks";
import { useIsUserAllowedToEditAgreement } from "../../../helpers/agreement-hooks";

/**
 * BLIRow component that represents a single row in the Budget Lines table.
 * @param {Object} props - The props for the BLIRow component.
 * @param {Object} props.bl - The budget line object.
 * @param {boolean} [props.canUserEditBudgetLines] - Whether the user can edit budget lines.
 * @param {Function} [props.handleSetBudgetLineForEditing] - The function to set the budget line for editing.
 * @param {Function} [props.handleDeleteBudgetLine] - The function to delete the budget line.
 * @param {boolean} [props.readOnly] - Whether the user is in read only mode.
 * @returns {React.JSX.Element} The BLIRow component.
 **/
const AllBLIRow = ({
    bl: budgetLine,
    handleSetBudgetLineForEditing = () => {},
    handleDeleteBudgetLine = () => {},
    readOnly = false,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isRowActive, setIsRowActive] = React.useState(false);
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const isUserBudgetLineCreator = useIsBudgetLineCreator(budgetLine);
    const isBudgetLineEditableFromStatus = useIsBudgetLineEditableByStatus(budgetLine);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(budgetLine?.agreement_id);
    const isBudgetLineEditable = (canUserEditAgreement || isUserBudgetLineCreator) && isBudgetLineEditableFromStatus;

    // styles for the table row
    const removeBorderBottomIfExpanded = isExpanded ? "border-bottom-none" : "";
    const changeBgColorIfExpanded = { backgroundColor: isExpanded && "var(--neutral-lightest)" };

    const TableRowData = ({ bl }) => (
        <>
            <th scope="row" className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                {bl.line_description}
            </th>
            <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                {bl.agreement_name}
            </td>
            <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                {formatDateNeeded(bl.date_needed)}
            </td>
            <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                {bl.fiscal_year}
            </td>
            <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                {bl.can_number}
            </td>
            <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                {totalBudgetLineAmountPlusFees(bl?.amount, bl?.procShopFee) === 0 ? (
                    0
                ) : (
                    <CurrencyFormat
                        value={totalBudgetLineAmountPlusFees(bl?.amount, bl?.procShopFee)}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        decimalScale={2}
                        fixedDecimalScale={true}
                        renderText={(value) => value}
                    />
                )}
            </td>
            <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                {isRowActive && !isExpanded && !readOnly && isBudgetLineEditable ? (
                    <div>
                        <ChangeIcons
                            budgetLine={budgetLine}
                            handleDeleteBudgetLine={handleDeleteBudgetLine}
                            handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                            isBudgetLineEditable={isBudgetLineEditable}
                            noDuplicateIcon={true}
                        />
                    </div>
                ) : (
                    <TableTag status={budgetLine.status} />
                )}
            </td>
        </>
    );

    const ExpandedData = () => (
        <>
            <td colSpan={9} className="border-top-none" style={{ backgroundColor: "var(--neutral-lightest)" }}>
                <div className="display-flex padding-right-9">
                    <dl className="font-12px">
                        <dt className="margin-0 text-base-dark">Created By</dt>
                        <dd id={`created-by-name-${budgetLine?.id}`} className="margin-0">
                            {budgetLineCreatorName}
                        </dd>
                        <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                            <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1" />
                            {formatDateToMonthDayYear(budgetLine?.created_on)}
                        </dt>
                    </dl>
                    <dl className="font-12px" style={{ marginLeft: "9.0625rem" }}>
                        <dt className="margin-0 text-base-dark">Notes</dt>
                        <dd className="margin-0" style={{ maxWidth: "25rem" }}>
                            {budgetLine?.comments ? budgetLine.comments : "No notes added."}
                        </dd>
                    </dl>
                    <div className="font-12px" style={{ marginLeft: "15rem" }}>
                        <dl className="margin-bottom-0">
                            <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                            <dd className="margin-0" style={{ maxWidth: "25rem" }}>
                                {`${budgetLine?.procShopCode}-Fee Rate: ${displayFeePercent(budgetLine?.procShopFee)}`}
                            </dd>
                        </dl>
                        <div className="font-12px display-flex margin-top-1">
                            <dl className="margin-0">
                                <dt className="margin-0 text-base-dark">SubTotal</dt>
                                <dd className="margin-0">
                                    <CurrencyFormat
                                        value={budgetLine?.amount}
                                        displayType={"text"}
                                        thousandSeparator={true}
                                        prefix={"$"}
                                        decimalScale={2}
                                        fixedDecimalScale={true}
                                        renderText={(value) => value}
                                    />
                                </dd>
                            </dl>
                            <dl className=" margin-0 margin-left-2">
                                <dt className="margin-0 text-base-dark">Fees</dt>
                                <dd className="margin-0">
                                    {totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine?.procShopFee) === 0 ? (
                                        0
                                    ) : (
                                        <CurrencyFormat
                                            value={totalBudgetLineFeeAmount(
                                                budgetLine?.amount,
                                                budgetLine?.procShopFee
                                            )}
                                            displayType={"text"}
                                            thousandSeparator={true}
                                            prefix={"$"}
                                            decimalScale={2}
                                            fixedDecimalScale={true}
                                            renderText={(value) => value}
                                        />
                                    )}
                                </dd>
                            </dl>
                        </div>
                    </div>
                    <div className="flex-align-self-end margin-left-auto margin-bottom-1">
                        {!readOnly && (
                            <ChangeIcons
                                budgetLine={budgetLine}
                                handleDeleteBudgetLine={handleDeleteBudgetLine}
                                handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                                isBudgetLineEditable={isBudgetLineEditable}
                                noDuplicateIcon={true}
                            />
                        )}
                    </div>
                </div>
            </td>
        </>
    );
    return (
        <TableRowExpandable
            tableRowData={<TableRowData bl={budgetLine} />}
            expandedData={<ExpandedData />}
            isExpanded={isExpanded}
            isRowActive={isRowActive}
            setIsExpanded={setIsExpanded}
            setIsRowActive={setIsRowActive}
        />
    );
};

AllBLIRow.propTypes = {
    bl: PropTypes.object.isRequired,
    canUserEditBudgetLines: PropTypes.bool,
    isReviewMode: PropTypes.bool,
    handleSetBudgetLineForEditing: PropTypes.func,
    handleDeleteBudgetLine: PropTypes.func,
    handleDuplicateBudgetLine: PropTypes.func,
    readOnly: PropTypes.bool,
};

export default AllBLIRow;
