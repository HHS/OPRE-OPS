import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import ContractModificationEditCard from "../../../components/Agreements/ContractModificationEdits/ContractModificationEditCard";
import ModificationDocumentUploads from "../../../components/Agreements/ModificationDocumentUploads";
import AgreementBLIReviewTable from "../../../components/BudgetLineItems/BLIReviewTable";
import StatusChangeReviewCard from "../../../components/ChangeRequests/StatusChangeReviewCard";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import PageHeader from "../../../components/UI/PageHeader";
import Tooltip from "../../../components/UI/USWDS/Tooltip";
import {
    findDescription,
    findIfOptional,
    findPeriodEnd,
    findPeriodStart
} from "../../../helpers/servicesComponent.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { AgreementType } from "../agreements.constants";
import { actionOptions, selectedAction } from "../review/ReviewAgreement.constants";
import useStartModification, { PLANNED_TO_EXECUTING } from "./StartModification.hooks";

const CAN_REVIEW_INSTRUCTIONS =
    "The budget lines you are executing are using funds from the CANs displayed below. If you have not selected any budget lines, there will be no CANs to review.";

/**
 * @component - Start a Contract Modification for a Modified LOE (#3268): review the edits that
 * require a modification, pick Planned budget lines to execute, and send it to approval.
 * @returns {React.ReactElement}
 */
export const StartModification = () => {
    const agreementId = Number(useParams()?.id);
    const navigate = useNavigate();
    const {
        agreement,
        errorAgreement,
        isPageReady,
        canStartModification,
        servicesComponents,
        edits,
        groupedBudgetLinesByServicesComponent,
        selectedBudgetLines,
        handleSelectBLI,
        toggleSelectActionableBLIs,
        toggleStates,
        setToggleStates,
        afterApproval,
        setAfterApproval,
        notes,
        setNotes,
        isSubmissionReady,
        handleSendToApproval,
        projectOfficerName,
        alternateProjectOfficerName,
        showModal,
        setShowModal,
        handleCancel,
        confirmCancel
    } = useStartModification(agreementId);

    React.useEffect(() => {
        if (!isPageReady) return;
        if (errorAgreement || (agreement && !agreement._meta?.isEditable)) {
            navigate("/error");
        } else if (agreement && !canStartModification) {
            navigate(`/agreements/${agreementId}/award-modifications`);
        }
    }, [isPageReady, errorAgreement, agreement, canStartModification, agreementId, navigate]);

    if (!isPageReady) {
        return (
            <App breadCrumbName="Start Modification">
                <h1>Loading...</h1>
            </App>
        );
    }

    const showCLINColumn = agreement?.agreement_type === AgreementType.CONTRACT;

    return (
        <App breadCrumbName="Start Modification">
            {showModal && (
                <ConfirmationModal
                    heading="Are you sure you want to cancel this contract modification? Your changes will not be saved."
                    setShowModal={setShowModal}
                    actionButtonText="Cancel Modification"
                    secondaryButtonText="Continue Editing"
                    handleConfirm={confirmCancel}
                />
            )}
            <PageHeader
                title="Start Modification"
                subTitle={agreement?.name}
            />
            <Accordion
                heading="Review Contract Modifications"
                level={2}
            >
                <p>
                    This is a list of changes you have made on the agreement that should be included in the Contract
                    Modification. If this Modification should include additional changes that are not listed, please
                    describe those changes in the Notes section below.
                </p>
                <ul
                    className="usa-list--unstyled display-flex flex-column"
                    style={{ gap: "1rem" }}
                    data-cy="mod-review-changes"
                >
                    {edits.map((edit) => (
                        <li key={edit.id}>
                            <ContractModificationEditCard edit={edit} />
                        </li>
                    ))}
                    {selectedBudgetLines.map((budgetLine) => (
                        <li key={`execute-${budgetLine.id}`}>
                            <StatusChangeReviewCard
                                isCondensed={true}
                                agreementId={budgetLine.agreement_id}
                                bliId={budgetLine.id}
                                requestDate={budgetLine.date_needed}
                                changeTo={PLANNED_TO_EXECUTING}
                                handleReviewChangeRequest={() => {}}
                                changeRequestId={budgetLine.id}
                                createdById={budgetLine.created_by}
                            />
                        </li>
                    ))}
                </ul>
            </Accordion>
            <AgreementMetaAccordion
                agreement={agreement}
                instructions="Please review the agreement details below."
                projectOfficerName={projectOfficerName}
                alternateProjectOfficerName={alternateProjectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
                isAgreementAwarded={true}
            />
            <AgreementBLIAccordion
                title="Select Budget Lines (if applicable)"
                instructions="Select the budget lines you’d like to execute for this modification. These budget lines will change to Executing Status after the Modification is approved by your Division Director. If you don’t need to Execute a Budget Line for this Modification, you can skip selecting budget lines and proceed to Upload Documents."
                budgetLineItems={selectedBudgetLines}
                agreement={agreement}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
                action={selectedAction.PLANNED_TO_EXECUTING}
            >
                {groupedBudgetLinesByServicesComponent.map((group, index) => {
                    const scLabel = group.serviceComponentGroupingLabel || group.servicesComponentNumber;
                    return (
                        <ServicesComponentAccordion
                            key={`${group.servicesComponentNumber}-${index}`}
                            servicesComponentNumber={group.servicesComponentNumber}
                            serviceComponentGroupingLabel={group.serviceComponentGroupingLabel}
                            withMetadata={true}
                            periodStart={findPeriodStart(servicesComponents, scLabel)}
                            periodEnd={findPeriodEnd(servicesComponents, scLabel)}
                            description={findDescription(servicesComponents, scLabel)}
                            optional={findIfOptional(servicesComponents, scLabel)}
                            serviceRequirementType={agreement?.service_requirement_type}
                        >
                            <AgreementBLIReviewTable
                                readOnly={false}
                                budgetLines={group.budgetLines}
                                isReviewMode={true}
                                setSelectedBLIs={handleSelectBLI}
                                toggleSelectActionableBLIs={() =>
                                    toggleSelectActionableBLIs(group.servicesComponentNumber)
                                }
                                mainToggleSelected={toggleStates[group.servicesComponentNumber] || false}
                                setMainToggleSelected={(newState) =>
                                    setToggleStates((prev) => ({ ...prev, [group.servicesComponentNumber]: newState }))
                                }
                                servicesComponentNumber={group.servicesComponentNumber}
                                action={actionOptions.CHANGE_PLANNED_TO_EXECUTING}
                                clin={{ showColumn: showCLINColumn, readOnly: true }}
                            />
                        </ServicesComponentAccordion>
                    );
                })}
            </AgreementBLIAccordion>
            {selectedBudgetLines.length > 0 ? (
                <AgreementCANReviewAccordion
                    instructions={CAN_REVIEW_INSTRUCTIONS}
                    selectedBudgetLines={selectedBudgetLines}
                    afterApproval={afterApproval}
                    setAfterApproval={setAfterApproval}
                    action={selectedAction.PLANNED_TO_EXECUTING}
                    changeRequestType={agreement?.change_request_type}
                />
            ) : (
                // The shared accordion says "The budget lines you selected do not have a CAN." when
                // nothing is selected, which is wrong here: selecting budget lines is optional.
                <Accordion
                    heading="Review CANs"
                    level={2}
                >
                    <p>{CAN_REVIEW_INSTRUCTIONS}</p>
                </Accordion>
            )}
            <Accordion
                heading="Upload Documents"
                level={2}
            >
                <p>Please upload the documents needed to execute your contract modification.</p>
                <ModificationDocumentUploads agreementId={agreementId} />
            </Accordion>
            <Accordion
                heading="Notes"
                level={2}
            >
                <p>Notes can be shared between the Submitter and Reviewer, if needed.</p>
                <TextArea
                    name="submitter-notes"
                    label="Notes (optional)"
                    maxLength={150}
                    value={notes}
                    onChange={(name, value) => setNotes(value)}
                />
            </Accordion>
            <div className="grid-row flex-justify-end margin-top-1">
                <button
                    type="button"
                    className="usa-button usa-button--unstyled margin-right-2"
                    data-cy="cancel-modification-btn"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
                {isSubmissionReady ? (
                    <button
                        type="button"
                        className="usa-button"
                        data-cy="send-to-approval-btn"
                        onClick={handleSendToApproval}
                    >
                        Send to Approval
                    </button>
                ) : (
                    <Tooltip
                        label="Select a budget line to execute, or make an edit that requires a contract modification"
                        position="top"
                    >
                        <button
                            type="button"
                            className="usa-button"
                            data-cy="send-to-approval-btn"
                            disabled={true}
                        >
                            Send to Approval
                        </button>
                    </Tooltip>
                )}
            </div>
        </App>
    );
};

export default StartModification;
