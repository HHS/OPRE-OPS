import React from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/UI/Alert/Alert";

/**
 * Renders the "Agreement Success" step of the Create Agreement flow.
 *
 * @param {Object} props - The component props.
 * @param {number} [props.delay=6000] - The delay (in milliseconds) before redirecting to the Agreements list page.
 * @param {boolean} props.isEditMode - A flag indicating whether the component is in edit mode.
 * @returns {JSX.Element} - The rendered component.
 */
export const StepAgreementSuccess = ({ delay = 6000, isEditMode }) => {
    const navigate = useNavigate();

    React.useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/agreements/");
        }, delay);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let alertMsg = "";
    let alertHeading = "";
    if (isEditMode) {
        alertHeading = "Agreement draft saved";
        alertMsg = "The agreement has been successfully edited and saved as a draft.";
    } else {
        alertHeading = "Agreement Created";
        alertMsg = "The agreement has been successfully created. You will be redirected to the Agreements list page.";
    }

    return (
        <Alert heading={alertHeading} type="success" setIsAlertActive={() => {}}>
            {alertMsg}
        </Alert>
    );
};

export default StepAgreementSuccess;
