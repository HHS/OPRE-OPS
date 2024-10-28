import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

/**
 * A simple alert component.
 * @param {Object} props - The props object.
 * @param {React.ReactNode} [props.children] - The child elements to render inside the alert. - optional
 * @param {string} props.heading - The heading text for the alert.
 * @param {string} props.message - The message text for the alert.
 * @param {string} props.type - The type of alert to display.
 * @param {boolean} [props.isClosable] - Whether the alert is closable. - optional
 * @param {boolean} [props.isAlertVisible] - Whether the alert is visible.
 * @param {Function} [props.setIsAlertVisible] - The function to set the alert visibility.
 * @returns {JSX.Element | null} - The rendered alert component.
 */
const SimpleAlert = ({
    children,
    heading,
    message,
    type,
    isClosable = false,
    isAlertVisible = true,
    setIsAlertVisible = () => {}
}) => {
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

    return isAlertVisible ? (
        <div
            className={classNames}
            role="status"
            data-cy="alert"
        >
            <div
                className="usa-alert__body display-flex flex-justify"
                style={{ flexDirection: "row" }}
            >
                <div>
                    <h1 className="usa-alert__heading">{heading}</h1>
                    <p className="usa-alert__text">{message}</p>
                    {children}
                </div>
                {isClosable && (
                    <FontAwesomeIcon
                        icon={faClose}
                        className="height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                        title="close"
                        data-position="top"
                        data-cy="close-alert"
                        onClick={() => {
                            setIsAlertVisible(false);
                        }}
                    />
                )}
            </div>
        </div>
    ) : null;
};

SimpleAlert.propTypes = {
    children: PropTypes.node,
    heading: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "warning", "error"]).isRequired,
    isClosable: PropTypes.bool,
    isAlertVisible: PropTypes.bool,
    setIsAlertVisible: PropTypes.func
};

export default SimpleAlert;
