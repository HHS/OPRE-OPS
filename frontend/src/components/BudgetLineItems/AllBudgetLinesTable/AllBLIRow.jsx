import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { NO_DATA } from "../../../constants";
import {
    calculateProcShopFeePercentage,
    getBudgetLineCreatedDate,
    getProcurementShopLabel
} from "../../../helpers/budgetLines.helpers";
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
import { hasProcurementShopChange } from "../../../helpers/changeRequests.helpers";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";

/**
 * BLIRow component that represents a single row in the Budget Lines table.
 * @component
 * @param {Object} props - The props for the BLIRow component.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} props.budgetLine - The budget line object.
 * @param {import("../../../types/AgreementTypes").ProcurementShop[]} props.procurementShops - The procurement shops data.
 * @returns {React.ReactElement} The BLIRow component.
 **/
const AllBLIRow = ({ budgetLine, procurementShops }) => {
    const currentProcurementShop = procurementShops?.find(
        (shop) => shop.id === budgetLine?.agreement?.awarding_entity_id
    ) || { abbr: NO_DATA, fee_percentage: 0 };
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const isBudgetLineInReview = budgetLine?.in_review;
    const feePercentage = calculateProcShopFeePercentage(budgetLine, currentProcurementShop.fee_percentage);
    const feeTotal = totalBudgetLineFeeAmount(budgetLine?.amount ?? 0, feePercentage / 100);
    const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(budgetLine?.amount ?? 0, feeTotal);
    const { isExpanded, setIsRowActive, setIsExpanded } = useTableRow();
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const serviceComponentName = useGetServicesComponentDisplayName(budgetLine?.services_component_id ?? 0);
    const doesBLIHaveProcurementShopChangeRequest = hasProcurementShopChange(budgetLine);

    // Conditionally fetch agreement details only if there's a procurement shop change
    const {
        data: agreementDetails,
        isLoading: isAgreementLoading,
        isError: isAgreementError
    } = useGetAgreementByIdQuery(budgetLine?.agreement?.id, {
        skip: !doesBLIHaveProcurementShopChangeRequest || !budgetLine?.agreement?.id
    });
    const lockedMessage = useChangeRequestsForTooltip(budgetLine, "", agreementDetails?.budget_line_items || []);

    if (isAgreementLoading) {
        return <div>Loading...</div>;
    }
    if (isAgreementError) {
        return <div>Error loading agreement details</div>;
    }

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
                        className="margin-0 wrap-text"
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
                            {getProcurementShopLabel(
                                budgetLine,
                                currentProcurementShop.abbr,
                                currentProcurementShop.fee_percentage
                            )}
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
