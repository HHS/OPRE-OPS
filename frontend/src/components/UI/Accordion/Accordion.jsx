import React from "react";
import PropTypes from "prop-types";
import accordion from "@uswds/uswds/js/usa-accordion";
/**
 * Renders an accordion component with a heading and content.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading text for the accordion.
 * @param {number} [props.level=4] - The heading level for the accordion. Defaults to 4.
 * @param {React.ReactNode} props.children - The content to display in the accordion.
 * @returns {JSX.Element} - The rendered accordion component.
 */
const Accordion = ({ heading, level = 4, children }) => {
    const accordionId = React.useId();
    const AccordionHeading = `h${level}`;

    // Ensure accordion JS is loaded
    const accordionRef = React.useRef(null);
    React.useEffect(() => {
        const accordionElement = accordionRef.current;
        /* v8 ignore else */
        if (accordionElement) {
            accordionElement.querySelectorAll("button").forEach((elem) => {
                accordion.on(elem);
            });
        }

        // Ensure cleanup after the effect
        return () => {
            /* v8 ignore else */
            if (accordionElement) {
                accordionElement.querySelectorAll("button").forEach((elem) => {
                    accordion.off(elem);
                });
            }
        };
    });

    if (typeof level !== "number" || level < 1 || level > 6) {
        throw new Error(`Unrecognized heading level: ${level}`);
    }

    return (
        <div
            className="usa-accordion padding-bottom-6"
            style={{ lineHeight: "inherit" }}
            ref={accordionRef}
        >
            <AccordionHeading className="usa-accordion__heading">
                <button
                    type="button"
                    className="usa-accordion__button bg-brand-base-light-variant"
                    aria-expanded={true}
                    aria-controls={accordionId}
                >
                    {heading}
                </button>
            </AccordionHeading>
            <div
                id={accordionId}
                className="usa-accordion__content padding-x-0 overflow-visible"
            >
                {children}
            </div>
        </div>
    );
};

Accordion.propTypes = {
    heading: PropTypes.string.isRequired,
    level: PropTypes.number,
    children: PropTypes.node.isRequired
};

export default Accordion;
