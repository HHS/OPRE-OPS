import PropTypes from "prop-types";
import React from "react";
import { useNavigate } from "react-router-dom";
import classnames from "vest/classnames";

import {
    useAddAgreementMutation,
    useDeleteAgreementMutation,
    useGetProductServiceCodesQuery,
    useUpdateAgreementMutation
} from "../../../api/opsAPI";
import { formatTeamMember } from "../../../api/postAgreements";
import useAlert from "../../../hooks/use-alert.hooks";
import useHasStateChanged from "../../../hooks/useHasStateChanged.hooks";
import ContractTypeSelect from "../../ServicesComponents/ContractTypeSelect";
import ServiceReqTypeSelect from "../../ServicesComponents/ServiceReqTypeSelect";
import GoBackButton from "../../UI/Button/GoBackButton";
import Input from "../../UI/Form/Input";
import TextArea from "../../UI/Form/TextArea/TextArea";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import AgreementReasonSelect from "../AgreementReasonSelect";
import AgreementTypeSelect from "../AgreementTypeSelect";
import ProcurementShopSelectWithFee from "../ProcurementShopSelectWithFee";
import ProductServiceCodeSelect from "../ProductServiceCodeSelect";
import ProductServiceCodeSummaryBox from "../ProductServiceCodeSummaryBox";
import ProjectOfficerComboBox from "../ProjectOfficerComboBox";
import TeamMemberComboBox from "../TeamMemberComboBox";
import TeamMemberList from "../TeamMemberList";
import suite from "./AgreementEditFormSuite";
import {
    useEditAgreement,
    useEditAgreementDispatch,
    useSetState,
    useUpdateAgreement
} from "./AgreementEditorContext.hooks";
import { convertCodeForDisplay } from "../../../helpers/utils";

/**
 * Renders the "Create Agreement" step of the Create Agreement flow.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Function} [props.setHasAgreementChanged] - A function to set the agreement changed state. - optional
 * @param {Function} [props.goBack] - A function to go back to the previous step. - optional
 * @param {Function} [props.goToNext] - A function to go to the next step. - optional
 * @param {boolean} [props.isReviewMode] - Whether the form is in review mode. - optional
 * @param {boolean} props.isEditMode - Whether the edit mode is on (in the Agreement details page) - optional.
 * @param {function} props.setIsEditMode - The function to set the edit mode (in the Agreement details page) - optional.
 * @param {number} [props.selectedAgreementId] - The ID of the selected agreement. - optional
 * @param {string} [props.cancelHeading] - The heading for the cancel modal. - optional
 * @returns {JSX.Element} - The rendered component.
 */
export const AgreementEditForm = ({
    setHasAgreementChanged = () => {},
    goBack,
    goToNext,
    isReviewMode,
    isEditMode,
    setIsEditMode,
    selectedAgreementId,
    cancelHeading
}) => {
    // TODO: Add custom hook for logic below (./AgreementEditForm.hooks.js)
    const isCreatingAgreement = location.pathname === "/agreements/create";
    const isEditingAgreement = location.pathname.startsWith("/agreements/edit");
    const isWizardMode = isCreatingAgreement || isEditingAgreement;

    // SETTERS
    const setSelectedProcurementShop = useSetState("selected_procurement_shop");
    const setSelectedProductServiceCode = useSetState("selected_product_service_code");
    const setSelectedProjectOfficer = useSetState("selected_project_officer");
    const setSelectedAlternateProjectOfficer = useSetState("selected_alternate_project_officer");

    // AGREEMENT SETTERS
    const setAgreementType = useUpdateAgreement("agreement_type");
    const setAgreementTitle = useUpdateAgreement("name");
    const setAgreementDescription = useUpdateAgreement("description");
    const setAgreementProcurementShopId = useUpdateAgreement("awarding_entity_id");
    const setAgreementId = useUpdateAgreement("id");
    const setProductServiceCodeId = useUpdateAgreement("product_service_code_id");
    const setAgreementReason = useUpdateAgreement("agreement_reason");
    const setProjectOfficerId = useUpdateAgreement("project_officer_id");
    const setAlternateProjectOfficerId = useUpdateAgreement("alternate_project_officer_id");
    const setAgreementVendor = useUpdateAgreement("vendor");
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
    const [deleteAgreement] = useDeleteAgreementMutation();

    const {
        agreement,
        selected_procurement_shop: selectedProcurementShop,
        selected_product_service_code: selectedProductServiceCode,
        selected_project_officer: selectedProjectOfficer,
        selected_alternate_project_officer: selectedAlternateProjectOfficer
    } = useEditAgreement();
    const {
        notes: agreementNotes,
        vendor: agreementVendor,
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
    const hasAgreementChanged = useHasStateChanged(agreement);
    setHasAgreementChanged(hasAgreementChanged);

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

    const vendorDisabled = agreementReason === "NEW_REQ" || agreementReason === null || agreementReason === "0";
    const shouldDisableBtn =
        !agreementTitle ||
        !agreementType ||
        res.hasErrors() ||
        (isCreatingAgreement && selectedProcurementShop.id !== 2);

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

    const changeSelectedAlternateProjectOfficer = (selectedProjectOfficer) => {
        setSelectedAlternateProjectOfficer(selectedProjectOfficer);
        const alternateProjectOfficerId = selectedProjectOfficer ? selectedProjectOfficer.id : null;
        setAlternateProjectOfficerId(alternateProjectOfficerId);
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

        if (!hasAgreementChanged) {
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
                    if (!isWizardMode) {
                        setAlert({
                            type: "success",
                            heading: "Agreement Draft Saved",
                            message: `The agreement ${agreement.name} has been successfully created.`
                        });
                    }
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
        setHasAgreementChanged(false);
        if (isEditMode && setIsEditMode) setIsEditMode(false);
        await goToNext({ agreement });
    };

    const handleDraft = async () => {
        await saveAgreement();
        setHasAgreementChanged(false);
        await navigate("/agreements");
    };

    const handleCancel = () => {
        const actionButtonText = `${isWizardMode ? "Cancel Agreement" : "Cancel Edits"}`;
        setShowModal(true);
        setModalProps({
            heading: cancelHeading ?? "Are you sure you want to cancel editing? Your changes will not be saved.",
            actionButtonText,
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                if (selectedAgreementId && !isEditMode && !isReviewMode) {
                    deleteAgreement(selectedAgreementId)
                        .unwrap()
                        .then((fulfilled) => {
                            console.log(`DELETE agreement success: ${JSON.stringify(fulfilled, null, 2)}`);
                            setAlert({
                                type: "success",
                                heading: "Agreement Edits Cancelled",
                                message: "Your agreement edits have been cancelled.",
                                redirectUrl: "/agreements"
                            });
                        })
                        .catch((rejected) => {
                            console.error(`DELETE agreement rejected: ${JSON.stringify(rejected, null, 2)}`);
                            setAlert({
                                type: "error",
                                heading: "Error",
                                message: "An error occurred while deleting the agreement.",
                                redirectUrl: "/error"
                            });
                        });
                } else if (isWizardMode) {
                    setAlert({
                        type: "success",
                        heading: "Create New Agreement Cancelled",
                        message: "Your agreement has been cancelled.",
                        redirectUrl: "/agreements"
                    });
                } else if (isEditMode) {
                    setIsEditMode(false);
                    navigate(`/agreements/${agreement.id}`);
                }
                setHasAgreementChanged(false);
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
            <AgreementTypeSelect
                messages={res.getErrors("agreement_type")}
                className={cn("agreement_type")}
                selectedAgreementType={agreementType || ""}
                isRequired={true}
                onChange={(name, value) => {
                    setAgreementType(value);
                    runValidate(name, value);
                }}
            />
            <h2 className="font-sans-lg margin-top-3">Agreement Details</h2>
            <p className="margin-top-1">
                Tell us a little more about this agreement. Make sure you complete the required information in order to
                proceed. For everything else you can skip the parts you do not know or come back to edit the information
                later.
            </p>
            <Input
                name="name"
                label="Agreement Title"
                messages={res.getErrors("name")}
                maxLength={200}
                className={cn("name")}
                isRequired={true}
                value={agreementTitle}
                onChange={(name, value) => {
                    setAgreementTitle(value);
                    runValidate(name, value);
                }}
            />
            {/* TODO: Add Agreement Nickname/Acronym */}
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
            <ContractTypeSelect
                messages={res.getErrors("contract-type")}
                className={`margin-top-3 ${cn("contract-type")}`}
                value={contractType}
                onChange={(name, value) => {
                    setContractType(value);
                }}
            />
            <ServiceReqTypeSelect
                messages={res.getErrors("service_requirement_type")}
                className={`margin-top-3 ${cn("service_requirement_type")}`}
                isRequired={true}
                value={serviceReqType}
                onChange={(name, value) => {
                    setServiceReqType(value);
                    runValidate(name, value);
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
                        setAgreementVendor(null);
                        setAgreementReason(value);
                        if (isReviewMode) {
                            runValidate(name, value);
                        }
                    }}
                />
                <fieldset
                    className={`usa-fieldset margin-left-4 ${vendorDisabled && "text-disabled"}`}
                    disabled={vendorDisabled}
                >
                    <Input
                        name="vendor"
                        label="Vendor"
                        messages={res.getErrors("vendor")}
                        className={`margin-top-0 cn("vendor")`}
                        value={agreementVendor || ""}
                        onChange={(name, value) => {
                            setAgreementVendor(value);
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
                    label={convertCodeForDisplay("projectOfficer", agreementType)}
                />
                {/* TODO: add alternate project officer */}
                <ProjectOfficerComboBox
                    selectedProjectOfficer={selectedAlternateProjectOfficer}
                    setSelectedProjectOfficer={changeSelectedAlternateProjectOfficer}
                    className="margin-left-4"
                    legendClassname="usa-label margin-top-0 margin-bottom-1"
                    messages={res.getErrors("project_officer")}
                    onChange={(name, value) => {
                        if (isReviewMode) {
                            runValidate(name, value);
                        }
                    }}
                    overrideStyles={{ width: "15em" }}
                    label={`Alternate ${convertCodeForDisplay("projectOfficer", agreementType)}`}
                />
            </div>

            <div className="margin-top-3">
                <TeamMemberComboBox
                    messages={res.getErrors("team-members")}
                    legendClassname="usa-label margin-top-0 margin-bottom-1"
                    selectedTeamMembers={selectedTeamMembers}
                    selectedProjectOfficer={selectedProjectOfficer}
                    setSelectedTeamMembers={setSelectedTeamMembers}
                    overrideStyles={{ width: "14.375rem" }}
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
                maxLength={500}
                messages={res.getErrors("agreementNotes")}
                className={cn("agreementNotes")}
                value={agreementNotes || ""}
                onChange={(name, value) => setAgreementNotes(value)}
            />
            <div className="grid-row flex-justify margin-top-8">
                {isWizardMode ? <GoBackButton handleGoBack={goBack} /> : <div />}
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
    setHasAgreementChanged: PropTypes.func,
    goBack: PropTypes.func,
    goToNext: PropTypes.func,
    isReviewMode: PropTypes.bool,
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func,
    selectedAgreementId: PropTypes.number,
    cancelHeading: PropTypes.string
};

export default AgreementEditForm;
