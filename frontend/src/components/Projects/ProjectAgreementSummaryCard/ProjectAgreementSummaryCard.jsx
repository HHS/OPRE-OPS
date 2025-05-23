import PropTypes from "prop-types";

export const ProjectAgreementSummaryCard = ({
    selectedResearchProject = {},
    selectedAgreement = {},
    selectedProcurementShop = {}
}) => {
    const { title } = selectedResearchProject;
    const { name: agreementName } = selectedAgreement;
    const { fee_percentage, name: procurementShopName } = selectedProcurementShop;

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
                    {title}
                </dd>
                {selectedAgreement?.name && (
                    <>
                        <dt className="margin-0 margin-top-205">Agreement</dt>
                        <dd
                            className="margin-0 text-bold margin-top-1"
                            style={{ fontSize: "1.375rem" }}
                        >
                            {agreementName}
                        </dd>
                    </>
                )}
            </dl>
            <dl className="display-flex margin-top-205 font-12px padding-x-3">
                <div>
                    <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                    <dd className="margin-0 text-semibold">{procurementShopName}</dd>
                </div>
                <div className="margin-left-5">
                    <dt className="margin-0 text-base-dark">Fee Rate</dt>
                    <dd className="margin-0 text-semibold">{fee_percentage && `${fee_percentage}`}%</dd>
                </div>
            </dl>
        </div>
    );
};

ProjectAgreementSummaryCard.propTypes = {
    selectedResearchProject: PropTypes.shape({
        title: PropTypes.string
    }),
    selectedAgreement: PropTypes.oneOfType([
        PropTypes.shape({
            name: PropTypes.string
        }),
        PropTypes.number
    ]),

    selectedProcurementShop: PropTypes.shape({
        name: PropTypes.string,
        fee: PropTypes.number
    })
};

export default ProjectAgreementSummaryCard;
