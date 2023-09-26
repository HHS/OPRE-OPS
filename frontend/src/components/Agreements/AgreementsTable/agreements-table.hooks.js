import { useNavigate } from "react-router-dom";

export const useAgreementApproval = () => {
    const navigate = useNavigate();

    const handleSubmitAgreementForApproval = (id) => {
        navigate(`/agreements/approve/${id}`);
    };

    return handleSubmitAgreementForApproval;
};
