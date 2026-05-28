import { useMemo } from "react";
import Tag from "../../../components/UI/Tag";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { convertToCurrency } from "../../../helpers/utils";
import { ProcurementDetailsTable } from "./ProcurementDetailsTable";

const STEP_DESCRIPTIONS = {
    "Acquisition Planning":
        "Once the pre-solicitation package is drafted and signed by all parties, the COR will send it to the Procurement Shop and check this step as complete.",
    "Pre-Solicitation":
        "The COR will edit the pre-solicitation package in collaboration with the Procurement Shop. Once the documents are finalized, they will upload the final and signed versions, and check this step as complete.",
    Solicitation:
        "Once the Procurement Shop has posted the Solicitation and it’s “on the street”, the COR will enter the Solicitation Start and End Dates. After all proposals are received, vendor questions have been answered, and evaluations are starting, they will check this step as complete.",
    Evaluation:
        "The COR and evaluation panel will complete the technical evaluations and any potential negotiations. Once they internally select a vendor, they will check this step as complete (internally means internal to OPRE, before they send the Final Consensus Memo to the Procurement Shop).",
    "Pre-Award":
        "All agreements need Pre-Award Approval before the Final Consensus Memo can be sent to the Procurement Shop. The COR will review the Vendor Price Sheet and make any edits or budget line status changes as needed. After final edits are approved by the Division Director(s), the Budget Team will submit the requisition and this step will be complete.",
    Award: "Once the COR receives the signed award, they will upload the award document, add CLINs, and update the Vendor and Vendor Type. The budget team will review everything has been entered correctly before changing the agreement to Awarded in OPS (this will also change the budget lines in executing status to obligated status)."
};

const ProcurementDetailsStep = ({
    agreements,
    agreementsPerStep,
    stepType,
    userNameById,
    targetDateByAgreementId,
    daysInStepByAgreementId,
    fiscalYear
}) => {
    const executingBLIs = useMemo(
        () =>
            agreements
                .flatMap((agreement) => agreement.budget_line_items ?? [])
                .filter((bli) => bli.status === BLI_STATUS.EXECUTING && bli.fiscal_year === fiscalYear),
        [agreements, fiscalYear]
    );

    const executingBLICount = executingBLIs.length;

    const totalExecuting = useMemo(
        () => executingBLIs.reduce((sum, bli) => sum + (bli.amount ?? 0), 0),
        [executingBLIs]
    );

    const totalFees = useMemo(() => executingBLIs.reduce((sum, bli) => sum + (bli.fees ?? 0), 0), [executingBLIs]);

    const totalExecutingPlusFees = totalExecuting + totalFees;
    return (
        <>
            <div>
                <p className="line-height-alt-4 margin-bottom-1">{STEP_DESCRIPTIONS[stepType] ?? ""}</p>
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
                                    text={convertToCurrency(totalExecutingPlusFees)}
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
                        fiscalYear={fiscalYear}
                    />
                </>
            ) : (
                <p className="text-center">There are currently no agreements in this step.</p>
            )}
        </>
    );
};

export default ProcurementDetailsStep;
