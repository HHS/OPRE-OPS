import React from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import Alert from "../../components/UI/Alert";

export const StepAgreementSuccess = ({ delay = 6000 }) => {
    const navigate = useNavigate();

    React.useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/agreements/");
        }, delay);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Alert heading="Agreement Created" type="success" setIsAlertActive={() => {}}>
            The agreement has been successfully created. You will be redirected to the Agreements list page.
        </Alert>
    );
};

StepAgreementSuccess.propTypes = {
    delay: PropTypes.number,
};

export default StepAgreementSuccess;
