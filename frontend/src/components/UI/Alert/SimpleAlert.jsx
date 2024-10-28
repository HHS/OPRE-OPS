import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
    @typedef {Object} SimpleAlertProps
    @property {React.ReactNode} [children] - The child elements to render inside the alert. - optional
    @property {string} heading - The heading text for the alert.
    @property {string} message - The message text for the alert.
    @property {"success" | "warning" | "error" | "emergency" | "info"} type - The type of alert to display.
    @property {boolean} [isClosable] - Whether the alert is closable. - optional
    @property {boolean} [isAlertVisible] - Whether the alert is visible.
    @property {Function} [setIsAlertVisible] - The function to set the alert visibility.
*/

/**
 * @component - A simple alert component.
 * @param {SimpleAlertProps} props - The props for the component.
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
        case "info":
            classNames += " usa-alert--info";
            break;
        case "success":
            classNames += " usa-alert--success";
            break;
        case "warning":
            classNames += " usa-alert--warning";
            break;
        case "error":
            classNames += " usa-alert--error";
            break;
        case "emergency":
            classNames += " usa-alert--emergency";
            break;
        default:
    }

    const handleRole = () => {
        if (type === "emergency" || type === "error") {
            return "alert";
        }
        if (type === "success") {
            return "status";
        }
        return "";
    };

    return isAlertVisible ? (
        <div
            className={classNames}
            role={handleRole()}
            data-cy="alert"
            data-testid="alert"
        >
            <div
                className="usa-alert__body"
                style={{ flexDirection: "row", justifyContent: "space-between" }}
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

export default SimpleAlert;
