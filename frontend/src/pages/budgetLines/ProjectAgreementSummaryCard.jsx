export const ProjectAgreementSummaryCard = ({
    selectedResearchProject,
    selectedAgreement,
    selectedProcurementShop,
}) => {
    const { title } = selectedResearchProject;
    const { name: agreementName } = selectedAgreement;
    const { fee, name: procurementShopName } = selectedProcurementShop;

    return (
        <div
            className="bg-base-lightest font-family-sans border-1px border-base-light radius-sm margin-top-4"
            // style={{ width: "23.9375rem", minHeight: "11.75rem" }}
        >
            <dl className="margin-0 padding-y-2 padding-x-3">
                <dt className="margin-0 text-base-dark">Project</dt>
                <dd className="text-semibold margin-0 text-bold font-sans-lg">{title}</dd>
                <dt className="margin-0 text-base-dark">Agreement</dt>
                <dd className="text-semibold margin-0 text-bold font-sans-lg">{agreementName}</dd>
                <div className="display-flex">
                    <div>
                        <dt className="margin-0 text-base-dark">Procurement Shop</dt>
                        <dd className="text-semibold margin-0 text-bold">{procurementShopName}</dd>
                    </div>
                    <div className="margin-left-4">
                        <dt className="margin-0 text-base-dark">Fee Rate</dt>
                        <dd className="text-semibold margin-0 text-bold">{fee}%</dd>
                    </div>
                </div>
            </dl>
        </div>
    );
};
