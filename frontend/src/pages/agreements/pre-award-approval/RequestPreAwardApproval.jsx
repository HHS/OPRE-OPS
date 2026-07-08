import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import classnames from "vest/classnames";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import DisabledButtonWithTooltip from "../../../components/UI/Button/DisabledButtonWithTooltip";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useRequestPreAwardApproval from "./RequestPreAwardApproval.hooks";
import { PreAwardBudgetLinesReviewAccordion } from "./PreAwardBudgetLinesReviewAccordion";
import FileUploadButton from "../../../components/UI/Button/FileUploadButton";

// Feature flag for upload consensus memo functionality
const ENABLE_UPLOAD_CONSENSUS_MEMO = false;

/**
 * @component - Renders a page for requesting pre-award approval from Division Directors.
 * @returns {React.ReactElement} - The rendered component.
 */
export const RequestPreAwardApproval = () => {
    const { id } = useParams();
    const agreementId = Number(id);
    const navigate = useNavigate();

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
        isStep4Completed,
        showModal,
        setShowModal,
        modalProps,
        agreementValidationResults,
        hasBLIError,
        pageErrors,
        isAlertActive,
        setIsAlertActive
    } = useRequestPreAwardApproval(agreementId);

    const isAgreementEditable = agreement?._meta?.isEditable;
    const hasValidationErrors = isAlertActive && Object.keys(pageErrors).length > 0 && isStep4Completed;
    const isAgreementInvalid = Boolean(agreementValidationResults && !agreementValidationResults.isValid());
    const cn = agreementValidationResults
        ? classnames(agreementValidationResults, {
              invalid: "usa-form-group--error",
              valid: "success",
              warning: "warning"
          })
        : undefined;

    React.useEffect(() => {
        if (hasValidationErrors) {
            scrollToTop();
        }
    }, [hasValidationErrors]);

    // Calculate upload disabled state
    const isUploadDisabled =
        !ENABLE_UPLOAD_CONSENSUS_MEMO || !isStep4Completed || isUploading || hasApprovalBeenRequested || hasBLIInReview;

    // Determine tooltip message for disabled state
    let uploadDisabledReason;
    if (!ENABLE_UPLOAD_CONSENSUS_MEMO) {
        uploadDisabledReason =
            "Documents tab is coming soon! For now, please upload to the OPRE preferred tool to share documents";
    } else if (!isStep4Completed) {
        uploadDisabledReason = "Please complete Step 4 (Evaluation) before uploading documents";
    } else if (hasApprovalBeenRequested) {
        uploadDisabledReason = "Cannot upload documents after approval has been requested";
    } else if (hasBLIInReview) {
        uploadDisabledReason = "Cannot upload documents while budget line items have pending changes";
    } else if (isUploading) {
        uploadDisabledReason = "Upload in progress...";
    }

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <App breadCrumbName="Request Pre-Award Approval">
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
                title="Request Pre-Award Approval"
                subTitle={agreement?.name}
            />

            {hasValidationErrors && (
                <SimpleAlert
                    type="error"
                    heading="Please resolve the errors outlined below"
                    message="In order to send this agreement to approval, click edit to update the required information."
                    isClosable={true}
                    setIsAlertVisible={setIsAlertActive}
                >
                    <ul data-cy="error-list">
                        {Object.entries(pageErrors).map(([key]) => (
                            <li
                                key={key}
                                data-cy="error-item"
                            >
                                {convertCodeForDisplay("validation", key)}
                            </li>
                        ))}
                    </ul>
                </SimpleAlert>
            )}

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
                agreementValidationResults={agreementValidationResults}
                cn={cn}
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
                showBudgetLineErrors={true}
            />

            {/* Upload Final Consensus Memo */}
            <Accordion
                heading="Upload Final Consensus Memo (optional)"
                level={2}
            >
                <p>Please upload the Final Consensus Memo so the Division Director can review it.</p>

                <div className="usa-form-group margin-top-3">
                    <FileUploadButton
                        id="consensus-memo-upload"
                        acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx"
                        onFileChange={handleFileChange}
                        selectedFile={selectedFile}
                        label="Final Consensus Memo"
                        disabled={isUploadDisabled}
                        disabledTooltip={uploadDisabledReason}
                        buttonText="Upload File"
                    />
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
                    className="usa-button usa-button--outline margin-right-2"
                    data-cy="edit-agreement-btn"
                    title={!isAgreementEditable ? "Agreement is not editable" : ""}
                    onClick={() => {
                        const returnTo = encodeURIComponent(`/agreements/${agreementId}/pre-award-approval`);
                        navigate(`/agreements/review/${agreementId}/edit?returnTo=${returnTo}`);
                    }}
                    disabled={!isAgreementEditable}
                >
                    Edit
                </button>
                {isStep4Completed && (isAgreementInvalid || hasBLIError) ? (
                    <DisabledButtonWithTooltip
                        label="In order to send this agreement to approval, click edit to update the required information."
                        tooltipPosition="top"
                        dataCy="send-to-approval-btn"
                    >
                        {isSubmitting ? "Submitting..." : "Send to Approval"}
                    </DisabledButtonWithTooltip>
                ) : (
                    <button
                        type="button"
                        className="usa-button"
                        data-cy="send-to-approval-btn"
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
                )}
            </div>
        </App>
    );
};
