import React from "react";
import Alert from "../../components/UI/Alert/Alert";
import { useNavigate } from "react-router-dom";

export const StepAgreementSuccess = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/agreements/");
        }, 6000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Alert heading="Agreement Created" type="success">
            The agreement has been successfully created. You will be redirected to the Agreements list page.
        </Alert>
    );
};

export default StepAgreementSuccess;
