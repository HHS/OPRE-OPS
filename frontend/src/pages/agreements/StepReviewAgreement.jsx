import { useSelector } from "react-redux";
import PreviewTable from "../budgetLines/PreviewTable";

export const StepReviewAgreement = ({ goBack, goToNext }) => {
    const selectedResearchProject = useSelector((state) => state.createAgreement.selected_project);
    const selectedAgreement = useSelector((state) => state.createAgreement.agreement);
    const { title } = selectedResearchProject;
    const {
        selected_agreement_type: agreementType,
        name: agreementName,
        description: agreementDescription,
        selected_product_service_code: selectedProductServiceCode,
        selected_agreement_reason: agreementReason,
        incumbent_entered: agreementIncumbent,
    } = selectedAgreement;
    const selectedProcurementShop = useSelector((state) => state.createAgreement.selected_procurement_shop);
    const { name: procurementShopName, fee } = selectedProcurementShop;
    const projectOfficer = useSelector((state) => state.createAgreement.agreement.project_officer.full_name);
    const teamMembers = useSelector((state) => state.createAgreement.agreement.team_members);
    const teamMembersFullNamesAndId = teamMembers.map((member) => {
        return { name: member.full_name, id: member.member_id };
    });
    const { name: pscName, naics, support_code: supportCode } = selectedProductServiceCode;

    return (
        <>
            <h1 className="text-bold" style={{ fontSize: "1.375rem" }}>
                Review and Send Agreement to Approval
            </h1>
            <p>
                Please review the agreement below or edit any information if necessary. Send to Approval will send the
                agreement to your Division Director to review for Planned Status.
            </p>
            <dl className="margin-0 font-12px">
                <dt className="margin-0 text-base-dark margin-top-1">Project</dt>
                <dd className="text-semibold margin-0">{title}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">Agreement Type</dt>
                <dd className="text-semibold margin-0">{agreementType}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">Agreement Name</dt>
                <dd className="text-semibold margin-0">{agreementName}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">Description</dt>
                <dd className="text-semibold margin-0">{agreementDescription}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">Product Service Code</dt>
                <dd className="text-semibold margin-0">{pscName}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">NAICS Code</dt>
                <dd className="text-semibold margin-0">{naics}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">Program Support Code</dt>
                <dd className="text-semibold margin-0">{supportCode}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">Procurement Shop</dt>
                <dd className="text-semibold margin-0">{`${procurementShopName}-Fee Rate: ${fee}%`}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">Reason for creating the agreement</dt>
                <dd className="text-semibold margin-0">{agreementReason}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">Incumbent</dt>
                <dd className="text-semibold margin-0">{agreementIncumbent}</dd>
                <dt className="margin-0 text-base-dark margin-top-1">Project Officer</dt>
                <dd className="text-semibold margin-0">{projectOfficer}</dd>
                {teamMembersFullNamesAndId.length > 0 && (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-1">Team Members</dt>
                        {teamMembersFullNamesAndId.map((member) => (
                            <dd key={member.id} className="text-semibold margin-0">
                                {member.name}
                            </dd>
                        ))}
                    </>
                )}
            </dl>
            <h2 className="text-bold" style={{ fontSize: "1.375rem" }}>
                Budget Lines
            </h2>
            <p>This is a list of all budget lines within this agreement.</p>
            <PreviewTable readOnly={true} handleDeleteBudgetLine={() => {}} />
            <div className="grid-row flex-justify-end margin-top-1">
                <button
                    className="usa-button usa-button--outline margin-right-2"
                    onClick={() => {
                        goBack();
                    }}
                >
                    Edit
                </button>
                <button className="usa-button" onClick={() => goToNext()}>
                    Send to Approval
                </button>
            </div>
        </>
    );
};

export default StepReviewAgreement;
