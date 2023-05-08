import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

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

export default Alert;

Alert.propTypes = {
    type: PropTypes.oneOf(["success", "warning", "error"]),
    heading: PropTypes.string.isRequired,
    children: PropTypes.node,
    setIsAlertActive: PropTypes.func.isRequired,
};
