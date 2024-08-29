import React from "react";
import { useParams } from "react-router-dom";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";
import App from "../../../App";
import DebugCode from "../../../components/DebugCode";
import { useIsAgreementEditable, useIsUserAllowedToEditAgreement } from "../../../hooks/agreement.hooks";

// /agreements/resolve/:id/*
function ResolveAgreement() {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);
    const [projectOfficer, setProjectOfficer] = React.useState({});
    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });

    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isAgreementEditable = useIsAgreementEditable(agreement?.id);
    const isEditable = isAgreementEditable && canUserEditAgreement;

    return (
        <App breadCrumbName={agreement?.display_name}>
            <h2>Edit Agreement Details</h2>
            <DebugCode data={agreement} />
        </App>
    );
}

export default ResolveAgreement;
