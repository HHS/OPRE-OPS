import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {useGetAgreementByIdQuery, useUpdateBudgetLineItemStatusMutation} from "../../../api/opsAPI";
import {getUser} from "../../../api/getUser";
import Alert from "../../../components/UI/Alert/Alert";
import {convertCodeForDisplay} from "../../../helpers/utils";
import ProjectSummaryCard from "../../../components/ResearchProjects/ProjectSummaryCard/ProjectSummaryCard";
import ProductServiceCodeSelect from "../../../components/UI/Form/ProductServiceCodeSelect";
import ProductServiceCodeSummaryBox from "../../../components/UI/Form/ProductServiceCodeSummaryBox";

export const EditAgreementForm = ({ agreement_id }) => {
    // const navigate = useNavigate();
    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementByIdQuery(agreement_id);

    // const [updateBudgetLineItemStatus] = useUpdateBudgetLineItemStatusMutation();

    const [user, setUser] = useState({});
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [alertProps, setAlertProps] = useState({
        type: "",
        heading: "",
        message: "",
    });

    useEffect(() => {
        const getUserAndSetState = async (id) => {
            const results = await getUser(id);
            setUser(results);
        };

        // if (agreement?.project_officer) {
        //     getUserAndSetState(agreement?.project_officer).catch(console.error);
        // } else {
        //     setUser({ full_name: "Sheila Celentano" });
        // }

        return () => {
            setUser({});
        };
    }, [agreement]);

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Oops, an error occurred</div>;
    }

    // /**
    //  * Shows an alert with the specified type, heading, and message.
    //  *
    //  * @async
    //  * @param {string} type - The type of the alert (e.g. "success", "warning", "error").
    //  * @param {string} heading - The heading of the alert.
    //  * @param {string} message - The message of the alert.
    //  * @returns {Promise<void>} A Promise that resolves when the alert is dismissed.
    //  */
    // const showAlert = async (type, heading, message) => {
    //     await new Promise((resolve) => setTimeout(resolve, 500));
    //     window.scrollTo(0, 0);
    //     setIsAlertActive(true);
    //     setAlertProps({ type, heading, message });
    //
    //     await new Promise((resolve) => setTimeout(resolve, 6000));
    //     setIsAlertActive(false);
    //     setAlertProps({});
    //     navigate("/agreements");
    // };

    const anyBudgetLinesAreDraft = agreement.budget_line_items.some((item) => item.status === "DRAFT");

    return (
        <>

            {isAlertActive ? (
                <Alert heading={alertProps.heading} type={alertProps.type} setIsAlertActive={setIsAlertActive}>
                    {alertProps.message}
                </Alert>
            ) : (
                <h1 className="text-bold margin-top-0" style={{ fontSize: "1.375rem" }}>
                    Edit Agreement
                </h1>
            )}

            <ProjectSummaryCard selectedResearchProject={agreement?.research_project} />
            <h2 className="font-sans-lg">Agreement Type</h2>
            {convertCodeForDisplay("agreementType", agreement?.agreement_type)}

            <h2 className="font-sans-lg margin-top-3">Agreement Details</h2>
            <label className="usa-label" htmlFor="agreement-title">
                Agreement Title
            </label>
            <input
                className="usa-input"
                id="agreement-title"
                name="agreement-title"
                type="text"
                // value={agreementTitle || ""}
                value={agreement?.name || ""}
                // onChange={(e) => setAgreementTitle(e.target.value)}
                required
            />

            <label className="usa-label" htmlFor="agreement-description">
                Description
            </label>
            <textarea
                className="usa-textarea"
                id="agreement-description"
                name="agreement-description"
                rows="5"
                style={{ height: "7rem" }}
                // value={agreementDescription || ""}
                value={agreement?.description || ""}
                // onChange={(e) => setAgreementDescription(e.target.value)}
            ></textarea>

            {/*<ProductServiceCodeSelect*/}
            {/*    selectedProductServiceCode={selectedProductServiceCode}*/}
            {/*    setSelectedProductServiceCode={setSelectedProductServiceCode}*/}
            {/*/>*/}
            {/*{selectedProductServiceCode &&*/}
            {/*    selectedProductServiceCode.naics &&*/}
            {/*    selectedProductServiceCode.support_code && (*/}
            {/*        <ProductServiceCodeSummaryBox selectedProductServiceCode={selectedProductServiceCode} />*/}
            {/*    )}*/}


            <dl className="margin-0 font-12px">
                <dt className="margin-0 text-base-dark margin-top-3">Product Service Code</dt>
                <dd className="text-semibold margin-0 margin-top-05">{agreement?.product_service_code?.name}</dd>
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

        </>
    );
};

export default EditAgreementForm;
