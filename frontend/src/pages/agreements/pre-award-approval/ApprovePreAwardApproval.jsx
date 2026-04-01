import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementBLIReviewTable from "../../../components/BudgetLineItems/BLIReviewTable";
import ReviewExecutingTotalAccordion from "../../../components/BudgetLineItems/ReviewExecutingTotalAccordion/ReviewExecutingTotalAccordion";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import { convertCodeForDisplay } from "../../../helpers/utils";
import {
    findDescription,
    findIfOptional,
    findPeriodEnd,
    findPeriodStart
} from "../../../helpers/servicesComponent.helpers";
import useApprovePreAwardApproval from "./ApprovePreAwardApproval.hooks";

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
        approvalAlreadyProcessed
    } = useApprovePreAwardApproval(agreementId);

    if (isLoading) {
        return <h1>Loading...</h1>;
    }

    if (!hasPermission) {
        return (
            <App breadCrumbName="Review Pre-Award Approval">
                <SimpleAlert
                    type="error"
                    heading="Access Denied"
                    message="You do not have permission to review this pre-award approval request."
                />
            </App>
        );
    }

    return (
        <App breadCrumbName="Review Pre-Award Approval">
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
                title="Review Pre-Award Approval Request"
                subTitle={agreement?.name}
            />

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
                instructions="Review the agreement details to ensure all information is correct before approving the pre-award request."
                changeRequestType={agreement?.change_request_type}
            />

            {/* Budget Lines (Executing Status) */}
            <AgreementBLIAccordion
                title="Review Budget Lines"
                instructions="Review all executing budget lines for this agreement."
                budgetLineItems={executingBudgetLines}
                agreement={agreement}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
            >
                {groupedBudgetLinesByServicesComponent &&
                    groupedBudgetLinesByServicesComponent.length > 0 &&
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

            {/* Review Executing Total */}
            <ReviewExecutingTotalAccordion executingTotal={executingTotal} />

            {/* CAN Impact */}
            <AgreementCANReviewAccordion
                instructions="Review the CAN budget impact for executing budget lines."
                selectedBudgetLines={executingBudgetLines}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
                changeRequestType=""
            />

            {/* Pre-Award Documents */}
            {preAwardMemoDocuments && preAwardMemoDocuments.length > 0 && (
                <Accordion
                    heading="Final Consensus Memo"
                    level={2}
                >
                    <p>The submitter uploaded the following documents:</p>
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
                </Accordion>
            )}

            {/* Notes Section */}
            <Accordion
                heading="Notes"
                level={2}
            >
                <p>Notes can be shared between the Submitter and Reviewer, if needed.</p>

                {requestorNotes && (
                    <>
                        <h3 className="font-sans-lg text-semibold">Submitter&apos;s Notes</h3>
                        <p
                            className="maxw-mobile-lg"
                            style={{ whiteSpace: "pre-wrap" }}
                        >
                            {requestorNotes}
                        </p>
                    </>
                )}

                <section className="margin-top-3">
                    <h3 className="font-sans-lg text-semibold">Reviewer&apos;s Notes</h3>
                    <TextArea
                        name="reviewer-notes"
                        label="Notes (optional)"
                        maxLength={150}
                        value={reviewerNotes}
                        onChange={(name, value) => setReviewerNotes(value)}
                        disabled={approvalAlreadyProcessed}
                    />
                </section>
            </Accordion>

            {/* Submit Error Alert */}
            {submitError && (
                <SimpleAlert
                    type="error"
                    heading="Action Failed"
                    className="margin-top-3"
                >
                    {submitError}
                </SimpleAlert>
            )}

            {/* Action Buttons */}
            <div className="grid-row flex-justify-end margin-top-8">
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
                    disabled={isSubmitting || approvalAlreadyProcessed}
                    data-cy="approve-pre-award-btn"
                >
                    {isSubmitting ? "Processing..." : "Approve"}
                </button>
            </div>
        </App>
    );
};
