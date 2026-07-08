import { useState } from "react";
import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import Accordion from "../../../components/UI/Accordion";
import { BudgetLinesReviewAccordion } from "../../agreements/pre-award-approval/BudgetLinesReviewAccordion";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import FileUploadButton from "../../../components/UI/Button/FileUploadButton";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import useApproveAwardApproval from "./ApproveAwardApproval.hooks";

/**
 * @component - Award Approval review page for Budget Team members (OPS-2280).
 * Read-only review; approving transitions BLIs and marks the agreement Awarded.
 * @returns {React.ReactElement}
 */
export const ApproveAwardApproval = () => {
    const { id } = useParams();
    const agreementId = Number(id);

    const {
        agreement,
        isLoading,
        allBudgetLines,
        executingTotal,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        requestorNotes,
        handleApprove,
        handleCancel,
        projectOfficerName,
        alternateProjectOfficerName,
        step6,
        showModal,
        setShowModal,
        modalProps,
        isSubmitting,
        submitError,
        hasPermission,
        approvalAlreadyProcessed,
        obligatedDate,
        setObligatedDate,
        MemoizedDatePicker
    } = useApproveAwardApproval(agreementId);

    const [understandsApproval, setUnderstandsApproval] = useState(false);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!hasPermission) {
        return (
            <App breadCrumbName="Award Approval">
                <SimpleAlert
                    type="error"
                    heading="Access Denied"
                    message="You do not have permission to review this award approval request."
                    headingLevel={2}
                />
            </App>
        );
    }

    return (
        <App breadCrumbName="Award Approval">
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}

            <PageHeader
                title="Award Approval"
                subTitle={agreement?.name}
            />

            <p className="margin-y-3">
                Review the agreement details and the Signed Award attached below. Confirm that the CLINs have been
                entered correctly and that all the agreement details match the award exactly. Make any final edits, as
                needed. After the Budget Team approves, the agreement will change to Awarded. This will change the
                budget lines in Executing Status to Obligated Status, and change budget lines in Planned Status to
                Planned - Mod Status.
            </p>

            {approvalAlreadyProcessed && (
                <SimpleAlert
                    type="info"
                    heading="Already Processed"
                    message="This award approval request has already been processed."
                    isClosable={false}
                    headingLevel={2}
                />
            )}

            {/* Agreement Details */}
            <AgreementMetaAccordion
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                alternateProjectOfficerName={alternateProjectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
                instructions="Please review the agreement details below to ensure everything is up to date."
                changeRequestType={agreement?.change_request_type}
            />

            {/* Budget Lines — show only PLANNED and IN_EXECUTION (not DRAFT), with CLIN column */}
            <BudgetLinesReviewAccordion
                budgetLineItems={allBudgetLines.filter((bli) => bli.status !== "DRAFT")}
                agreement={agreement}
                servicesComponents={servicesComponents}
                groupedBudgetLines={(groupedBudgetLinesByServicesComponent ?? []).map((group) => ({
                    ...group,
                    budgetLines: group.budgetLines.filter((bli) => bli.status !== "DRAFT")
                }))}
                executingTotal={executingTotal}
                showCLINColumn={true}
                executingTotalInstructions="Review the total of all budget lines in Executing Status."
            />

            {/* CAN Impact */}
            <AgreementCANReviewAccordion
                instructions="The budget lines on this agreement have allocated funds from the CANs displayed below and the amounts have been approved. Click on each CAN to view more details."
                selectedBudgetLines={allBudgetLines}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
                changeRequestType=""
            />

            {/* Vendor Information — read-only */}
            <Accordion
                heading="Review Vendor Information"
                level={2}
            >
                <p>Please review the vendor details below to ensure everything is correct.</p>
                <div className="grid-row grid-gap margin-top-3">
                    <div className="grid-col-4">
                        <dl className="font-12px margin-0">
                            <dt className="text-base-dark">Vendor</dt>
                            <dd className="margin-0 text-bold">{step6?.vendor?.name || "—"}</dd>
                        </dl>
                    </div>
                    <div className="grid-col-4">
                        <dl className="font-12px margin-0">
                            <dt className="text-base-dark">Unique Entity ID (SAM.gov ID)</dt>
                            <dd className="margin-0 text-bold">{step6?.vendor?.duns || "—"}</dd>
                        </dl>
                    </div>
                    <div className="grid-col-4">
                        <dl className="font-12px margin-0">
                            <dt className="text-base-dark">Vendor Type</dt>
                            <dd className="margin-0 text-bold">{step6?.vendor?.vendor_type || "—"}</dd>
                        </dl>
                    </div>
                </div>
            </Accordion>

            {/* Current Award Information — read-only */}
            <Accordion
                heading="Review Current Award Information"
                level={2}
            >
                <p>Please review the award details below to ensure everything is correct.</p>
                <div className="grid-row grid-gap margin-top-3">
                    <div className="grid-col-4">
                        <dl className="font-12px margin-0">
                            <dt className="text-base-dark">Contract #</dt>
                            <dd className="margin-0 text-bold">{step6?.contract_number || "—"}</dd>
                        </dl>
                    </div>
                    <div className="grid-col-4">
                        <dl className="font-12px margin-0">
                            <dt className="text-base-dark">Award Amount</dt>
                            <dd className="margin-0 text-bold">
                                {step6?.award_amount != null ? formatCurrency(step6.award_amount) : "—"}
                            </dd>
                        </dl>
                    </div>
                    <div className="grid-col-4">
                        <dl className="font-12px margin-0">
                            <dt className="text-base-dark">Award Date</dt>
                            <dd className="margin-0 text-bold">{step6?.award_date || "—"}</dd>
                        </dl>
                    </div>
                </div>
            </Accordion>

            {/* Review Signed Award — upload disabled (feature-flagged) */}
            <Accordion
                heading="Review Signed Award"
                level={2}
            >
                <p>Please review the Signed Award below to ensure everything is correct.</p>
                <FileUploadButton
                    id="signed-award-review"
                    variant="download"
                    label="Signed Award"
                    disabled={true}
                    disabledTooltip="Upload Documents is coming soon! For now, please review within the OPRE preferred tool to share documents"
                    buttonText="Download File"
                />
            </Accordion>

            {/* Enter Obligated Date */}
            <Accordion
                heading="Enter Obligated Date"
                level={2}
            >
                <p>
                    Enter the Obligated Date from outside of OPS. This date will replace the estimated Obligated By Date
                    for the actual Obligated By Date on all budget lines changing from Executing to Obligated Status.
                </p>
                <div className="grid-col-4">
                    <MemoizedDatePicker
                        id="obligated-date"
                        name="obligatedDate"
                        label="Obligated Date"
                        hint="mm/dd/yyyy"
                        value={obligatedDate}
                        onChange={(e) => setObligatedDate(e.target.value)}
                        isDisabled={approvalAlreadyProcessed}
                    />
                </div>
            </Accordion>

            {/* Notes — read-only Submitter's Notes per Figma */}
            <Accordion
                heading="Notes"
                level={2}
            >
                <p>Notes can be shared between the Submitter and Reviewer, if needed.</p>

                <section className="margin-top-5">
                    <h2 className="font-sans-lg text-semibold">Submitter&apos;s Notes</h2>
                    {requestorNotes ? (
                        <p
                            className="maxw-mobile-lg"
                            style={{ whiteSpace: "pre-wrap" }}
                        >
                            {requestorNotes}
                        </p>
                    ) : (
                        <p className="text-base-dark">No notes from the submitter.</p>
                    )}
                </section>
            </Accordion>

            {/* Submit Error Alert */}
            {submitError && (
                <SimpleAlert
                    type="error"
                    heading="Action Failed"
                    message={submitError}
                    headingLevel={2}
                />
            )}

            {/* Attestation Checkbox */}
            <div className="margin-top-3">
                <div className="usa-checkbox">
                    <input
                        className="usa-checkbox__input"
                        id="understand-approval"
                        type="checkbox"
                        name="understand-approval"
                        checked={understandsApproval}
                        onChange={(e) => setUnderstandsApproval(e.target.checked)}
                        disabled={approvalAlreadyProcessed}
                    />
                    <label
                        className="usa-checkbox__label"
                        htmlFor="understand-approval"
                    >
                        I understand that approving for Award means all information in this agreement is correct
                        (matches the award exactly) and can be changed to Awarded in OPS. I understand this action will
                        change budget lines in Executing Status to Obligated Status and budget lines in Planned Status
                        will change to Planned Mod Status.
                    </label>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid-row flex-justify-end margin-top-8 margin-bottom-8">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    data-cy="cancel-approval-btn"
                >
                    Cancel
                </button>

                <button
                    className="usa-button"
                    onClick={handleApprove}
                    disabled={isSubmitting || approvalAlreadyProcessed || !understandsApproval}
                    data-cy="approve-award-btn"
                >
                    {isSubmitting ? "Processing..." : "Approve Award"}
                </button>
            </div>
        </App>
    );
};

export default ApproveAwardApproval;
