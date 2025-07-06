/**
 * @typedef {import("../../../types/ProjectTypes").ResearchProject} ResearchProject
 * @typedef {import("../../../types/AgreementTypes").Agreement} Agreement
 * @typedef {import("../../../types/AgreementTypes").ProcurementShop} ProcurementShop
 */

/**
 * Displays a summary card with project, agreement, and procurement shop details.
 *
 * @param {object} props - The component's props.
 * @param {ResearchProject} props.selectedResearchProject The selected research project object.
 * @param {Agreement} props.selectedAgreement - The selected agreement object.
 * @param {ProcurementShop} props.selectedProcurementShop - The selected procurement shop object.
 * @returns {React.ReactElement} - The rendered summary card component.
 */
export const ProjectAgreementSummaryCard = ({
    selectedResearchProject,
    selectedAgreement,
    selectedProcurementShop
}) => {
    return (
        <div
            className="bg-base-lightest font-family-sans border-1px border-base-light radius-sm margin-y-7"
            data-cy="project-agreement-summary-box"
        >
            <dl className="margin-0 padding-y-2 padding-x-3">
                <dt className="margin-0">Project</dt>
                <dd
                    className="margin-0 text-bold margin-top-1"
                    style={{ fontSize: "1.375rem" }}
                >
                    {selectedResearchProject?.title}
                </dd>
                {selectedAgreement?.name && (
                    <>
                        <dt className="margin-0 margin-top-205">Agreement</dt>
                        <dd
                            className="margin-0 text-bold margin-top-1"
                            style={{ fontSize: "1.375rem" }}
                        >
                            {selectedAgreement.name}
                        </dd>
                    </>
                )}
            </dl>
            <dl className="display-flex margin-top-205 font-12px padding-x-3">
                <div>
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    <dd className="margin-0 text-semibold">{selectedProcurementShop?.abbr}</dd>
                </div>
                <div className="margin-left-5">
                    <dt className="margin-0 text-base-dark">Current Fee Rate</dt>
                    <dd className="margin-0 text-semibold">
                        {selectedProcurementShop?.fee_percentage ?? selectedProcurementShop?.fee}%
                    </dd>
                </div>
            </dl>
        </div>
    );
};

export default ProjectAgreementSummaryCard;
