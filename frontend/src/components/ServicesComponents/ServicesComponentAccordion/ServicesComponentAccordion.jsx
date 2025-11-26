import Accordion from "../../UI/Accordion";
import ServicesComponentMetadata from "../ServicesComponentMetadata";
import { formatServiceComponent } from "../ServicesComponents.helpers";

/**
 * @component ServicesComponentAccordion is a component that wraps its children in an Accordion UI component.
 * @param {Object} props - The properties passed to this component.
 * @param {number} props.servicesComponentNumber - The number of the services component.
 * @param {'NON_SEVERABLE' | 'SEVERABLE'} props.serviceRequirementType - The type of service requirement.
 * @param {boolean} [props.withMetadata] - Whether to display metadata.
 * @param {string} [props.periodStart] - The start date of the period of performance.
 * @param {string} [props.periodEnd] - The end date of the period of performance.
 * @param {string} [props.description] - The description of the services component.
 * @param {string} [props.serviceComponentGroupingLabel] - The serviceComponentGroupingLabel of the services component.
 * @param {boolean} [props.optional] - Whether the services component is optional.
 * @param {React.ReactNode} props.children - The child elements to be wrapped in the Accordion.
 * @returns {JSX.Element} - The rendered component.
 */
function ServicesComponentAccordion({
    servicesComponentNumber,
    serviceRequirementType,
    withMetadata = false,
    periodStart = "",
    periodEnd = "",
    description = "",
    optional = false,
    serviceComponentGroupingLabel = "",
    children
}) {
    const servicesComponentDisplayTitle =
        servicesComponentNumber === 0
            ? "BLs not associated with a Services Component"
            : formatServiceComponent(
                  servicesComponentNumber,
                  optional,
                  serviceRequirementType,
                  false,
                  serviceComponentGroupingLabel
              );

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
