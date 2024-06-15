import React from "react";
import PropTypes from "prop-types";
import tooltip from "@uswds/uswds/js/usa-tooltip";

/**
 * A tooltip is a short descriptive message that appears when a user hovers or focuses on an element.
 * @component
 * @param {object} props - the component props
 * @param {string} props.label - the content of the tooltip
 * @param {("top" | "right" | "bottom" | "left")} [props.position] - where the tooltip should be placed (if possible), default is "top"
 * @param {string} [props.className] - the className for the span container, optional
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */

export const Tooltip = ({ label, position = "top", children, className }) => {
    const tooltipRef = React.useRef(null);
    React.useLayoutEffect(() => {
        // Ensure tooltipRef.current is not null and tooltip is defined
        const tooltipElement = tooltipRef.current?.firstChild;
        if (tooltipElement && tooltip) {
            tooltipElement.classList.add("usa-tooltip");
            tooltipElement.title = label;
            tooltipElement.setAttribute("data-position", position);
            tooltip.on(tooltipElement);

            // Cleanup function now safely checks if tooltip is available
            return () => {
                if (tooltip) {
                    tooltip.off(tooltipElement);
                }
            };
        }
        // If tooltipElement or tooltip is not available, return a no-op cleanup function
        return () => {};
    }, [label, position, tooltip]); // Add dependencies to ensure effect runs only if these values change
    return (
        <span
            ref={tooltipRef}
            className={className}
        >
            {children}
        </span>
    );
};

Tooltip.propTypes = {
    label: PropTypes.string.isRequired,
    position: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Tooltip;
