import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import classnames from "vest/classnames";
import App from "../../../App";
import AgreementActionAccordion from "../../../components/Agreements/AgreementActionAccordion";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementBLIReviewTable from "../../../components/BudgetLineItems/BLIReviewTable";
import StatusChangeReviewCard from "../../../components/ChangeRequests/StatusChangeReviewCard";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import Accordion from "../../../components/UI/Accordion";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
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
import { actionOptions } from "./ReviewAgreement.constants";
import useReviewAgreement from "./ReviewAgreement.hooks";

/**
 * @component - Renders a page for reviewing an Agreement and sending Status Changes to approval.
 * @returns {React.ReactElement} - The rendered component.
 */

export const ReviewAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = Number(urlPathParams?.id);
    const navigate = useNavigate();

    const {
        handleSelectBLI,
        pageErrors,
        isAlertActive,
        setIsAlertActive,
        agreementValidationResults,
        handleActionChange,
        toggleSelectActionableBLIs,
        notes,
        setNotes,
        action,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        handleSendToApproval,
        hasBLIError,
        isSubmissionReady,
        changeRequestAction,
        anyBudgetLinesDraft,
        anyBudgetLinePlanned,
        errorAgreement,
        isLoadingAgreement,
        isAgreementAwarded,
        isAgreementEditable,
        projectOfficerName,
        alternateProjectOfficerName,
        afterApproval,
        setAfterApproval,
        agreement,
        toggleStates,
        setToggleStates,
        selectedBudgetLines,
        changeTo,
        handleCancel,
        showModal,
        setShowModal,
        modalProps
    } = useReviewAgreement(agreementId);

    const cn = agreementValidationResults ? classnames(agreementValidationResults, {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    }): undefined;

    // Add this useEffect to handle navigation after render
    const canUserEditAgreement = agreement?._meta.isEditable;

    React.useEffect(() => {
        if (!isLoadingAgreement) {
            if (errorAgreement || (agreement && !canUserEditAgreement)) {
                navigate("/error");
            }
        }
    }, [isLoadingAgreement, errorAgreement, agreement, canUserEditAgreement, navigate]);

    if (isLoadingAgreement) {
        return <h1>Loading...</h1>;
    }

    return (
        <App breadCrumbName="Request BL Status Change">
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                    secondaryButtonText={modalProps.secondaryButtonText}
                />
            )}
            <div style={{ position: "relative" }}>
                {isAlertActive && Object.entries(pageErrors).length > 0 ? (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 1000
                        }}
                    >
                        <SimpleAlert
                            type="error"
                            heading="Please resolve the errors outlined below"
                            message="In order to send this agreement to approval, click edit to update the required information."
                            isClosable={true}
                            setIsAlertVisible={setIsAlertActive}
                        >
                            <ul data-cy="error-list">
                                {Object.entries(pageErrors).map(([key]) => (
                                    <li
                                        key={key}
                                        data-cy="error-item"
                                    >
                                        {convertCodeForDisplay("validation", key)}
                                    </li>
                                ))}
                            </ul>
                        </SimpleAlert>
                    </div>
                ) : (
                    <PageHeader
                        title="Request BL Status Change"
                        subTitle={agreement?.name}
                    />
                )}
            </div>

            <AgreementMetaAccordion
                agreement={agreement}
                instructions="Please review the agreement details below and edit any information if necessary."
                projectOfficerName={projectOfficerName}
                alternateProjectOfficerName={alternateProjectOfficerName}
                agreementValidationResults={agreementValidationResults}
                cn={cn}
                convertCodeForDisplay={convertCodeForDisplay}
                changeRequestType={agreement?.change_request_type}
                isAgreementAwarded={isAgreementAwarded}
            />
            <AgreementActionAccordion
                setAction={handleActionChange}
                optionOneDisabled={!anyBudgetLinesDraft}
                optionTwoDisabled={!anyBudgetLinePlanned}
            />
            <AgreementBLIAccordion
                title="Select Budget Lines"
                instructions={`Select the budget lines you'd like this action to apply to. The agreement will be sent to your
                Division Director to review and approve before changes are made. ${
                    action === actionOptions.CHANGE_DRAFT_TO_PLANNED
                        ? "Use the toggle to see how your request will change the agreement total."
                        : ""
                }`}
                budgetLineItems={selectedBudgetLines}
                agreement={agreement}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
                action={changeRequestAction}
            >
                {hasBLIError && (
                    <div className="font-12px usa-form-group usa-form-group--error margin-left-0 margin-bottom-2">
                        <span
                            className="usa-error-message text-normal margin-left-neg-1"
                            role="alert"
                        >
                            This information is required to submit for approval
                        </span>
                    </div>
                )}
                {groupedBudgetLinesByServicesComponent.length > 0 &&
                    groupedBudgetLinesByServicesComponent.map((group, index) => {
                        const budgetLineScGroupingLabel = group.serviceComponentGroupingLabel
                            ? group.serviceComponentGroupingLabel
                            : group.servicesComponentNumber;
                        return (
                            <ServicesComponentAccordion
                                key={`${group.servicesComponentNumber}-${index}`}
                                servicesComponentNumber={group.servicesComponentNumber}
                                serviceComponentGroupingLabel={group.serviceComponentGroupingLabel}
                                withMetadata={true}
                                periodStart={findPeriodStart(servicesComponents, budgetLineScGroupingLabel)}
                                periodEnd={findPeriodEnd(servicesComponents, budgetLineScGroupingLabel)}
                                description={findDescription(servicesComponents, budgetLineScGroupingLabel)}
                                optional={findIfOptional(servicesComponents, budgetLineScGroupingLabel)}
                                serviceRequirementType={agreement?.service_requirement_type}
                            >
                                {group.budgetLines.length > 0 ? (
                                    <AgreementBLIReviewTable
                                        readOnly={true}
                                        budgetLines={group.budgetLines}
                                        isReviewMode={true}
                                        setSelectedBLIs={handleSelectBLI}
                                        toggleSelectActionableBLIs={() =>
                                            toggleSelectActionableBLIs(group.servicesComponentNumber)
                                        }
                                        mainToggleSelected={toggleStates[group.servicesComponentNumber] || false}
                                        setMainToggleSelected={(newState) =>
                                            setToggleStates((prev) => ({
                                                ...prev,
                                                [group.servicesComponentNumber]: newState
                                            }))
                                        }
                                        servicesComponentNumber={group.servicesComponentNumber}
                                        action={action}
                                    />
                                ) : (
                                    <p className="text-center margin-y-7">
                                        You have not added any budget lines to this services component yet.
                                    </p>
                                )}
                            </ServicesComponentAccordion>
                        );
                    })}
            </AgreementBLIAccordion>
            <AgreementCANReviewAccordion
                instructions={`The budget lines you've selected are using funds from the CANs displayed below. ${
                    action === actionOptions.CHANGE_DRAFT_TO_PLANNED
                        ? "Use the toggle to see how your approval would change the remaining budget of CANs within your Portfolio or Division."
                        : ""
                }`}
                selectedBudgetLines={selectedBudgetLines}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
                action={changeRequestAction}
                changeRequestType={agreement?.change_request_type}
            />
            {action === actionOptions.CHANGE_PLANNED_TO_EXECUTING && (
                <Accordion
                    heading="Upload Documents"
                    level={2}
                >
                    <p className="margin-bottom-neg-2">
                        {isAgreementAwarded
                            ? "Please coordinate documents related to contract modifications via email until contract modifications have been developed in OPS."
                            : "Please coordinate documents related to pre-solicitation via email until upload documents have been developed in OPS."}
                    </p>
                </Accordion>
            )}
            <Accordion
                heading="Review Changes"
                level={2}
            >
                <p>This is a list of status changes you are requesting approval for.</p>
                {selectedBudgetLines.length > 0 &&
                    selectedBudgetLines.map((budgetLine) => (
                        <StatusChangeReviewCard
                            key={budgetLine.id}
                            isCondensed={true}
                            agreementId={budgetLine.agreement_id}
                            bliId={budgetLine.id}
                            requestDate={budgetLine.date_needed}
                            changeTo={changeTo}
                            handleReviewChangeRequest={() => {}}
                            changeRequestId={budgetLine.id}
                            createdById={budgetLine.created_by}
                        />
                    ))}
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
                    name="cancel"
                    className={`usa-button usa-button--unstyled margin-right-2`}
                    data-cy="cancel-approval-btn"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
                <button
                    className={`usa-button usa-button--outline margin-right-2 ${
                        !isAgreementEditable ? "usa-tooltip" : ""
                    }`}
                    data-cy="edit-agreement-btn"
                    title={!isAgreementEditable ? "Agreement is not editable" : ""}
                    onClick={() => {
                        navigate(`/agreements/edit/${agreement?.id}?mode=review`);
                    }}
                    disabled={!isAgreementEditable}
                >
                    Edit
                </button>
                {!isSubmissionReady || !agreementValidationResults.isValid() ? (
                    <Tooltip
                        label="Agreement is not ready to be sent for approval."
                        position="top"
                    >
                        <button
                            className="usa-button"
                            data-cy="send-to-approval-btn"
                            disabled={true}
                        >
                            Send to Approval
                        </button>
                    </Tooltip>
                ) : (
                    <button
                        className="usa-button"
                        data-cy="send-to-approval-btn"
                        onClick={handleSendToApproval}
                    >
                        Send to Approval
                    </button>
                )}
            </div>
        </App>
    );
};

export default ReviewAgreement;
