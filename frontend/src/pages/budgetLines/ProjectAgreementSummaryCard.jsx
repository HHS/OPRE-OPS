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
            className="bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-sm margin-top-4"
            // style={{ width: "23.9375rem", minHeight: "11.75rem" }}
        >
            <dl>
                <dt>Project</dt>
                <dd>{title}</dd>
                <dt>Agreement</dt>
                <dd>{agreementName}</dd>
                <dt>Procurement Shop</dt>
                <dd>{procurementShopName}</dd>
                <dt>Fee Rate</dt>
                <dd>{fee}%</dd>
            </dl>
        </div>
    );
};
