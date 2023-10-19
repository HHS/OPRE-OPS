import PropTypes from "prop-types";
import styles from "./TextClip.module.scss";

/**
 * The TextClip component is a layout component to limit text to two lines and provide the full value in a tooltip
 * @param {object} props - The component props.
 * @param {string} [props.text] - The text
 * @param {string} [props.maxLines] - optional, the number of lines to display, default is 2
 * @returns {React.JSX.Element} - The rendered component
 **/
const TextClip = ({ text, maxLines = 2 }) => {
    return (
        <span
            className={`usa-tooltip ${styles.limitedLinesWithEllipsis}`}
            style={{ WebkitLineClamp: maxLines }}
            title={text}
            data-position="bottom"
        >
            {text}
        </span>
    );
};

TextClip.propTypes = {
    text: PropTypes.string.isRequired,
    maxLines: PropTypes.number
};

export default TextClip;
