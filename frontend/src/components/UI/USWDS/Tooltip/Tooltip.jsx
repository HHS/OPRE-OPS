import React from "react";
import tooltip from "@uswds/uswds/js/usa-tooltip";

/**
 * A tooltip is a short descriptive message that appears when a user hovers or focuses on an element.
 * @component
 * @param {object} props - the component props
 * @param {string} props.label - the content of the tooltip
 * @param {("top" | "right" | "bottom" | "left")} [props.position] - where the tooltip should be placed (if possible), default is "top"
 * @param {string} [props.className] - the className for the span container, optional
 * @param {("card" | "card-lg" | "mobile" | "mobile-lg" | "tablet" | "tablet-lg" | "desktop" | "desktop-lg" | "widescreen")} [props.maxWidth] - sizes the tooltip bubble to a USWDS `width-*` utility width and enables text wrapping, optional
 * @param {React.ReactNode} props.children
 * @returns {React.ReactElement}
 * @note
 * The child element should be a valid HTML element that can have a tooltip applied to it.
 * The tooltip will be applied to the first child of the span container.
 */

const Tooltip = ({ label, position = "top", children, className, maxWidth }) => {
    const tooltipRef = React.useRef(null);
    React.useLayoutEffect(() => {
        const tooltipElement = tooltipRef.current?.firstChild;

        if (tooltipElement && tooltip && label) {
            // Always reinitialize tooltip to ensure label updates properly
            // First, clean up existing tooltip if it exists
            if (tooltipElement.classList.contains("usa-tooltip")) {
                tooltip.off(tooltipElement);
                tooltipElement.classList.remove("usa-tooltip");
            }

            tooltipElement.classList.add("usa-tooltip");
            tooltipElement.title = label;
            tooltipElement.setAttribute("data-position", position);
            tooltip.on(tooltipElement);

            if (maxWidth) {
                // USWDS creates the tooltip body as a sibling of tooltipElement during tooltip.on() above,
                // so it can only be targeted once it exists in the DOM, not via a prop on this component.
                const tooltipBody = tooltipElement.parentElement?.querySelector(".usa-tooltip__body");
                // The tooltip body is absolutely positioned with an auto width, shrink-to-fit against a
                // containing block that's only as wide as the trigger itself — so a maxw-* utility alone
                // collapses the box down to its longest word instead of filling the available space.
                // width-* forces the intended size; USWDS's own wrap behavior does the same thing with
                // width: 100% + min-width: 50vw for the same reason.
                tooltipBody?.classList.add(`width-${maxWidth}`, "text-wrap");
            }

            return () => {
                if (tooltip && tooltipElement.classList.contains("usa-tooltip")) {
                    tooltip.off(tooltipElement);
                }
            };
        } else if (tooltipElement && !label) {
            // Clean up tooltip if no label
            if (tooltipElement.classList.contains("usa-tooltip")) {
                tooltip.off(tooltipElement);
                tooltipElement.classList.remove("usa-tooltip");
                tooltipElement.removeAttribute("title");
                tooltipElement.removeAttribute("data-position");
            }
        }
        return () => {};
    }, [label, position, maxWidth]);

    return (
        <span
            ref={tooltipRef}
            className={className}
        >
            {children}
        </span>
    );
};

export default Tooltip;
