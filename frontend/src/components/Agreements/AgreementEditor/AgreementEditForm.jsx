import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import classnames from "vest/classnames";

import ProcurementShopSelectWithFee from "../../UI/Form/ProcurementShopSelectWithFee";
import AgreementReasonSelect from "../../UI/Form/AgreementReasonSelect";
import AgreementTypeSelect from "../../UI/Form/AgreementTypeSelect";
import ProductServiceCodeSelect from "../../UI/Form/ProductServiceCodeSelect";
import TeamMemberComboBox from "../../UI/Form/TeamMemberComboBox";
import TeamMemberList from "../../UI/Form/TeamMemberList";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import { formatTeamMember } from "../../../api/postAgreements";
import ProductServiceCodeSummaryBox from "../../UI/Form/ProductServiceCodeSummaryBox";
import { useEditAgreement, useEditAgreementDispatch, useSetState, useUpdateAgreement } from "./AgreementEditorContext";
import suite from "./AgreementEditFormSuite";
import Input from "../../UI/Form/Input";
import TextArea from "../../UI/Form/TextArea/TextArea";
import ContractTypeSelect from "../../../pages/servicesComponents/ContractTypeSelect";
import {
    useAddAgreementMutation,
    useGetProductServiceCodesQuery,
    useUpdateAgreementMutation
} from "../../../api/opsAPI";
import ProjectOfficerComboBox from "../../UI/Form/ProjectOfficerComboBox";
import useAlert from "../../../hooks/use-alert.hooks";
import ServiceReqTypeSelect from "../../../pages/servicesComponents/ServiceReqTypeSelect";

/**
 * Renders the "Create Agreement" step of the Create Agreement flow.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.goBack] - A function to go back to the previous step. - optional
 * @param {Function} [props.goToNext] - A function to go to the next step. - optional
 * @param {boolean} [props.isReviewMode] - Whether the form is in review mode. - optional
 * @param {boolean} props.isEditMode - Whether the edit mode is on (in the Agreement details page) - optional.
 * @param {function} props.setIsEditMode - The function to set the edit mode (in the Agreement details page) - optional.
 * @returns {React.JSX.Element} - The component JSX.
 */
export const AgreementEditForm = ({ goBack, goToNext, isReviewMode, isEditMode, setIsEditMode }) => {
    const isWizardMode = location.pathname === "/agreements/create" || location.pathname.startsWith("/agreements/edit");
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
    const setProjectOfficerId = useUpdateAgreement("project_officer_id");
    const setAgreementIncumbent = useUpdateAgreement("incumbent");
    const setAgreementNotes = useUpdateAgreement("notes");
    const setContractType = useUpdateAgreement("contract_type");
    const setServiceReqType = useUpdateAgreement("service_requirement_type");

    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});

    const navigate = useNavigate();
    const dispatch = useEditAgreementDispatch();
    const { setAlert } = useAlert();

    const [updateAgreement] = useUpdateAgreementMutation();
    const [addAgreement] = useAddAgreementMutation();

    const {
        agreement,
        selected_procurement_shop: selectedProcurementShop,
        selected_product_service_code: selectedProductServiceCode,
        selected_project_officer: selectedProjectOfficer
    } = useEditAgreement();
    const {
        notes: agreementNotes,
        incumbent: agreementIncumbent,
        agreement_type: agreementType,
        name: agreementTitle,
        description: agreementDescription,
        agreement_reason: agreementReason,
        team_members: selectedTeamMembers,
        contract_type: contractType,
        service_requirement_type: serviceReqType
    } = agreement;

    const {
        data: productServiceCodes,
        error: errorProductServiceCodes,
        isLoading: isLoadingProductServiceCodes
    } = useGetProductServiceCodesQuery();

    // make a copy of the agreement object
    const agreementCopy = React.useMemo(() => {
        return { ...agreement };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isReviewMode) {
        suite({
            ...agreement
        });
    }

    if (isLoadingProductServiceCodes) {
        return <div>Loading...</div>;
    }
    if (errorProductServiceCodes) {
        return <div>Oops, an error occurred</div>;
    }

    let res = suite.get();

    const incumbentDisabled = agreementReason === "NEW_REQ" || agreementReason === null || agreementReason === "0";
    const shouldDisableBtn = !agreementTitle || !agreementType || res.hasErrors();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
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
            payload: teamMember
        });
    };

    const removeTeamMember = (teamMember) => {
        dispatch({
            type: "REMOVE_TEAM_MEMBER",
            payload: teamMember
        });
    };

    const cleanAgreementForApi = (data) => {
        // eslint-disable-next-line no-unused-vars
        const { id, budget_line_items, services_components, created_by, created_on, updated_on, ...cleanData } = data;
        return { id: id, cleanData: cleanData };
    };

    const saveAgreement = async () => {
        const data = {
            ...agreement,
            team_members: selectedTeamMembers.map((team_member) => {
                return formatTeamMember(team_member);
            })
        };
        const { id, cleanData } = cleanAgreementForApi(data);

        if (JSON.stringify(agreementCopy) === JSON.stringify(agreement)) {
            return;
        }

        if (id) {
            await updateAgreement({ id: id, data: cleanData })
                .unwrap()
                .then((fulfilled) => {
                    console.log(`UPDATE: agreement updated: ${JSON.stringify(fulfilled, null, 2)}`);
                    setAlert({
                        type: "success",
                        heading: "Agreement Edited",
                        message: `The agreement ${agreement.name} has been successfully updated.`
                    });
                })
                .catch((rejected) => {
                    console.error(`UPDATE: agreement updated failed: ${JSON.stringify(rejected, null, 2)}`);
                    setAlert({
                        type: "error",
                        heading: "Error",
                        message: "An error occurred while saving the agreement.",
                        redirectUrl: "/error"
                    });
                });
        } else {
            await addAgreement(cleanData)
                .unwrap()
                .then((payload) => {
                    const newAgreementId = payload.id;
                    setAgreementId(newAgreementId);
                })
                .then((fulfilled) => {
                    console.log(`CREATE: agreement success: ${JSON.stringify(fulfilled, null, 2)}`);
                    setAlert({
                        type: "success",
                        heading: "Agreement Draft Saved",
                        message: `The agreement ${agreement.name} has been successfully created.`
                    });
                })
                .catch((rejected) => {
                    console.error(`CREATE: agreement failed: ${JSON.stringify(rejected, null, 2)}`);
                    setAlert({
                        type: "error",
                        heading: "Error",
                        message: "An error occurred while creating the agreement.",
                        redirectUrl: "/error"
                    });
                });
        }
    };

    const handleContinue = async () => {
        await saveAgreement();
        if (isEditMode && setIsEditMode) setIsEditMode(false);
        await goToNext();
    };

    const handleDraft = async () => {
        await saveAgreement();
        await navigate("/agreements");
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your agreement will not be saved.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                if (isWizardMode) {
                    navigate("/agreements");
                } else {
                    if (isEditMode && setIsEditMode) setIsEditMode(false);
                    navigate(`/agreements/${agreement.id}`);
                }
            }
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
                ...{ [name]: value }
            },
            name
        );
    };

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <h2 className="font-sans-lg margin-top-3 margin-bottom-0">Select the Agreement Type</h2>
            <p className="margin-top-1">Select the type of agreement you&apos;d like to create.</p>
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
            <ContractTypeSelect
                value={contractType}
                onChange={(name, value) => {
                    setContractType(value);
                }}
            />
            <ServiceReqTypeSelect
                className="margin-top-3"
                value={serviceReqType}
                onChange={(name, value) => {
                    setServiceReqType(value);
                }}
            />
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
                maxLength={1000}
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
            <div className="margin-top-3">
                <ProcurementShopSelectWithFee
                    selectedProcurementShop={selectedProcurementShop}
                    onChangeSelectedProcurementShop={handleOnChangeSelectedProcurementShop}
                />
            </div>

            <div className="display-flex margin-top-3">
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

            <div className="display-flex margin-top-3">
                <ProjectOfficerComboBox
                    selectedProjectOfficer={selectedProjectOfficer}
                    setSelectedProjectOfficer={changeSelectedProjectOfficer}
                    legendClassname="usa-label margin-top-0 margin-bottom-1"
                    messages={res.getErrors("project_officer")}
                    onChange={(name, value) => {
                        if (isReviewMode) {
                            runValidate(name, value);
                        }
                    }}
                    overrideStyles={{ width: "15em" }}
                />
                <TeamMemberComboBox
                    className="margin-left-4"
                    legendClassname="usa-label margin-top-0 margin-bottom-1"
                    selectedTeamMembers={selectedTeamMembers}
                    selectedProjectOfficer={selectedProjectOfficer}
                    setSelectedTeamMembers={setSelectedTeamMembers}
                    overrideStyles={{ width: "12.8em" }}
                />
            </div>

            <h3 className="font-sans-sm text-semibold">Team Members Added</h3>
            <TeamMemberList
                selectedTeamMembers={selectedTeamMembers}
                removeTeamMember={removeTeamMember}
            />
            <TextArea
                name="agreementNotes"
                label="Notes (optional)"
                maxLength={1000}
                messages={res.getErrors("agreementNotes")}
                className={cn("agreementNotes")}
                value={agreementNotes || ""}
                onChange={(name, value) => setAgreementNotes(value)}
            />
            <div className="grid-row flex-justify margin-top-8">
                {isWizardMode ? (
                    <button
                        className="usa-button usa-button--unstyled margin-right-2"
                        onClick={() => goBack()}
                    >
                        Go Back
                    </button>
                ) : (
                    <div />
                )}
                <div>
                    <button
                        className="usa-button usa-button--unstyled margin-right-2"
                        data-cy="cancel-button"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    {isWizardMode && (
                        <button
                            className="usa-button usa-button--outline"
                            onClick={handleDraft}
                            disabled={!isReviewMode && shouldDisableBtn}
                            data-cy="save-draft-btn"
                        >
                            Save Draft
                        </button>
                    )}
                    <button
                        id="continue"
                        className="usa-button"
                        onClick={handleContinue}
                        disabled={shouldDisableBtn}
                        data-cy="continue-btn"
                    >
                        {isWizardMode ? "Continue" : "Save Changes"}
                    </button>
                </div>
            </div>
        </>
    );
};

AgreementEditForm.propTypes = {
    goBack: PropTypes.func,
    goToNext: PropTypes.func,
    isReviewMode: PropTypes.bool,
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func
};

export default AgreementEditForm;
