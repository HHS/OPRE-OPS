import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Alert from "../../components/UI/Alert";
import { setAlert } from "../../components/UI/Alert/alertSlice";

/**
 * Renders a success message and redirects the user to the Agreements list page after a delay.
 * @param {Object} props - The component props.
 * @param {number} [props.delay=6000] - The delay in milliseconds before redirecting the user.
 * @returns {React.JSX.Element} - The success message element.
 */
export const StepSuccess = ({ delay = 6000 }) => {
    const globalDispatch = useDispatch();
    const navigate = useNavigate();

    React.useEffect(() => {
        setTimeout(() => {
            navigate("/agreements");
        }, delay);

        globalDispatch(
            setAlert({
                type: "success",
                heading: "Budget Lines Created",
                message:
                    " The budget lines have been successfully created. You will be redirected to the Agreements list page.",
            })
        );
    }, [globalDispatch, navigate, delay]);

    return <Alert />;
};

export default StepSuccess;
