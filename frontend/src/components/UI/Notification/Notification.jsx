import customStyles from "./Notification.module.css";
import { timeAgo } from "../../../helpers/utils.js";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Renders a notification item.
 * @param {Object} props - The component props.
 * @param {Object} props.data - The notification data.
 * @param {string} props.data.title - The notification title.
 * @param {string} props.data.message - The notification message.
 * @param {string} props.data.created_on - The notification creation date.
 * @returns {JSX.Element} - The rendered component.
 */
export const Notification = ({ data }) => {
    return (
        <li className={customStyles.notificationListItem} id="notification-center-list">
            <div className="display-flex flex-justify">
                <span className="text-bold">{data.title}</span>
                <span className="font-12px display-flex flex-align-center">
                    <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1 text-base-dark" />
                    <span className="text-base-dark">{timeAgo(data.created_on)}</span>
                </span>
            </div>
            <div>
                <p>{data.message}</p>
            </div>
            <div>
                <hr className="height-1px bg-brand-neutral-lighter" />
            </div>
        </li>
    );
};
export default Notification;
