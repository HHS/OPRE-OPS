import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { useGetAgreementSpendingByIdQuery } from "../../../api/opsAPI";
import { NO_DATA } from "../../../constants";
import { getAgreementType } from "../../../helpers/agreement.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import TableRowExpandable from "../../UI/TableRowExpandable";
import { expandedRowBGColor } from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import TextClip from "../../UI/Text/TextClip";
import {
    getAgreementContractNumber,
    getAgreementEndDate,
    getAgreementName,
    getAgreementStartDate,
    getProcurementShopDisplay
} from "../../Agreements/AgreementsTable/AgreementsTable.helpers";
import { AWARD_TYPE_LABELS } from "../../../pages/agreements/agreements.constants";

const COLUMN_COUNT = 7; // Agreement, Type, Start, End, FY Total, Agreement Total, chevron

/**
 * A read-only expandable table row for the Project Spending Agreements table.
 *
 * The FY Total comes from `GET /agreements/:id/spending/` (per-agreement, per-FY).
 * The `fyTotal` prop is used as a fallback while the query is in flight or if the
 * endpoint has no entry for the selected FY.
 *
 * @param {Object} props
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement
 * @param {number} props.fiscalYear - The selected fiscal year.
 * @param {number | null} props.fyTotal - Fallback FY total from the parent.
 * @returns {React.ReactElement}
 */
const ProjectSpendingAgreementRow = ({ agreement, fiscalYear, fyTotal }) => {
    const { isExpanded, setIsExpanded, setIsRowActive } = useTableRow();

    const { data: agreementSpending } = useGetAgreementSpendingByIdQuery(agreement?.id, {
        skip: !agreement?.id
    });
    const fyTotalFromEndpoint = agreementSpending?.fy_total?.[fiscalYear];
    const resolvedFyTotal = fyTotalFromEndpoint != null ? Number(fyTotalFromEndpoint) : fyTotal;

    const agreementName = getAgreementName(agreement) ?? NO_DATA;
    const agreementType = getAgreementType(agreement?.agreement_type) ?? NO_DATA;
    const agreementStartDate = getAgreementStartDate(agreement);
    const agreementEndDate = getAgreementEndDate(agreement);
    const agreementTotal = Number(agreement?.agreement_total ?? 0);

    // Expanded detail fields
    const description = agreement?.description ?? NO_DATA;
    const procurementShopDisplay = getProcurementShopDisplay(agreement);
    const agreementSubTotal = Number(agreement?.agreement_subtotal ?? 0);
    const agreementFees = Number(agreement?.total_agreement_fees ?? 0);
    const lifetimeObligated = Number(agreement?.lifetime_obligated ?? 0);
    const contractNumber = getAgreementContractNumber(agreement) ?? NO_DATA;
    const awardType = AWARD_TYPE_LABELS[agreement?.award_type] ?? NO_DATA;
    const vendor = agreement?.vendor ?? NO_DATA;

    const TableRowData = (
        <>
            <td data-cy="agreement-name">
                <Link
                    className="text-ink text-no-underline"
                    to={`/agreements/${agreement?.id}`}
                    aria-label={`View agreement details for ${agreementName}`}
                >
                    <TextClip
                        text={agreementName}
                        tooltipThreshold={10}
                        maxLines={2}
                    />
                </Link>
            </td>
            <td data-cy="agreement-type">{agreementType}</td>
            <td data-cy="agreement-start-date">{agreementStartDate}</td>
            <td data-cy="agreement-end-date">{agreementEndDate}</td>
            <td data-cy="agreement-fy-total">
                {resolvedFyTotal != null ? (
                    <CurrencyFormat
                        value={resolvedFyTotal}
                        displayType="text"
                        thousandSeparator={true}
                        prefix="$"
                        decimalScale={getDecimalScale(resolvedFyTotal)}
                        fixedDecimalScale={true}
                        renderText={(value) => value}
                    />
                ) : (
                    NO_DATA
                )}
            </td>
            <td data-cy="agreement-total">
                <CurrencyFormat
                    value={agreementTotal}
                    displayType="text"
                    thousandSeparator={true}
                    prefix="$"
                    decimalScale={getDecimalScale(agreementTotal)}
                    fixedDecimalScale={true}
                    renderText={(value) => value}
                />
            </td>
        </>
    );

    const ExpandedData = (
        <td
            colSpan={COLUMN_COUNT}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            {/* Row 1: Description, Procurement Shop, Subtotal, Fees, Lifetime Obligated */}
            <div
                className="display-flex padding-right-4"
                style={{ justifyContent: "space-between" }}
            >
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Description</dt>
                    <dd
                        className="margin-0"
                        style={{ maxWidth: "18rem" }}
                    >
                        {description}
                    </dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    <dd className="margin-0">{procurementShopDisplay}</dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Subtotal</dt>
                    <dd className="margin-0">
                        <CurrencyFormat
                            value={agreementSubTotal}
                            displayType="text"
                            thousandSeparator={true}
                            prefix="$"
                            decimalScale={getDecimalScale(agreementSubTotal)}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Fees</dt>
                    <dd className="margin-0">
                        <CurrencyFormat
                            value={agreementFees}
                            displayType="text"
                            thousandSeparator={true}
                            prefix="$"
                            decimalScale={getDecimalScale(agreementFees)}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Lifetime Obligated</dt>
                    <dd className="margin-0">
                        <CurrencyFormat
                            value={lifetimeObligated}
                            displayType="text"
                            thousandSeparator={true}
                            prefix="$"
                            decimalScale={getDecimalScale(lifetimeObligated)}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </dd>
                </dl>
            </div>
            {/* Row 2: Contract #, Award Type, Vendor */}
            <div
                className="display-flex padding-right-4 margin-top-2"
                style={{ justifyContent: "flex-start", gap: "7rem" }}
            >
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Contract #</dt>
                    <dd className="margin-0">{contractNumber}</dd>
                </dl>
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Award Type</dt>
                    <dd className="margin-0">{awardType}</dd>
                </dl>
                <dl className="font-12px">
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
            data-testid={`project-spending-agreement-row-${agreement?.id}`}
        />
    );
};

export default ProjectSpendingAgreementRow;
