import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { useGetAgreementByIdQuery, useUpdateBudgetLineItemStatusMutation } from "../../../api/opsAPI";

const ApproveAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = +urlPathParams.id;
    const navigate = useNavigate();
    const {
        isSuccess,
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });
    if (isLoadingAgreement) {
        return <h1>Loading...</h1>;
    }
    if (errorAgreement) {
        return <h1>Oops, an error occurred</h1>;
    }

    return (
        <App breadCrumbName="Approve BLI Status Change">
            <h1 className="margin-0 text-brand-primary font-sans-2xl">Approval for Planned Status</h1>
            <p className="font-sans-3xs margin-0">{agreement.name}</p>
            <pre className="font-code-2xs border-dashed border-error">{JSON.stringify(agreement, null, 2)}</pre>
        </App>
    );
};

export default ApproveAgreement;
