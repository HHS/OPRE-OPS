import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReactMarkdown from "react-markdown";
import { timeAgo } from "../../../helpers/utils.js";
import styles from "./LogItem.module.css";

/**
 * Renders a Log item
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.title - The Log item title.
 * @param {string} props.message - The Log item message.
 * @param {string} props.createdOn - The Log item creation date.
 * @param {'large'} [props.variant] - The Log item variant. optional
 * @param {boolean} [props.withSeparator] - The Log item separator. optional
 * @param {React.ReactNode} [props.children] - The Log item children. optional
 * @returns {JSX.Element} - The rendered component.
 */
export const LogItem = ({ title, message, createdOn, variant, withSeparator = false, children }) => {
    const isLarge = variant === "large";

    return (
        <li className={`${isLarge ? "font-body-sm" : "font-12px"} ${styles.notificationListItem}`}>
            <div className="display-flex flex-justify margin-bottom-1">
                <span
                    className={`text-bold ${isLarge ? "font-body-sm" : ""}`}
                    data-cy="log-item-title"
                >
                    {title}
                </span>
                <span className="display-flex flex-align-center">
                    <FontAwesomeIcon
                        icon={faClock}
                        className="height-2 width-2 margin-right-1 text-base-dark"
                    />
                    <span className="text-base-dark">{timeAgo(createdOn)}</span>
                </span>
            </div>
            {message && (
                <article
                    className={`margin-0 line-height-sans-0 margin-y-1 ${isLarge ? "font-body-sm" : ""}`}
                    data-cy="log-item-message"
                >
                    <div className="margin-top-neg-1 margin-bottom-neg-1">
                        <ReactMarkdown>{message}</ReactMarkdown>
                    </div>
                </article>
            )}
            <div
                className="margin-bottom-1"
                data-cy="log-item-children"
            >
                {children}
            </div>

            {withSeparator && <hr className="height-1px bg-brand-neutral-lighter margin-bottom-1" />}
        </li>
    );
};

export default LogItem;
