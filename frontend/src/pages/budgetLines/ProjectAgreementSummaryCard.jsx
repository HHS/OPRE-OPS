export const ProjectAgreementSummaryCard = ({
    selectedResearchProject,
    selectedAgreement,
    selectedProcurementShop,
}) => {
    const { title } = selectedResearchProject;
    const { name: agreementName } = selectedAgreement;
    const { fee, name: procurementShopName } = selectedProcurementShop;

    return (
        <div className="bg-base-lightest font-family-sans border-1px border-base-light radius-sm margin-y-7">
            <dl className="margin-0 padding-y-2 padding-x-3">
                <dt className="margin-0">Project</dt>
                <dd className="margin-0 text-bold margin-top-1" style={{ fontSize: "1.375rem" }}>
                    {title}
                </dd>
                <dt className="margin-0 margin-top-205">Agreement</dt>
                <dd className="margin-0 text-bold margin-top-1" style={{ fontSize: "1.375rem" }}>
                    {agreementName}
                </dd>
                <div className="display-flex margin-top-205 font-12px">
                    <div>
                        <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                        <dd className="margin-0 text-bold">{procurementShopName}</dd>
                    </div>
                    <div className="margin-left-5">
                        <dt className="margin-0 text-base-dark">Fee Rate</dt>
                        <dd className="margin-0 text-bold">{fee}%</dd>
                    </div>
                </div>
            </dl>
        </div>
    );
};
