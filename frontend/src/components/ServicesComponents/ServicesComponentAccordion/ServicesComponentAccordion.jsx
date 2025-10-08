import Accordion from "../../UI/Accordion";
import ServicesComponentMetadata from "../ServicesComponentMetadata";
import { formatServiceComponent } from "../ServicesComponents.helpers";

/**
 * ServicesComponentAccordion is a component that wraps its children in an Accordion UI component.
 * The Accordion's heading is determined by the servicesComponentId prop.
 * If the servicesComponentId corresponds to a "TBD" title, the heading is set to "BLs not associated with a Services Component".
 * @component
 * @param {Object} props - The properties passed to this component.
 * @param {number} props.servicesComponentId - The ID of the services component.
 * @param {'NON_SEVERABLE' | 'SEVERABLE'} props.serviceRequirementType - The type of service requirement.
 * @param {boolean} [props.withMetadata] - Whether to display metadata.
 * @param {string} [props.periodStart] - The start date of the period of performance.
 * @param {string} [props.periodEnd] - The end date of the period of performance.
 * @param {string} [props.description] - The description of the services component.
 * @param {React.ReactNode} props.children - The child elements to be wrapped in the Accordion.
 * @returns {JSX.Element} - The rendered component.
 */
function ServicesComponentAccordion({
    servicesComponentId,
    serviceRequirementType,
    withMetadata = false,
    periodStart = "",
    periodEnd = "",
    description = "",
    children
}) {
    // let servicesComponentDisplayTitle = useGetServicesComponentDisplayTitle(servicesComponentId);
    let servicesComponentDisplayTitle = "";
    if (servicesComponentId === 0) {
        servicesComponentDisplayTitle = "BLs not associated with a Services Component";
    } else {
        servicesComponentDisplayTitle = formatServiceComponent(servicesComponentId, false, serviceRequirementType);
    }

    return (
        <Accordion
            heading={servicesComponentDisplayTitle}
            level={3}
        >
            {withMetadata && (
                <ServicesComponentMetadata
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    description={description}
                />
            )}
            {children}
        </Accordion>
    );
}

export default ServicesComponentAccordion;
