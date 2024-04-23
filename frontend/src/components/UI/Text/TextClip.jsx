import PropTypes from "prop-types";
import React from "react";
import USWDS from "@uswds/uswds/js";
import styles from "./TextClip.module.scss";

const { tooltip } = USWDS;

/**
 * The TextClip component is a layout component to limit text to two lines and provide the full value in a tooltip
 * @component
 * @param {object} props - The component props.
 * @param {string} [props.text] - The text
 * @param {string} [props.maxLines] - optional (default 2), the number of lines to display, default is 2
 * @param {number} [props.tooltipThreshold] - optional (default 50), minimum character length to add the enhanced tooltip
 * @returns {JSX.Element} - The rendered component
 **/
const TextClip = ({ text, maxLines = 2, tooltipThreshold = 40 }) => {
    const tooltipEnabled = text?.length > tooltipThreshold;
    const tooltipRef = React.useRef();

    React.useEffect(() => {
        if (tooltipEnabled) {
            // initialize
            tooltip.on(tooltipRef.current);
            // remove event listeners when the component un-mounts.
            return () => {
                tooltip.off();
            };
        }
    });
    return (
        <span
            ref={tooltipRef}
            className={`${tooltipEnabled ? "usa-tooltip" : ""} ${styles.limitedLinesWithEllipsis}`}
            style={{ WebkitLineClamp: maxLines }}
            title={text}
            data-position="right"
        >
            {text}
        </span>
    );
};

TextClip.propTypes = {
    text: PropTypes.string.isRequired,
    maxLines: PropTypes.number,
    tooltipThreshold: PropTypes.number
};

export default TextClip;
