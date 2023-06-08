import App from "../../../App";
import { useParams } from "react-router-dom";
import { EditAgreementForm } from "./EditAgreementForm";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import { EditAgreementProvider } from "./EditAgreementContext";
import {useGetAgreementByIdQuery} from "../../../api/opsAPI";
import React from "react";
import {convertCodeForDisplay} from "../../../helpers/utils";
import {AgreementCard} from "./AgreementCard";

export const Agreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementByIdQuery(agreementId);

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Oops, an error occurred</div>;
    }

    const agreement_remote = agreement


    return (
        <>
            ID: {agreement.id}, name: {agreement.name}
            <EditAgreementForm agreement={agreement}/>
            <AgreementCard agreement={agreement} />
        </>
    )
};
