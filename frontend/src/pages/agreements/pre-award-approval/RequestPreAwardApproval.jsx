import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { convertCodeForDisplay } from "../../../helpers/utils";
import useRequestPreAwardApproval from "./RequestPreAwardApproval.hooks";
import { PreAwardBudgetLinesReviewAccordion } from "./PreAwardBudgetLinesReviewAccordion";

// Feature flag for upload consensus memo functionality
const ENABLE_UPLOAD_CONSENSUS_MEMO = false;

/**
 * @component - Renders a page for requesting pre-award approval from Division Directors.
 * @returns {React.ReactElement} - The rendered component.
 */
export const RequestPreAwardApproval = () => {
    const { id } = useParams();
    const agreementId = Number(id);

    const {
        agreement,
        isLoading,
        allBudgetLines,
        executingTotal,
        notes,
        setNotes,
        handleSubmit,
        handleCancel,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        selectedFile,
        handleFileChange,
        handleFileUpload,
        isUploading,
        uploadError,
        submitError,
        preAwardMemoDocuments,
        isSubmitting,
        isApprovalPending,
        hasApprovalBeenRequested,
        hasBLIInReview,
        isStep4Completed
    } = useRequestPreAwardApproval(agreementId);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <App breadCrumbName="Request Pre-Award Approval">
            <PageHeader
                title="Request Pre-Award Approval"
                subTitle={agreement?.name}
            />

            <p className="margin-y-3">
                Review the agreement details to make sure everything looks up to date and upload the Final Consensus
                Memo. If you need to make changes, Cancel the Pre-Award Request and edit from the Agreement Details
                Page. Once you receive Pre-Award approval from the Division Director(s), the Budget Team will add the
                Requisition # and Requisition Date. Then you can send the Final Consensus Memo to the Procurement Shop.
                The agreement will be locked from editing until the contract is Awarded.
            </p>

            {isApprovalPending && (
                <SimpleAlert
                    type="warning"
                    heading="Pre-Award Approval In Review"
                    message="This agreement is In Review for Pre-Award Approval. Edits or changes cannot be made at this time."
                    isClosable={false}
                    headingLevel={2}
                />
            )}

            {hasBLIInReview && (
                <SimpleAlert
                    type="warning"
                    heading="Budget Line In Review"
                    message="One or more budget lines have pending change requests that are currently in review. You cannot request pre-award approval until all change requests are resolved."
                    isClosable={false}
                    headingLevel={2}
                />
            )}

            {!isStep4Completed && (
                <SimpleAlert
                    type="warning"
                    heading="Step 4 Not Completed"
                    message="You must complete Step 4 (Evaluation) in the Procurement Tracker before requesting pre-award approval."
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

            {/* Upload Final Consensus Memo */}
            <Accordion
                heading="Upload Final Consensus Memo (optional)"
                level={2}
            >
                <p>Please upload the Final Consensus Memo so the Division Director can review it.</p>

                <div className="usa-form-group margin-top-3">
                    <div className="display-flex flex-align-center">
                        <div
                            className="position-relative bg-white border-1px border-base-light"
                            style={{
                                maxWidth: "540px",
                                flexGrow: 1,
                                minHeight: "100px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                padding: "1rem"
                            }}
                        >
                            <div>
                                <span style={{ fontSize: "0.875rem", color: "#757575" }}>
                                    {selectedFile ? selectedFile.name : "Final Consensus Memo"}
                                </span>
                            </div>
                            <label
                                htmlFor="consensus-memo-upload"
                                className={
                                    !ENABLE_UPLOAD_CONSENSUS_MEMO ||
                                    !isStep4Completed ||
                                    isUploading ||
                                    hasApprovalBeenRequested ||
                                    hasBLIInReview
                                        ? "cursor-not-allowed"
                                        : "cursor-pointer"
                                }
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "end",
                                    gap: "0.5rem",
                                    color:
                                        !ENABLE_UPLOAD_CONSENSUS_MEMO ||
                                        !isStep4Completed ||
                                        isUploading ||
                                        hasApprovalBeenRequested ||
                                        hasBLIInReview
                                            ? "#c9c9c9"
                                            : "#757575",
                                    fontSize: "0.875rem",
                                    marginTop: "0.5rem",
                                    opacity: !ENABLE_UPLOAD_CONSENSUS_MEMO ? 0.5 : 1
                                }}
                                title={
                                    !ENABLE_UPLOAD_CONSENSUS_MEMO
                                        ? "Document upload functionality is currently unavailable"
                                        : !isStep4Completed
                                          ? "Step 4 (Evaluation) must be completed before uploading documents"
                                          : isUploading
                                            ? "Upload in progress"
                                            : hasApprovalBeenRequested
                                              ? "Cannot upload documents - Pre-Award approval has already been requested"
                                              : hasBLIInReview
                                                ? "Cannot upload documents while budget lines have pending change requests"
                                                : ""
                                }
                            >
                                <svg
                                    className="usa-icon"
                                    aria-hidden="true"
                                    focusable="false"
                                    role="img"
                                    viewBox="0 0 24 24"
                                    style={{ fill: "currentColor", width: "32px", height: "32px" }}
                                >
                                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                                </svg>
                                <span style={{ textDecoration: "underline", fontSize: "1rem" }}>Upload File</span>
                            </label>
                            <input
                                id="consensus-memo-upload"
                                type="file"
                                name="consensus-memo-upload"
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                onChange={handleFileChange}
                                disabled={
                                    !ENABLE_UPLOAD_CONSENSUS_MEMO ||
                                    !isStep4Completed ||
                                    isUploading ||
                                    hasApprovalBeenRequested ||
                                    hasBLIInReview
                                }
                                style={{ display: "none" }}
                            />
                        </div>
                        <div
                            className="bg-base-darker text-white padding-2 border-radius-md margin-left-2"
                            style={{
                                maxWidth: "300px",
                                fontSize: "0.875rem"
                            }}
                        >
                            Documents tab is coming soon! For now, please upload to the OPRE preferred tool to share
                            documents
                        </div>
                    </div>
                </div>

                {uploadError && (
                    <div className="usa-alert usa-alert--error usa-alert--slim margin-top-2">
                        <div className="usa-alert__body">
                            <p className="usa-alert__text">{uploadError}</p>
                        </div>
                    </div>
                )}

                {selectedFile && !isUploading && (
                    <div className="margin-top-2">
                        <button
                            type="button"
                            className="usa-button"
                            onClick={handleFileUpload}
                            disabled={
                                !ENABLE_UPLOAD_CONSENSUS_MEMO ||
                                !isStep4Completed ||
                                isUploading ||
                                isSubmitting ||
                                hasApprovalBeenRequested ||
                                hasBLIInReview
                            }
                            title={
                                !ENABLE_UPLOAD_CONSENSUS_MEMO
                                    ? "Document upload functionality is currently unavailable"
                                    : !isStep4Completed
                                      ? "Step 4 (Evaluation) must be completed before uploading documents"
                                      : hasApprovalBeenRequested
                                        ? "Pre-Award approval has already been requested"
                                        : hasBLIInReview
                                          ? "Cannot upload documents while budget lines have pending change requests"
                                          : ""
                            }
                        >
                            Confirm Upload
                        </button>
                    </div>
                )}

                {isUploading && (
                    <div className="margin-top-2">
                        <p className="text-bold">Uploading...</p>
                    </div>
                )}

                {preAwardMemoDocuments && preAwardMemoDocuments.length > 0 && (
                    <div className="margin-top-3">
                        <p className="text-bold">Uploaded Documents:</p>
                        {preAwardMemoDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="padding-2 bg-base-lightest margin-top-1"
                            >
                                <p className="margin-0">
                                    <span className="text-bold">{doc.document_name}</span>
                                    {doc.document_size && <span> ({doc.document_size} MB)</span>}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </Accordion>

            {/* Submit Error Alert */}
            {submitError && (
                <div className="margin-top-3">
                    <SimpleAlert
                        type="error"
                        heading="Submission Failed"
                        headingLevel={2}
                    >
                        {submitError}
                    </SimpleAlert>
                </div>
            )}

            {/* Notes */}
            <div className="margin-top-5">
                <h2 className="font-sans-lg margin-bottom-2">Notes</h2>
                <TextArea
                    name="requestor-notes"
                    label="Notes (optional)"
                    maxLength={150}
                    value={notes}
                    onChange={(_name, value) => setNotes(value)}
                    isDisabled={!isStep4Completed || hasApprovalBeenRequested || hasBLIInReview}
                />
            </div>

            {/* Action Buttons */}
            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    type="button"
                    className="usa-button usa-button--unstyled margin-right-2"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="usa-button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || hasApprovalBeenRequested || hasBLIInReview || !isStep4Completed}
                    title={
                        !isStep4Completed
                            ? "Step 4 (Evaluation) must be completed before requesting pre-award approval"
                            : hasApprovalBeenRequested
                              ? "Pre-Award approval has already been requested"
                              : hasBLIInReview
                                ? "Cannot request approval while budget lines have pending change requests"
                                : ""
                    }
                >
                    {isSubmitting ? "Submitting..." : "Send to Approval"}
                </button>
            </div>
        </App>
    );
};
