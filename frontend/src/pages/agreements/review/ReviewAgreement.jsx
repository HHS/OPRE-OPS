import { Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import classnames from "vest/classnames";
import App from "../../../App";
import AgreementActionAccordion from "../../../components/Agreements/AgreementActionAccordion";
import AgreementAddInfoAccordion from "../../../components/Agreements/AgreementAddInfoAccordion";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementChangesAccordion from "../../../components/Agreements/AgreementChangesAccordion";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementBLIReviewTable from "../../../components/BudgetLineItems/BLIReviewTable";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import TextArea from "../../../components/UI/Form/TextArea";
import PageHeader from "../../../components/UI/PageHeader";
import Tooltip from "../../../components/UI/USWDS/Tooltip";
import { findDescription, findPeriodEnd, findPeriodStart } from "../../../helpers/servicesComponent.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { actionOptions } from "./ReviewAgreement.constants";
import { getSelectedBudgetLines, selectedBudgetLinesTotal } from "./ReviewAgreement.helpers";
import useReviewAgreement from "./reviewAgreement.hooks";
import suite from "./suite";

/**
 * Renders a page for reviewing and sending an agreement to approval.
 * @component
 * @returns {JSX.Element} - The rendered component.
 */

export const ReviewAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = urlPathParams?.id;
    const navigate = useNavigate();

    const {
        budgetLines,
        handleSelectBLI,
        pageErrors,
        isAlertActive,
        res,
        handleActionChange,
        toggleSelectActionableBLIs,
        mainToggleSelected,
        setMainToggleSelected,
        notes,
        setNotes,
        action,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        handleSendToApproval,
        areThereBudgetLineErrors,
        isSubmissionReady,
        changeRequestAction,
        changeInCans,
        anyBudgetLinesDraft,
        anyBudgetLinePlanned,
        budgetLineErrorsExist,
        budgetLineErrors,
        budgetLinePageErrorsExist,
        budgetLinePageErrors,
        errorAgreement,
        isLoadingAgreement,
        isAgreementEditable,
        projectOfficerName,
        afterApproval,
        setAfterApproval,
        agreement
    } = useReviewAgreement(agreementId);

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });

    if (isLoadingAgreement) {
        return <h1>Loading...</h1>;
    }
    if (errorAgreement) {
        return <h1>Oops, an error occurred</h1>;
    }

    return (
        <App breadCrumbName="Request BL Status Change">
            {isAlertActive && Object.entries(pageErrors).length > 0 ? (
                <SimpleAlert
                    type="error"
                    heading="Please resolve the errors outlined below"
                    message="In order to send this agreement to approval, click edit to update the required information."
                >
                    <ul data-cy="error-list">
                        {Object.entries(pageErrors).map(([key, value]) => (
                            <li
                                key={key}
                                data-cy="error-item"
                            >
                                <strong>{convertCodeForDisplay("validation", key)} </strong>
                                {
                                    <span>
                                        {value.map((message, index) => (
                                            <Fragment key={index}>
                                                <span>{message}</span>
                                                {index < value.length - 1 && <span>, </span>}
                                            </Fragment>
                                        ))}
                                    </span>
                                }
                            </li>
                        ))}
                    </ul>
                </SimpleAlert>
            ) : (
                <PageHeader
                    title="Request BL Status Change"
                    subTitle={agreement?.name}
                />
            )}

            <AgreementMetaAccordion
                agreement={agreement}
                instructions="Please review the agreement details below and edit any information if necessary."
                projectOfficerName={projectOfficerName}
                res={res}
                cn={cn}
                convertCodeForDisplay={convertCodeForDisplay}
            />
            <AgreementActionAccordion
                setAction={handleActionChange}
                optionOneDisabled={!anyBudgetLinesDraft || areThereBudgetLineErrors}
                optionTwoDisabled={!anyBudgetLinePlanned || areThereBudgetLineErrors}
            />
            <AgreementBLIAccordion
                title="Select Budget Lines"
                instructions="  Select the budget lines you'd like this action to apply to. The agreement will be sent to your
                Division Director to review and approve before changes are made."
                budgetLineItems={getSelectedBudgetLines(budgetLines)}
                agreement={agreement}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
                action={changeRequestAction}
            >
                <div className={`font-12px usa-form-group ${areThereBudgetLineErrors ? "usa-form-group--error" : ""}`}>
                    {areThereBudgetLineErrors && (
                        <ul className="usa-error-message padding-left-2">
                            {budgetLineErrorsExist && (
                                <li>
                                    {budgetLineErrors.map((error, index) => (
                                        <Fragment key={index}>
                                            <span>{error}</span>
                                            {index < budgetLineErrors.length - 1 && <span>, </span>}
                                        </Fragment>
                                    ))}
                                </li>
                            )}
                            {budgetLinePageErrorsExist &&
                                budgetLinePageErrors.map(([budgetLineItem, errors]) => (
                                    <li key={budgetLineItem}>
                                        {budgetLineItem} {errors.join(", ")}
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
                {groupedBudgetLinesByServicesComponent.map((group) => (
                    <ServicesComponentAccordion
                        key={group.servicesComponentId}
                        servicesComponentId={group.servicesComponentId}
                        withMetadata={true}
                        periodStart={findPeriodStart(servicesComponents, group.servicesComponentId)}
                        periodEnd={findPeriodEnd(servicesComponents, group.servicesComponentId)}
                        description={findDescription(servicesComponents, group.servicesComponentId)}
                    >
                        <AgreementBLIReviewTable
                            readOnly={true}
                            budgetLines={budgetLines}
                            isReviewMode={true}
                            setSelectedBLIs={handleSelectBLI}
                            toggleSelectActionableBLIs={toggleSelectActionableBLIs}
                            mainToggleSelected={mainToggleSelected}
                            setMainToggleSelected={setMainToggleSelected}
                        />
                    </ServicesComponentAccordion>
                ))}
            </AgreementBLIAccordion>
            <AgreementCANReviewAccordion
                instructions="The budget lines you've selected are using funds from the CANs displayed below."
                selectedBudgetLines={getSelectedBudgetLines(budgetLines)}
                afterApproval={afterApproval}
                setAfterApproval={setAfterApproval}
                action={changeRequestAction}
            />
            {action === actionOptions.CHANGE_DRAFT_TO_PLANNED && (
                <AgreementChangesAccordion
                    changeInBudgetLines={selectedBudgetLinesTotal(budgetLines)}
                    changeInCans={changeInCans}
                />
            )}
            {action === actionOptions.CHANGE_PLANNED_TO_EXECUTING && <AgreementAddInfoAccordion />}
            <section>
                <h2 className="font-sans-lg text-semibold">Notes</h2>
                <TextArea
                    name="submitter-notes"
                    label="Notes (optional)"
                    maxLength={150}
                    value={notes}
                    onChange={(name, value) => setNotes(value)}
                />
            </section>
            <div className="grid-row flex-justify-end margin-top-1">
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
                {!isSubmissionReady || !res.isValid() ? (
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
