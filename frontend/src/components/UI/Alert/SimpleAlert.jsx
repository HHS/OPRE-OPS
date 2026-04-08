import React from "react";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
    @typedef {Object} SimpleAlertProps
    @property {React.ReactNode} [children] - The child elements to render inside the alert. - optional
    @property {string} [heading] - The heading text for the alert. - optional
    @property {string} message - The message text for the alert.
    @property {"success" | "warning" | "error" | "emergency" | "info"} type - The type of alert to display.
    @property {boolean} [isClosable] - Whether the alert is closable. - optional
    @property {boolean} [isAlertVisible] - Whether the alert is visible.
    @property {Function} [setIsAlertVisible] - The function to set the alert visibility.
    @property {number} [headingLevel=4] - Heading level (1-6), defaults to 4
*/

/**
 * @component - A simple alert component.
 * @param {SimpleAlertProps} props - The props for the component.
 * @returns {React.ReactElement | null} - The rendered alert component.
 */
const SimpleAlert = ({
    children,
    heading,
    message,
    type,
    isClosable = false,
    isAlertVisible = true,
    setIsAlertVisible = () => {},
    headingLevel = 4
}) => {
    // Validate heading level (1-6)
    const parsedLevel = typeof headingLevel === "number" ? headingLevel : parseInt(headingLevel);
    const level = isNaN(parsedLevel) ? 4 : Math.max(1, Math.min(6, parsedLevel));
    const headingTag = `h${level}`;

    let classNames = "usa-alert margin-left-neg-4 margin-right-neg-4 margin-top-2 margin-bottom-2";

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
                    {heading &&
                        React.createElement(
                            headingTag,
                            { className: "usa-alert__heading" },
                            heading
                        )}
                    <p
                        className="usa-alert__text"
                        style={{ whiteSpace: "pre-wrap" }}
                    >
                        {message}
                    </p>
                    {children}
                </div>
                {isClosable && (
                    <FontAwesomeIcon
                        icon={faClose}
                        className="height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                        aria-label="close"
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
