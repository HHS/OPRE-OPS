import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import { convertCodeForDisplay } from "../../../helpers/utils";
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
        alternateProjectOfficerName
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
            />

            {/* Budget Lines (Executing Status) */}
            <AgreementBLIAccordion
                title="Review Budget Lines"
                instructions="Review all executing budget lines for this agreement before requesting approval."
                budgetLineItems={executingBudgetLines}
                agreement={agreement}
            />

            {/* CAN Impact */}
            <AgreementCANReviewAccordion
                instructions="Review the CAN budget impact for executing budget lines."
                selectedBudgetLines={executingBudgetLines}
            />

            {/* Notes */}
            <Accordion
                heading="Notes"
                level={2}
            >
                <TextArea
                    name="requestor-notes"
                    label="Notes (optional)"
                    maxLength={750}
                    value={notes}
                    onChange={(_, value) => setNotes(value)}
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
                >
                    Request Pre-Award Approval
                </button>
            </div>
        </App>
    );
};
