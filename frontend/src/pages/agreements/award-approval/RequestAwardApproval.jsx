import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementBLIReviewTable from "../../../components/BudgetLineItems/BLIReviewTable";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import TextArea from "../../../components/UI/Form/TextArea";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { convertCodeForDisplay } from "../../../helpers/utils";
import {
    findDescription,
    findIfOptional,
    findPeriodEnd,
    findPeriodStart
} from "../../../helpers/servicesComponent.helpers";
import useRequestAwardApproval from "./RequestAwardApproval.hooks";

/**
 * @component - Renders a page for requesting award approval from the Budget Team.
 * @returns {React.ReactElement} - The rendered component.
 */
export const RequestAwardApproval = () => {
    const { id } = useParams();
    const agreementId = Number(id);

    const {
        agreement,
        isLoading,
        notes,
        setNotes,
        handleSubmit,
        handleCancel,
        submitError,
        isSubmitting,
        hasApprovalBeenRequested,
        hasBLIInReview,
        isStep5Completed,
        projectOfficerName,
        alternateProjectOfficerName,
        allBudgetLines,
        servicesComponents,
        groupedBudgetLinesByServicesComponent
    } = useRequestAwardApproval(agreementId);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <App breadCrumbName="Request Award Approval">
            <PageHeader
                title="Request Award Approval"
                subTitle={agreement?.name}
            />

            <p className="margin-y-3">
                Review the agreement details below to ensure the signed award has been uploaded, CLINs have been
                entered, and Vendor information is complete. The Budget Team will review everything before changing the
                agreement to Awarded status in OPS. Once approved, you can complete Step 6 (Award) in the Procurement
                Tracker.
            </p>

            {!isStep5Completed && (
                <SimpleAlert
                    type="warning"
                    heading="Step 5 Not Completed"
                    message="Step 5 (Pre-Award) must be completed before requesting Award Approval. Please complete Step 5 first."
                    isClosable={false}
                    headingLevel={2}
                />
            )}

            {hasApprovalBeenRequested && (
                <SimpleAlert
                    type="warning"
                    heading="Award Approval Already Requested"
                    message="Award Approval has already been requested for this agreement. The Budget Team will review and approve when ready."
                    isClosable={false}
                    headingLevel={2}
                />
            )}

            {hasBLIInReview && (
                <SimpleAlert
                    type="warning"
                    heading="Budget Line Items In Review"
                    message="Some budget line items have pending changes that are currently in review. Award Approval cannot be requested until all changes are approved."
                    isClosable={false}
                    headingLevel={2}
                />
            )}

            {submitError && (
                <SimpleAlert
                    type="error"
                    heading="Error Requesting Award Approval"
                    message={submitError}
                    isClosable={true}
                    headingLevel={2}
                />
            )}

            {/* Agreement Details */}
            <AgreementMetaAccordion
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                alternateProjectOfficerName={alternateProjectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
                instructions="Review the agreement details below to ensure the signed award has been uploaded, CLINs have been entered, and Vendor information is complete."
                changeRequestType={agreement?.change_request_type}
                isAgreementAwarded={true}
            />

            {/* Add CLINs to Budget Lines */}
            <AgreementBLIAccordion
                title="Add CLINs to Budget Lines"
                instructions="Hover over each budget line and click Add CLIN to enter the Contract Line Item Number as outlined in the award. The budget team will double check the CLINs match the award exactly."
                budgetLineItems={allBudgetLines}
                agreement={agreement}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
            >
                {groupedBudgetLinesByServicesComponent &&
                    groupedBudgetLinesByServicesComponent.length > 0 &&
                    groupedBudgetLinesByServicesComponent.map(
                        (/** @type {any} */ group, /** @type {number} */ index) => {
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
                                            servicesComponentNumber={group.servicesComponentNumber}
                                            action=""
                                        />
                                    ) : (
                                        <p className="text-center margin-y-7">
                                            No budget lines in this services component.
                                        </p>
                                    )}
                                </ServicesComponentAccordion>
                            );
                        }
                    )}
            </AgreementBLIAccordion>

            {/* Notes (Optional) */}
            <div className="margin-top-4">
                <TextArea
                    name="notes"
                    label="Notes (Optional)"
                    value={notes}
                    onChange={(_name, value) => setNotes(value)}
                    maxLength={750}
                    messages={notes.length > 750 ? ["Notes must be 750 characters or less"] : []}
                />
            </div>

            {/* Action Buttons */}
            <div className="display-flex flex-justify margin-top-4">
                <button
                    className="usa-button usa-button--unstyled"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    className="usa-button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || hasApprovalBeenRequested || hasBLIInReview || !isStep5Completed}
                    data-cy="request-award-approval-submit"
                >
                    {isSubmitting ? "Requesting..." : "Request Award Approval"}
                </button>
            </div>
        </App>
    );
};

export default RequestAwardApproval;
