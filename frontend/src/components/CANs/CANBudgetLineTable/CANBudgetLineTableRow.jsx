import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { buildTrailState } from "../../../helpers/breadcrumb.helpers";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { useChangeRequestsForTooltip } from "../../../hooks/useChangeRequests.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import TableRowExpandable from "../../UI/TableRowExpandable";
import { expandedRowBGColor } from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import tableStyles from "../../UI/Table/table.module.css";
import TableTag from "../../UI/TableTag";
import TextClip from "../../UI/Text/TextClip";
import Tooltip from "../../UI/USWDS/Tooltip";
import { getProcurementShopLabel } from "../../../helpers/budgetLines.helpers";

/**
 * @typedef {import("../../../types/BudgetLineTypes").BudgetLine} BudgetLine
 */

/**
 * @typedef {Object} CANBudgetLineTableRowProps
 * @property {BudgetLine} budgetLine
 * @property {number} blId
 * @property {string} agreementName
 * @property {string} obligateDate
 * @property {number | string } fiscalYear
 * @property {number} amount
 * @property {number} fee
 * @property {number} percentOfCAN
 * @property {string} status
 * @property {boolean} inReview
 * @property {number} creatorId
 * @property {string} creationDate
 * @property {string} description
 * @property {import("../../../helpers/breadcrumb.helpers").BreadcrumbAncestor[]} [ancestry] - Breadcrumb ancestry passed to the agreement (composed by the embedding page: CAN detail vs. Portfolio spending).
 */

/**
 * @component - The CAN Budget Line Table.
 * @param {CANBudgetLineTableRowProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetLineTableRow = ({
    budgetLine,
    blId,
    agreementName,
    obligateDate,
    fiscalYear,
    amount,
    percentOfCAN,
    status,
    inReview,
    creatorId,
    creationDate,
    description,
    ancestry = []
}) => {
    const lockedMessage = useChangeRequestsForTooltip(budgetLine);
    const { isExpanded, setIsRowActive, setIsExpanded } = useTableRow();
    const budgetLineCreatorName = useGetUserFullNameFromId(creatorId);
    const feeTotal = budgetLine.fees;
    const displayCreatedDate = formatDateToMonthDayYear(creationDate);
    const procShopLabel = getProcurementShopLabel(budgetLine);
    const resolvedAgreementName =
        agreementName?.trim() ||
        (budgetLine?.agreement?.id ? `Agreement ${budgetLine.agreement.id}` : "Agreement details");
    const agreementPath = `/agreements/${budgetLine?.agreement?.id}`;
    // When the nickname-preferred agreementName differs from the full title, the full title
    // must also reach keyboard/screen-reader users through the link's own accessible name —
    // the hover Tooltip alone doesn't reliably expose it to AT users navigating the table via
    // virtual cursor/browse mode, matching AgreementTableRow.
    const fullAgreementName = budgetLine?.agreement?.name;
    const hasDistinctFullName = Boolean(fullAgreementName) && fullAgreementName !== resolvedAgreementName;
    const agreementLinkLabel = hasDistinctFullName
        ? `View agreement details for ${resolvedAgreementName}, full title ${fullAgreementName}`
        : `View agreement details for ${resolvedAgreementName}`;

    const TableRowData = (
        <>
            <td>{blId}</td>
            <td>
                <div className={tableStyles.textClipContainer}>
                    {budgetLine.agreement ? (
                        <Tooltip
                            label={hasDistinctFullName ? fullAgreementName : ""}
                            position="right"
                        >
                            <Link
                                className="text-ink text-no-underline"
                                to={agreementPath}
                                state={buildTrailState(agreementPath, ancestry, agreementName?.trim())}
                                aria-label={agreementLinkLabel}
                            >
                                <TextClip
                                    text={agreementName?.trim() || `${budgetLine.agreement.id}`}
                                    maxLines={1}
                                />
                            </Link>
                        </Tooltip>
                    ) : (
                        <span className="text-ink">{agreementName}</span>
                    )}
                </div>
            </td>
            <td>{obligateDate}</td>
            <td>{fiscalYear}</td>
            <td>{formatCurrency(budgetLine.total ?? 0)}</td>
            <td>{percentOfCAN}%</td>
            <td>
                <TableTag
                    status={status}
                    inReview={inReview}
                    lockedMessage={lockedMessage}
                />
            </td>
        </>
    );

    const ExpandedData = (
        <td
            colSpan={8}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="grid-row grid-gap-4 padding-bottom-1">
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Created By</dt>
                    <dd className="margin-0">
                        <div id={`created-by-name-${blId}`}>{budgetLineCreatorName}</div>
                        <div className="margin-top-2 display-flex flex-align-center text-base-dark text-normal">
                            <FontAwesomeIcon
                                icon={faClock}
                                className="height-2 width-2 margin-right-1"
                                aria-hidden={true}
                            />
                            {displayCreatedDate}
                        </div>
                    </dd>
                </dl>
                <dl className="grid-col-4 margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd className="margin-0 wrap-text">{description}</dd>
                </dl>

                <dl className="grid-col-auto margin-top-0 font-12px text-no-wrap">
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    <dd className="margin-0">{`${procShopLabel}`}</dd>
                </dl>

                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">SubTotal</dt>
                    <dd className="margin-0">{formatCurrency(amount)}</dd>
                </dl>
                <dl className="grid-col-auto margin-top-0 font-12px">
                    <dt className="margin-0 text-base-dark">Fees</dt>
                    <dd className="margin-0">{formatCurrency(feeTotal)}</dd>
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

export default CANBudgetLineTableRow;
