import customStyles from "./Notification.module.css";
import { timeAgo } from "../../../helpers/utils.js";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const Notification = ({ data }) => {
    return (
        <li className={customStyles.notificationListItem}>
            <div className={customStyles.flexContainer}>
                <span className={`${customStyles.notificationHeader} text-bold`}>{data.title}</span>
                <span className={`${customStyles.notificationDateTimeGroup} font-12px`}>
                    <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1" />
                    <span>{timeAgo(data.created_on)}</span>
                </span>
            </div>
            <div>
                <p>{data.message}</p>
            </div>
            <div className={customStyles.hrContainer}>
                <hr className={customStyles.hrClass} />
            </div>
        </li>
    );
};
export default Notification;
