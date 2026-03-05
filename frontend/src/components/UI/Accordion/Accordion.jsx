import React from "react";
import accordion from "@uswds/uswds/js/usa-accordion";
/**
 * Renders an accordion component with a heading and content.
 *
 * This is an uncontrolled component - the `isClosed` prop sets the initial state only.
 * After mount, the component manages its own open/closed state via user clicks.
 *
 * Note: USWDS JavaScript (usa-accordion.js) also manipulates the DOM directly for
 * accordion behavior. The React state and USWDS DOM manipulation work together to
 * provide the accordion functionality.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.heading - The heading content for the accordion.
 * @param {React.ReactNode} props.children - The content to display in the accordion.
 * @param {number} [props.level=4] - The heading level for the accordion. Defaults to 4.
 * @param {boolean} [props.isClosed=false] - Initial closed state (only used on mount).
 * @param {string} [props.id] - Optional id for anchor linking.
 * @param {string} [props.dataCy] - Data attribute for testing.
 * @param {(isOpen: boolean) => void} [props.onToggle] - Optional callback fired on toggle.
 * @returns {JSX.Element} - The rendered accordion component.
 */
const Accordion = ({ heading, children, level = 4, isClosed = false, id, dataCy, onToggle }) => {
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
            id={id}
            className={`usa-accordion ${isOpen ? "padding-bottom-6" : ""}`}
            style={{ lineHeight: "inherit" }}
            ref={accordionRef}
            data-cy={dataCy}
        >
            <AccordionHeading className="usa-accordion__heading">
                <button
                    type="button"
                    className="usa-accordion__button bg-brand-base-light-variant"
                    aria-expanded={isOpen}
                    aria-controls={accordionId}
                    onClick={() =>
                        setIsOpen((prevIsOpen) => {
                            const nextIsOpen = !prevIsOpen;
                            onToggle?.(nextIsOpen);
                            return nextIsOpen;
                        })
                    }
                >
                    {heading}
                </button>
            </AccordionHeading>
            <div
                id={accordionId}
                className="usa-accordion__content padding-x-0 overflow-visible"
                hidden={!isOpen}
            >
                {children}
            </div>
        </div>
    );
};

export default Accordion;
