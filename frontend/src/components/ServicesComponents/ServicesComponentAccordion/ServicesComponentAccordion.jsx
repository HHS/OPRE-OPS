import PropTypes from "prop-types";
import Accordion from "../../UI/Accordion";
import Tag from "../../UI/Tag";
import { useGetServicesComponentDisplayTitle } from "../../../hooks/useServicesComponents.hooks";
import { dateToYearMonthDay } from "../servicesComponents.helpers";

/**
 * ServicesComponentAccordion is a component that wraps its children in an Accordion UI component.
 * The Accordion's heading is determined by the servicesComponentId prop.
 * If the servicesComponentId corresponds to a "TBD" title, the heading is set to "BLs not associated with a Services Component".
 * @component
 * @param {Object} props - The properties passed to this component.
 * @param {number} props.servicesComponentId - The ID of the services component.
 * @param {boolean} props.withMetadata - Whether to display metadata.
 * @param {string} props.periodStart - The start date of the period of performance.
 * @param {string} props.periodEnd - The end date of the period of performance.
 * @param {string} props.description - The description of the services component.
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
    const { year: popStartYear, month: popStartMonth, day: popStartDay } = dateToYearMonthDay(periodStart);
    const { year: popEndYear, month: popEndMonth, day: popEndDay } = dateToYearMonthDay(periodEnd);

    return (
        <Accordion
            heading={servicesComponentDisplayTitle}
            level={3}
        >
            {withMetadata && (
                <section className="margin-top-0">
                    <dl className="display-flex font-12px">
                        <div>
                            <dt className="margin-0 text-base-dark margin-top-1px">Period of Performance - Start</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag tagStyle="primaryDarkTextLightBackground">
                                    {popStartYear && popStartMonth && popStartDay
                                        ? `${popStartMonth}/${popStartDay}/${popStartYear}`
                                        : "TBD"}
                                </Tag>
                            </dd>
                        </div>
                        <div className="margin-left-4">
                            <dt className="margin-0 text-base-dark margin-top-1px">Period of Performance - End</dt>
                            <dd className="margin-0 margin-top-1">
                                <Tag tagStyle="primaryDarkTextLightBackground">
                                    {popEndYear && popEndMonth && popEndDay
                                        ? `${popEndMonth}/${popEndDay}/${popEndYear}`
                                        : "TBD"}
                                </Tag>
                            </dd>
                        </div>
                        <div
                            className="margin-left-8"
                            style={{ width: "25rem" }}
                        >
                            <dt className="margin-0 text-base-dark margin-top-1px">Description</dt>
                            <dd className="margin-0 margin-top-05 text-semibold">{description}</dd>
                        </div>
                    </dl>
                </section>
            )}
            {children}
        </Accordion>
    );
}

ServicesComponentAccordion.propTypes = {
    servicesComponentId: PropTypes.number.isRequired,
    withMetadata: PropTypes.bool,
    periodStart: PropTypes.string,
    periodEnd: PropTypes.string,
    description: PropTypes.string,
    children: PropTypes.node.isRequired
};
export default ServicesComponentAccordion;
