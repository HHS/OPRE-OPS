import icons from "../../../uswds/img/sprite.svg";

/**
 * @typedef {Object} SlimAlertProps
 * @property {"info" | "success" | "warning" | "error" | "emergency"| "last-data-update"} type - The type of alert to display.
 * @property {string} [message] - The message to display in the alert.
 * @property {string} [updateDate] - The date to display in the alert.
 */

/**
 * @param {SlimAlertProps} props - The props for the SlimAlert component.
 * @returns {React.ReactElement} - The rendered SlimAlert component.
 */
const SlimAlert = ({ type, message="", updateDate=new Date().toLocaleDateString() }) => {
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
        case "last-data-update":
            classNames += " bg-brand-secondary-lighter border-left-0";
            break;
        default:
    }
    return (
        <div
            className={`usa-alert margin-0 ${classNames}`}
            role="alert"
        >
            <div className="usa-alert__body">
                {message ? (
                    <p className="usa-alert__text">{message}</p>
                ) : (
                    <div className="display-flex flex-align-center">
                        <svg
                className="usa-icon height-205 width-205 text-ink margin-right-1"
                id="last-data-update-icon"
                aria-label="Last data update"
                role="img"
            >
                <use href={`${icons}#campaign`}></use>
            </svg>
                    <p className="usa-alert__text">
                        Last data update was <span className="text-bold">{updateDate}</span> from the budget team’s
                        spreadsheet. Changes submitted before this date should be included.
                    </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlimAlert;
