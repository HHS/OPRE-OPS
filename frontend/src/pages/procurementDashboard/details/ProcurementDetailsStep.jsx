import { useMemo } from "react";
import Tag from "../../../components/UI/Tag";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { convertToCurrency } from "../../../helpers/utils";
import { ProcurementDetailsTable } from "./ProcurementDetailsTable";

const STEP_DESCRIPTIONS = {
    "Acquisition Planning":
        "The pre-solicitation package is being drafted and will be sent to the Procurement Shop to review.",
    "Pre-Solicitation":
        "The pre-solicitation package is being edited in collaboration with the Procurement Shop and when finalized, the final signed versions will get uploaded to the agreement.",
    Solicitation:
        "The Procurement Shop posts the Solicitation. When posted it is “on the street”. Proposals will come in along with vendor questions and evaluations will begin.",
    Evaluation: "Technical evaluations and any potential negotiations are being completed to select a vendor.",
    "Pre-Award":
        "The Vendor Price Sheet is being reviewed and any edits or budget line status changes are made. When ready, it is sent to the Division Director to approve and then to the budget team to add the requisition information.",
    Award: "Signed award is received and uploaded, CLINs are added and updates to the Vendor and Vendor Type are completed. The budget team will then review everything before changing the agreement to Awarded in OPS."
};

const ProcurementDetailsStep = ({
    agreements,
    agreementsPerStep,
    stepType,
    userNameById,
    targetDateByAgreementId,
    daysInStepByAgreementId
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
                <p className="line-height-alt-4 margin-bottom-5">{STEP_DESCRIPTIONS[stepType] ?? ""}</p>
            </div>
            {agreements?.length > 0 ? (
                <>
                    <div
                        className="display-flex"
                        style={{ gap: "5rem" }}
                    >
                        <dl className="margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">Agreements</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag
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
                    />
                </>
            ) : (
                <p className="text-center">There are currently no agreements in this step.</p>
            )}
        </>
    );
};

export default ProcurementDetailsStep;
