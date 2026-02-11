import React from "react";
import accordion from "@uswds/uswds/js/usa-accordion";
/**
 * Renders an accordion component with a heading and content.
 * @component
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.heading - The heading content for the accordion.
 * @param {React.ReactNode} props.children - The content to display in the accordion.
 * @param {number} [props.level=4] - The heading level for the accordion. Defaults to 4.
 * @param {boolean} [props.isClosed]
 * @param {string} [props.dataCy]
 * @returns {JSX.Element} - The rendered accordion component.
 */
const Accordion = ({ heading, children, level = 4, isClosed = false, dataCy }) => {
    const accordionId = React.useId();
    const AccordionHeading = `h${level}`;
    const [isOpen, setIsOpen] = React.useState(!isClosed);

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
            className={`usa-accordion ${!isOpen ? "" : "padding-bottom-6"}`}
            style={{ lineHeight: "inherit" }}
            ref={accordionRef}
            data-cy={dataCy}
        >
            <AccordionHeading className="usa-accordion__heading">
                <button
                    type="button"
                    className="usa-accordion__button bg-brand-base-light-variant"
                    aria-expanded={!isClosed}
                    aria-controls={accordionId}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {heading}
                </button>
            </AccordionHeading>
            <div
                id={accordionId}
                className="usa-accordion__content padding-x-0 overflow-visible"
                hidden={isClosed}
            >
                {children}
            </div>
        </div>
    );
};

export default Accordion;
