import BenefitsCardsGrid from "../BenefitsCardsGrid";

/**
 * @component - "OPS Benefits" tab content for the redesigned homepage. Reuses the
 * existing benefits card grid with a left-aligned header matching the other tabs,
 * instead of the legacy centered header + flourish-image divider.
 * @returns {React.ReactElement}
 */
const OpsBenefitsContent = () => (
    <>
        <h2>OPS Benefits</h2>
        <p>
            OPS brings everyone together for transparent and collaborative budget planning and tracking. Explore more
            details below.
        </p>
        <BenefitsCardsGrid />
    </>
);

export default OpsBenefitsContent;
