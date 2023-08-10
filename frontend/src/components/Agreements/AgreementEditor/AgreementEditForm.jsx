import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import classnames from "vest/classnames";
import ProcurementShopSelectWithFee from "../../UI/Form/ProcurementShopSelectWithFee";
import AgreementReasonSelect from "../../UI/Form/AgreementReasonSelect";
import AgreementTypeSelect from "../../UI/Form/AgreementTypeSelect";
import ProductServiceCodeSelect from "../../UI/Form/ProductServiceCodeSelect";
import TeamMemberSelect from "../../UI/Form/TeamMemberSelect";
import TeamMemberList from "../../UI/Form/TeamMemberList";
import Modal from "../../UI/Modal";
import { formatTeamMember } from "../../../api/postAgreements";
import ProductServiceCodeSummaryBox from "../../UI/Form/ProductServiceCodeSummaryBox";
import { useEditAgreement, useEditAgreementDispatch, useSetState, useUpdateAgreement } from "./AgreementEditorContext";
import { setAlert } from "../../UI/Alert/alertSlice";
import suite from "./AgreementEditFormSuite";
import Input from "../../UI/Form/Input";
import TextArea from "../../UI/Form/TextArea/TextArea";
import {
    useAddAgreementMutation,
    useGetProductServiceCodesQuery,
    useUpdateAgreementMutation,
} from "../../../api/opsAPI";
import ProjectOfficerComboBox from "../../UI/Form/ProjectOfficerComboBox";
import { getUser } from "../../../api/getUser";
import _ from "lodash";

/**
 * Renders the "Create Agreement" step of the Create Agreement flow.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.goBack] - A function to go back to the previous step. - optional
 * @param {Function} [props.goToNext] - A function to go to the next step. - optional
 * @param {boolean} [props.isReviewMode] - Whether the form is in review mode. - optional
 * @param {boolean} props.isEditMode - Whether the edit mode is on (in the Agreement details page) - optional.
 * @param {function} props.setIsEditMode - The function to set the edit mode (in the Agreement details page) - optional.
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
    const setProjectOfficerId = useUpdateAgreement("project_officer");
    const setAgreementIncumbent = useUpdateAgreement("incumbent");
    const setAgreementNotes = useUpdateAgreement("notes");

    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});

    const navigate = useNavigate();
    const dispatch = useEditAgreementDispatch();
    const globalDispatch = useDispatch();

    const [updateAgreement] = useUpdateAgreementMutation();
    const [addAgreement] = useAddAgreementMutation();

    const {
        agreement,
        selected_procurement_shop: selectedProcurementShop,
        selected_product_service_code: selectedProductServiceCode,
        selected_project_officer: selectedProjectOfficer,
    } = useEditAgreement();
    const {
        notes: agreementNotes,
        incumbent: agreementIncumbent,
        agreement_type: agreementType,
        name: agreementTitle,
        description: agreementDescription,
        agreement_reason: agreementReason,
        team_members: selectedTeamMembers,
    } = agreement;

    // This is needed due to a caching issue with the React Context - for some reason selected_project_officer
    // is not updated in the parent context/props.
    useEffect(() => {
        const getProjectOfficerSetState = async (id) => {
            const results = await getUser(id);
            setSelectedProjectOfficer(results);
        };

        if (_.isEmpty(selectedProjectOfficer) && agreement?.project_officer) {
            getProjectOfficerSetState(agreement?.project_officer).catch(console.error);
        }

        return () => {
            setSelectedProjectOfficer({});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const {
        data: productServiceCodes,
        error: errorProductServiceCodes,
        isLoading: isLoadingProductServiceCodes,
    } = useGetProductServiceCodesQuery();

    if (isReviewMode) {
        suite({
            ...agreement,
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
    const shouldDisableBtn = !agreementTitle || res.hasErrors();

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

    const cleanAgreementForApi = (data) => {
        // eslint-disable-next-line no-unused-vars
        const { id, budget_line_items, created_by, created_on, updated_on, ...cleanData } = data;
        if (!("number" in cleanData)) {
            cleanData["number"] = "";
        }
        return { id: id, cleanData: cleanData };
    };

    const saveAgreement = async () => {
        const data = {
            ...agreement,
            team_members: selectedTeamMembers.map((team_member) => {
                return formatTeamMember(team_member);
            }),
        };
        const { id, cleanData } = cleanAgreementForApi(data);
        if (id) {
            // TODO: handle failures
            updateAgreement({ id: id, data: cleanData })
                .unwrap()
                .then((payload) => {
                    console.log("Agreement Updated", payload);
                })
                .catch((error) => console.error("Agreement Updated Failed", error));
        } else {
            // TODO: handle failures
            addAgreement(cleanData)
                .unwrap()
                .then((payload) => {
                    console.log("Agreement Created", payload);
                    const newAgreementId = payload.id;
                    setAgreementId(newAgreementId);
                })
                .catch((error) => console.error("Agreement Failed", error));
        }
    };

    const handleContinue = async () => {
        saveAgreement();
        if (isEditMode && setIsEditMode) setIsEditMode(false);
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
                if (isWizardMode) {
                    navigate("/agreements");
                } else {
                    if (isEditMode && setIsEditMode) setIsEditMode(false);
                    navigate(`/agreements/${agreement.id}`);
                }
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
                    overrideStyles={{ width: "240px" }}
                />
                <TeamMemberSelect
                    className="margin-left-4"
                    legendClassname="usa-label margin-top-0 margin-bottom-1"
                    selectedTeamMembers={selectedTeamMembers}
                    selectedProjectOfficer={selectedProjectOfficer}
                    setSelectedTeamMembers={setSelectedTeamMembers}
                />
            </div>

            <h3 className="font-sans-sm text-semibold">Team Members Added</h3>
            <TeamMemberList selectedTeamMembers={selectedTeamMembers} removeTeamMember={removeTeamMember} />
            <TextArea
                name="agreementNotes"
                label="Notes (optional)"
                hintMsg="Maximum 150 characters"
                messages={res.getErrors("agreementNotes")}
                className={cn("agreementNotes")}
                value={agreementNotes}
                onChange={(name, value) => setAgreementNotes(value)}
            />
            <div className="grid-row flex-justify margin-top-8">
                {isWizardMode ? (
                    <button className="usa-button usa-button--unstyled margin-right-2" onClick={() => goBack()}>
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
    setIsEditMode: PropTypes.func,
};

export default AgreementEditForm;
