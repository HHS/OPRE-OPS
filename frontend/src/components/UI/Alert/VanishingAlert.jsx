import PropTypes from "prop-types";
import SimpleAlert from "./SimpleAlert"
import { useEffect } from "react";

/**
 * An alert component that dismisses itself after a set amount of time.
 * @param {Object} props - The props object.
 * @param {React.ReactNode} [props.children] - The child elements to render inside the alert. - optional
 * @param {string} props.heading - The heading text for the alert.
 * @param {string} props.message - The message text for the alert.
 * @param {string} props.type - The type of alert to display.
 * @param {boolean} [props.isAlertVisible] - Whether the alert is visible.
 * @param {Function} [props.setIsAlertVisible] - The function to set the alert visibility.
 * @param {number} [props.timeout] - The amount of time before the alert disappears in milliseconds. Default is 2000ms
 * @returns {JSX.Element | null} - The rendered alert component.
 */
const VanishingAlert =  ({
    children,
    heading,
    message,
    type,
    isAlertVisible = true,
    setIsAlertVisible = () => {},
    timeout = 2000,
}) => {
    // Manage alert visibility and auto-dismiss without affecting navigation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAlertVisible(false);
        }, timeout);

        return () => clearTimeout(timer);
    }, [timeout]);
    return (
        <SimpleAlert
            heading={heading}
            message={message}
            type={type}
            isClosable={true}
            isAlertVisible={isAlertVisible}
            setIsAlertVisible={setIsAlertVisible}
        >
            {children}
        </SimpleAlert>)
}

VanishingAlert.propTypes = {
    children: PropTypes.node,
    heading: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "warning", "error"]).isRequired,
    isAlertVisible: PropTypes.bool,
    setIsAlertVisible: PropTypes.func,
    timeout: PropTypes.number
};

export default VanishingAlert;
