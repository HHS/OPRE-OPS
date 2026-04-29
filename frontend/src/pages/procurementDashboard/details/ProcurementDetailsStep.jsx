import { useMemo } from "react";
import Tag from "../../../components/UI/Tag";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { convertToCurrency } from "../../../helpers/utils";
import { ProcurementDetailsTable } from "./ProcurementDetailsTable";

const ProcurementDetailsStep = ({
    agreements,
    agreementsPerStep,
    userNameById,
    targetDateByAgreementId,
    daysInStepByAgreementId,
    procurementOverview
}) => {
    const executingBLIs = useMemo(
        () =>
            agreements
                .flatMap((agreement) => agreement.budget_line_items ?? [])
                .filter((bli) => bli.status === BLI_STATUS.EXECUTING),
        [agreements]
    );

    const executingBLICount = executingBLIs.length;

    const totalExecuting = useMemo(
        () => executingBLIs.reduce((sum, bli) => sum + (bli.amount ?? 0), 0),
        [executingBLIs]
    );

    const totalFees = useMemo(() => executingBLIs.reduce((sum, bli) => sum + (bli.fees ?? 0), 0), [executingBLIs]);
    return (
        <>
            <div>
                <p className="line-height-alt-4 margin-bottom-5">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa earum odit debitis eveniet laboriosam
                    cumque, id rem similique. Amet harum doloribus distinctio unde eum cumque deserunt eius alias
                    corrupti fugit!
                </p>
            </div>
            <div
                className="display-flex"
                style={{ gap: "5rem" }}
            >
                <dl className="margin-0 font-12px">
                    <dt className="margin-0 text-base-dark margin-top-3">Agreements</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag
                            // dataCy="agreement-nickname-tag"
                            tagStyle="primaryDarkTextLightBackground"
                            text={agreementsPerStep}
                        />
                    </dd>
                </dl>
                <dl className="margin-0 font-12px">
                    <dt className="margin-0 text-base-dark margin-top-3">Executing Budget Lines</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag
                            tagStyle="primaryDarkTextLightBackground"
                            text={executingBLICount}
                        />
                    </dd>
                </dl>
                <dl className="margin-0 font-12px">
                    <dt className="margin-0 text-base-dark margin-top-3">Total Executing</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag
                            tagStyle="primaryDarkTextLightBackground"
                            text={convertToCurrency(totalExecuting)}
                        />
                    </dd>
                </dl>
                <dl className="margin-0 font-12px">
                    <dt className="margin-0 text-base-dark margin-top-3">Total Fees</dt>
                    <dd className="margin-0 margin-top-1">
                        <Tag
                            tagStyle="primaryDarkTextLightBackground"
                            text={convertToCurrency(totalFees)}
                        />
                    </dd>
                </dl>
            </div>
            <ProcurementDetailsTable
                agreements={agreements}
                userNameById={userNameById}
                targetDateByAgreementId={targetDateByAgreementId}
                daysInStepByAgreementId={daysInStepByAgreementId}
                procurementOverview={procurementOverview}
            ></ProcurementDetailsTable>
        </>
    );
};

export default ProcurementDetailsStep;
