import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

/**
 * A component that displays an alert.
 * @param {object} props - The component props.
 * @param {("success"|"warning"|"error")} props.type - The type of the alert to be styled.
 * @param {string} props.heading - The heading of the alert.
 * @param {string} props.children - The message of the alert.
 * @param {function} props.setIsAlertActive - A function that sets whether the alert is active.
 * @returns {JSX.Element} The JSX element to render.
 * @see {@link https://designsystem.digital.gov/components/alerts/}
 */
export const Alert = ({ type, heading, children, setIsAlertActive }) => {
    let classNames = "usa-alert margin-left-neg-4 margin-right-neg-4";

    switch (type) {
        case "success":
            classNames += " usa-alert--success";
            break;
        case "warning":
            classNames += " usa-alert--warning";
            break;
        case "error":
            classNames += " usa-alert--error";
            break;
        default:
    }

    return (
        <div className={classNames}>
            <div className="usa-alert__body display-flex flex-justify">
                <div>
                    <h1 className="usa-alert__heading">{heading}</h1>
                    <p className="usa-alert__text">{children}</p>
                </div>
                <FontAwesomeIcon
                    icon={faClose}
                    className="height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                    title="close"
                    data-position="top"
                    onClick={() => setIsAlertActive(false)}
                />
            </div>
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(["success", "warning", "error"]),
    heading: PropTypes.string.isRequired,
    children: PropTypes.node,
    setIsAlertActive: PropTypes.func.isRequired,
};

export default Alert;
