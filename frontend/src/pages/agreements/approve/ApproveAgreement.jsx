import App from "../../../App";
import { useParams } from "react-router-dom";
import ReviewAgreement from "../review";

export const ApproveAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);

    return (
        <App breadCrumbName="Agreements">
            <ReviewAgreement agreement_id={agreementId} />
        </App>
    );
};
