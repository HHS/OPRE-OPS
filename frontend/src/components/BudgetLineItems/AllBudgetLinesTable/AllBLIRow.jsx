import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { NO_DATA } from "../../../constants";
import { getProcurementShopLabel } from "../../../helpers/budgetLines.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { convertCodeForDisplay, formatDateNeeded } from "../../../helpers/utils";
import { useChangeRequestsForTooltip } from "../../../hooks/useChangeRequests.hooks";
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
    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);
    const serviceComponentName = useGetServicesComponentDisplayName(budgetLine?.services_component_id ?? 0);
    const lockedMessage = useChangeRequestsForTooltip(budgetLine);
    const { data: budgetLinePortfolio, isLoading: isPortfolioLoading } = useGetPortfolioByIdQuery(
        budgetLine?.portfolio_id
    );

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
                data-cy="agreement-type"
            >
                <TextClip
                    text={convertCodeForDisplay("agreementType", budgetLine?.agreement?.agreement_type) || NO_DATA}
                    maxLines={1}
                />
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
                data-cy="can"
            >
                {budgetLine?.can?.display_name}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
                data-cy="portfolio-name"
            >
                <TextClip
                    text={isPortfolioLoading ? "Loading..." : (budgetLinePortfolio?.abbreviation ?? NO_DATA)}
                    maxLines={1}
                />
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
            colSpan={12}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="display-flex flex-justify padding-right-10">
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd
                        className="margin-0 wrap-text"
                        style={{ maxWidth: "25rem" }}
                    >
                        {budgetLine?.line_description}
                    </dd>
                </dl>
                <dl className="font-12px margin-left-2">
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "25rem" }}
                    >
                        {getProcurementShopLabel(budgetLine)}
                    </dd>
                </dl>
                <dl className="font-12px margin-left-2">
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
                <dl className="margin-left-2 font-12px">
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
            <div className="display-flex flex-justify padding-right-10">
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    <dd
                        className="margin-0 wrap-text"
                        style={{ maxWidth: "25rem" }}
                    >
                        {budgetLine.agreement?.project?.title ?? NO_DATA}
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
            data-testid={`budget-line-row-${budgetLine?.id}`}
        />
    );
};

export default AllBLIRow;
