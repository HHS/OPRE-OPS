import PropTypes from "prop-types";
import { useGetServicesComponentDisplayTitle } from "../../../hooks/useServicesComponents.hooks";
import Accordion from "../../UI/Accordion";

/**
 * ServicesComponentAccordion is a component that wraps its children in an Accordion UI component.
 * The Accordion's heading is determined by the servicesComponentId prop.
 * If the servicesComponentId corresponds to a "TBD" title, the heading is set to "BLs not associated with a Services Component".
 * @component
 * @param {Object} props - The properties passed to this component.
 * @param {number} props.servicesComponentId - The ID of the services component.
 * @param {React.ReactNode} props.children - The child elements to be wrapped in the Accordion.
 * @returns {JSX.Element} - The rendered component.
 */
function ServicesComponentAccordion({ servicesComponentId, children }) {
    let servicesComponentDisplayTitle = useGetServicesComponentDisplayTitle(servicesComponentId);
    if (servicesComponentDisplayTitle === "TBD") {
        servicesComponentDisplayTitle = "BLs not associated with a Services Component";
    }

    return (
        <Accordion
            heading={servicesComponentDisplayTitle}
            level={3}
        >
            {children}
        </Accordion>
    );
}

ServicesComponentAccordion.propTypes = {
    servicesComponentId: PropTypes.number.isRequired,
    children: PropTypes.node.isRequired
};
export default ServicesComponentAccordion;
