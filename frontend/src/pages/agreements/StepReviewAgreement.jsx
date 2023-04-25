import { useSelector } from "react-redux";

export const StepReviewAgreement = () => {
    const selectedResearchProject = useSelector((state) => state.createAgreement.selected_project);
    const selectedAgreement = useSelector((state) => state.createAgreement.agreement);
    const { title } = selectedResearchProject;
    const {
        selected_agreement_type: agreementType,
        name: agreementName,
        description: agreementDescription,
        selected_product_service_code: productServiceCode,
    } = selectedAgreement;
    return (
        <>
            <h1>Review and Send Agreement to Approval</h1>
            <p>
                Please review the agreement below or edit any information if necessary. Send to Approval will send the
                agreement to your Division Director to review for Planned Status.
            </p>
            <dl className="margin-0 padding-y-2 padding-x-105">
                <dt className="margin-0 text-base-dark">Project</dt>
                <dd className="text-semibold margin-0">{title}</dd>
                <dt className="margin-0 text-base-dark">Agreement Type</dt>
                <dd className="text-semibold margin-0">{agreementType}</dd>
                <dt className="margin-0 text-base-dark">Agreement Name</dt>
                <dd className="text-semibold margin-0">{agreementName}</dd>
                <dt className="margin-0 text-base-dark">Description</dt>
                <dd className="text-semibold margin-0">{agreementDescription}</dd>
                <dt className="margin-0 text-base-dark">Product Service Code</dt>
                <dd className="text-semibold margin-0">{productServiceCode}</dd>
            </dl>
        </>
    );
};

export default StepReviewAgreement;
