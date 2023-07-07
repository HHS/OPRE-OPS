import customStyles from "./Notification.module.css";
import { timeAgo } from "../../../helpers/utils.js";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const Notification = ({ data }) => {
    return (
        <li className={customStyles.notificationListItem}>
            <div className={customStyles.flexContainer}>
                <span className={customStyles.notificationHeader}>{data.title}</span>
                <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1" />
                <span className={customStyles.notificationDateTime}>{timeAgo(data.created_on)}</span>
            </div>
        </li>
    );
};
export default Notification;
