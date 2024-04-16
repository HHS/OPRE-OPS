import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import Alert from "./Alert";
import useAlert from "../../../hooks/use-alert.hooks";

/**
 * Renders a success message and redirects the user after a delay.
 * @component
 * @param {Object} props - The component props.
 * @param {number} [props.delay=3000] - The delay in milliseconds before redirecting the user.
 * @param {string} props.heading - The heading of the success message.
 * @param {string} props.message - The message to display.
 * @param {string} props.link - The link to redirect to after the delay.
 * @returns {JSX.Element} - The success message element.
 */
export const StepSuccessAlert = ({ delay = 3000, heading, message, link }) => {
    const navigate = useNavigate();
    const { setAlert } = useAlert();

    React.useEffect(() => {
        setTimeout(() => {
            navigate(link);
        }, delay);

        setAlert({
            type: "success",
            heading,
            message
        });
    }, [setAlert, navigate, delay, heading, message, link]);

    return <Alert />;
};

StepSuccessAlert.propTypes = {
    delay: PropTypes.number,
    heading: PropTypes.string,
    message: PropTypes.string,
    link: PropTypes.string
};

export default StepSuccessAlert;
