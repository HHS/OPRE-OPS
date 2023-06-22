import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import classnames from "vest/classnames";
import PreviewTable from "../../../components/UI/PreviewTable";
import Alert from "../../../components/UI/Alert";
import { useGetAgreementByIdQuery, useUpdateBudgetLineItemStatusMutation } from "../../../api/opsAPI";
import { getUser } from "../../../api/getUser";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import Terms from "./Terms";
import suite from "./suite";

/**
 * Renders a page for reviewing and sending an agreement to approval.
 * @param {Object} props - The component props.
 * @param {string} props.agreement_id - The ID of the agreement to review.
 * @returns {JSX.Element} - The rendered component.
 */
export const ReviewAgreement = ({ agreement_id }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementByIdQuery(agreement_id);

    const [updateBudgetLineItemStatus] = useUpdateBudgetLineItemStatusMutation();

    const [projectOfficerName, setProjectOfficerName] = useState({ full_name: "" });
    const [pageErrors, setPageErrors] = useState({});
    const isAlertActive = useSelector((state) => state.alert.isActive);
    let res = suite.get();

    console.log(JSON.stringify(res, null, 2));
    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning",
    });

    // add agreement data to suite
    useEffect(() => {
        if (agreement) {
            suite.reset();
            suite({
                ...agreement,
            });
        }
        if (!res.isValid()) {
            dispatch(
                setAlert({
                    type: "error",
                    heading: "Please resolve the errors outlined below",
                    message:
                        "In order to send this agreement to approval, click edit to update the required information.",
                })
            );
            setPageErrors(res.getErrors());
        }
    }, [agreement, dispatch, res]);

    useEffect(() => {
        const getUserAndSetState = async (id) => {
            const results = await getUser(id);
            setProjectOfficerName(results);
        };

        if (agreement?.project_officer) {
            getUserAndSetState(agreement?.project_officer).catch(console.error);
        }

        return () => {
            setProjectOfficerName({
                full_name: "",
            });
        };
    }, [agreement]);

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Oops, an error occured</div>;
    }

    const anyBudgetLinesAreDraft = agreement.budget_line_items.some((item) => item.status === "DRAFT");

    const handleSendToApproval = () => {
        if (anyBudgetLinesAreDraft) {
            agreement?.budget_line_items.forEach((bli) => {
                if (bli.status === "DRAFT") {
                    console.log(bli.id);
                    try {
                        updateBudgetLineItemStatus({ id: bli.id, status: "UNDER_REVIEW" }).unwrap();
                        console.log("BLI Status Updated");
                    } catch (error) {
                        console.log("Error Updating Budget Line Status");
                        console.dir(error);
                    }
                }
            });
        }
        dispatch(
            setAlert({
                type: "success",
                heading: "Agreement sent to approval",
                message: "The agreement has been successfully sent to approval for Planned Status.",
                redirectUrl: "/agreements",
            })
        );
    };

    return (
        <>
            {isAlertActive ? (
                <Alert noClear={true}>
                    <ul>
                        {Object.entries(pageErrors).map(([key, value]) => (
                            <li key={key}>
                                <strong>{key}: </strong>
                                {value.map((message, index) => (
                                    <span key={index}>{message}</span>
                                ))}
                            </li>
                        ))}
                    </ul>
                </Alert>
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
                    value={projectOfficerName?.full_name}
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
            <h2 className="text-bold" style={{ fontSize: "1.375rem" }}>
                Budget Lines
            </h2>
            <p>This is a list of all budget lines within this agreement.</p>
            <PreviewTable readOnly={true} budgetLinesAdded={agreement?.budget_line_items} />
            <div className="grid-row flex-justify-end margin-top-1">
                <button
                    className="usa-button usa-button--outline margin-right-2"
                    onClick={() => {
                        navigate(`/agreements/edit/${agreement?.id}`);
                    }}
                >
                    Edit
                </button>
                <button
                    className="usa-button"
                    onClick={handleSendToApproval}
                    disabled={!anyBudgetLinesAreDraft || !res.isValid()}
                >
                    Send to Approval
                </button>
            </div>
        </>
    );
};

export default ReviewAgreement;
