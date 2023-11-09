import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { useGetAgreementByIdQuery, useUpdateBudgetLineItemStatusMutation } from "../../../api/opsAPI";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { convertCodeForDisplay } from "../../../helpers/utils";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementChangesAccordion from "../../../components/Agreements/AgreementChangesAccordion";
import { anyBudgetLinesByStatus, selectedBudgetLinesTotal, getTotalByCans } from "../review/ReviewAgreement.helpers";

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
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);

    if (isLoadingAgreement) {
        return <h1>Loading...</h1>;
    }
    if (errorAgreement) {
        return <h1>Oops, an error occurred</h1>;
    }

    const changeInCans = getTotalByCans(agreement?.budget_line_items);

    return (
        <App breadCrumbName="Approve BLI Status Change">
            <PageHeader
                title="Approval for Planned Status"
                subTitle={agreement.name}
            />
            <AgreementMetaAccordion
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
            />

            <AgreementBLIAccordion
                title="Review Budget Lines"
                budgetLineItems={agreement.budget_line_items}
                agreement={agreement}
                afterApproval={() => {}}
                setAfterApproval={() => {}}
            >
                <BudgetLinesTable
                    readOnly={true}
                    budgetLinesAdded={agreement.budget_line_items}
                    isReviewMode={false}
                    showTotalSummaryCard={false}
                />
            </AgreementBLIAccordion>
            <AgreementCANReviewAccordion
                selectedBudgetLines={agreement.budget_line_items}
                afterApproval={() => {}}
                setAfterApproval={() => {}}
            />
            <AgreementChangesAccordion
                changeInBudgetLines={agreement.budget_line_items.reduce((acc, { amount }) => acc + amount, 0)}
                changeInCans={changeInCans}
            />

            <pre className="font-code-2xs border-dashed border-error">{JSON.stringify(agreement, null, 2)}</pre>
        </App>
    );
};

export default ApproveAgreement;
