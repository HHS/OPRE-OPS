import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import classnames from "vest/classnames";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import ProcurementShopSelect from "../../components/UI/Form/ProcurementShopSelect";
import AgreementReasonSelect from "../../components/UI/Form/AgreementReasonSelect";
import AgreementTypeSelect from "../../components/UI/Form/AgreementTypeSelect";
import ProductServiceCodeSelect from "../../components/UI/Form/ProductServiceCodeSelect";
import ProjectOfficerSelect from "../../components/UI/Form/ProjectOfficerSelect";
import TeamMemberSelect from "../../components/UI/Form/TeamMemberSelect";
import TeamMemberList from "../../components/UI/Form/TeamMemberList";
import Modal from "../../components/UI/Modal";
import { formatTeamMember, postAgreement } from "../../api/postAgreements";
import ProjectSummaryCard from "../../components/ResearchProjects/ProjectSummaryCard/ProjectSummaryCard";
import ProductServiceCodeSummaryBox from "../../components/UI/Form/ProductServiceCodeSummaryBox";
import {
    useCreateAgreement,
    useSetState,
    useUpdateAgreement,
    useCreateAgreementDispatch,
} from "./CreateAgreementContext";
import { setAlert } from "../../components/UI/Alert/alertSlice";
import { patchAgreement } from "../../api/patchAgreements";
import suite from "./stepCreateAgreementSuite";
import Input from "../../components/UI/Form/Input";
import EditModeTitle from "./EditModeTitle";
import TextArea from "../../components/UI/Form/TextArea/TextArea";
import { useGetProductServiceCodesQuery } from "../../api/opsAPI";
/**
 * Renders the "Create Agreement" step of the Create Agreement flow.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.goBack] - A function to go back to the previous step. - optional
 * @param {Function} [props.goToNext] - A function to go to the next step. - optional
 * @param {string} [props.formMode] - The mode of the form (e.g. "create", "edit", "review"). - optional
 */
export const StepCreateAgreement = ({ goBack, goToNext, formMode }) => {
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
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isReviewMode, setIsReviewMode] = React.useState(false);

    const navigate = useNavigate();
    const dispatch = useCreateAgreementDispatch();
    const globalDispatch = useDispatch();

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

    const {
        data: productServiceCodes,
        error: errorProductServiceCodes,
        isLoading: isLoadingProductServiceCodes,
    } = useGetProductServiceCodesQuery();

    React.useEffect(() => {
        switch (formMode) {
            case "edit":
                setIsEditMode(true);
                break;
            case "review":
                setIsReviewMode(true);
                suite({
                    ...agreement,
                });
                break;
            default:
                return;
        }
        return () => {
            setIsReviewMode(false);
            setIsEditMode(false);
            suite.reset();
        };
    }, [formMode, agreement]);

    if (isLoadingProductServiceCodes) {
        return <div>Loading...</div>;
    }
    if (errorProductServiceCodes) {
        return <div>Oops, an error occurred</div>;
    }

    let res = suite.get();
    console.log(`res: ${JSON.stringify(res, null, 2)}`);
    const incumbentDisabled = agreementReason === "NEW_REQ" || agreementReason === null || agreementReason === "0";
    const shouldDisableBtn = !agreementTitle && !res.isValid();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning",
    });

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
        await globalDispatch(
            setAlert({
                type: "success",
                heading: "Agreement Draft Saved",
                message: "The agreement has been successfully saved.",
                redirectUrl: "/agreements",
            })
        );
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your agreement will not be saved.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                navigate("/agreements");
            },
        });
    };

    const handleOnChangeSelectedProcurementShop = (procurementShop) => {
        setSelectedProcurementShop(procurementShop);
        setAgreementProcurementShopId(procurementShop.id);
    };

    const runValidate = (name, value) => {
        suite(
            {
                ...agreement,
                ...{ [name]: value },
            },
            name
        );
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

            <EditModeTitle isEditMode={isEditMode || isReviewMode} />
            <StepIndicator steps={wizardSteps} currentStep={2} />
            <ProjectSummaryCard selectedResearchProject={selectedResearchProject} />
            <h2 className="font-sans-lg">Select the Agreement Type</h2>
            <p>Select the type of agreement you&#39;d like to create.</p>
            <AgreementTypeSelect
                name="agreement_type"
                label="Agreement Type"
                messages={res.getErrors("agreement_type")}
                className={cn("agreement_type")}
                selectedAgreementType={agreementType || ""}
                onChange={(name, value) => {
                    setAgreementType(value);
                    runValidate(name, value);
                }}
            />
            <h2 className="font-sans-lg margin-top-3">Agreement Details</h2>

            <Input
                name="name"
                label="Agreement Title"
                messages={res.getErrors("name")}
                className={cn("name")}
                value={agreementTitle}
                onChange={(name, value) => {
                    setAgreementTitle(value);
                    runValidate(name, value);
                }}
            />

            <TextArea
                name="description"
                label="Description"
                messages={res.getErrors("description")}
                className={cn("description")}
                value={agreementDescription}
                onChange={(name, value) => {
                    setAgreementDescription(value);
                    if (isReviewMode) {
                        runValidate(name, value);
                    }
                }}
            />

            <ProductServiceCodeSelect
                name="product_service_code_id"
                label="Product Service Code"
                messages={res.getErrors("product_service_code_id")}
                className={cn("product_service_code_id")}
                selectedProductServiceCode={selectedProductServiceCode || ""}
                codes={productServiceCodes}
                onChange={(name, value) => {
                    changeSelectedProductServiceCode(productServiceCodes[value - 1]);
                    if (isReviewMode) {
                        runValidate(name, value);
                    }
                }}
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
                    name="agreement_reason"
                    label="Reason for Agreement"
                    messages={res.getErrors("agreement_reason")}
                    className={cn("agreement_reason")}
                    selectedAgreementReason={agreementReason}
                    onChange={(name, value) => {
                        setAgreementIncumbent(null);
                        setAgreementReason(value);
                        if (isReviewMode) {
                            runValidate(name, value);
                        }
                    }}
                />
                <fieldset
                    className={`usa-fieldset margin-left-4 ${incumbentDisabled && "text-disabled"}`}
                    disabled={incumbentDisabled}
                >
                    <Input
                        name="incumbent"
                        label="Incumbent"
                        messages={res.getErrors("incumbent")}
                        className={`margin-top-0 cn("incumbent")`}
                        value={agreementIncumbent || ""}
                        onChange={(name, value) => {
                            setAgreementIncumbent(value);
                            if (isReviewMode) {
                                runValidate(name, value);
                            }
                        }}
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
                    <button
                        className="usa-button usa-button--outline"
                        onClick={handleDraft}
                        disabled={shouldDisableBtn}
                        data-cy="save-draft-btn"
                    >
                        Save Draft
                    </button>
                    <button
                        id="continue"
                        className="usa-button"
                        onClick={handleContinue}
                        disabled={shouldDisableBtn}
                        data-cy="continue-btn"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </>
    );
};

export default StepCreateAgreement;
