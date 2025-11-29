import React from "react";
import tooltip from "@uswds/uswds/js/usa-tooltip";

/**
 * A tooltip is a short descriptive message that appears when a user hovers or focuses on an element.
 * @component
 * @param {object} props - the component props
 * @param {string} props.label - the content of the tooltip
 * @param {("top" | "right" | "bottom" | "left")} [props.position] - where the tooltip should be placed (if possible), default is "top"
 * @param {string} [props.className] - the className for the span container, optional
 * @param {React.ReactNode} props.children
 * @returns {React.ReactElement}
 * @note
 * The child element should be a valid HTML element that can have a tooltip applied to it.
 * The tooltip will be applied to the first child of the span container.
 */

const Tooltip = ({ label, position = "top", children, className }) => {
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
    }, [label, position]);

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
