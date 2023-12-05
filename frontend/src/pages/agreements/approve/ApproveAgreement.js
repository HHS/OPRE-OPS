import React from "react";
import { useParams } from "react-router-dom";
import App from "../../../App";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { convertCodeForDisplay } from "../../../helpers/utils";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementChangesAccordion from "../../../components/Agreements/AgreementChangesAccordion";
import { getTotalByCans } from "../review/ReviewAgreement.helpers";
import TextArea from "../../../components/UI/Form/TextArea";
import useToggle from "../../../hooks/useToggle";

const ApproveAgreement = () => {
    const urlPathParams = useParams();
    const [notes, setNotes] = React.useState("");
    // @ts-ignore
    const agreementId = +urlPathParams.id;
    // const navigate = useNavigate();
    const {
        // isSuccess,
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const [afterApproval, setAfterApproval] = useToggle(true);

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
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
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
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
            />
            <AgreementChangesAccordion
                changeInBudgetLines={agreement.budget_line_items.reduce((acc, { amount }) => acc + amount, 0)}
                changeInCans={changeInCans}
            />
            <h2 className="font-sans-lg text-semibold">Notes</h2>
            <TextArea
                name="submitter-notes"
                label="Notes (optional)"
                maxLength={150}
                value={notes}
                onChange={(name, value) => setNotes(value)}
            />
            <div className="grid-row flex-justify-end flex-align-center margin-top-8">
                <button
                    name="cancel"
                    className={`usa-button usa-button--unstyled margin-right-2`}
                    data-cy="edit-agreement-btn"
                    onClick={() => {
                        alert("Not implemented yet");
                    }}
                >
                    Cancel
                </button>

                <button
                    className={`usa-button usa-button--outline margin-right-2`}
                    data-cy="edit-agreement-btn"
                    onClick={() => {
                        alert("Not implemented yet");
                    }}
                >
                    Decline
                </button>
                <button
                    className="usa-button"
                    data-cy="send-to-approval-btn"
                    onClick={() => {
                        alert("Not implemented yet");
                    }}
                >
                    Approve
                </button>
            </div>
            <pre className="font-code-2xs border-dashed border-error margin-top-10">
                {JSON.stringify(agreement, null, 2)}
            </pre>
        </App>
    );
};

export default ApproveAgreement;
