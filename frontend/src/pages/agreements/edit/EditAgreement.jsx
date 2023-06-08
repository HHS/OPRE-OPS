import App from "../../../App";
import { useParams } from "react-router-dom";
import { EditAgreementForm } from "./EditAgreementForm";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";

export const EditAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);

    return (
        <App>
            <Breadcrumb currentName={"Agreements"} />
            <EditAgreementForm agreement_id={agreementId} />
        </App>
    );
};
