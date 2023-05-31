import App from "../../../App";
import { useParams } from "react-router-dom";
import { ReviewAgreement } from "../ReviewAgreement";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";

export const ApproveAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);

    return (
        <App>
            <Breadcrumb currentName={"Agreements"} />
            <ReviewAgreement agreement_id={agreementId} />
        </App>
    );
};
