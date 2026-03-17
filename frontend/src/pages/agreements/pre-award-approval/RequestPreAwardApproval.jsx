import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementBLIReviewTable from "../../../components/BudgetLineItems/BLIReviewTable";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import { convertCodeForDisplay } from "../../../helpers/utils";
import {
    findDescription,
    findIfOptional,
    findPeriodEnd,
    findPeriodStart
} from "../../../helpers/servicesComponent.helpers";
import useRequestPreAwardApproval from "./RequestPreAwardApproval.hooks";

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
        executingBudgetLines,
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
        preAwardMemoDocuments
    } = useRequestPreAwardApproval(agreementId);

    if (isLoading) {
        return <h1>Loading...</h1>;
    }

    return (
        <App breadCrumbName="Request Pre-Award Approval">
            <PageHeader
                title="Request Pre-Award Approval"
                subTitle={agreement?.name}
            />

            {/* Agreement Details */}
            <AgreementMetaAccordion
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                alternateProjectOfficerName={alternateProjectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
                instructions="Review the agreement details below before requesting pre-award approval."
                changeRequestType={agreement?.change_request_type}
            />

            {/* Budget Lines (Executing Status) */}
            <AgreementBLIAccordion
                title="Review Budget Lines"
                instructions="Review all executing budget lines for this agreement before requesting approval."
                budgetLineItems={executingBudgetLines}
                agreement={agreement}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
            >
                {groupedBudgetLinesByServicesComponent && groupedBudgetLinesByServicesComponent.length > 0 &&
                    groupedBudgetLinesByServicesComponent.map((group, index) => {
                        const budgetLineScGroupingLabel = group.serviceComponentGroupingLabel
                            ? group.serviceComponentGroupingLabel
                            : group.servicesComponentNumber;
                        return (
                            <ServicesComponentAccordion
                                key={`${group.servicesComponentNumber}-${index}`}
                                servicesComponentNumber={group.servicesComponentNumber}
                                serviceComponentGroupingLabel={group.serviceComponentGroupingLabel}
                                withMetadata={true}
                                periodStart={findPeriodStart(servicesComponents, budgetLineScGroupingLabel)}
                                periodEnd={findPeriodEnd(servicesComponents, budgetLineScGroupingLabel)}
                                description={findDescription(servicesComponents, budgetLineScGroupingLabel)}
                                optional={findIfOptional(servicesComponents, budgetLineScGroupingLabel)}
                                serviceRequirementType={agreement?.service_requirement_type}
                            >
                                {group.budgetLines.length > 0 ? (
                                    <AgreementBLIReviewTable
                                        readOnly={true}
                                        budgetLines={group.budgetLines}
                                        isReviewMode={true}
                                    />
                                ) : (
                                    <p className="text-center margin-y-7">
                                        No budget lines in this services component.
                                    </p>
                                )}
                            </ServicesComponentAccordion>
                        );
                    })}
            </AgreementBLIAccordion>

            {/* CAN Impact */}
            <AgreementCANReviewAccordion
                instructions="Review the CAN budget impact for executing budget lines."
                selectedBudgetLines={executingBudgetLines}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
                changeRequestType=""
            />

            {/* Upload Final Consensus Memo */}
            <Accordion
                heading="Upload Final Consensus Memo"
                level={2}
            >
                <p>Please upload the Final Consensus Memo so the Division Director can review it.</p>

                <div className="usa-form-group">
                    <label
                        className="usa-label"
                        htmlFor="consensus-memo-upload"
                    >
                        Final Consensus Memo
                    </label>
                    <span
                        className="usa-hint"
                        id="consensus-memo-upload-hint"
                    >
                        Documents tab is coming soon! For now, please upload to the OPRE preferred tool to share
                        documents
                    </span>
                    <input
                        id="consensus-memo-upload"
                        className="usa-file-input"
                        type="file"
                        name="consensus-memo-upload"
                        aria-describedby="consensus-memo-upload-hint"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </div>

                {uploadError && (
                    <div className="usa-alert usa-alert--error usa-alert--slim margin-top-2">
                        <div className="usa-alert__body">
                            <p className="usa-alert__text">{uploadError}</p>
                        </div>
                    </div>
                )}

                {selectedFile && (
                    <div className="margin-top-2">
                        <p className="text-bold">Selected file: {selectedFile.name}</p>
                        <button
                            className="usa-button margin-top-1"
                            onClick={handleFileUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? "Uploading..." : "Upload File"}
                        </button>
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

            {/* Notes */}
            <Accordion
                heading="Notes"
                level={2}
            >
                <TextArea
                    name="requestor-notes"
                    label="Notes (optional)"
                    maxLength={150}
                    value={notes}
                    onChange={(name, value) => setNotes(value)}
                />
            </Accordion>

            {/* Action Buttons */}
            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
                <button
                    className="usa-button"
                    onClick={handleSubmit}
                    disabled={!preAwardMemoDocuments || preAwardMemoDocuments.length === 0}
                    title={
                        !preAwardMemoDocuments || preAwardMemoDocuments.length === 0
                            ? "Please upload the Final Consensus Memo before requesting approval"
                            : ""
                    }
                >
                    Request Pre-Award Approval
                </button>
            </div>
        </App>
    );
};
