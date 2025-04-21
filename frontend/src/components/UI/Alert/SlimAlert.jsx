/**
 * @typedef {Object} SlimAlertProps
 * @property {"info" | "success" | "warning" | "error" | "emergency"} type - The type of alert to display.
 * @property {string} message - The message to display in the alert.
 */

/**
 * @param {SlimAlertProps} props - The props for the SlimAlert component.
 * @returns {JSX.Element} - The rendered SlimAlert component.
 */
const SlimAlert = ({ type, message }) => {
    let classNames = "usa-alert--slim";

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
    return (
        <div
            className={`usa-alert margin-0 ${classNames}`}
            role="alert"
        >
            <div className="usa-alert__body">
                <p className="usa-alert__text">{message}</p>
            </div>
        </div>
    );
};

export default SlimAlert;
