import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import classnames from "vest/classnames";
import PropTypes from "prop-types";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
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
import { setActionableBudgetLines, anyBudgetLinesByStatus } from "./ReviewAgreement.helpers";

/**
 * Renders a page for reviewing and sending an agreement to approval.
 * @param {Object} props - The component props.
 * @param {number} props.agreement_id - The ID of the agreement to review.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const ReviewAgreement = ({ agreement_id }) => {
    const navigate = useNavigate();
    const {
        isSuccess,
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreement_id, {
        refetchOnMountOrArgChange: true
    });

    const [updateBudgetLineItemStatus] = useUpdateBudgetLineItemStatusMutation();
    const [action, setAction] = useState(""); // for the action accordion
    const [pageErrors, setPageErrors] = useState({});
    const [isAlertActive, setIsAlertActive] = useState(false);
    const isAgreementStateEditable = useIsAgreementEditable(agreement?.id);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isAgreementEditable = isAgreementStateEditable && canUserEditAgreement;
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const { setAlert } = useAlert();

    let res = suite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });
    // pass in the agreement object to the suite
    useEffect(() => {
        if (isSuccess) {
            suite({
                ...agreement
            });
        }
        return () => {
            suite.reset();
        };
    }, [isSuccess, agreement]);

    // fire the page errors based on the suite results
    useEffect(() => {
        if (isSuccess && !res.isValid()) {
            setIsAlertActive(true);
            setPageErrors(res.getErrors());
        }
        return () => {
            setPageErrors({});
            setIsAlertActive(false);
        };
    }, [res, isSuccess]);

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
    const actionableBudgetLines = setActionableBudgetLines(agreement, action);

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
        <>
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
                    className="text-bold margin-top-0"
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
                setAction={setAction}
                optionOneDisabled={!anyBudgetLinesDraft}
                optionTwoDisabled={!anyBudgetLinePlanned}
            />
            <pre className="border-1px padding-1 font-12px border-dotted border-info">
                {action ? action : "no action"} is selected
            </pre>
            <pre className="border-1px padding-1 font-12px border-dotted border-info">
                actionableBudgetLines:
                {actionableBudgetLines && JSON.stringify(actionableBudgetLines, null, 2)}
            </pre>

            <AgreementBLIAccordion
                budgetLineItems={agreement?.budget_line_items}
                agreement={agreement}
            >
                <div
                    className={`font-12px usa-form-group ${areThereBudgetLineErrors ? "usa-form-group--error" : null}`}
                >
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
                {/* TODO: Make actionable Table variant */}
                {/* TODO: Handle action toggle disabling of BLIs */}
                <BudgetLinesTable
                    readOnly={true}
                    budgetLinesAdded={agreement?.budget_line_items}
                    isReviewMode={true}
                    showTotalSummaryCard={false}
                />
            </AgreementBLIAccordion>
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
        </>
    );
};

ReviewAgreement.propTypes = {
    agreement_id: PropTypes.number.isRequired
};

export default ReviewAgreement;
