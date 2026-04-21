import { Link } from "react-router-dom";
import TableRowExpandable from "../../../components/UI/TableRowExpandable";
import { useTableRow } from "../../../components/UI/TableRowExpandable/TableRowExpandable.hooks";
import TextClip from "../../../components/UI/Text/TextClip";
import { getAgreementName } from "../../../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import { NO_DATA } from "../../../constants";
import { expandedRowBGColor } from "../../../components/UI/TableRowExpandable/TableRowExpandable.helpers";
import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";

export const ProcurementDetailsTableRow = ({ agreement }) => {
    const { isExpanded, setIsExpanded, setIsRowActive } = useTableRow();
    const isSuccess = !!agreement;
    const agreementName = isSuccess ? getAgreementName(agreement) : NO_DATA;

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
            <td data-cy="cor-name">{agreement.cotr_id || ""}</td>
            <td data-cy="proc-shop">{agreement.procurement_shop.abbr || ""}</td>
            <td data-cy="total-executing">{"test"}</td>
            <td data-cy="target-date">{"test"}</td>
            <td data-cy="days-in-step">{"test"}</td>
        </>
    );
    const ExpandedData = (
        <td
            colSpan={7}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div
                className="display-flex padding-right-4"
                style={{ justifyContent: "space-between" }}
            >
                <dl className="font-12px">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    {/* <dd className="margin-0">{researchProjectName || NO_DATA}</dd> */}
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Earliest PoP - Start</dt>
                    {/* <dd className="margin-0">{procurementShopDisplay}</dd> */}
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Subtotal</dt>
                    <dd className="margin-0">
                        <CurrencyFormat
                            value={"100000"}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            decimalScale={getDecimalScale(100000)}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Budget Lines</dt>
                    {/* <dd className="margin-0">{procurementShopDisplay}</dd> */}
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Initial Req. #</dt>
                    {/* <dd className="margin-0">{procurementShopDisplay}</dd> */}
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Final Req. #</dt>
                    {/* <dd className="margin-0">{procurementShopDisplay}</dd> */}
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Initial Req. Date</dt>
                    {/* <dd className="margin-0">{procurementShopDisplay}</dd> */}
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Final Req. Date</dt>
                    {/* <dd className="margin-0">{procurementShopDisplay}</dd> */}
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Initial Req. Amount</dt>
                    <dd className="margin-0">
                        <CurrencyFormat
                            value={"100"}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            decimalScale={getDecimalScale(100)}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Final Req. Amount</dt>
                    <dd className="margin-0">
                        <CurrencyFormat
                            value={"100"}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            decimalScale={getDecimalScale(100)}
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
                            value={"100"}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            decimalScale={getDecimalScale(100)}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </dd>
                </dl>
                <dl
                    className="font-12px"
                    style={{ marginLeft: "2.5rem" }}
                >
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    {/* <dd className="margin-0">{procurementShopDisplay}</dd> */}
                </dl>
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
