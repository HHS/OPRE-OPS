import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import Accordion from "../../../components/UI/Accordion";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { convertCodeForDisplay, formatDateToMonthDayYear } from "../../../helpers/utils";
import icons from "../../../uswds/img/sprite.svg";
import usePreAwardApprovalData from "./usePreAwardApprovalData";
import { PreAwardBudgetLinesReviewAccordion } from "./PreAwardBudgetLinesReviewAccordion";
import FileUploadButton from "../../../components/UI/Button/FileUploadButton";
import Input from "../../../components/UI/Form/Input";

/**
 * @component - Renders a read-only page for Budget Team to review pre-award requisition information
 * Phase 3: Display-only with disabled form fields (no handlers)
 * Phase 4: Will add handlers, validation, and submission
 * @returns {React.ReactElement} - The rendered component
 */
export const ReviewBudgetTeamRequisition = () => {
    const { id } = useParams();
    const agreementId = Number(id);

    // Get current user and check for BUDGET_TEAM role
    const currentUser = useSelector((state) => state.auth?.activeUser);
    const userRoles = currentUser?.roles?.map((role) => role.name) || [];
    const hasPermission = userRoles.includes("BUDGET_TEAM");

    // Fetch data using shared hook
    const {
        agreement,
        isLoading,
        allBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        preAwardMemoDocuments,
        step5,
        preAwardRequestorName,
        preAwardApprovalRequestedDate
    } = usePreAwardApprovalData(agreementId);

    // Get notes from step5
    const requestorNotes = step5?.requestor_notes;
    const reviewerNotes = step5?.reviewer_notes; // DD notes

    // Check if already processed
    const approvalAlreadyProcessed = step5?.requisition_approved_by !== null && step5?.requisition_approved_by !== undefined;

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!hasPermission) {
        return (
            <App breadCrumbName="Pre-Award Requisition">
                <SimpleAlert
                    type="error"
                    heading="Access Denied"
                    message="You do not have permission to review this pre-award requisition request."
                    headingLevel={2}
                />
            </App>
        );
    }

    return (
        <App breadCrumbName="Pre-Award Requisition">
            <PageHeader
                title="Pre-Award Requisition"
                subTitle={agreement?.name}
            />

            <p className="margin-y-3">
                Review the agreement details and Final Consensus Memo attached below. This agreement has been approved
                by the Division Director for Pre-Award, and the Final Consensus Memo will be sent to the Procurement
                Shop after the Budget Team completes the Requisition Request. Complete the Requisition Request outside
                of OPS and then enter the Requisition # and Date.
            </p>

            {approvalAlreadyProcessed && (
                <SimpleAlert
                    type="info"
                    heading="Already Processed"
                    message="This budget team requisition has already been processed."
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

            {/* Budget Lines and Executing Total */}
            <PreAwardBudgetLinesReviewAccordion
                budgetLineItems={allBudgetLines}
                agreement={agreement}
                servicesComponents={servicesComponents}
                groupedBudgetLines={groupedBudgetLinesByServicesComponent}
                executingTotal={executingTotal}
            />

            {/* CAN Impact */}
            <AgreementCANReviewAccordion
                instructions="The budget lines on this agreement have allocated funds from the CANs displayed below. Review to confirm everything looks good and click on each CAN to view more details."
                selectedBudgetLines={allBudgetLines}
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
                    <div className="margin-top-3">
                        <FileUploadButton
                            id="consensus-memo-download"
                            variant="download"
                            label="Final Consensus Memo"
                            disabled={true}
                            disabledTooltip="Upload Documents is coming soon! For now, please review within the OPRE preferred tool to share documents"
                            buttonText="Download File"
                        />
                    </div>
                )}
            </Accordion>

            {/* Enter Requisition Information */}
            <Accordion
                heading="Enter Requisition Information"
                level={2}
            >
                <p>Complete the requisition outside of OPS and then enter the requisition information below.</p>

                <div className="grid-row grid-gap margin-top-3">
                    <div className="grid-col-6">
                        <Input
                            name="requisition-number"
                            label="Requisition #"
                            type="text"
                            value=""
                            onChange={() => {}} // Phase 3: no functionality
                            disabled={true}
                            messages={[]}
                            required={true}
                            maxLength={100}
                        />
                    </div>

                    <div className="grid-col-6">
                        <label
                            className="usa-label"
                            htmlFor="requisition-date"
                        >
                            Requisition Date <span className="text-secondary-dark">*</span>
                        </label>
                        <input
                            className="usa-input"
                            id="requisition-date"
                            name="requisition-date"
                            type="date"
                            disabled={true}
                        />
                    </div>
                </div>
            </Accordion>

            {/* Notes Section (Read-Only) */}
            <Accordion
                heading="Notes"
                level={2}
            >
                <p>Notes can be shared between the Submitter and Reviewer, if needed.</p>

                <div className="grid-row grid-gap margin-top-3">
                    <div className="grid-col-6">
                        <h3 className="font-sans-sm text-semibold margin-bottom-2">Submitter&apos;s Notes</h3>
                        <div style={{ minHeight: "8.5rem", whiteSpace: "pre-wrap" }}>
                            {requestorNotes || "No notes provided"}
                        </div>
                    </div>

                    <div className="grid-col-6">
                        <h3 className="font-sans-sm text-semibold margin-bottom-2">Division Director Notes</h3>
                        <div style={{ minHeight: "8.5rem", whiteSpace: "pre-wrap" }}>
                            {reviewerNotes || "No notes provided"}
                        </div>
                    </div>
                </div>
            </Accordion>

            {/* Attestation Checkbox */}
            <div className="margin-top-4 maxw-tablet">
                <div className="usa-checkbox">
                    <input
                        className="usa-checkbox__input"
                        id="attestation"
                        type="checkbox"
                        name="attestation"
                        disabled={true} // Phase 3: no functionality
                    />
                    <label
                        className="usa-checkbox__label"
                        htmlFor="attestation"
                    >
                        I understand that approving Pre-Award Requisition means the requisition has been submitted
                        outside of OPS and the Final Consensus Memo can be sent to the Procurement Shop
                    </label>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid-row flex-justify-end margin-top-8 margin-bottom-8">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    type="button"
                    disabled={true} // Phase 3: no functionality
                    data-cy="cancel-requisition-btn"
                >
                    Cancel
                </button>

                <button
                    className="usa-button"
                    type="button"
                    disabled={true} // Phase 3: no functionality
                    data-cy="approve-requisition-btn"
                >
                    Approve Pre-Award Requisition
                </button>
            </div>
        </App>
    );
};

export default ReviewBudgetTeamRequisition;
