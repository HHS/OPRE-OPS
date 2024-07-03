import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import App from "../../../App";
import { useAddWorkflowApproveMutation, useGetAgreementByIdQuery } from "../../../api/opsAPI";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementChangesAccordion from "../../../components/Agreements/AgreementChangesAccordion";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
import ReviewChangeRequestAccordion from "../../../components/ChangeRequests/ReviewChangeRequestAccordion";
import TextArea from "../../../components/UI/Form/TextArea";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import PageHeader from "../../../components/UI/PageHeader";
import { convertCodeForDisplay, toTitleCaseFromSlug } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks.js";
import useToggle from "../../../hooks/useToggle";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { useGetWorkflowInstanceFromId, useGetWorkflowStepInstanceFromId } from "../../../hooks/workflow.hooks.js";
import { workflowActions } from "../review/ReviewAgreement.constants";
import { getTotalByCans } from "../review/ReviewAgreement.helpers";

const BudgetLinesTableWithWorkflowStep = ({ agreement, workflowStepInstance }) => {
    const workflowBudgetLineItemIds = workflowStepInstance?.package_entities?.budget_line_item_ids;
    return (
        <BudgetLinesTable
            readOnly={true}
            budgetLines={agreement?.budget_line_items}
            isReviewMode={false}
            workflowBudgetLineItemIds={workflowBudgetLineItemIds}
        />
    );
};

const ApproveAgreement = () => {
    const { setAlert } = useAlert();
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
    const [searchParams] = useSearchParams();
    const [workflowApprove] = useAddWorkflowApproveMutation();
    const stepId = searchParams.get("stepId");
    let changeRequestType = "";
    searchParams.get("type") ? (changeRequestType = searchParams.get("type")) : (changeRequestType = "TBD");

    const workflowStepInstance = useGetWorkflowStepInstanceFromId(stepId);
    const { workflow_instance_id: workflowInstanceId, package_entities: packageEntities } = workflowStepInstance;
    const workflowBudgetLineItemIds = packageEntities?.budget_line_item_ids;
    const submittersNotes = packageEntities?.notes;
    console.log("workflowBudgetLineItemIds", workflowBudgetLineItemIds);
    console.log("workflowStepInstance", workflowStepInstance);
    console.log("submittersNotes", submittersNotes);
    const workflowInstance = useGetWorkflowInstanceFromId(workflowInstanceId);
    const { workflow_action: action } = workflowInstance;

    const navigate = useNavigate();
    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const [afterApproval, setAfterApproval] = useToggle(true);
    const goToText = action === workflowActions.DRAFT_TO_PLANNED ? "Planned" : "Executing";
    const fromToText = action === workflowActions.DRAFT_TO_PLANNED ? "Draft to Planned" : "Planned to Executing";
    const checkBoxText =
        action === workflowActions.DRAFT_TO_PLANNED
            ? "I understand that approving these budget lines will subtract the amounts from the FY budget"
            : "I understand that approving these budget lines will start the Procurement Process";
    const approveModalHeading =
        action === workflowActions.DRAFT_TO_PLANNED
            ? "Are you sure you want to approve these budget lines for Planned Status? This will subtract the amounts from the FY budget."
            : "Are you sure you want to approve these budget lines for Executing Status? This will start the procurement process.";

    if (isLoadingAgreement) {
        return <h1>Loading...</h1>;
    }
    if (errorAgreement) {
        return <h1>Oops, an error occurred</h1>;
    }

    // TODO: move this to a helper function
    const budgetLinesInReview = agreement?.budget_line_items.filter((bli) => bli.in_review);
    const changeInCans = getTotalByCans(budgetLinesInReview);

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading:
                "Are you sure you want to cancel? This will exit the review process and you can come back to it later.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Reviewing",
            handleConfirm: () => {
                navigate("/agreements");
            }
        });
    };

    const rejectStep = async () => {
        const data = {
            workflow_step_action: "REJECT",
            workflow_step_id: stepId,
            notes: notes
        };

        await workflowApprove(data)
            .unwrap()
            .then((fulfilled) => {
                console.log(`SUCCESS of workflow-approve: ${JSON.stringify(fulfilled, null, 2)}`);
                setAlert({
                    type: "success",
                    heading: "Rejection Saved",
                    message: `The rejection to change Budget Lines has been saved.`
                });
            })
            .catch((rejected) => {
                console.error(`ERROR with workflow-approve: ${JSON.stringify(rejected, null, 2)}`);
                setAlert({
                    type: "error",
                    heading: "Error",
                    message: "An error occurred while saving the approval.",
                    redirectUrl: "/error"
                });
            });
    };

    const handleDecline = async () => {
        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to decline these budget lines for ${goToText} Status?`,
            actionButtonText: "Decline",
            secondaryButtonText: "Cancel",
            handleConfirm: async () => {
                await rejectStep();
                navigate("/agreements");
            }
        });
    };
    const approveStep = async () => {
        const data = {
            workflow_step_action: "APPROVE",
            workflow_step_id: stepId,
            notes: notes
        };

        await workflowApprove(data)
            .unwrap()
            .then((fulfilled) => {
                console.log(`SUCCESS of workflow-approve: ${JSON.stringify(fulfilled, null, 2)}`);
                setAlert({
                    type: "success",
                    heading: `Budget Lines Approved for ${goToText} Status`,
                    message: `Budget lines for ${agreement.name} have been successfully approved for ${goToText} Status.`
                });
            })
            .catch((rejected) => {
                console.error(`ERROR with workflow-approve: ${JSON.stringify(rejected, null, 2)}`);
                setAlert({
                    type: "error",
                    heading: "Error",
                    message: "An error occurred while saving the approval.",
                    redirectUrl: "/error"
                });
            });
    };

    const handleApprove = async () => {
        setShowModal(true);
        setModalProps({
            heading: approveModalHeading,
            actionButtonText: "Approve",
            secondaryButtonText: "Cancel",
            handleConfirm: async () => {
                await approveStep();
                await navigate("/agreements");
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
                title={`Approval for ${toTitleCaseFromSlug(changeRequestType)}`}
                subTitle={agreement.name}
            />
            <ReviewChangeRequestAccordion
                changeType={toTitleCaseFromSlug(changeRequestType)}
                budgetLinesInReview={budgetLinesInReview}
            />
            <AgreementMetaAccordion
                instructions="Please review the agreement details below to ensure all information is correct."
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
            />
            <AgreementBLIAccordion
                title="Review Budget Lines"
                instructions={`This is a list of all budget lines within this agreement. The budget lines showing In Review Status need your approval to change from ${fromToText} Status.`}
                budgetLineItems={budgetLinesInReview}
                agreement={agreement}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
                action={action}
            >
                <BudgetLinesTableWithWorkflowStep
                    agreement={agreement}
                    workflowStepInstance={workflowStepInstance}
                />
            </AgreementBLIAccordion>
            <AgreementCANReviewAccordion
                instructions="The budget lines showing In Review Status have allocated funds from the CANs displayed below."
                selectedBudgetLines={budgetLinesInReview}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
                action={action}
            />
            {action === workflowActions.DRAFT_TO_PLANNED && (
                <AgreementChangesAccordion
                    changeInBudgetLines={budgetLinesInReview.reduce((acc, { amount }) => acc + amount, 0)}
                    changeInCans={changeInCans}
                />
            )}
            <section>
                <h2 className="font-sans-lg text-semibold">Submitter&apos;s Notes</h2>
                <p
                    className="margin-top-3 text-semibold font-12px line-height-body-1"
                    style={{ maxWidth: "25rem" }}
                >
                    {submittersNotes}
                </p>
            </section>
            <section>
                <h2 className="font-sans-lg text-semibold margin-top-5">Reviewer&apos;s Notes</h2>
                <TextArea
                    name="submitter-notes"
                    label="Notes (optional)"
                    maxLength={150}
                    value={notes}
                    onChange={(name, value) => setNotes(value)}
                />
            </section>
            <div className="usa-checkbox padding-bottom-105 margin-top-4">
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
                    {checkBoxText}
                </label>
            </div>
            <div className="grid-row flex-justify-end flex-align-center margin-top-8">
                <button
                    name="cancel"
                    className={`usa-button usa-button--unstyled margin-right-2`}
                    data-cy="cancel-approval-btn"
                    onClick={handleCancel}
                >
                    Cancel
                </button>

                <button
                    className={`usa-button usa-button--outline margin-right-2`}
                    data-cy="decline-approval-btn"
                    onClick={handleDecline}
                >
                    Decline
                </button>
                <button
                    className="usa-button"
                    data-cy="send-to-approval-btn"
                    onClick={handleApprove}
                    disabled={!confirmation}
                >
                    Approve
                </button>
            </div>
        </App>
    );
};

export default ApproveAgreement;
