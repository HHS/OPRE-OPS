import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import PropTypes from "prop-types";
import { timeAgo } from "../../../helpers/utils.js";
import styles from "./ListItem.module.css";

/**
 * Renders a List item
 * @param {Object} props - The component props.
 * @param {string} props.title - The list item title.
 * @param {string} props.message - The list item message.
 * @param {string} props.createdOn - The list item creation date.
 * @param {string} props.variant - The list item variant.
 * @returns {JSX.Element} - The rendered component.
 */
export const ListItem = ({ title, createdOn, message, variant }) => {
    return (
        <li className={styles.notificationListItem} id="notification-center-list">
            <div className="display-flex flex-justify">
                <span className="text-bold">{title}</span>
                <span className="font-12px display-flex flex-align-center">
                    <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1 text-base-dark" />
                    <span className="text-base-dark">{timeAgo(createdOn)}</span>
                </span>
            </div>
            <p>{message}</p>
            {variant === "condensed" ? null : <hr className="height-1px bg-brand-neutral-lighter" />}
        </li>
    );
};

ListItem.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    createdOn: PropTypes.string.isRequired,
};

export default ListItem;
