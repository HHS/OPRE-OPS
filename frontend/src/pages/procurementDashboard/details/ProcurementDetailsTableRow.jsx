import { useMemo } from "react";
import { Link } from "react-router-dom";
import TableRowExpandable from "../../../components/UI/TableRowExpandable";
import { useTableRow } from "../../../components/UI/TableRowExpandable/TableRowExpandable.hooks";
import TextClip from "../../../components/UI/Text/TextClip";
import {
    getAgreementName,
    getProcurementShopDisplay,
    getResearchProjectName
} from "../../../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import { NO_DATA } from "../../../constants";
import { expandedRowBGColor } from "../../../components/UI/TableRowExpandable/TableRowExpandable.helpers";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { convertToCurrency, formatDateNeeded } from "../../../helpers/utils";
import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tag from "../../../components/UI/Tag";

export const ProcurementDetailsTableRow = ({
    agreement,
    userNameById,
    targetDateByAgreementId,
    daysInStepByAgreementId,
    procurementOverview
}) => {
    const { isExpanded, setIsExpanded, setIsRowActive } = useTableRow();
    const isSuccess = !!agreement;
    const agreementName = isSuccess ? getAgreementName(agreement) : NO_DATA;

    const totalExecuting = useMemo(
        () =>
            (agreement.budget_line_items ?? [])
                .filter((bli) => bli.status === BLI_STATUS.EXECUTING)
                .reduce((sum, bli) => sum + (bli.amount ?? 0), 0),
        [agreement]
    );

    const researchProjectName = isSuccess ? getResearchProjectName(agreement) : NO_DATA;
    const procurementShopDisplay = isSuccess ? getProcurementShopDisplay(agreement) : NO_DATA;
    const agreementSubTotal = isSuccess ? (agreement?.agreement_subtotal ?? 0) : 0;
    const agreementFees = isSuccess ? (agreement?.total_agreement_fees ?? 0) : 0;

    const statusData = procurementOverview?.status_data ?? [];
    const getStatusCount = (status) => statusData.find((item) => item.status === status)?.agreements ?? 0;

    const TableRowData = (
        <>
            <td data-cy="agreement-name">
                <Link
                    className="text-ink text-no-underline"
                    to={`/agreements/${agreement?.id}`}
                    aria-label={`View agreement details for ${agreementName || "agreement"}`}
                >
                    <TextClip
                        text={agreementName}
                        tooltipThreshold={10}
                        maxLines={2}
                    />
                </Link>
            </td>
            <td data-cy="cor-name">{userNameById[agreement.project_officer_id] || ""}</td>
            <td data-cy="proc-shop">{agreement.procurement_shop.abbr || ""}</td>
            <td data-cy="total-executing">{convertToCurrency(totalExecuting)}</td>
            <td data-cy="target-date">
                {targetDateByAgreementId[agreement.id]
                    ? formatDateNeeded(targetDateByAgreementId[agreement.id])
                    : "None"}
            </td>
            <td data-cy="days-in-step">
                <Tag
                    tagStyle={
                        daysInStepByAgreementId[agreement.id] > 30
                            ? "lightTextRedBackground"
                            : "primaryDarkTextLightBackground"
                    }
                    text={`${daysInStepByAgreementId[agreement.id] ?? "None"} days`}
                />
            </td>
        </>
    );
    const ExpandedData = (
        <td
            colSpan={7}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="display-flex">
                {/* Left section - data fields */}
                <div style={{ flex: "1 1 auto" }}>
                    {/* Row 1: Project, Earliest PoP-Start, Subtotal */}
                    <div
                        className="padding-bottom-1"
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.25fr 1fr", columnGap: "2.5rem" }}
                    >
                        <dl
                            className="font-12px margin-top-0"
                            style={{ gridColumn: "1 / 3" }}
                        >
                            <dt className="margin-0 text-base-dark">Project</dt>
                            <dd className="margin-0 text-bold">{researchProjectName || NO_DATA}</dd>
                        </dl>
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Earliest PoP - Start</dt>
                            <dd className="margin-0">2/25/2026</dd>
                        </dl>
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Subtotal</dt>
                            <dd className="margin-0">
                                <CurrencyFormat
                                    value={agreementSubTotal}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                    decimalScale={getDecimalScale(agreementSubTotal)}
                                    fixedDecimalScale={true}
                                    renderText={(value) => value}
                                />
                            </dd>
                        </dl>
                    </div>
                    {/* Row 2: Initial Req. #, Initial Req. Date, Initial Req. Amount, Fees */}
                    <div
                        className="padding-bottom-1"
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.25fr 1fr", columnGap: "2.5rem" }}
                    >
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Initial Req. #</dt>
                            <dd className="margin-0">TBD</dd>
                        </dl>
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Initial Req. Date</dt>
                            <dd className="margin-0">TBD</dd>
                        </dl>
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Initial Req. Amount</dt>
                            <dd className="margin-0">
                                <CurrencyFormat
                                    value={0}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                    decimalScale={getDecimalScale(0)}
                                    fixedDecimalScale={true}
                                    renderText={(value) => value}
                                />
                            </dd>
                        </dl>
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Fees</dt>
                            <dd className="margin-0">
                                <CurrencyFormat
                                    value={agreementFees}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                    decimalScale={getDecimalScale(agreementFees)}
                                    fixedDecimalScale={true}
                                    renderText={(value) => value}
                                />
                            </dd>
                        </dl>
                    </div>
                    {/* Row 3: Final Req. #, Final Req. Date, Final Req. Amount, Procurement Shop */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.25fr 1fr", columnGap: "2.5rem" }}>
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Final Req. #</dt>
                            <dd className="margin-0">TBD</dd>
                        </dl>
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Final Req. Date</dt>
                            <dd className="margin-0">TBD</dd>
                        </dl>
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Final Req. Amount</dt>
                            <dd className="margin-0">
                                <CurrencyFormat
                                    value={0}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                    decimalScale={getDecimalScale(0)}
                                    fixedDecimalScale={true}
                                    renderText={(value) => value}
                                />
                            </dd>
                        </dl>
                        <dl className="font-12px margin-top-0">
                            <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                            <dd className="margin-0">{procurementShopDisplay}</dd>
                        </dl>
                    </div>
                </div>
                {/* Right section - Budget Lines summary */}
                <div
                    className="font-12px margin-right-1 padding-right-5"
                    style={{
                        minWidth: "10rem",
                        flex: "0 0 auto"
                    }}
                >
                    <dt className="margin-0 text-base-dark margin-bottom-1">Budget Lines</dt>
                    <dd className="margin-0">
                        <div className="display-flex flex-justify flex-align-center margin-bottom-05">
                            <span className="display-flex flex-align-center">
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    className="margin-right-05"
                                    style={{
                                        color: "var(--data-viz-bl-by-status-1)",
                                        width: "0.625rem",
                                        height: "0.625rem"
                                    }}
                                />
                                Draft
                            </span>
                            <Tag
                                tagStyle="darkTextWhiteBackground"
                                text={`${getStatusCount("DRAFT")}`}
                                className="margin-left-2"
                            />
                        </div>
                        <div className="display-flex flex-justify flex-align-center margin-bottom-05">
                            <span className="display-flex flex-align-center">
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    className="margin-right-05"
                                    style={{
                                        color: "var(--data-viz-bl-by-status-2)",
                                        width: "0.625rem",
                                        height: "0.625rem"
                                    }}
                                />
                                Planned
                            </span>
                            <Tag
                                tagStyle="darkTextWhiteBackground"
                                text={`${getStatusCount("PLANNED")}`}
                                className="margin-left-2"
                            />
                        </div>
                        <div className="display-flex flex-justify flex-align-center margin-bottom-05">
                            <span className="display-flex flex-align-center">
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    className="margin-right-05"
                                    style={{
                                        color: "var(--data-viz-bl-by-status-3)",
                                        width: "0.625rem",
                                        height: "0.625rem"
                                    }}
                                />
                                Executing
                            </span>
                            <Tag
                                tagStyle="darkTextWhiteBackground"
                                text={`${getStatusCount("IN_EXECUTION")}`}
                                className="margin-left-2"
                            />
                        </div>
                        <div className="display-flex flex-justify flex-align-center">
                            <span className="display-flex flex-align-center">
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    className="margin-right-05"
                                    style={{
                                        color: "var(--data-viz-bl-by-status-4)",
                                        width: "0.625rem",
                                        height: "0.625rem"
                                    }}
                                />
                                Obligated
                            </span>
                            <Tag
                                tagStyle="darkTextWhiteBackground"
                                text={`${getStatusCount("OBLIGATED")}`}
                                className="margin-left-2"
                            />
                        </div>
                    </dd>
                </div>
            </div>
        </td>
    );

    return (
        <>
            <TableRowExpandable
                tableRowData={TableRowData}
                expandedData={ExpandedData}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
                setIsRowActive={setIsRowActive}
            ></TableRowExpandable>
        </>
    );
};
