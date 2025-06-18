import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { useLazyGetAgreementByIdQuery } from "../../../api/opsAPI";
import { NO_DATA } from "../../../constants";
import { BLI_STATUS, getBudgetLineCreatedDate } from "../../../helpers/budgetLines.helpers";
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
 * @param {Object} props - The props for the BLIRow component.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} props.budgetLine - The budget line object.
 * @returns {JSX.Element} The BLIRow component.
 **/
const AllBLIRow = ({ budgetLine }) => {
    const [procShopCode, setProcShopCode] = React.useState(NO_DATA);
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const isBudgetLineInReview = budgetLine?.in_review;
    const feePercentage = budgetLine?.procurement_shop_fee
        ? budgetLine?.procurement_shop_fee?.fee || 0
        : budgetLine?.agreement?.procurement_shop?.fee_percentage || 0;
    const feeTotal = totalBudgetLineFeeAmount(budgetLine?.amount ?? 0, feePercentage);
    const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(budgetLine?.amount ?? 0, feeTotal);
    const { isExpanded, setIsRowActive, setIsExpanded } = useTableRow();
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const serviceComponentName = useGetServicesComponentDisplayName(budgetLine?.services_component_id ?? 0);
    const lockedMessage = useChangeRequestsForTooltip(budgetLine);

    const currentFeeRateDescription =
        budgetLine.status === BLI_STATUS.OBLIGATED ? `FY ${budgetLine.fiscal_year} Fee Rate` : "Current Fee Rate";
    const procShopLabel = () => {
        if (budgetLine?.status === BLI_STATUS.OBLIGATED && budgetLine?.procurement_shop_fee !== null) {
            return `${procShopCode} - ${currentFeeRateDescription} : ${feePercentage}%`;
        } else {
            return `${procShopCode} - ${currentFeeRateDescription} :  ${feePercentage}%`;
        }
    };

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
                data-cy="bli-id"
            >
                {budgetLine.id}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="agreement-name"
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
                data-cy="service-component"
            >
                {serviceComponentName}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="date-needed"
            >
                {formatDateNeeded(budgetLine?.date_needed ?? "")}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="fiscal-year"
            >
                {budgetLine.fiscal_year}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="can"
            >
                {budgetLine?.can?.display_name}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="amount"
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
                data-cy="status"
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
                            {procShopLabel()}
                        </dd>
                    </dl>
                    <div className="font-12px display-flex margin-top-1">
                        <dl className="margin-0">
                            <dt className="margin-0 text-base-dark">SubTotal</dt>
                            <dd className="margin-0">
                                <CurrencyFormat
                                    value={budgetLine?.amount ?? 0}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                    decimalScale={getDecimalScale(budgetLine?.amount ?? 0)}
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
