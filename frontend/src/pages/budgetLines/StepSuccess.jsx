import React from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/UI/Alert";
import useAlert from "../../hooks/use-alert.hooks";

/**
 * Renders a success message and redirects the user to the Agreements list page after a delay.
 * @param {Object} props - The component props.
 * @param {number} [props.delay=6000] - The delay in milliseconds before redirecting the user.
 * @returns {React.JSX.Element} - The success message element.
 */
export const StepSuccess = ({ delay = 6000 }) => {
    const navigate = useNavigate();
    const { setAlert } = useAlert();

    React.useEffect(() => {
        setTimeout(() => {
            navigate("/agreements");
        }, delay);

        setAlert({
            type: "success",
            heading: "Budget Lines Created",
            message:
                " The budget lines have been successfully created. You will be redirected to the Agreements list page."
        });
    }, [setAlert, navigate, delay]);

    return <Alert />;
};

export default StepSuccess;
