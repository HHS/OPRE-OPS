import React from "react";
import { useLocation, useNavigate, useBlocker } from "react-router-dom";
import classnames from "vest/classnames";
import {
    useDeleteAgreementMutation,
    useGetProductServiceCodesQuery,
    useUpdateAgreementMutation
} from "../../../api/opsAPI";
import { calculateAgreementTotal, cleanAgreementForApi, formatTeamMember } from "../../../helpers/agreement.helpers.js";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useAlert from "../../../hooks/use-alert.hooks";
import useHasStateChanged from "../../../hooks/useHasStateChanged.hooks";
import { AGREEMENT_TYPES } from "../../ServicesComponents/ServicesComponents.constants";
import suite from "./AgreementEditFormSuite";
import {
    useEditAgreement,
    useEditAgreementDispatch,
    useSetState,
    useUpdateAgreement
} from "./AgreementEditorContext.hooks";
import { useSelector } from "react-redux";

const FUNDING_METHOD = [
    {
        term: "Funding Method",
        definition: "Advanced Funding"
    }
];

const AGREEMENT_FILTER_OPTIONS = [
    { label: "Contract", value: AGREEMENT_TYPES.CONTRACT },
    { label: "Partner (IAA, AA, IDDA, IPA)", value: AGREEMENT_TYPES.PARTNER },
    { label: "Grant", value: AGREEMENT_TYPES.GRANT },
    { label: "Direct Obligation", value: AGREEMENT_TYPES.DIRECT_OBLIGATION }
];

const useAgreementEditForm = (
    isAgreementAwarded,
    areAnyBudgetLinesPlanned,
    setHasAgreementChanged,
    goBack,
    goToNext,
    isReviewMode,
    isEditMode,
    setIsEditMode,
    selectedAgreementId,
    cancelHeading
) => {
    const location = useLocation();
    const isCreatingAgreement = location.pathname === "/agreements/create";
    const isEditingAgreement = location.pathname.startsWith("/agreements/edit");
    const isWizardMode = isCreatingAgreement || isEditingAgreement;
    const isSuperUser = useSelector((state) => state.auth?.activeUser?.is_superuser) ?? false;

    // SETTERS
    const setSelectedProcurementShop = useSetState("selected_procurement_shop");
    const setSelectedProductServiceCode = useSetState("selected_product_service_code");
    const setSelectedProjectOfficer = useSetState("selected_project_officer");
    const setSelectedAlternateProjectOfficer = useSetState("selected_alternate_project_officer");

    // AGREEMENT SETTERS
    const setAgreementType = useUpdateAgreement("agreement_type");
    const setAgreementTitle = useUpdateAgreement("name");
    const setAgreementNickName = useUpdateAgreement("nick_name");
    const setAgreementDescription = useUpdateAgreement("description");
    const setAgreementProcurementShopId = useUpdateAgreement("awarding_entity_id");
    const setProductServiceCodeId = useUpdateAgreement("product_service_code_id");
    const setAgreementReason = useUpdateAgreement("agreement_reason");
    const setProjectOfficerId = useUpdateAgreement("project_officer_id");
    const setAlternateProjectOfficerId = useUpdateAgreement("alternate_project_officer_id");
    const setAgreementVendor = useUpdateAgreement("vendor");
    const setAgreementNotes = useUpdateAgreement("notes");
    const setContractType = useUpdateAgreement("contract_type");
    const setServiceReqType = useUpdateAgreement("service_requirement_type");
    const setRequestingAgency = useUpdateAgreement("requesting_agency");
    const setServicingAgency = useUpdateAgreement("servicing_agency");

    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const [showBlockerModal, setShowBlockerModal] = React.useState(false);
    const [blockerModalProps, setBlockerModalProps] = React.useState({});
    const [isCancelling, setIsCancelling] = React.useState(false);
    const [selectedAgreementFilter, setSelectedAgreementFilter] = React.useState("");

    const navigate = useNavigate();
    const dispatch = useEditAgreementDispatch();
    const { setAlert } = useAlert();

    const [updateAgreement] = useUpdateAgreementMutation();
    const [deleteAgreement] = useDeleteAgreementMutation();

    // Track transitions into edit mode so we can reset the cancelling flag
    const wasEditModeRef = React.useRef(isEditMode);

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
        nick_name: agreementNickName,
        description: agreementDescription,
        agreement_reason: agreementReason,
        team_members: selectedTeamMembers,
        contract_type: contractType,
        service_requirement_type: serviceReqType,
        procurement_shop: procurementShop,
        servicing_agency: servicingAgency,
        requesting_agency: requestingAgency,
        special_topics: specialTopics,
        research_methodologies: researchMethodologies,
        _meta: { immutable_awarded_fields: immutableFields = [] } = {}
    } = agreement;

    const {
        data: productServiceCodes = [],
        error: errorProductServiceCodes,
        isLoading: isLoadingProductServiceCodes
    } = useGetProductServiceCodesQuery({});

    // make a copy of the agreement object
    const hasAgreementChanged = useHasStateChanged(agreement);

    const isAgreementCreated = !!agreement?.id;
    // state update happens after the render cycle completes
    React.useEffect(() => {
        setHasAgreementChanged(hasAgreementChanged);
    }, [hasAgreementChanged, setHasAgreementChanged]);

    // Reset cancelling flag when entering edit mode
    React.useEffect(() => {
        // When we newly enter edit mode, clear any stale cancelling state
        if (!wasEditModeRef.current && isEditMode) {
            setIsCancelling(false);
        }
        wasEditModeRef.current = isEditMode;
    }, [isEditMode]);

    // set agreement filter state based on agreement type
    React.useEffect(() => {
        if (agreementType === AGREEMENT_TYPES.CONTRACT) {
            setSelectedAgreementFilter(AGREEMENT_TYPES.CONTRACT);
        } else if (agreementType === AGREEMENT_TYPES.GRANT) {
            setSelectedAgreementFilter(AGREEMENT_TYPES.GRANT);
        } else if (agreementType === AGREEMENT_TYPES.DIRECT_OBLIGATION) {
            setSelectedAgreementFilter(AGREEMENT_TYPES.DIRECT_OBLIGATION);
        } else {
            setSelectedAgreementFilter(AGREEMENT_TYPES.PARTNER);
        }
    }, [agreementType]);

    const hasProcurementShopChanged = useHasStateChanged(selectedProcurementShop);
    const shouldRequestChange = hasProcurementShopChanged && areAnyBudgetLinesPlanned && !isAgreementAwarded;

    React.useEffect(() => {
        if (isReviewMode) {
            suite({
                ...agreement,
                "procurement-shop-select": selectedProcurementShop
            });
        }
    }, [isReviewMode, agreement, selectedProcurementShop]);

    React.useEffect(() => {
        if (errorProductServiceCodes) {
            navigate("/error");
        }
    }, [errorProductServiceCodes, navigate]);

    let res = suite.get();

    // Navigation blocker to prevent unsaved changes from being lost
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isCancelling && hasAgreementChanged && currentLocation.pathname !== nextLocation.pathname
    );

    const vendorDisabled = agreementReason === "NEW_REQ" || agreementReason === null || agreementReason === "0";
    const isAgreementAA = agreementType === AGREEMENT_TYPES.AA;
    const shouldDisableBtn =
        !agreementTitle ||
        !agreementType ||
        res.hasErrors() ||
        (isAgreementAA && (!servicingAgency || !requestingAgency));

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

    const changeSelectedAlternateProjectOfficer = (selectedAlternateProjectOfficer) => {
        setSelectedAlternateProjectOfficer(selectedAlternateProjectOfficer);
        const alternateProjectOfficerId = selectedAlternateProjectOfficer ? selectedAlternateProjectOfficer.id : null;
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

    const setResearchMethodology = (researchMethodologies) => {
        dispatch({
            type: "SET_RESEARCH_METHODOLOGIES",
            payload: researchMethodologies ? researchMethodologies : []
        });
    };

    const setSpecialTopics = (specialTopics) => {
        dispatch({
            type: "SET_SPECIAL_TOPICS",
            payload: specialTopics ? specialTopics : []
        });
    };

    const saveAgreement = React.useCallback(
        async (redirectUrl = null, skipChangeCheck = false) => {
            const data = {
                ...agreement,
                team_members: selectedTeamMembers.map((team_member) => {
                    return formatTeamMember(team_member);
                }),
                requesting_agency_id: requestingAgency ? requestingAgency.id : null,
                servicing_agency_id: servicingAgency ? servicingAgency.id : null
            };
            const { id, cleanData } = cleanAgreementForApi(data);

            if (!skipChangeCheck && !hasAgreementChanged) {
                return false;
            }

            if (id) {
                try {
                    const fulfilled = await updateAgreement({ id: id, data: cleanData }).unwrap();
                    console.log(`UPDATE: agreement updated: ${JSON.stringify(fulfilled, null, 2)}`);
                    if (shouldRequestChange) {
                        const oldTotal = calculateAgreementTotal(
                            agreement?.budget_line_items ?? [],
                            procurementShop?.fee_percentage ?? 0
                        );
                        const newTotal = calculateAgreementTotal(
                            agreement?.budget_line_items ?? [],
                            selectedProcurementShop?.fee_percentage ?? 0
                        );
                        const procurementShopChanges = `Procurement Shop: ${procurementShop?.name} (${procurementShop?.abbr}) to ${selectedProcurementShop.name} (${selectedProcurementShop.abbr})`;
                        const feeRateChanges = `Fee Rate: ${procurementShop?.fee_percentage}% to ${selectedProcurementShop.fee_percentage}%`;
                        const feeTotalChanges = `Fee Total: $${oldTotal} to $${newTotal}`;

                        setAlert({
                            type: "success",
                            heading: "Changes Sent to Approval",
                            message:
                                `Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.\n\n` +
                                `<strong>Pending Changes:</strong>\n` +
                                `<ul><li>${procurementShopChanges}</li>` +
                                `<li>${feeRateChanges}</li>` +
                                `<li>${feeTotalChanges}</li></ul>`,
                            redirectUrl: redirectUrl
                        });
                    } else {
                        setAlert({
                            type: "success",
                            heading: "Agreement Updated",
                            message: `The agreement ${agreement.name} has been successfully updated.`,
                            redirectUrl: redirectUrl
                        });
                    }
                    scrollToTop();
                    return true;
                } catch (rejected) {
                    console.error(`UPDATE: agreement updated failed: ${JSON.stringify(rejected, null, 2)}`);
                    setAlert({
                        type: "error",
                        heading: "Error",
                        message: "An error occurred while saving the agreement.",
                        redirectUrl: "/error"
                    });
                    // Don't call scrollToTop on error - let the redirect happen
                    throw rejected; // Re-throw to prevent further execution
                }
            }
            return false;
        },
        [
            agreement,
            selectedTeamMembers,
            requestingAgency,
            servicingAgency,
            hasAgreementChanged,
            updateAgreement,
            shouldRequestChange,
            procurementShop,
            selectedProcurementShop,
            setAlert
        ]
    );

    // Ref to capture saveAgreement for use in blocker modal
    const saveAgreementRef = React.useRef(saveAgreement);

    React.useEffect(() => {
        saveAgreementRef.current = saveAgreement;
    }, [saveAgreement]);

    // Setup blocker modal when navigation is blocked
    React.useEffect(() => {
        if (blocker.state === "blocked") {
            setShowBlockerModal(true);
            setBlockerModalProps({
                heading: "You have unsaved changes",
                description: "Do you want to save your changes before leaving this page?",
                actionButtonText: "Save Changes",
                secondaryButtonText: "Leave without saving",
                handleConfirm: async () => {
                    try {
                        await saveAgreementRef.current(null); // No redirectUrl - let blocker handle navigation
                        setHasAgreementChanged(false);
                        if (isEditMode && setIsEditMode) setIsEditMode(false);
                        setShowBlockerModal(false);
                        blocker.proceed();
                    } catch (error) {
                        // Error already handled in saveAgreement
                        console.error(error);
                        blocker.reset();
                    }
                },
                handleSecondary: () => {
                    setHasAgreementChanged(false);
                    setShowBlockerModal(false);
                    if (isEditMode && setIsEditMode) setIsEditMode(false);
                    blocker.proceed();
                },
                closeModal: () => {
                    setShowBlockerModal(false);
                    blocker.reset();
                }
            });
        }
    }, [blocker, setHasAgreementChanged, isEditMode, setIsEditMode]);

    const handleContinue = async () => {
        if (shouldRequestChange) {
            setShowModal(true);
            setModalProps({
                heading:
                    "Changing the Procurement Shop will impact the fee rate on each budget line. Budget changes require approval from your Division Director. Do you want to send it to approval?",
                actionButtonText: "Send to Approval",
                secondaryButtonText: "Continue Editing",
                handleConfirm: async () => {
                    try {
                        await saveAgreement();
                        setHasAgreementChanged(false);
                        if (isEditMode && setIsEditMode) setIsEditMode(false);
                        await goToNext({ agreement });
                        // eslint-disable-next-line no-unused-vars
                    } catch (error) {
                        // Error already handled in saveAgreement with alert and redirect
                        return;
                    }
                }
            });
        } else {
            try {
                await saveAgreement();
                setHasAgreementChanged(false);
                if (isEditMode && setIsEditMode) setIsEditMode(false);
                await goToNext({ agreement });
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                // Error already handled in saveAgreement with alert and redirect
                return;
            }
        }
    };

    const handleDraft = async () => {
        try {
            await saveAgreement();
            setHasAgreementChanged(false);
            navigate("/agreements");
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            // Error already handled in saveAgreement with alert and redirect
            return;
        }
    };

    const handleCancel = () => {
        const actionButtonText = `${isWizardMode ? "Cancel Agreement" : "Cancel Edits"}`;
        setShowModal(true);
        setModalProps({
            heading: cancelHeading ?? "Are you sure you want to cancel editing? Your changes will not be saved.",
            actionButtonText,
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                // Set cancelling flag to bypass blocker
                setIsCancelling(true);

                // Also update parent state for consistency
                setHasAgreementChanged(false);

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
                    return;
                }
                scrollToTop();
            }
        });
    };

    const handleOnChangeSelectedProcurementShop = (procurementShop) => {
        setSelectedProcurementShop(procurementShop);
        setAgreementProcurementShopId(procurementShop?.id);
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

    const hasProcurementShopChangeRequest = agreement?.change_requests_in_review?.some(
        (changeRequest) => changeRequest.has_proc_shop_change
    );

    const isProcurementShopDisabled = !isSuperUser && (hasProcurementShopChangeRequest || isAgreementAwarded);
    const disabledMessage = () => {
        if (agreement.in_review) {
            return "There are pending edits In Review for the Procurement Shop.\n It cannot be edited until pending edits have been approved or declined.";
        } else if (isAgreementAwarded) {
            return "The Procurement Shop cannot be edited on an awarded agreement.";
        }
        return "Disabled";
    };

    const handleAgreementFilterChange = (value) => {
        setSelectedAgreementFilter(value);
        if (value === AGREEMENT_TYPES.CONTRACT) {
            setAgreementType(AGREEMENT_TYPES.CONTRACT);
        } else if (value === AGREEMENT_TYPES.GRANT) {
            setAgreementType(AGREEMENT_TYPES.GRANT);
        } else if (value === AGREEMENT_TYPES.DIRECT_OBLIGATION) {
            setAgreementType(AGREEMENT_TYPES.DIRECT_OBLIGATION);
        } else {
            // PARTNER
            setAgreementType(null);
        }
    };

    return {
        cn,
        isWizardMode,
        isAgreementCreated,
        agreement,
        agreementNotes,
        agreementVendor,
        agreementType,
        agreementTitle,
        agreementNickName,
        agreementDescription,
        agreementReason,
        selectedTeamMembers,
        contractType,
        serviceReqType,
        servicingAgency,
        requestingAgency,
        specialTopics,
        researchMethodologies,
        productServiceCodes,
        selectedProductServiceCode,
        selectedProcurementShop,
        selectedProjectOfficer,
        selectedAlternateProjectOfficer,
        showModal,
        setShowModal,
        modalProps,
        selectedAgreementFilter,
        vendorDisabled,
        immutableFields,
        isAgreementAA,
        isSuperUser,
        shouldDisableBtn,
        changeSelectedProductServiceCode,
        changeSelectedProjectOfficer,
        changeSelectedAlternateProjectOfficer,
        setSelectedTeamMembers,
        removeTeamMember,
        setResearchMethodology,
        setSpecialTopics,
        handleContinue,
        handleDraft,
        handleCancel,
        handleOnChangeSelectedProcurementShop,
        runValidate,
        isProcurementShopDisabled,
        disabledMessage,
        fundingMethod: FUNDING_METHOD,
        agreementFilterOptions: AGREEMENT_FILTER_OPTIONS,
        handleAgreementFilterChange,
        setAgreementDescription,
        setAgreementNickName,
        setAgreementReason,
        setAgreementTitle,
        setContractType,
        setServiceReqType,
        setRequestingAgency,
        setServicingAgency,
        setAgreementVendor,
        setAgreementNotes,
        setAgreementType,
        res,
        blocker,
        showBlockerModal,
        setShowBlockerModal,
        blockerModalProps,
        saveAgreement,
        isLoadingProductServiceCodes
    };
};

export default useAgreementEditForm;
