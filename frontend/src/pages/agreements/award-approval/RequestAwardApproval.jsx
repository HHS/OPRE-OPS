import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import TextArea from "../../../components/UI/Form/TextArea";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
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
        hasBLIInReview
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
                entered, and Vendor information is complete. The Budget Team will review everything before changing
                the agreement to Awarded status in OPS. Once approved, you can complete Step 6 (Award) in the
                Procurement Tracker.
            </p>

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

            {/* Review Agreement Details */}
            <section className="margin-top-4">
                <h2>Review Agreement Details</h2>
                <AgreementMetaAccordion agreement={agreement} />
            </section>

            {/* Add CLINs to Budget Lines */}
            <section className="margin-top-4">
                <h2>Add CLINs to Budget Lines</h2>
                <p>
                    Ensure all CLINs have been entered for this agreement. You can add or edit CLINs from the
                    Agreement Details page.
                </p>
                <a
                    href={`/agreements/${agreementId}?mode=edit`}
                    className="usa-button usa-button--outline"
                >
                    Go to Agreement Details
                </a>
            </section>

            {/* Notes (Optional) */}
            <section className="margin-top-4">
                <TextArea
                    name="notes"
                    label="Notes (Optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={750}
                    messages={notes.length > 750 ? ["Notes must be 750 characters or less"] : []}
                />
            </section>

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
                    disabled={isSubmitting || hasApprovalBeenRequested || hasBLIInReview}
                    data-cy="request-award-approval-submit"
                >
                    {isSubmitting ? "Requesting..." : "Request Award Approval"}
                </button>
            </div>
        </App>
    );
};

export default RequestAwardApproval;
