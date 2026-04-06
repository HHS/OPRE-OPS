import { useState } from "react";
import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import { convertCodeForDisplay, formatDateToMonthDayYear } from "../../../helpers/utils";
import icons from "../../../uswds/img/sprite.svg";
import useApprovePreAwardApproval from "./ApprovePreAwardApproval.hooks";
import { PreAwardBudgetLinesReviewAccordion } from "./PreAwardBudgetLinesReviewAccordion";

/**
 * @component - Renders a page for Division Directors to approve/decline pre-award approval requests.
 * @returns {React.ReactElement} - The rendered component.
 */
export const ApprovePreAwardApproval = () => {
    const { id } = useParams();
    const agreementId = Number(id);

    const {
        agreement,
        isLoading,
        executingBudgetLines,
        executingTotal,
        reviewerNotes,
        setReviewerNotes,
        requestorNotes,
        handleApprove,
        handleDecline,
        handleCancel,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        preAwardMemoDocuments,
        showModal,
        setShowModal,
        modalProps,
        isSubmitting,
        submitError,
        hasPermission,
        approvalAlreadyProcessed,
        preAwardRequestorName,
        preAwardApprovalRequestedDate
    } = useApprovePreAwardApproval(agreementId);

    const [understandsApproval, setUnderstandsApproval] = useState(false);

    if (isLoading) {
        return <h1>Loading...</h1>;
    }

    if (!hasPermission) {
        return (
            <App breadCrumbName="Approval for Pre-Award">
                <SimpleAlert
                    type="error"
                    heading="Access Denied"
                    message="You do not have permission to review this pre-award approval request."
                />
            </App>
        );
    }

    return (
        <App breadCrumbName="Approval for Pre-Award">
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
                title="Approval for Pre-Award"
                subTitle={agreement?.name}
            />

            <p className="margin-y-3">
                Review the agreement details and Final Consensus Memo to make sure everything looks up to date. Once you
                approve, the Budget Team will add the Requisition # and Requisition Date. Then the COR will send the
                Final Consensus Memo to the Procurement Shop. The agreement will be locked from editing until the
                contract is Awarded.
            </p>

            {approvalAlreadyProcessed && (
                <SimpleAlert
                    type="info"
                    heading="Already Processed"
                    message="This pre-award approval request has already been processed."
                    isClosable={false}
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

            {/* Budget Lines and Executing Total */}
            <PreAwardBudgetLinesReviewAccordion
                budgetLineItems={executingBudgetLines}
                agreement={agreement}
                servicesComponents={servicesComponents}
                groupedBudgetLines={groupedBudgetLinesByServicesComponent}
                executingTotal={executingTotal}
            />

            {/* CAN Impact */}
            <AgreementCANReviewAccordion
                instructions="The budget lines on this agreement have allocated funds from the CANs displayed below. Review to confirm everything looks good and click on each CAN to view more details."
                selectedBudgetLines={executingBudgetLines}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
                changeRequestType=""
            />

            {/* Review Final Consensus Memo */}
            <Accordion
                heading="Review Final Consensus Memo"
                level={2}
            >
                <p>Please review the Final Consensus Memo below to ensure everything is up to date.</p>

                {preAwardMemoDocuments && preAwardMemoDocuments.length > 0 ? (
                    preAwardMemoDocuments.map((/** @type {any} */ doc) => (
                        <div
                            key={doc.id}
                            className="bg-base-lightest border-1px border-base-light padding-3 margin-top-3"
                            style={{
                                maxWidth: "540px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <div style={{ flexGrow: 1 }}>
                                <div style={{ fontSize: "0.875rem", color: "#757575", marginBottom: "0.5rem" }}>
                                    Final Consensus Memo
                                </div>
                                <div
                                    className="text-bold"
                                    style={{ marginBottom: "0.25rem" }}
                                >
                                    {doc.document_name}
                                </div>
                                <div style={{ fontSize: "0.875rem", color: "#757575" }}>
                                    Uploaded by {preAwardRequestorName || "Team Member"} on{" "}
                                    {formatDateToMonthDayYear(preAwardApprovalRequestedDate) || "Unknown Date"}{" "}
                                    {doc.document_size} MB
                                </div>
                            </div>
                            <button
                                type="button"
                                className="usa-button--unstyled"
                                style={{ padding: "0.5rem", cursor: "pointer" }}
                                title="Download document"
                                aria-label={`Download ${doc.document_name}`}
                            >
                                <svg
                                    className="usa-icon"
                                    aria-hidden="true"
                                    focusable="false"
                                    style={{ fill: "#005ea2", width: "24px", height: "24px" }}
                                >
                                    <use href={`${icons}#file_download`}></use>
                                </svg>
                            </button>
                        </div>
                    ))
                ) : (
                    <div
                        className="margin-top-3"
                        style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                    >
                        <div
                            className="border-1px border-base-light padding-2"
                            style={{
                                backgroundColor: "white",
                                maxWidth: "460px",
                                flexGrow: 1
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "0.875rem",
                                    color: "#757575",
                                    marginBottom: "0.5rem"
                                }}
                            >
                                Final Consensus Memo
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    className="usa-button--unstyled"
                                    style={{ padding: "0.5rem", cursor: "not-allowed" }}
                                    title="Document upload coming soon"
                                    aria-label="Download document (disabled)"
                                    disabled
                                >
                                    <svg
                                        className="usa-icon"
                                        aria-hidden="true"
                                        focusable="false"
                                        style={{ fill: "#757575", width: "24px", height: "24px" }}
                                    >
                                        <use href={`${icons}#file_download`}></use>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div
                            className="bg-base-dark padding-2"
                            style={{
                                color: "white",
                                fontSize: "0.875rem",
                                maxWidth: "420px",
                                borderRadius: "4px"
                            }}
                        >
                            Upload Documents is coming soon! For now, please review within the OPRE preferred tool to
                            share documents
                        </div>
                    </div>
                )}
            </Accordion>

            {/* Notes Section */}
            <Accordion
                heading="Notes"
                level={2}
            >
                <p>Notes can be shared between the Submitter and Reviewer, if needed.</p>

                {requestorNotes && (
                    <section className="margin-top-5">
                        <h3 className="font-sans-lg text-semibold">Submitter&apos;s Notes</h3>
                        <p
                            className="maxw-mobile-lg"
                            style={{ whiteSpace: "pre-wrap" }}
                        >
                            {requestorNotes}
                        </p>
                    </section>
                )}

                <section className={requestorNotes ? "margin-top-5" : "margin-top-3"}>
                    <h3 className="font-sans-lg text-semibold margin-bottom-0">Reviewer&apos;s Notes</h3>
                    <TextArea
                        name="reviewer-notes"
                        label="Notes (optional)"
                        maxLength={150}
                        value={reviewerNotes}
                        onChange={(/** @type {string} */ _name, /** @type {string} */ value) => setReviewerNotes(value)}
                        isDisabled={approvalAlreadyProcessed}
                        textAreaStyle={{ height: "8.5rem", maxWidth: "40rem" }}
                    />
                </section>
            </Accordion>

            {/* Submit Error Alert */}
            {submitError && (
                <SimpleAlert
                    type="error"
                    heading="Action Failed"
                    message={submitError}
                />
            )}

            {/* Approval Confirmation Checkbox */}
            <div className="margin-top-3 maxw-tablet">
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
                        I understand that approving for Pre-Award means the Requisition will be submitted and the Final
                        Consensus Memo will be sent to the Procurement Shop
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
                    className="usa-button usa-button--outline margin-right-2"
                    onClick={handleDecline}
                    disabled={isSubmitting || approvalAlreadyProcessed}
                    data-cy="decline-approval-btn"
                >
                    {isSubmitting ? "Processing..." : "Decline"}
                </button>

                <button
                    className="usa-button"
                    onClick={handleApprove}
                    disabled={isSubmitting || approvalAlreadyProcessed || !understandsApproval}
                    data-cy="approve-pre-award-btn"
                >
                    {isSubmitting ? "Processing..." : "Approve Pre-Award"}
                </button>
            </div>
        </App>
    );
};
