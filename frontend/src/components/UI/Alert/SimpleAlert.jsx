/**
 * A simple alert component.
 * @param {Object} props - The props object.
 * @param {React.ReactNode} [props.children] - The child elements to render inside the alert. - optional
 * @param {string} props.heading - The heading text for the alert.
 * @param {string} props.message - The message text for the alert.
 * @param {string} props.type - The type of alert to display (success, warning, or error).
 * @returns {JSX.Element} - The rendered alert component.
 */
export const SimpleAlert = ({ children, heading, message, type }) => {
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
        <div className={classNames} role="status" data-cy="alert">
            <div className="usa-alert__body display-flex flex-justify">
                <div>
                    <h1 className="usa-alert__heading">{heading}</h1>
                    <p className="usa-alert__text">{message}</p>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SimpleAlert;
