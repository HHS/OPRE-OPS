import { Link } from "react-router-dom";
import TableRowExpandable from "../../../components/UI/TableRowExpandable";
import { useTableRow } from "../../../components/UI/TableRowExpandable/TableRowExpandable.hooks";
import TextClip from "../../../components/UI/Text/TextClip";
import { getAgreementName } from "../../../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import { NO_DATA } from "../../../constants";

export const ProcurementDetailsTableRow = ({ agreement }) => {
    const { isExpanded, setIsExpanded, setIsRowActive } = useTableRow();
    const isSuccess = !!agreement;
    const agreementName = isSuccess ? getAgreementName(agreement) : NO_DATA;
    console.log(agreement);

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
            <td data-cy="total-executing">{ "test"}</td>
            <td data-cy="target-date">{ "test"}</td>
            <td data-cy="days-in-step">{ "test"}</td>
        </>
    );
    const ExpandedData = (
        <>
            <p>Test</p>
        </>
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
