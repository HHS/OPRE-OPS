import Table from "../../../components/UI/Table";
import { tableSortCodes } from "../../../helpers/utils";
import { ProcurementDetailsTableRow } from "./ProcurementDetailsTableRow";

export const ProcurementDetailsTable = ({agreements, userNameById, targetDateByAgreementId}) => {
    const tableHeadings = [
        { heading: "Agreements", value: tableSortCodes.agreementCodes.AGREEMENT },
        { heading: "COR", value: tableSortCodes.agreementCodes.AGREEMENT },
        { heading: "Proc. Shop", value: tableSortCodes.agreementCodes.AGREEMENT },
        { heading: "Total Executing", value: tableSortCodes.agreementCodes.AGREEMENT },
        { heading: "Target Date", value: tableSortCodes.agreementCodes.AGREEMENT },
        { heading: "Days in Step", value: tableSortCodes.agreementCodes.AGREEMENT }
    ];
    return <Table tableHeadings={tableHeadings}>
                        {agreements.length > 0 &&
                            agreements?.map((agreement) => (
                                <ProcurementDetailsTableRow
                                    key={agreement?.id}
                                    agreement={agreement}
                                    userNameById={userNameById}
                                    targetDateByAgreementId={targetDateByAgreementId}
                                />
                            ))}
    </Table>;
};
