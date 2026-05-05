import Table from "../../../components/UI/Table";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { SORT_TYPES, useSortData } from "../../../hooks/use-sortable-data.hooks";
import { tableSortCodes } from "../../../helpers/utils";
import { PROCUREMENT_DETAILS_SORT_CODES } from "./ProcurementDetailsTable.constants";
import { ProcurementDetailsTableRow } from "./ProcurementDetailsTableRow";

const TABLE_HEADINGS = [
    { heading: "Agreements", value: tableSortCodes.agreementCodes.AGREEMENT },
    { heading: "COR", value: PROCUREMENT_DETAILS_SORT_CODES.COR },
    { heading: "Proc. Shop", value: PROCUREMENT_DETAILS_SORT_CODES.PROC_SHOP },
    { heading: "Total Executing", value: PROCUREMENT_DETAILS_SORT_CODES.TOTAL_EXECUTING },
    { heading: "Target Date", value: PROCUREMENT_DETAILS_SORT_CODES.TARGET_DATE },
    { heading: "Days in Step", value: PROCUREMENT_DETAILS_SORT_CODES.DAYS_IN_STEP }
];

export const ProcurementDetailsTable = ({
    agreements,
    userNameById,
    targetDateByAgreementId,
    daysInStepByAgreementId
}) => {
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();

    const sortContext = { userNameById, targetDateByAgreementId, daysInStepByAgreementId };

    const sortedAgreements = useSortData(
        [...agreements],
        sortDescending,
        sortCondition,
        SORT_TYPES.PROCUREMENT_DETAILS,
        sortContext
    );

    return (
        <Table
            tableHeadings={TABLE_HEADINGS}
            selectedHeader={sortCondition}
            onClickHeader={setSortConditions}
            sortDescending={sortDescending}
        >
            {sortedAgreements.length > 0 &&
                sortedAgreements.map((agreement) => (
                    <ProcurementDetailsTableRow
                        key={agreement?.id}
                        agreement={agreement}
                        userNameById={userNameById}
                        targetDateByAgreementId={targetDateByAgreementId}
                        daysInStepByAgreementId={daysInStepByAgreementId}
                    />
                ))}
        </Table>
    );
};
