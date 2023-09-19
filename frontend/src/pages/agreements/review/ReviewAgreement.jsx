import { useEffect, useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import classnames from "vest/classnames";
import PropTypes from "prop-types";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { useGetAgreementByIdQuery, useUpdateBudgetLineItemStatusMutation } from "../../../api/opsAPI";
import { convertCodeForDisplay } from "../../../helpers/utils";
import Terms from "./Terms";
import suite from "./suite";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import useGetUserFullNameFromId from "../../../helpers/user-hooks";
import { useIsAgreementEditable, useIsUserAllowedToEditAgreement } from "../../../helpers/agreement-hooks";

/**
 * Renders a page for reviewing and sending an agreement to approval.
 * @param {Object} props - The component props.
 * @param {number} props.agreement_id - The ID of the agreement to review.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const ReviewAgreement = ({ agreement_id }) => {
    const globalDispatch = useDispatch();
    const navigate = useNavigate();
    const {
        isSuccess,
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementByIdQuery(agreement_id, {
        refetchOnMountOrArgChange: true,
    });

    const [updateBudgetLineItemStatus] = useUpdateBudgetLineItemStatusMutation();
    const [pageErrors, setPageErrors] = useState({});
    const [isAlertActive, setIsAlertActive] = useState(false);
    const isAgreementStateEditable = useIsAgreementEditable(agreement?.id);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isAgreementEditable = isAgreementStateEditable && canUserEditAgreement;
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer);

    let res = suite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning",
    });
    // pass in the agreement object to the suite
    useEffect(() => {
        if (isSuccess) {
            suite({
                ...agreement,
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
    const anyBudgetLinesAreDraft = agreement.budget_line_items.some((item) => item.status === "DRAFT");

    const handleSendToApproval = () => {
        if (anyBudgetLinesAreDraft) {
            agreement?.budget_line_items.forEach((bli) => {
                if (bli.status === "DRAFT") {
                    console.log(bli.id);
                    updateBudgetLineItemStatus({ id: bli.id, status: "UNDER_REVIEW" })
                        .unwrap()
                        .then((fulfilled) => {
                            console.log("BLI Status Updated:", fulfilled);
                            globalDispatch(
                                setAlert({
                                    type: "success",
                                    heading: "Agreement sent to approval",
                                    message: "The agreement has been successfully sent to approval for Planned Status.",
                                })
                            );
                            navigate("/agreements");
                        })
                        .catch((rejected) => {
                            console.log("Error Updating Budget Line Status");
                            console.dir(rejected);
                            globalDispatch(
                                setAlert({
                                    type: "error",
                                    heading: "Error",
                                    message: "An error occurred. Please try again.",
                                })
                            );
                            navigate("/error");
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
                            <li key={key} data-cy="error-item">
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
                <h1 className="text-bold margin-top-0" style={{ fontSize: "1.375rem" }}>
                    Review and Send Agreement to Approval
                </h1>
            )}
            <p>
                Please review the agreement below and edit any information if necessary. Send to Approval will send the
                agreement to your Division Director to review for Planned Status.
            </p>

            <dl className="margin-0 font-12px">
                <Terms
                    name="name"
                    label="Project"
                    messages={res.getErrors("name")}
                    className={cn("name")}
                    value={agreement?.name}
                />
                <Terms
                    name="type"
                    label="Agreement Type"
                    messages={res.getErrors("type")}
                    className={cn("type")}
                    value={convertCodeForDisplay("agreementType", agreement?.agreement_type)}
                />
                <Terms
                    name="description"
                    label="Description"
                    messages={res.getErrors("description")}
                    className={cn("description")}
                    value={agreement?.description}
                />
                <Terms
                    name="psc"
                    label="Product Service Code"
                    messages={res.getErrors("psc")}
                    className={cn("psc")}
                    value={agreement?.product_service_code?.name}
                />
                <Terms
                    name="naics"
                    label="NAICS Code"
                    messages={res.getErrors("naics")}
                    className={cn("naics")}
                    value={agreement?.product_service_code?.naics}
                />
                <Terms
                    name="program-support-code"
                    label="Program Support Code"
                    messages={res.getErrors("program-support-code")}
                    className={cn("program-support-code")}
                    value={agreement?.product_service_code?.support_code}
                />
                <Terms
                    name="procurement-shop"
                    label="Procurement Shop"
                    messages={res.getErrors("procurement-shop")}
                    className={cn("procurement-shop")}
                    value={`${agreement?.procurement_shop?.abbr} - Fee Rate: ${
                        agreement?.procurement_shop?.fee * 100
                    }%`}
                />
                <Terms
                    name="reason"
                    label="Reason for creating the agreement"
                    messages={res.getErrors("reason")}
                    className={cn("reason")}
                    value={convertCodeForDisplay("agreementReason", agreement?.agreement_reason)}
                />

                {agreement?.incumbent && (
                    <Terms
                        name="incumbent"
                        label="Incumbent"
                        messages={res.getErrors("incumbent")}
                        className={cn("incumbent")}
                        value={agreement?.incumbent}
                    />
                )}
                <Terms
                    name="project-officer"
                    label="Project Officer"
                    messages={res.getErrors("project-officer")}
                    className={cn("project-officer")}
                    value={projectOfficerName}
                />

                {agreement?.team_members.length > 0 ? (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-3">Team Members</dt>
                        {agreement?.team_members.map((member) => (
                            <dd key={member.id} className="text-semibold margin-0 margin-top-05">
                                {member.full_name}
                            </dd>
                        ))}
                    </>
                ) : (
                    <Terms
                        name="team-member"
                        label="Team Members"
                        messages={res.getErrors("team-member")}
                        className={cn("team-member")}
                        value={agreement?.team_members[0]}
                    />
                )}
            </dl>
            <div className={`font-12px usa-form-group ${areThereBudgetLineErrors ? "usa-form-group--error" : null}`}>
                <h2 className="text-bold" style={{ fontSize: "1.375rem" }}>
                    Budget Lines
                </h2>
                <p>This is a list of all budget lines within this agreement.</p>
                {areThereBudgetLineErrors && (
                    <ul className="usa-error-message padding-left-1">
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

            <BudgetLinesTable readOnly={true} budgetLinesAdded={agreement?.budget_line_items} isReviewMode={true} />
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
                    className={`usa-button ${!anyBudgetLinesAreDraft ? "usa-tooltip" : ""}`}
                    data-cy="send-to-approval-btn"
                    title={!anyBudgetLinesAreDraft ? "Agreement is not able to be reviewed" : ""}
                    onClick={handleSendToApproval}
                    disabled={!anyBudgetLinesAreDraft || !res.isValid()}
                >
                    Send to Approval
                </button>
            </div>
        </>
    );
};

ReviewAgreement.propTypes = {
    agreement_id: PropTypes.number.isRequired,
};

export default ReviewAgreement;
