import PropTypes from "prop-types";
import Accordion from "../../UI/Accordion";
import ServicesComponentMetadata from "../ServicesComponentMetadata";
import { useGetServicesComponentDisplayTitle } from "../../../hooks/useServicesComponents.hooks";

/**
 * ServicesComponentAccordion is a component that wraps its children in an Accordion UI component.
 * The Accordion's heading is determined by the servicesComponentId prop.
 * If the servicesComponentId corresponds to a "TBD" title, the heading is set to "BLs not associated with a Services Component".
 * @component
 * @param {Object} props - The properties passed to this component.
 * @param {number} [props.servicesComponentId] - The ID of the services component.
 * @param {boolean} [props.withMetadata] - Whether to display metadata.
 * @param {string} [props.periodStart] - The start date of the period of performance.
 * @param {string} [props.periodEnd] - The end date of the period of performance.
 * @param {string} [props.description] - The description of the services component.
 * @param {React.ReactNode} props.children - The child elements to be wrapped in the Accordion.
 * @returns {JSX.Element} - The rendered component.
 */
function ServicesComponentAccordion({
    servicesComponentId,
    withMetadata = false,
    periodStart = "",
    periodEnd = "",
    description = "",
    children
}) {
    let servicesComponentDisplayTitle = useGetServicesComponentDisplayTitle(servicesComponentId);
    if (servicesComponentDisplayTitle === "TBD") {
        servicesComponentDisplayTitle = "BLs not associated with a Services Component";
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

ServicesComponentAccordion.propTypes = {
    servicesComponentId: PropTypes.number,
    withMetadata: PropTypes.bool,
    periodStart: PropTypes.string,
    periodEnd: PropTypes.string,
    description: PropTypes.string,
    children: PropTypes.node.isRequired
};
export default ServicesComponentAccordion;
