import { Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import classnames from "vest/classnames";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { useGetAgreementByIdQuery, useUpdateBudgetLineItemStatusMutation } from "../../../api/opsAPI";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import { convertCodeForDisplay } from "../../../helpers/utils";
import suite from "./suite";
import { useIsAgreementEditable, useIsUserAllowedToEditAgreement } from "../../../hooks/agreement.hooks";
import useAlert from "../../../hooks/use-alert.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import AgreementActionAccordion from "../../../components/Agreements/AgreementActionAccordion";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementChangesAccordion from "../../../components/Agreements/AgreementChangesAccordion";
import { anyBudgetLinesByStatus, selectedBudgetLinesTotal, getTotalBySelectedCans } from "./ReviewAgreement.helpers";
import AgreementBLIReviewTable from "../../../components/BudgetLineItems/BLIReviewTable";
import useReviewAgreement from "./reviewAgreement.hooks";
import App from "../../../App";

/**
 * Renders a page for reviewing and sending an agreement to approval.
 * @returns {React.JSX.Element} - The rendered component.
 */

export const ReviewAgreement = () => {
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

    const [updateBudgetLineItemStatus] = useUpdateBudgetLineItemStatusMutation();
    const isAgreementStateEditable = useIsAgreementEditable(agreement?.id);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isAgreementEditable = isAgreementStateEditable && canUserEditAgreement;
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const { setAlert } = useAlert();
    const {
        budgetLines,
        handleSelectBLI,
        pageErrors,
        isAlertActive,
        res,
        handleActionChange,
        toggleSelectActionableBLIs,
        mainToggleSelected,
        setMainToggleSelected
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

    const handleSendToApproval = () => {
        if (anyBudgetLinesDraft) {
            agreement?.budget_line_items.forEach((bli) => {
                if (bli.status === "DRAFT") {
                    console.log(bli.id);
                    updateBudgetLineItemStatus({ id: bli.id, status: "UNDER_REVIEW" })
                        .unwrap()
                        .then((fulfilled) => {
                            console.log("BLI Status Updated:", fulfilled);
                            setAlert({
                                type: "success",
                                heading: "Agreement sent to approval",
                                message: "The agreement has been successfully sent to approval for Planned Status.",
                                redirectUrl: "/agreements"
                            });
                        })
                        .catch((rejected) => {
                            console.log("Error Updating Budget Line Status");
                            console.dir(rejected);
                            setAlert({
                                type: "error",
                                heading: "Error",
                                message: "An error occurred. Please try again.",
                                redirectUrl: "/error"
                            });
                        });
                }
            });
        }
    };

    return (
        <App breadCrumbName="Agreements">
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
                                <strong>{convertCodeForDisplay("validation", key)}: </strong>
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
                <h1
                    className="text-bold"
                    style={{ fontSize: "1.375rem" }}
                >
                    Review and Send Agreement to Approval
                </h1>
            )}
            <AgreementMetaAccordion
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                res={res}
                cn={cn}
                convertCodeForDisplay={convertCodeForDisplay}
            />
            <AgreementActionAccordion
                setAction={handleActionChange}
                optionOneDisabled={!anyBudgetLinesDraft}
                optionTwoDisabled={!anyBudgetLinePlanned}
            />

            <AgreementBLIAccordion
                budgetLineItems={agreement?.budget_line_items}
                agreement={agreement}
            >
                <div className={`font-12px usa-form-group ${areThereBudgetLineErrors ? "usa-form-group--error" : ""}`}>
                    {areThereBudgetLineErrors && (
                        <ul className="usa-error-message padding-left-2 border-left-05">
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
                                        {budgetLineItem}: {errors.join(", ")}
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
                <AgreementBLIReviewTable
                    readOnly={true}
                    budgetLines={budgetLines}
                    isReviewMode={true}
                    showTotalSummaryCard={false}
                    setSelectedBLIs={handleSelectBLI}
                    toggleSelectActionableBLIs={toggleSelectActionableBLIs}
                    mainToggleSelected={mainToggleSelected}
                    setMainToggleSelected={setMainToggleSelected}
                />
            </AgreementBLIAccordion>
            <AgreementChangesAccordion
                changeInBudgetLines={selectedBudgetLinesTotal(budgetLines)}
                changeInCans={changeInCans}
            />

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
                <button
                    className={`usa-button ${!anyBudgetLinesDraft ? "usa-tooltip" : ""}`}
                    data-cy="send-to-approval-btn"
                    title={!anyBudgetLinesDraft ? "Agreement is not able to be reviewed" : ""}
                    onClick={handleSendToApproval}
                    disabled={!anyBudgetLinesDraft || !res.isValid()}
                >
                    Send to Approval
                </button>
            </div>
        </App>
    );
};

export default ReviewAgreement;
