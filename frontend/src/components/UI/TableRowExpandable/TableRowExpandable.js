import React from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import CurrencyFormat from "react-currency-format";
import TableTag from "../BudgetLinesTable/TableTag";
import ChangeIcons from "../ChangeIcons";
import { loggedInName, fiscalYearFromDate, formatDateNeeded, formatDateToMonthDayYear } from "../../../helpers/utils";

const TableRow = ({
    bl,
    canUserEditBudgetLines = false,
    isReviewMode = false,
    handleSetBudgetLineForEditing = () => {},
    handleDeleteBudgetLine = () => {},
    handleDuplicateBudgetLine = () => {},
    readOnly = false,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isRowActive, setIsRowActive] = React.useState(false);
    let loggedInUser = useSelector((state) => loggedInName(state.auth?.activeUser));
    const loggedInUserId = useSelector((state) => state?.auth?.activeUser?.id);

    let feeTotal = bl?.amount * bl?.psc_fee_amount;
    let total = bl?.amount + feeTotal;
    const isBudgetLineDraft = bl?.status === "DRAFT";
    const isBudgetLineInReview = bl?.status === "UNDER_REVIEW";
    const isBudgetLinePlanned = bl?.status === "PLANNED";
    const isUserBudgetLineCreator = bl?.created_by === loggedInUserId;
    const isBudgetLineEditable =
        (canUserEditBudgetLines || isUserBudgetLineCreator) &&
        (isBudgetLineDraft || isBudgetLineInReview || isBudgetLinePlanned);

    const handleExpandRow = () => {
        setIsExpanded(!isExpanded);
        setIsRowActive(true);
    };

    // styles for the table row
    const removeBorderBottomIfExpanded = isExpanded ? "border-bottom-none" : undefined;
    const changeBgColorIfExpanded = { backgroundColor: isRowActive && "#F0F0F0" };

    const addErrorClassIfNotFound = (item) => {
        if (isReviewMode && !item) {
            return "table-item-error";
        } else {
            return undefined;
        }
    };
    // error class for need_by_date to be in the future
    const futureDateErrorClass = (item) => {
        const today = new Date().valueOf();
        const dateNeeded = new Date(item).valueOf();

        if (isReviewMode && dateNeeded < today) {
            return "table-item-error";
        } else {
            return undefined;
        }
    };

    return (
        <React.Fragment key={bl?.id}>
            <tr onMouseEnter={() => setIsRowActive(true)} onMouseLeave={() => !isExpanded && setIsRowActive(false)}>
                <th
                    scope="row"
                    className={`${addErrorClassIfNotFound(bl?.line_description)} ${removeBorderBottomIfExpanded}`}
                    style={changeBgColorIfExpanded}
                >
                    {bl?.line_description}
                </th>
                <td
                    className={`${futureDateErrorClass(formatDateNeeded(bl?.date_needed))} ${addErrorClassIfNotFound(
                        formatDateNeeded(bl?.date_needed)
                    )} ${removeBorderBottomIfExpanded}`}
                    style={changeBgColorIfExpanded}
                >
                    {formatDateNeeded(bl?.date_needed)}
                </td>
                <td
                    className={`${addErrorClassIfNotFound(
                        fiscalYearFromDate(bl?.date_needed)
                    )} ${removeBorderBottomIfExpanded}`}
                    style={changeBgColorIfExpanded}
                >
                    {fiscalYearFromDate(bl?.date_needed)}
                </td>
                <td
                    className={`${addErrorClassIfNotFound(bl?.can?.number)} ${removeBorderBottomIfExpanded}`}
                    style={changeBgColorIfExpanded}
                >
                    {bl?.can?.number}
                </td>
                <td
                    className={`${addErrorClassIfNotFound(bl?.amount)} ${removeBorderBottomIfExpanded}`}
                    style={changeBgColorIfExpanded}
                >
                    <CurrencyFormat
                        value={bl?.amount || 0}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        decimalScale={2}
                        fixedDecimalScale={true}
                        renderText={(value) => value}
                    />
                </td>
                <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    {feeTotal === 0 ? (
                        0
                    ) : (
                        <CurrencyFormat
                            value={feeTotal}
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
                    {total === 0 ? (
                        0
                    ) : (
                        <CurrencyFormat
                            value={total}
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
                    {isRowActive && !isExpanded && !readOnly ? (
                        <div>
                            <ChangeIcons
                                budgetLine={bl}
                                handleDeleteBudgetLine={handleDeleteBudgetLine}
                                handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                                handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                                isBudgetLineEditable={isBudgetLineEditable}
                            />
                        </div>
                    ) : (
                        <TableTag status={bl.status} />
                    )}
                </td>
                <td className={removeBorderBottomIfExpanded} style={changeBgColorIfExpanded}>
                    <FontAwesomeIcon
                        id={`expand-${bl?.id}`}
                        data-cy="expand-row"
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        className="height-2 width-2 padding-right-1 hover: cursor-pointer"
                        onClick={() => handleExpandRow()}
                    />
                </td>
            </tr>

            {isExpanded && (
                <tr>
                    <td colSpan={9} className="border-top-none" style={{ backgroundColor: "#F0F0F0" }}>
                        <div className="display-flex padding-right-9">
                            <dl className="font-12px">
                                <dt className="margin-0 text-base-dark">Created By</dt>
                                <dd id={`created-by-name-${bl?.id}`} className="margin-0">
                                    {loggedInUser}
                                </dd>
                                <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                                    <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1" />
                                    {formatDateToMonthDayYear(bl?.created_on)}
                                </dt>
                            </dl>
                            <dl className="font-12px" style={{ marginLeft: "9.0625rem" }}>
                                <dt className="margin-0 text-base-dark">Notes</dt>
                                <dd className="margin-0" style={{ maxWidth: "400px" }}>
                                    {bl?.comments ? bl.comments : "No notes added."}
                                </dd>
                            </dl>
                            <div className="flex-align-self-end margin-left-auto margin-bottom-1">
                                {!readOnly && (
                                    <ChangeIcons
                                        budgetLine={bl}
                                        handleDeleteBudgetLine={handleDeleteBudgetLine}
                                        handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                                        handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                                        isBudgetLineEditable={isBudgetLineEditable}
                                    />
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

export default TableRow;
