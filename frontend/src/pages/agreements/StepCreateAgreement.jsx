import React from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import ProcurementShopSelect from "../../components/UI/Form/ProcurementShopSelect";
import AgreementReasonSelect from "../../components/UI/Form/AgreementReasonSelect";
import AgreementTypeSelect from "../../components/UI/Form/AgreementTypeSelect";
import ProductServiceCodeSelect from "../../components/UI/Form/ProductServiceCodeSelect";
import Alert from "../../components/UI/Alert/Alert";
import ProjectOfficerSelect from "../../components/UI/Form/ProjectOfficerSelect";
import TeamMemberSelect from "../../components/UI/Form/TeamMemberSelect";
import TeamMemberList from "../../components/UI/Form/TeamMemberList";
import Modal from "../../components/UI/Modal/Modal";
import { formatTeamMember, postAgreement } from "../../api/postAgreements";
import ProjectSummaryCard from "../../components/ResearchProjects/ProjectSummaryCard/ProjectSummaryCard";
import ProductServiceCodeSummaryBox from "../../components/UI/Form/ProductServiceCodeSummaryBox";
import {
    useCreateAgreement,
    useSetState,
    useUpdateAgreement,
    useCreateAgreementDispatch,
} from "./CreateAgreementContext";
import { patchAgreement } from "../../api/patchAgreements";
import EditModeTitle from "./EditModeTitle";

/**
 * Renders the "Create Agreement" step of the Create Agreement flow.
 *
 * @param {Object} props - The component props.
 * @param {Function} props.goBack - A function to go back to the previous step.
 * @param {Function} props.goToNext - A function to go to the next step.
 * @param {boolean} props.isEditMode - A flag indicating whether the component is in edit mode.
 */
export const StepCreateAgreement = ({ goBack, goToNext, isEditMode = false }) => {
    const navigate = useNavigate();
    const dispatch = useCreateAgreementDispatch();
    const {
        wizardSteps,
        selected_project: selectedResearchProject,
        agreement,
        selected_procurement_shop: selectedProcurementShop,
        selected_product_service_code: selectedProductServiceCode,
        selected_project_officer: selectedProjectOfficer,
    } = useCreateAgreement();
    const {
        notes: agreementNotes,
        incumbent: agreementIncumbent,
        agreement_type: agreementType,
        name: agreementTitle,
        description: agreementDescription,
        agreement_reason: agreementReason,
        team_members: selectedTeamMembers,
    } = agreement;
    // SETTERS
    const setSelectedProcurementShop = useSetState("selected_procurement_shop");
    const setSelectedProductServiceCode = useSetState("selected_product_service_code");
    const setSelectedProjectOfficer = useSetState("selected_project_officer");

    // AGREEMENT SETTERS
    const setAgreementType = useUpdateAgreement("agreement_type");
    const setAgreementTitle = useUpdateAgreement("name");
    const setAgreementDescription = useUpdateAgreement("description");
    const setAgreementProcurementShopId = useUpdateAgreement("procurement_shop_id");
    const setAgreementId = useUpdateAgreement("id");
    const setProductServiceCodeId = useUpdateAgreement("product_service_code_id");
    const setAgreementReason = useUpdateAgreement("agreement_reason");
    const setProjectOfficerId = useUpdateAgreement("project_officer");
    const setAgreementIncumbent = useUpdateAgreement("incumbent");
    const setAgreementNotes = useUpdateAgreement("notes");

    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const [isAlertActive, setIsAlertActive] = React.useState(false);
    const [alertProps, setAlertProps] = React.useState({});

    const incumbentDisabled = agreementReason === "NEW_REQ" || agreementReason === null || agreementReason === "0";

    const changeSelectedProductServiceCode = (selectedProductServiceCode) => {
        setSelectedProductServiceCode(selectedProductServiceCode);
        const productServiceCodeId = selectedProductServiceCode ? selectedProductServiceCode.id : null;
        setProductServiceCodeId(productServiceCodeId);
    };

    const changeSelectedProjectOfficer = (selectedProjectOfficer) => {
        setSelectedProjectOfficer(selectedProjectOfficer);
        const projectOfficerId = selectedProjectOfficer ? selectedProjectOfficer.id : null;
        setProjectOfficerId(projectOfficerId);
    };

    const setSelectedTeamMembers = (teamMember) => {
        dispatch({
            type: "ADD_TEAM_MEMBER",
            payload: teamMember,
        });
    };

    const removeTeamMember = (teamMember) => {
        dispatch({
            type: "REMOVE_TEAM_MEMBER",
            payload: teamMember,
        });
    };

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
            team_members: selectedTeamMembers.map((team_member) => {
                return formatTeamMember(team_member);
            }),
        };
        if (agreement.id) {
            // TODO: handle failures
            // const response = await patchAgreement(agreement.id, data);
            patchAgreement(agreement.id, data);
        } else {
            // TODO: handle failures
            const response = await postAgreement(data);
            const newAgreementId = response.id;
            console.log(`New Agreement Created: ${newAgreementId}`);
            setAgreementId(newAgreementId);
        }
    };

    const handleContinue = async () => {
        saveAgreement();
        await goToNext();
    };
    const handleDraft = async () => {
        saveAgreement();
        await showAlertAndNavigate("success", "Agreement Draft Saved", "The agreement has been successfully saved.");
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your agreement will not be saved.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                navigate("/agreements/");
            },
        });
    };

    const handleOnChangeSelectedProcurementShop = (procurementShop) => {
        setSelectedProcurementShop(procurementShop);
        setAgreementProcurementShopId(procurementShop.id);
    };

    return (
        <>
            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            {isAlertActive ? (
                <Alert heading={alertProps.heading} type={alertProps.type} setIsAlertActive={setIsAlertActive}>
                    {alertProps.message}
                </Alert>
            ) : (
                <EditModeTitle isEditMode={isEditMode} />
            )}
            <StepIndicator steps={wizardSteps} currentStep={2} />
            <ProjectSummaryCard selectedResearchProject={selectedResearchProject} />
            <h2 className="font-sans-lg">Select the Agreement Type</h2>
            <p>Select the type of agreement you&#39;d like to create.</p>
            <AgreementTypeSelect selectedAgreementType={agreementType} setSelectedAgreementType={setAgreementType} />
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
                rows={5}
                style={{ height: "7rem" }}
                value={agreementDescription || ""}
                onChange={(e) => setAgreementDescription(e.target.value)}
            ></textarea>

            <ProductServiceCodeSelect
                selectedProductServiceCode={selectedProductServiceCode}
                setSelectedProductServiceCode={changeSelectedProductServiceCode}
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
                <AgreementReasonSelect
                    selectedAgreementReason={agreementReason}
                    setSelectedAgreementReason={setAgreementReason}
                    setAgreementIncumbent={setAgreementIncumbent}
                />
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
                        onChange={(e) => setAgreementIncumbent(e.target.value)}
                        required
                    />
                </fieldset>
            </div>

            <h2 className="font-sans-lg margin-top-3">Points of Contact</h2>
            <div className="display-flex">
                <ProjectOfficerSelect
                    selectedProjectOfficer={selectedProjectOfficer}
                    setSelectedProjectOfficer={changeSelectedProjectOfficer}
                />
                <TeamMemberSelect
                    className="margin-left-4"
                    selectedTeamMembers={selectedTeamMembers}
                    selectedProjectOfficer={selectedProjectOfficer}
                    setSelectedTeamMembers={setSelectedTeamMembers}
                />
            </div>

            <h3 className="font-sans-sm text-semibold">Team Members Added</h3>
            <TeamMemberList selectedTeamMembers={selectedTeamMembers} removeTeamMember={removeTeamMember} />
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
                        maxLength={150}
                        name="with-hint-textarea"
                        rows={5}
                        aria-describedby="with-hint-textarea-info with-hint-textarea-hint"
                        style={{ height: "7rem" }}
                        value={agreementNotes || ""}
                        onChange={(e) => setAgreementNotes(e.target.value)}
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
                    <button
                        className="usa-button usa-button--unstyled margin-right-2"
                        data-cy="cancel-button"
                        onClick={handleCancel}
                    >
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

export default StepCreateAgreement;
