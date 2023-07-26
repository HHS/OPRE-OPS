import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import PropTypes from "prop-types";
import { timeAgo } from "../../../helpers/utils.js";
import styles from "./LogItem.module.css";

/**
 * Renders a Log item
 * @param {Object} props - The component props.
 * @param {string} props.title - The Log item title.
 * @param {string} props.message - The Log item message.
 * @param {string} props.createdOn - The Log item creation date.
 * @param {string} [props.variant] - The Log item variant.
 * @param {boolean} [props.withSeparator] - The Log item separator.
 * @returns {JSX.Element} - The rendered component.
 */
export const LogItem = ({ title, message, createdOn, variant, withSeparator = false }) => {
    const isLarge = variant === "large";

    return (
        <li className={`${isLarge ? "font-body-sm" : "font-12px"} ${styles.notificationListItem}`}>
            <div className="display-flex flex-justify">
                <span className={`text-bold ${isLarge ? "font-body-sm" : undefined}`}>{title}</span>
                <span className="display-flex flex-align-center">
                    <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1 text-base-dark" />
                    <span className="text-base-dark">{timeAgo(createdOn)}</span>
                </span>
            </div>
            <p className={`margin-0 margin-y-1 line-height-sans-2 ${isLarge ? "font-body-sm" : undefined}`}>
                {message}
            </p>
            {withSeparator ? <hr className="height-1px bg-brand-neutral-lighter margin-bottom-1" /> : null}
        </li>
    );
};

LogItem.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    createdOn: PropTypes.string.isRequired,
    variant: PropTypes.string,
    withSeparator: PropTypes.bool,
};

export default LogItem;
