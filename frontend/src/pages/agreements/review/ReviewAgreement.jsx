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
import Input from "../../../components/UI/Form/Input/Input";
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

    const [user, setUser] = useState({});
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
    }, [agreement]);

    useEffect(() => {
        const getUserAndSetState = async (id) => {
            const results = await getUser(id);
            setUser(results);
        };

        if (agreement?.project_officer) {
            getUserAndSetState(agreement?.project_officer).catch(console.error);
        } else {
            setUser({ full_name: "Sheila Celentano" });
        }

        return () => {
            setUser({});
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
                <Alert />
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
                {agreement?.name ? (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-3">Project</dt>
                        <dd className="text-semibold margin-0 margin-top-05">{agreement?.name}</dd>
                    </>
                ) : (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-3">Project</dt>
                        <p>This information is required for approval</p>
                        <dd className="text-semibold margin-0 margin-top-05">TBD</dd>
                    </>
                )}

                <dt className="margin-0 text-base-dark margin-top-3">Agreement Type</dt>
                <dd className="text-semibold margin-0 margin-top-05">
                    {convertCodeForDisplay("agreementType", agreement?.agreement_type)}
                </dd>
                <dt className="margin-0 text-base-dark margin-top-3">Agreement</dt>
                <dd className="text-semibold margin-0 margin-top-05">{agreement?.name}</dd>
                {agreement?.description ? (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-3">Description</dt>
                        <dd className="text-semibold margin-0 margin-top-05">{agreement?.description}</dd>
                    </>
                ) : (
                    <div className="usa-form-group usa-form-group--error">
                        <dt className="margin-0 text-base-dark margin-top-3">Description</dt>
                        <p className="usa-error-message">This information is required for approval</p>
                        <dd className="text-semibold margin-0 margin-top-05">TBD</dd>
                    </div>
                )}

                <Input
                    name="description"
                    label="Description"
                    onChange={() => {}}
                    messages={res.getErrors("description")}
                    className={cn("description")}
                    value={agreement?.description}
                />
                <Input
                    name="psc"
                    label="Product Service Code"
                    onChange={() => {}}
                    messages={res.getErrors("psc")}
                    className={cn("psc")}
                    value={agreement?.product_service_code?.name}
                />

                {/* <dt className="margin-0 text-base-dark margin-top-3">Product Service Code</dt>
                <dd className="text-semibold margin-0 margin-top-05">{agreement?.product_service_code?.name}</dd> */}
                <dt className="margin-0 text-base-dark margin-top-3">NAICS Code</dt>
                <dd className="text-semibold margin-0 margin-top-05">{agreement?.product_service_code?.naics}</dd>
                <dt className="margin-0 text-base-dark margin-top-3">Program Support Code</dt>
                <dd className="text-semibold margin-0 margin-top-05">
                    {agreement?.product_service_code?.support_code}
                </dd>
                <dt className="margin-0 text-base-dark margin-top-3">Procurement Shop</dt>
                <dd className="text-semibold margin-0 margin-top-05">{`${
                    agreement?.procurement_shop?.abbr
                } - Fee Rate: ${agreement?.procurement_shop?.fee * 100}%`}</dd>
                <dt className="margin-0 text-base-dark margin-top-3">Reason for creating the agreement</dt>
                <dd className="text-semibold margin-0 margin-top-05">
                    {convertCodeForDisplay("agreementReason", agreement?.agreement_reason)}
                </dd>
                {agreement.incumbent && (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-3">Incumbent</dt>
                        <dd className="text-semibold margin-0 margin-top-05">{agreement?.incumbent}</dd>
                    </>
                )}
                <dt className="margin-0 text-base-dark margin-top-3">Project Officer</dt>
                <dd className="text-semibold margin-0 margin-top-05">{user?.full_name}</dd>
                {agreement?.team_members.length > 0 && (
                    <>
                        <dt className="margin-0 text-base-dark margin-top-3">Team Members</dt>
                        {agreement?.team_members.map((member) => (
                            <dd key={member.id} className="text-semibold margin-0 margin-top-05">
                                {member.full_name}
                            </dd>
                        ))}
                    </>
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
                <button className="usa-button" onClick={handleSendToApproval} disabled={!anyBudgetLinesAreDraft}>
                    Send to Approval
                </button>
            </div>
        </>
    );
};

export default ReviewAgreement;
