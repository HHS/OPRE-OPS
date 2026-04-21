import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { NO_DATA } from "../../../constants";
import { getBudgetLineCreatedDate, getProcurementShopLabel } from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { convertCodeForDisplay, formatDateNeeded } from "../../../helpers/utils";
import { useChangeRequestsForTooltip } from "../../../hooks/useChangeRequests.hooks";
import { useGetServicesComponentDisplayName } from "../../../hooks/useServicesComponents.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { AWARD_TYPE_LABELS } from "../../../pages/agreements/agreements.constants";
import TableRowExpandable from "../../UI/TableRowExpandable";
import { expandedRowBGColor } from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TableTag from "../../UI/TableTag";
import TextClip from "../../UI/Text/TextClip";
import { useGetPortfolioByIdQuery } from "../../../api/opsAPI";

/**
 * BLIRow component that represents a single row in the Budget Lines table.
 * @component
 * @param {Object} props - The props for the BLIRow component.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} props.budgetLine - The budget line object.
 * @returns {React.ReactElement} The BLIRow component.
 **/
const AllBLIRow = ({ budgetLine }) => {
    const isBudgetLineInReview = budgetLine?.in_review;
    const feeTotal = budgetLine?.fees;
    const budgetLineTotalPlusFees = budgetLine?.total ?? 0;
    const { isExpanded, setIsRowActive, setIsExpanded } = useTableRow();
    const serviceComponentName = useGetServicesComponentDisplayName(budgetLine?.services_component_id ?? 0);
    const lockedMessage = useChangeRequestsForTooltip(budgetLine);
    const { data: budgetLinePortfolio, isLoading: isPortfolioLoading } = useGetPortfolioByIdQuery(
        budgetLine?.portfolio_id
    );
    const budgetLineCreatorName = useGetUserFullNameFromId(budgetLine?.created_by);
    const awardType = AWARD_TYPE_LABELS[budgetLine?.agreement?.award_type] ?? NO_DATA;
    const vendor = budgetLine?.agreement?.vendor ?? NO_DATA;
    const agreementName = budgetLine?.agreement?.name?.trim() || NO_DATA;
    const agreementLinkLabel =
        budgetLine?.agreement?.name?.trim() ||
        (budgetLine?.agreement?.id ? `Agreement ${budgetLine.agreement.id}` : "Agreement details");

    const TableRowData = (
        <>
            <td data-cy="bli-id">{budgetLine.id}</td>
            <td data-cy="agreement-name">
                {budgetLine?.agreement?.id ? (
                    <Link
                        to={`/agreements/${budgetLine.agreement.id}`}
                        className="text-ink text-no-underline"
                        aria-label={agreementLinkLabel}
                    >
                        <TextClip
                            text={agreementName}
                            maxLines={1}
                        />
                    </Link>
                ) : (
                    <TextClip
                        text={agreementName}
                        maxLines={1}
                    />
                )}
            </td>
            <td data-cy="agreement-type">
                <TextClip
                    text={convertCodeForDisplay("agreementType", budgetLine?.agreement?.agreement_type) || NO_DATA}
                    maxLines={1}
                />
            </td>
            <td data-cy="service-component">{serviceComponentName}</td>
            <td data-cy="date-needed">{formatDateNeeded(budgetLine?.date_needed ?? "")}</td>
            <td data-cy="can">{budgetLine?.can?.display_name}</td>
            <td data-cy="portfolio-name">
                <TextClip
                    text={isPortfolioLoading ? "Loading..." : (budgetLinePortfolio?.abbreviation ?? NO_DATA)}
                    maxLines={1}
                />
            </td>
            <td data-cy="amount">
                <CurrencyFormat
                    value={budgetLineTotalPlusFees}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(budgetLineTotalPlusFees)}
                    fixedDecimalScale={true}
                />
            </td>
            <td data-cy="status">
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
            colSpan={12}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="grid-row grid-gap-4">
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Created by</dt>
                    <dd
                        id={`created-by-name-${budgetLine?.id}`}
                        className="margin-0"
                    >
                        {budgetLineCreatorName}
                    </dd>
                    <dd className="margin-0 margin-top-2 display-flex flex-align-center text-base-dark">
                        <FontAwesomeIcon
                            icon={faClock}
                            className="height-2 width-2 margin-right-1"
                            aria-hidden={true}
                        />
                        {getBudgetLineCreatedDate(budgetLine)}
                    </dd>
                </dl>
                <dl className="grid-col-5 margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd className="margin-0 wrap-text">{budgetLine?.line_description}</dd>
                </dl>
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    <dd className="margin-0">{getProcurementShopLabel(budgetLine)}</dd>
                </dl>
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Subtotal</dt>
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
                <dl className="grid-col-auto margin-top-0 font-12px">
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
            <p className="font-12px margin-0 margin-top-1 text-base-dark">
                Agreement data associated to this budget line
            </p>
            <div className="grid-row grid-gap-6">
                <dl className="grid-col-4 margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    <dd className="margin-0 wrap-text">{budgetLine.agreement?.project?.title ?? NO_DATA}</dd>
                </dl>
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Award Type</dt>
                    <dd className="margin-0">{awardType}</dd>
                </dl>
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Research Type</dt>
                    <dd className="margin-0">{NO_DATA}</dd>
                </dl>
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Vendor</dt>
                    <dd className="margin-0">{vendor}</dd>
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
            data-testid={`budget-line-row-${budgetLine?.id}`}
        />
    );
};

export default AllBLIRow;
