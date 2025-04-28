import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { useLazyGetAgreementByIdQuery } from "../../../api/opsAPI";
import { NO_DATA } from "../../../constants";
import { getBudgetLineCreatedDate } from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { formatDateNeeded, totalBudgetLineAmountPlusFees, totalBudgetLineFeeAmount } from "../../../helpers/utils";
import { useChangeRequestsForTooltip } from "../../../hooks/useChangeRequests.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { useGetServicesComponentDisplayName } from "../../../hooks/useServicesComponents.hooks";
import TableRowExpandable from "../../UI/TableRowExpandable";
import {
    changeBgColorIfExpanded,
    expandedRowBGColor,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";
import TextClip from "../../UI/Text/TextClip";

/**
 * BLIRow component that represents a single row in the Budget Lines table.
 * @component
 * @typedef {import("../../BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 * @param {Object} props - The props for the BLIRow component.
 * @param {BudgetLine} props.budgetLine - The budget line object.
 * @param {boolean} [props.canUserEditBudgetLines] - Whether the user can edit budget lines.
 * @param {Function} [props.handleSetBudgetLineForEditing] - The function to set the budget line for editing.
 * @param {Function} [props.handleDeleteBudgetLine] - The function to delete the budget line.
 * @param {boolean} [props.readOnly] - Whether the user is in read only mode.
 * @returns {JSX.Element} The BLIRow component.
 **/
const AllBLIRow = ({ budgetLine }) => {
    const [procShopCode, setProcShopCode] = React.useState(NO_DATA);
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const isBudgetLineInReview = budgetLine?.in_review;
    const feeTotal = totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine?.proc_shop_fee_percentage);
    const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(budgetLine?.amount, feeTotal);
    const { isExpanded, setIsRowActive, setIsExpanded } = useTableRow();
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const serviceComponentName = useGetServicesComponentDisplayName(budgetLine?.services_component_id);
    const lockedMessage = useChangeRequestsForTooltip(budgetLine);

    const [trigger] = useLazyGetAgreementByIdQuery();

    React.useEffect(() => {
        if (isExpanded) {
            trigger(budgetLine?.agreement_id)
                .then((response) => {
                    if (response?.data) {
                        setProcShopCode(response.data.procurement_shop.abbr || NO_DATA);
                    }
                })
                .catch(() => {
                    setProcShopCode(NO_DATA);
                });
        }
    }, [isExpanded, budgetLine?.agreement_id, trigger]);

    const TableRowData = (
        <>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {budgetLine.id}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                <Link
                    to={`/agreements/${budgetLine?.agreement?.id}`}
                    className="text-ink text-no-underline"
                >
                    <TextClip
                        text={budgetLine?.agreement?.name}
                        maxLines={1}
                    />
                </Link>
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {serviceComponentName}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {formatDateNeeded(budgetLine.date_needed)}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {budgetLine.fiscal_year}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {budgetLine?.can?.display_name}
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
                />
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                <TableTag
                    inReview={isBudgetLineInReview}
                    status={budgetLine?.status}
                    lockedMessage={lockedMessage}
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
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "25rem" }}
                    >
                        {budgetLine?.line_description}
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
                            {`${procShopCode}-Fee Rate: ${budgetLine?.proc_shop_fee_percentage * 100}%`}
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
                                    decimalScale={getDecimalScale(budgetLine?.amount)}
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
                                    decimalScale={getDecimalScale(feeTotal)}
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
            data-testid={`budget-line-row-${budgetLine?.id}`}
        />
    );
};

export default AllBLIRow;
