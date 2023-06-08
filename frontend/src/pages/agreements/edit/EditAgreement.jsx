import App from "../../../App";
import { useParams } from "react-router-dom";
import { EditAgreementForm } from "./EditAgreementForm";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import { EditAgreementProvider } from "./EditAgreementContext";
import {useGetAgreementByIdQuery} from "../../../api/opsAPI";
import {Agreement} from "./Agreement";
import {AgreementCard} from "./AgreementCard";

export const EditAgreement = () => {


    return (
        <App>
            <Breadcrumb currentName={"Agreements"} />

            <Agreement/>

            {/*<EditAgreementProvider>*/}
            {/*    <EditAgreementForm agreement_id={agreementId} />*/}
            {/*</EditAgreementProvider>*/}
        </App>
    );
};
