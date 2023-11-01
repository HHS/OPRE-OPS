import React from "react";
import PropTypes from "prop-types";
/**
 * Renders an accordion component with a heading and content.
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading text for the accordion.
 * @param {number} [props.level=4] - The heading level for the accordion. Defaults to 4.
 * @param {React.ReactNode} props.children - The content to display in the accordion.
 * @returns {React.JSX.Element} - The rendered accordion component.
 */
const Accordion = ({ heading, level = 4, children }) => {
    const accordionId = React.useId();
    const AccordionHeading = `h${level}`;

    if (typeof level !== "number" || level < 1 || level > 6) {
        throw new Error(`Unrecognized heading level: ${level}`);
    }

    return (
        <div
            className="usa-accordion padding-bottom-6"
            style={{ lineHeight: "inherit" }}
        >
            <AccordionHeading className="usa-accordion__heading">
                <button
                    type="button"
                    className="usa-accordion__button"
                    aria-expanded={true}
                    aria-controls={accordionId}
                >
                    {heading}
                </button>
            </AccordionHeading>
            <div
                id={accordionId}
                className="usa-accordion__content padding-x-0 overflow-hidden"
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
