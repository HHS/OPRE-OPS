import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {useGetAgreementByIdQuery, useUpdateBudgetLineItemStatusMutation} from "../../../api/opsAPI";
import {getUser} from "../../../api/getUser";
import Alert from "../../../components/UI/Alert/Alert";
import {convertCodeForDisplay} from "../../../helpers/utils";
import ProjectSummaryCard from "../../../components/ResearchProjects/ProjectSummaryCard/ProjectSummaryCard";
import ProductServiceCodeSelect from "../../../components/UI/Form/ProductServiceCodeSelect";
import ProductServiceCodeSummaryBox from "../../../components/UI/Form/ProductServiceCodeSummaryBox";
import {formatTeamMember} from "../../../api/postAgreements";
import { patchAgreement } from "../../../api/patchAgreements";
import ProcurementShopSelect from "../../../components/UI/Form/ProcurementShopSelect";

// import {
//     useEditAgreement,
//     useSetState,
//     useUpdateAgreement,
//     useEditAgreementDispatch,
// } from "./EditAgreementContext";
// import {
//     useCreateAgreement as useEditAgreement,
//     useSetState,
//     useUpdateAgreement,
//     useCreateAgreementDispatch as useEditAgreementDispatch
// } from "../CreateAgreementContext";

export const EditAgreementForm = ({ agreement }) => {
    // const navigate = useNavigate();

    const agreement_remote = agreement

    // useEffect(() => {
    //     const getUserAndSetState = async (id) => {
    //         const results = await getUser(id);
    //         setUser(results);
    //     };
    //
    //     // if (agreement?.project_officer) {
    //     //     getUserAndSetState(agreement?.project_officer).catch(console.error);
    //     // } else {
    //     //     setUser({ full_name: "Sheila Celentano" });
    //     // }
    //
    //     return () => {
    //         setUser({});
    //     };
    // }, [agreement]);


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

    // const anyBudgetLinesAreDraft = agreement.budget_line_items.some((item) => item.status === "DRAFT");

    // ~~~~~~~

    // const dispatch = useEditAgreementDispatch();
    // const {
    //     // wizardSteps,
    //     // selected_project: selectedResearchProject,
    //     agreement,
    //     selected_procurement_shop: selectedProcurementShop,
    // } = useEditAgreement();
    // const {
    //     notes: agreementNotes,
    //     incumbent_entered: agreementIncumbent,
    //     selected_agreement_type: selectedAgreementType,
    //     name: agreementTitle,
    //     description: agreementDescription,
    //     selected_product_service_code: selectedProductServiceCode,
    //     selected_agreement_reason: selectedAgreementReason,
    //     project_officer: selectedProjectOfficer,
    //     team_members: selectedTeamMembers,
    // } = agreement;
    // // SETTERS
    // const setSelectedProcurementShop = useSetState("selected_procurement_shop");
    //
    // // AGREEMENT SETTERS
    // const setSelectedAgreementType = useUpdateAgreement("selected_agreement_type");
    // const setAgreementTitle = useUpdateAgreement("name");
    // // setAgreementTitle(agreement_remote?.name)
    // const setAgreementDescription = useUpdateAgreement("description");
    // const setAgreementProcurementShopId = useUpdateAgreement("procurement_shop_id");
    // const setAgreementId = useUpdateAgreement("id");
    // const setSelectedProductServiceCode = useUpdateAgreement("selected_product_service_code");
    // const setSelectedAgreementReason = useUpdateAgreement("selected_agreement_reason");
    // const setSelectedProjectOfficer = useUpdateAgreement("project_officer");
    // const setAgreementIncumbent = useUpdateAgreement("incumbent_entered");
    // const setAgreementNotes = useUpdateAgreement("notes");

    const [agreementTitle, setAgreementTitle] = useState(agreement.name);
    const [agreementDescription, setAgreementDescription] = useState(agreement.description)
    const [selectedProductServiceCode, setSelectedProductServiceCode] = useState(agreement.product_service_code)
    const [selectedProcurementShop, setSelectedProcurementShop] = useState(agreement.procurement_shop)

    const saveAgreement = async () => {
        const id = agreement.id;
        const data = {
            name: agreementTitle,
            description: agreementDescription,
            product_service_code_id: (selectedProductServiceCode?.id || null),
            procurement_shop_id: (selectedProcurementShop?.id || null)
        };
        const response = await patchAgreement(id, data);
        console.log(`Agreement Updated: ${response.id}`);
        console.log(response);
    };

    const handleSave = async () => {
        saveAgreement();
        // await showAlertAndNavigate("success", "Agreement Draft Saved", "The agreement has been successfully saved.");
        alert("Saved");
    };

    const handleCancel = () => {
        // setShowModal(true);
        // setModalProps({
        //     heading: "Are you sure you want to cancel? Your agreement will not be saved.",
        //     actionButtonText: "Cancel",
        //     secondaryButtonText: "Continue Editing",
        //     handleConfirm: () => {
        //         navigate("/agreements/");
        //     },
        // });
        console.log("Cancel")
        alert("TODO: Cancel")
    };


    return (
        <>
            <p>Hello 123</p>

            {/*{isAlertActive ? (*/}
            {/*    <Alert heading={alertProps.heading} type={alertProps.type} setIsAlertActive={setIsAlertActive}>*/}
            {/*        {alertProps.message}*/}
            {/*    </Alert>*/}
            {/*) : (*/}
            {/*    <h1 className="text-bold margin-top-0" style={{ fontSize: "1.375rem" }}>*/}
            {/*        Edit Agreement*/}
            {/*    </h1>*/}
            {/*)}*/}

            <ProjectSummaryCard selectedResearchProject={agreement_remote?.research_project} />
            <h2 className="font-sans-lg">Agreement Type</h2>
            {convertCodeForDisplay("agreementType", agreement_remote?.agreement_type)}

            <h2 className="font-sans-lg margin-top-3">Agreement Details</h2>
            <label className="usa-label" htmlFor="agreement-title">
                Agreement Title
            </label>
            <input
                className="usa-input"
                id="agreement-title"
                name="agreement-title"
                type="text"
                value={agreementTitle || ""}
                onChange={(e) => setAgreementTitle(e.target.value)}
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
                value={agreementDescription || ""}
                onChange={(e) => setAgreementDescription(e.target.value)}
            ></textarea>

            <ProductServiceCodeSelect
                selectedProductServiceCode={selectedProductServiceCode}
                setSelectedProductServiceCode={setSelectedProductServiceCode}
            />
            {selectedProductServiceCode &&
                selectedProductServiceCode.naics &&
                selectedProductServiceCode.support_code && (
                    <ProductServiceCodeSummaryBox selectedProductServiceCode={selectedProductServiceCode} />
                )}

            <h2 className="font-sans-lg margin-top-3">Procurement Shop</h2>
            <ProcurementShopSelect
                selectedProcurementShop={selectedProcurementShop}
                onChangeSelectedProcurementShop={setSelectedProcurementShop}
            />

            <div className="grid-row flex-justify margin-top-8">
                <div>
                    <button
                        className="usa-button usa-button--unstyled margin-right-2"
                        data-cy="cancel-button"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button className="usa-button usa-button--outline" onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>

        </>
    );
};

export default EditAgreementForm;
