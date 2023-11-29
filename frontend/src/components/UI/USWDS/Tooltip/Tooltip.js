import React, {Fragment, useLayoutEffect, useRef} from "react"
import tooltip from "@uswds/uswds/js/usa-tooltip"
import PropTypes from "prop-types";
import Accordion from "../../Accordion";

/**
 * A tooltip is a short descriptive message that appears when a user hovers or focuses on an element.
 *
 * @param {string} label - the content of the tooltip
 * @param {("top" | "right" | "bottom" | "left")} position - where the tooltip should be placed (if possible), default is "top"
 * @param {string} className - the className for the span container, optional
 * @param {React.ReactNode} children
 * @returns {React.JSX.Element}
 * @constructor
 */

export const Tooltip = ({label, position = "top", children, className}) => {
    const tooltipRef = useRef(null)
    useLayoutEffect(() => {
        const tooltipElement = tooltipRef.current?.firstChild
        if (tooltipElement) {
            tooltipElement.classList.add("usa-tooltip");
            tooltipElement.title = label;
            tooltipElement.setAttribute("data-position", position);
            tooltip.on(tooltipElement);
        }
        return () => tooltip.off(tooltipElement)
    })
    return <span ref={tooltipRef} className={className}>{children}</span>
}

Tooltip.propTypes = {
    label: PropTypes.string.isRequired,
    position: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Tooltip
