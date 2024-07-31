import React from "react";
import App from "../../../App";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import DocumentCollectionView from "../../../components/Agreements/Documents/DocumentCollectionView";
import BLIDiffTable from "../../../components/BudgetLineItems/BLIDiffTable";
import { CHANGE_REQUEST_ACTION } from "../../../components/ChangeRequests/ChangeRequests.constants";
import ReviewChangeRequestAccordion from "../../../components/ChangeRequests/ReviewChangeRequestAccordion";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import PageHeader from "../../../components/UI/PageHeader";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { findDescription, findPeriodEnd, findPeriodStart } from "../../../helpers/servicesComponent.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { document } from "../../../tests/data";
import useApproveAgreement from "./ApproveAgreement.hooks";

const ApproveAgreement = () => {
    const {
        agreement,
        projectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        groupedUpdatedBudgetLinesByServicesComponent,
        budgetLinesInReview,
        changeRequestsInReview,
        notes,
        setNotes,
        confirmation,
        setConfirmation,
        showModal,
        setShowModal,
        modalProps,
        checkBoxText,
        handleCancel,
        handleApproveChangeRequests,
        title,
        changeRequestTitle,
        afterApproval,
        setAfterApproval,
        requestorNoters,
        urlChangeToStatus,
        statusForTitle,
        statusChangeTo,
        errorAgreement,
        isLoadingAgreement,
        approvedBudgetLinesPreview
    } = useApproveAgreement();

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Something went wrong...</div>;
    }
    if (!agreement) {
        return <div>No agreement data available.</div>;
    }
    const BeforeApprovalContent = React.memo(
        ({ groupedBudgetLinesByServicesComponent, servicesComponents, changeRequestTitle, urlChangeToStatus }) => (
            <>
                {groupedBudgetLinesByServicesComponent.map((group) => (
                    <ServicesComponentAccordion
                        key={group.servicesComponentId}
                        servicesComponentId={group.servicesComponentId}
                        withMetadata={true}
                        periodStart={findPeriodStart(servicesComponents, group.servicesComponentId)}
                        periodEnd={findPeriodEnd(servicesComponents, group.servicesComponentId)}
                        description={findDescription(servicesComponents, group.servicesComponentId)}
                    >
                        <BLIDiffTable
                            budgetLines={group.budgetLines}
                            changeType={changeRequestTitle}
                            statusChangeTo={urlChangeToStatus}
                        />
                    </ServicesComponentAccordion>
                ))}
            </>
        )
    );
    BeforeApprovalContent.displayName = "BeforeApprovalContent";

    const AfterApprovalContent = React.memo(
        ({
            groupedUpdatedBudgetLinesByServicesComponent,
            servicesComponents,
            changeRequestTitle,
            urlChangeToStatus
        }) => (
            <>
                {groupedUpdatedBudgetLinesByServicesComponent.map((group) => (
                    <ServicesComponentAccordion
                        key={group.servicesComponentId}
                        servicesComponentId={group.servicesComponentId}
                        withMetadata={true}
                        periodStart={findPeriodStart(servicesComponents, group.servicesComponentId)}
                        periodEnd={findPeriodEnd(servicesComponents, group.servicesComponentId)}
                        description={findDescription(servicesComponents, group.servicesComponentId)}
                    >
                        <BLIDiffTable
                            budgetLines={group.budgetLines}
                            changeType={changeRequestTitle}
                            statusChangeTo={urlChangeToStatus}
                        />
                    </ServicesComponentAccordion>
                ))}
            </>
        )
    );
    AfterApprovalContent.displayName = "AfterApprovalContent";
    return (
        <App breadCrumbName={`Approve BLI ${changeRequestTitle} ${statusForTitle}`}>
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
                title={title}
                subTitle={agreement.name}
            />
            <ReviewChangeRequestAccordion
                changeType={changeRequestTitle}
                changeRequests={changeRequestsInReview}
                statusChangeTo={urlChangeToStatus}
            />
            <AgreementMetaAccordion
                instructions="Please review the agreement details below to ensure all information is correct."
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
            />
            <AgreementBLIAccordion
                title="Review Budget Lines"
                instructions="This is a list of all budget lines within this agreement.  Changes are displayed with a blue underline. Use the toggle to see how your approval would change the budget lines."
                budgetLineItems={agreement?.budget_line_items}
                agreement={agreement}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
                action={urlChangeToStatus}
                isApprovePage={true}
                updatedBudgetLines={approvedBudgetLinesPreview}
            >
                <section className="margin-top-4">
                    {!afterApproval ? (
                        <BeforeApprovalContent
                            groupedBudgetLinesByServicesComponent={groupedBudgetLinesByServicesComponent}
                            servicesComponents={servicesComponents}
                            changeRequestTitle={changeRequestTitle}
                            urlChangeToStatus={urlChangeToStatus}
                        />
                    ) : (
                        <AfterApprovalContent
                            groupedUpdatedBudgetLinesByServicesComponent={groupedUpdatedBudgetLinesByServicesComponent}
                            servicesComponents={servicesComponents}
                            changeRequestTitle={changeRequestTitle}
                            urlChangeToStatus={urlChangeToStatus}
                        />
                    )}
                </section>
            </AgreementBLIAccordion>
            <AgreementCANReviewAccordion
                instructions="The budget lines showing In Review Status have allocated funds from the CANs displayed below."
                selectedBudgetLines={budgetLinesInReview}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
                action={urlChangeToStatus}
                isApprovePage={true}
            />
            {statusChangeTo === BLI_STATUS.EXECUTING && (
                <Accordion
                    heading="Review Documents"
                    level={2}
                >
                    <p className="margin-bottom-neg-2">Please review all pre-solicitation documents listed below.</p>
                    {/* TODO: replace with real documents */}
                    <DocumentCollectionView documents={document.testDocuments} />
                </Accordion>
            )}
            <Accordion
                heading="Notes"
                level={2}
            >
                <p>Notes can be shared between the Submitter and Reviewer, if needed.</p>
                {requestorNoters && (
                    <>
                        <h3 className="font-sans-lg text-semibold">Submitter&apos;s Notes</h3>
                        <p
                            className="maxw-mobile-lg"
                            style={{ whiteSpace: "pre-wrap" }}
                        >
                            {requestorNoters}
                        </p>
                    </>
                )}
                <section>
                    <h2 className="font-sans-lg text-semibold">Reviewer&apos;s Notes</h2>
                    <TextArea
                        name="submitter-notes"
                        label="Notes (optional)"
                        maxLength={150}
                        value={notes}
                        onChange={(name, value) => setNotes(value)}
                    />
                </section>
            </Accordion>
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
                    onClick={() => handleApproveChangeRequests(CHANGE_REQUEST_ACTION.REJECT)}
                >
                    Decline
                </button>
                <button
                    className="usa-button"
                    data-cy="send-to-approval-btn"
                    onClick={() => handleApproveChangeRequests(CHANGE_REQUEST_ACTION.APPROVE)}
                    disabled={!confirmation}
                >
                    Approve Changes
                </button>
            </div>
        </App>
    );
};

export default ApproveAgreement;
