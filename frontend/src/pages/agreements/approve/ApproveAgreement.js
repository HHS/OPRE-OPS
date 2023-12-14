import React from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";

const ApproveAgreement = () => {
    const urlPathParams = useParams();
    const [notes, setNotes] = React.useState("");
    const [confirmation, setConfirmation] = React.useState(false);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    // @ts-ignore
    const agreementId = +urlPathParams.id;
    const navigate = useNavigate();
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

    // make a new array for budgetLines that have property has_active_workflow
    const budgetLinesWithActiveWorkflow = agreement?.budget_line_items.filter((bli) => bli.has_active_workflow);

    const changeInCans = getTotalByCans(budgetLinesWithActiveWorkflow);

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel?",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue",
            handleConfirm: () => {
                navigate("/agreements");
            }
        });
    };

    return (
        <App breadCrumbName="Approve BLI Status Change">
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                    secondaryButtonText={modalProps.secondaryButtonText}
                />
            )}
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
                budgetLineItems={budgetLinesWithActiveWorkflow}
                agreement={agreement}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
            >
                <BudgetLinesTable
                    readOnly={true}
                    budgetLinesAdded={agreement?.budget_line_items}
                    isReviewMode={false}
                    showTotalSummaryCard={false}
                />
            </AgreementBLIAccordion>
            <AgreementCANReviewAccordion
                selectedBudgetLines={budgetLinesWithActiveWorkflow}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
            />
            <AgreementChangesAccordion
                changeInBudgetLines={budgetLinesWithActiveWorkflow.reduce((acc, { amount }) => acc + amount, 0)}
                changeInCans={changeInCans}
            />
            <div className="usa-checkbox padding-bottom-105">
                <input
                    className="usa-checkbox__input"
                    id="approve-confirmation"
                    type="checkbox"
                    name="approve-confirmation"
                    value="approve-confirmation"
                    checked={confirmation}
                    onChange={() => setConfirmation(!confirmation)}
                />
                <label
                    className="usa-checkbox__label"
                    htmlFor="approve-confirmation"
                >
                    I understand that approving these budget lines will subtract the amounts from the FY budget
                </label>
            </div>
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
                    onClick={handleCancel}
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
                    disabled={!confirmation}
                >
                    Approve
                </button>
            </div>
            <pre className="font-code-2xs border-dashed border-error margin-top-10">
                {JSON.stringify(budgetLinesWithActiveWorkflow, null, 2)}
            </pre>
        </App>
    );
};

export default ApproveAgreement;
