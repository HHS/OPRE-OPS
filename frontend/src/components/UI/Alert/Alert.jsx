import PropTypes from "prop-types";

export const Alert = ({ type, heading, children }) => {
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
            <div className="usa-alert__body">
                <h4 className="usa-alert__heading">{heading}</h4>
                <p className="usa-alert__text">{children}</p>
            </div>
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(["success", "warning", "error"]),
    heading: PropTypes.string,
    children: PropTypes.node,
};
