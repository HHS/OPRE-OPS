import { Fragment } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import classnames from "vest/classnames";
import App from "../../../App";
import { useGetAgreementByIdQuery, useUpdateBudgetLineItemMutation } from "../../../api/opsAPI";
import AgreementActionAccordion from "../../../components/Agreements/AgreementActionAccordion";
import AgreementAddInfoAccordion from "../../../components/Agreements/AgreementAddInfoAccordion";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import AgreementChangesAccordion from "../../../components/Agreements/AgreementChangesAccordion";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementBLIReviewTable from "../../../components/BudgetLineItems/BLIReviewTable";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import TextArea from "../../../components/UI/Form/TextArea";
import PageHeader from "../../../components/UI/PageHeader";
import Tooltip from "../../../components/UI/USWDS/Tooltip";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { useIsAgreementEditable, useIsUserAllowedToEditAgreement } from "../../../hooks/agreement.hooks";
import useAlert from "../../../hooks/use-alert.hooks";
import useToggle from "../../../hooks/useToggle";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { actionOptions, selectedAction } from "./ReviewAgreement.constants";
import {
    anyBudgetLinesByStatus,
    getSelectedBudgetLines,
    getTotalBySelectedCans,
    selectedBudgetLinesTotal
} from "./ReviewAgreement.helpers";
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
        isSuccess,
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });
    const activeUser = useSelector((state) => state.auth.activeUser);
    const isAgreementStateEditable = useIsAgreementEditable(agreement?.id);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isAgreementEditable = isAgreementStateEditable && canUserEditAgreement;
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const [afterApproval, setAfterApproval] = useToggle(true);
    const { setAlert } = useAlert();
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
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
        action
    } = useReviewAgreement(agreement, isSuccess);

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

    // convert page errors about budget lines object into an array of objects
    const budgetLinePageErrors = Object.entries(pageErrors).filter((error) => error[0].includes("Budget line item"));
    const budgetLinePageErrorsExist = budgetLinePageErrors.length > 0;
    const budgetLineErrors = res.getErrors("budget-line-items");
    const budgetLineErrorsExist = budgetLineErrors.length > 0;
    const areThereBudgetLineErrors = budgetLinePageErrorsExist || budgetLineErrorsExist;
    const anyBudgetLinesDraft = anyBudgetLinesByStatus(agreement, "DRAFT");
    const anyBudgetLinePlanned = anyBudgetLinesByStatus(agreement, "PLANNED");
    const changeInCans = getTotalBySelectedCans(budgetLines);
    const actionOptionsToChangeRequests = {
        [actionOptions.CHANGE_DRAFT_TO_PLANNED]: selectedAction.DRAFT_TO_PLANNED,
        [actionOptions.CHANGE_PLANNED_TO_EXECUTING]: selectedAction.PLANNED_TO_EXECUTING
    };
    let changeRequestAction = actionOptionsToChangeRequests[action];
    const isAnythingSelected = getSelectedBudgetLines(budgetLines).length > 0;
    const isDRAFTSubmissionReady =
        anyBudgetLinesDraft && action === actionOptions.CHANGE_DRAFT_TO_PLANNED && isAnythingSelected;
    const isPLANNEDSubmissionReady =
        anyBudgetLinePlanned && action === actionOptions.CHANGE_PLANNED_TO_EXECUTING && isAnythingSelected;
    const isSubmissionReady = isDRAFTSubmissionReady || isPLANNEDSubmissionReady;

    const handleSendToApproval = () => {
        if (anyBudgetLinesDraft || anyBudgetLinePlanned) {
            const selectedBudgetLines = getSelectedBudgetLines(budgetLines);
            let selectedBLIsWithStatusAndNotes = [];

            switch (action) {
                case actionOptions.CHANGE_DRAFT_TO_PLANNED:
                    selectedBLIsWithStatusAndNotes = selectedBudgetLines.map((bli) => {
                        return { id: bli.id, status: BLI_STATUS.PLANNED, requestor_notes: notes };
                    });
                    break;
                case actionOptions.CHANGE_PLANNED_TO_EXECUTING:
                    selectedBLIsWithStatusAndNotes = selectedBudgetLines.map((bli) => {
                        return {
                            id: bli.id,
                            status: BLI_STATUS.EXECUTING,
                            requestor_notes: notes
                        };
                    });
                    break;
                default:
                    break;
            }

            const currentUserId = activeUser?.id;

            console.log("BLI Package Data:", selectedBudgetLines, currentUserId, notes);
            console.log("THE ACTION IS:", action);

            let promises = selectedBLIsWithStatusAndNotes.map((budgetLine) => {
                const { id, data: cleanExistingBLI } = cleanBudgetLineItemForApi(budgetLine);
                return updateBudgetLineItem({ id, data: cleanExistingBLI })
                    .unwrap()
                    .then((fulfilled) => {
                        console.log("Updated BLI:", fulfilled);
                    })
                    .catch((rejected) => {
                        console.error("Error Updating Budget Line");
                        console.error({ rejected });
                        throw new Error("Error Updating Budget Line");
                    });
            });
            Promise.allSettled(promises).then((results) => {
                let rejected = results.filter((result) => result.status === "rejected");
                if (rejected.length > 0) {
                    console.error(rejected[0].reason);
                    setAlert({
                        type: "error",
                        heading: "Error Sending Agreement Edits",
                        message: "There was an error sending your edits for approval. Please try again.",
                        redirectUrl: "/error"
                    });
                } else {
                    setAlert({
                        type: "success",
                        heading: "Changes Sent to Approval",
                        // TODO: add Change Requests to alert message
                        message:
                            "Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.",
                        redirectUrl: "/agreements"
                    });
                }
            });
        }
    };

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
                <AgreementBLIReviewTable
                    readOnly={true}
                    budgetLines={budgetLines}
                    isReviewMode={true}
                    setSelectedBLIs={handleSelectBLI}
                    toggleSelectActionableBLIs={toggleSelectActionableBLIs}
                    mainToggleSelected={mainToggleSelected}
                    setMainToggleSelected={setMainToggleSelected}
                />
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

const cleanBudgetLineItemForApi = (data) => {
    const cleanData = { ...data };
    if (data.services_component_id === 0) {
        cleanData.services_component_id = null;
    }
    if (cleanData.date_needed === "--") {
        cleanData.date_needed = null;
    }
    const budgetLineId = cleanData.id;
    delete cleanData.created_by;
    delete cleanData.created_on;
    delete cleanData.updated_on;
    delete cleanData.can;
    delete cleanData.id;
    delete cleanData.canDisplayName;
    delete cleanData.versions;
    delete cleanData.clin;
    delete cleanData.agreement;
    delete cleanData.financialSnapshotChanged;

    return { id: budgetLineId, data: cleanData };
};
