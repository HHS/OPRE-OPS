import PropTypes from "prop-types";
import styles from "./TableCellText.module.scss";

/**
 * The TableCellText component is a layout component to limit text to two lines and provide the full value in a tooltip
 * @param {object} props - The component props.
 * @param {string} [props.text] - The text
 * @returns {React.JSX.Element} - The rendered component
 **/
const TableCellText = ({ text }) => {
    return (
        <span
            className={`usa-tooltip ${styles.limitedToTwoLines}`}
            title={text}
            data-position="bottom"
        >
            {text}
        </span>
    );
};

TableCellText.propTypes = {
    text: PropTypes.string.isRequired
};

export default TableCellText;
