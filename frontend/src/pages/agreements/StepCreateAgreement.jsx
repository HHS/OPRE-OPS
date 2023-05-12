import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import ProcurementShopSelect from "../../components/Agreements/ProcurementShopSelect/ProcurementShopSelect";
import AgreementReasonSelect from "./AgreementReasonSelect";
import AgreementTypeSelect from "../../components/Agreements/AgreementTypeSelect/AgreementTypeSelect";
import ProductServiceCodeSelect from "../../components/Agreements/ProductServiceCodeSelect/ProductServiceCodeSelect";
import Alert from "../../components/UI/Alert/Alert";
import {
    setAgreementDescription,
    setAgreementId,
    setAgreementIncumbent,
    setAgreementNotes,
    setAgreementProcurementShop,
    setAgreementProjectOfficer,
    setAgreementTeamMembers,
    setAgreementTitle,
    setSelectedAgreementReason,
    setSelectedProcurementShop as setSelectedProcurementShopInAgreement,
    setSelectedProject,
} from "./createAgreementSlice";
import { setSelectedProcurementShop as setSelectedProcurementShopInBudgetLine } from "../budgetLines/createBudgetLineSlice";
import ProjectOfficerSelect from "./ProjectOfficerSelect";
import TeamMemberSelect from "./TeamMemberSelect";
import TeamMemberList from "./TeamMemberList";
import Modal from "../../components/UI/Modal/Modal";
import { postAgreement } from "../../api/postAgreements";
import ProjectSummaryCard from "../../components/ResearchProjects/ProjectSummaryCard/ProjectSummaryCard";
import ProductServiceCodeSummaryBox from "../../components/Agreements/ProductServiceCodeSummaryBox/ProductServiceCodeSummaryBox";

export const StepCreateAgreement = ({ goBack, goToNext, wizardSteps }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const agreementTitle = useSelector((state) => state.createAgreement.agreement.name);
    const agreementDescription = useSelector((state) => state.createAgreement.agreement.description);
    const agreementNotes = useSelector((state) => state.createAgreement.agreement.notes);
    const agreement = useSelector((state) => state.createAgreement.agreement);
    const agreementReason = agreement.selected_agreement_reason;
    const incumbentDisabled = agreementReason === "NEW_REQ" || agreementReason === null;
    const agreementIncumbent = useSelector((state) => state.createAgreement.agreement.incumbent_entered);
    const selectedResearchProject = useSelector((state) => state.createAgreement.selected_project);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const [isAlertActive, setIsAlertActive] = React.useState(false);
    const [alertProps, setAlertProps] = React.useState({});

    const [selectedAgreementType, setSelectedAgreementType] = React.useState("");
    const [selectedProductServiceCode, setSelectedProductServiceCode] = React.useState({});
    const [selectedProcurementShop, setSelectedProcurementShop] = React.useState({});

    const showAlertAndNavigate = async (type, heading, message) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.scrollTo(0, 0);
        setIsAlertActive(true);
        setAlertProps({ type, heading, message });

        await new Promise((resolve) =>
            setTimeout(() => {
                setIsAlertActive(false);
                setAlertProps({});
                navigate("/agreements/");
                resolve();
            }, 5000)
        );
    };

    const saveAgreement = async () => {
        const data = {
            ...agreement,
            selected_agreement_type: selectedAgreementType,
            product_service_code_id: selectedProductServiceCode ? selectedProductServiceCode.id : null,
        };
        const response = await postAgreement(data);
        const newAgreementId = response.id;
        console.log(`New Agreement Created: ${newAgreementId}`);
        dispatch(setAgreementId(newAgreementId));
    };
    const clearAgreement = () => {
        dispatch(setAgreementTitle(""));
        dispatch(setAgreementDescription(""));
        dispatch(setAgreementIncumbent(null));
        dispatch(setAgreementNotes(""));
        dispatch(setSelectedProject({}));
        setSelectedAgreementType("");
        setSelectedProductServiceCode({});
        dispatch(setSelectedAgreementReason(null));
        dispatch(setSelectedProcurementShop({}));
        dispatch(setAgreementProjectOfficer(null));
        dispatch(setAgreementTeamMembers([]));
        setModalProps({});
    };
    const handleContinue = async () => {
        saveAgreement();
        await goToNext();
    };
    const handleDraft = async () => {
        saveAgreement();
        clearAgreement();
        await showAlertAndNavigate("success", "Agreement Draft Saved", "The agreement has been successfully saved.");
    };
    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your agreement will not be saved.",
            actionButtonText: "Continue",
            handleConfirm: () => {
                clearAgreement();
                navigate("/agreements/");
            },
        });
    };

    const handleOnChangeSelectedProcurementShop = (procurementShop) => {
        // TODO:Remove dup state, i.e. use the local state and not in Redux
        setSelectedProcurementShop(procurementShop);
        dispatch(setAgreementProcurementShop(procurementShop.id));
        dispatch(setSelectedProcurementShopInAgreement(procurementShop));
        dispatch(setSelectedProcurementShopInBudgetLine(procurementShop));
    };

    return (
        <>
            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            {isAlertActive ? (
                <Alert heading={alertProps.heading} type={alertProps.type} setIsAlertActive={setIsAlertActive}>
                    {alertProps.message}
                </Alert>
            ) : (
                <>
                    <h1 className="font-sans-lg">Create New Agreement</h1>
                    <p>Follow the steps to create an agreement</p>
                </>
            )}
            <StepIndicator steps={wizardSteps} currentStep={2} />
            <ProjectSummaryCard selectedResearchProject={selectedResearchProject} />
            <h2 className="font-sans-lg">Select the Agreement Type</h2>
            <p>Select the type of agreement you&#39;d like to create.</p>
            <AgreementTypeSelect
                selectedAgreementType={selectedAgreementType}
                setSelectedAgreementType={setSelectedAgreementType}
            />
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
                onChange={(e) => dispatch(setAgreementTitle(e.target.value))}
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
                onChange={(e) => dispatch(setAgreementDescription(e.target.value))}
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
                onChangeSelectedProcurementShop={handleOnChangeSelectedProcurementShop}
            />

            <h2 className="font-sans-lg margin-top-3">Reason for Agreement</h2>
            <div className="display-flex">
                <AgreementReasonSelect />
                <fieldset
                    className={`usa-fieldset margin-left-4 ${incumbentDisabled && "text-disabled"}`}
                    disabled={incumbentDisabled}
                >
                    <label className="usa-label margin-top-0" htmlFor="agreement-incumbent">
                        Incumbent
                    </label>
                    <input
                        className="usa-input width-card-lg"
                        id="agreement-incumbent"
                        name="agreement-incumbent"
                        type="text"
                        value={agreementIncumbent || ""}
                        onChange={(e) => dispatch(setAgreementIncumbent(e.target.value))}
                        required
                    />
                </fieldset>
            </div>

            <h2 className="font-sans-lg margin-top-3">Points of Contact</h2>
            <div className="display-flex">
                <ProjectOfficerSelect />
                <TeamMemberSelect className="margin-left-4" />
            </div>

            <h3 className="font-sans-sm text-semibold">Team Members Added</h3>
            <TeamMemberList />
            <div className="usa-character-count margin-top-3">
                <div className="usa-form-group">
                    <label className="usa-label font-sans-lg text-bold" htmlFor="with-hint-textarea">
                        Notes (optional)
                    </label>
                    <span id="with-hint-textarea-hint" className="usa-hint">
                        Maximum 150 characters
                    </span>
                    <textarea
                        className="usa-textarea usa-character-count__field"
                        id="with-hint-textarea"
                        maxLength="150"
                        name="with-hint-textarea"
                        rows="5"
                        aria-describedby="with-hint-textarea-info with-hint-textarea-hint"
                        style={{ height: "7rem" }}
                        value={agreementNotes || ""}
                        onChange={(e) => dispatch(setAgreementNotes(e.target.value))}
                    ></textarea>
                </div>
                <span id="with-hint-textarea-info" className="usa-character-count__message sr-only">
                    You can enter up to 150 characters
                </span>
            </div>
            <div className="grid-row flex-justify margin-top-8">
                <button className="usa-button usa-button--unstyled margin-right-2" onClick={() => goBack()}>
                    Go Back
                </button>
                <div>
                    <button className="usa-button usa-button--unstyled margin-right-2" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button className="usa-button usa-button--outline" onClick={handleDraft}>
                        Save Draft
                    </button>
                    <button id="continue" className="usa-button" onClick={handleContinue}>
                        Continue
                    </button>
                </div>
            </div>
        </>
    );
};
