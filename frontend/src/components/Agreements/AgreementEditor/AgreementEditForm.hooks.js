import debounce from "lodash/debounce";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import classnames from "vest/classnames";
import {
    useAddAgreementMutation,
    useDeleteAgreementMutation,
    useGetProjectsQuery,
    useGetProductServiceCodesQuery,
    useLazyGetAgreementsQuery,
    useUpdateAgreementMutation
} from "../../../api/opsAPI";
import {
    buildProcurementShopChangeAlert,
    cleanAgreementForApi,
    formatTeamMember
} from "../../../helpers/agreement.helpers.js";
import { scrollToCenter } from "../../../helpers/scrollToCenter.helper";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useAlert from "../../../hooks/use-alert.hooks";
import useHasStateChanged from "../../../hooks/useHasStateChanged.hooks";
import useNavigationBlocker from "../../../hooks/useNavigationBlocker.hooks";
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

const UNIQUE_ERROR_MESSAGES = {
    name: "This title already exists. Try a different one",
    nick_name: "This nickname already exists. Try a different one"
};

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
    const setSelectedProject = useSetState("selected_project");
    const setSelectedProductServiceCode = useSetState("selected_product_service_code");
    const setSelectedProjectOfficer = useSetState("selected_project_officer");
    const setSelectedAlternateProjectOfficer = useSetState("selected_alternate_project_officer");

    // AGREEMENT SETTERS
    const setAgreementType = useUpdateAgreement("agreement_type");
    const setAgreementTitle = useUpdateAgreement("name");
    const setAgreementNickName = useUpdateAgreement("nick_name");
    const setAgreementDescription = useUpdateAgreement("description");
    const setAgreementProjectId = useUpdateAgreement("project_id");
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
    const [selectedAgreementFilter, setSelectedAgreementFilter] = React.useState("");

    const navigate = useNavigate();
    const dispatch = useEditAgreementDispatch();
    const { setAlert } = useAlert();

    const [updateAgreement] = useUpdateAgreementMutation();
    const [deleteAgreement] = useDeleteAgreementMutation();
    const [addAgreement] = useAddAgreementMutation();
    const [triggerGetAgreements] = useLazyGetAgreementsQuery();

    const [uniquenessErrors, setUniquenessErrors] = React.useState({ name: [], nick_name: [] });

    const {
        agreement,
        selected_project: selectedProject,
        selected_procurement_shop: selectedProcurementShop,
        selected_product_service_code: selectedProductServiceCode,
        selected_project_officer: selectedProjectOfficer,
        selected_alternate_project_officer: selectedAlternateProjectOfficer
    } = useEditAgreement();

    // Capture the original agreement identity once at mount. The reducer mutates
    // agreement.name/nick_name/agreement_type as the user types, so comparing
    // against `agreement?.name` would treat the typed-in duplicate as "the
    // current row" and suppress the conflict. We need the pre-edit baseline.
    const originalAgreementRef = React.useRef(null);
    if (originalAgreementRef.current === null && agreement?.id) {
        originalAgreementRef.current = {
            id: agreement.id,
            name: agreement.name,
            nick_name: agreement.nick_name,
            agreement_type: agreement.agreement_type
        };
    }
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
        data: projectsResponse,
        error: errorProjects,
        isLoading: isLoadingProjects
    } = useGetProjectsQuery(
        {},
        {
            skip: isWizardMode
        }
    );

    const projects = projectsResponse?.projects ?? [];

    const {
        data: productServiceCodes = [],
        error: errorProductServiceCodes,
        isLoading: isLoadingProductServiceCodes
    } = useGetProductServiceCodesQuery({});

    React.useEffect(() => {
        suite.reset();

        return () => {
            suite.reset();
        };
    }, []);

    // make a copy of the agreement object
    const hasAgreementChanged = useHasStateChanged(agreement);

    const isAgreementCreated = !!agreement?.id;
    // state update happens after the render cycle completes
    React.useEffect(() => {
        setHasAgreementChanged(hasAgreementChanged);
    }, [hasAgreementChanged, setHasAgreementChanged]);

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

    const runValidate = React.useCallback(
        (name, value, overrides = {}) => {
            suite.run(
                {
                    ...agreement,
                    ...overrides,
                    [name]: value
                },
                name
            );
        },
        [agreement]
    );

    React.useEffect(() => {
        if (isReviewMode) {
            suite.run({
                ...agreement,
                "procurement-shop-select": selectedProcurementShop
            });
        }
    }, [isReviewMode, agreement, selectedProcurementShop]);

    React.useEffect(() => {
        if (!isWizardMode) {
            runValidate("project_id", agreement?.project_id);
        }
    }, [isWizardMode, agreement?.project_id, runValidate]);

    React.useEffect(() => {
        if (errorProductServiceCodes || errorProjects) {
            navigate("/error");
        }
    }, [errorProductServiceCodes, errorProjects, navigate]);

    let res = suite.get();

    const runUniqueCheck = React.useCallback(
        async (field, value) => {
            const trimmed = (value ?? "").trim();
            if (!trimmed) {
                setUniquenessErrors((prev) => (prev[field].length === 0 ? prev : { ...prev, [field]: [] }));
                return false;
            }
            if (field === "name" && !agreementType) {
                return false;
            }
            try {
                const filters =
                    field === "name"
                        ? { agreementName: [{ name: trimmed }], agreementType: [{ type: agreementType }] }
                        : { nickName: [trimmed] };
                const result = await triggerGetAgreements({ filters, page: 0, limit: 1 }).unwrap();
                const totalMatches = result?.count ?? 0;
                // The current agreement (in edit mode) is itself in the result set when its
                // saved value still matches the input. Treat that one row as not a conflict.
                // Compare against the original (pre-edit) values, not the live reducer state,
                // since `agreement.name` / `nick_name` get mutated as the user types.
                const original = originalAgreementRef.current;
                const currentMatchesInput =
                    !!original?.id &&
                    (field === "name"
                        ? original.agreement_type === agreementType &&
                          (original.name ?? "").toLowerCase() === trimmed.toLowerCase()
                        : original.nick_name === trimmed);
                const conflict = totalMatches > (currentMatchesInput ? 1 : 0);
                setUniquenessErrors((prev) => ({
                    ...prev,
                    [field]: conflict ? [UNIQUE_ERROR_MESSAGES[field]] : []
                }));
                return conflict;
            } catch {
                setUniquenessErrors((prev) => (prev[field].length === 0 ? prev : { ...prev, [field]: [] }));
                return false;
            }
        },
        [agreementType, triggerGetAgreements]
    );

    const checkUniqueOnBlur = React.useMemo(
        () => debounce((field, value) => runUniqueCheck(field, value), 300),
        [runUniqueCheck]
    );

    React.useEffect(() => () => checkUniqueOnBlur.cancel(), [checkUniqueOnBlur]);

    // When agreement_type changes, re-check the title uniqueness because the
    // backend constraint is scoped per type.
    React.useEffect(() => {
        if (agreementType && agreementTitle) {
            checkUniqueOnBlur("name", agreementTitle);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agreementType]);

    const hasUniquenessErrors = uniquenessErrors.name.length > 0 || uniquenessErrors.nick_name.length > 0;

    const vendorDisabled = agreementReason === "NEW_REQ" || agreementReason === null || agreementReason === "0";
    const isAgreementAA = agreementType === AGREEMENT_TYPES.AA;
    const shouldDisableBtn =
        !agreementTitle ||
        !agreement?.project_id ||
        !agreementType ||
        res.hasErrors() ||
        hasUniquenessErrors ||
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

    const changeSelectedProject = (project) => {
        setSelectedProject(project);
        const projectId = project ? project.id : null;
        setAgreementProjectId(projectId);
        runValidate("project_id", projectId);
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
        if (isReviewMode) {
            const newTeamMembers = [...(selectedTeamMembers ?? []), teamMember];
            runValidate("team-members", newTeamMembers, { team_members: newTeamMembers });
        }
    };

    const removeTeamMember = (teamMember) => {
        dispatch({
            type: "REMOVE_TEAM_MEMBER",
            payload: teamMember
        });
        if (isReviewMode) {
            const newTeamMembers = (selectedTeamMembers ?? []).filter((member) => member.id !== teamMember.id);
            runValidate("team-members", newTeamMembers, { team_members: newTeamMembers });
        }
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
        async (
            redirectUrl = null,
            skipChangeCheck = false,
            suppressErrorAlert = false,
            suppressSuccessAlert = false
        ) => {
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
                    if (!suppressSuccessAlert) {
                        if (shouldRequestChange) {
                            setAlert(
                                buildProcurementShopChangeAlert({
                                    budgetLines: agreement?.budget_line_items ?? [],
                                    oldProcurementShop: procurementShop,
                                    newProcurementShop: selectedProcurementShop,
                                    redirectUrl
                                })
                            );
                        } else {
                            setAlert({
                                type: "success",
                                heading: "Agreement Updated",
                                message: `The agreement ${agreement.name} has been successfully updated.`,
                                redirectUrl: redirectUrl
                            });
                        }
                        scrollToTop();
                    }
                    return true;
                } catch (rejected) {
                    console.error(`UPDATE: agreement updated failed: ${JSON.stringify(rejected, null, 2)}`);
                    if (!suppressErrorAlert) {
                        setAlert({
                            type: "error",
                            heading: "Error",
                            message: "An error occurred while saving the agreement.",
                            redirectUrl: "/error"
                        });
                    }
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

    const blockerSaveChanges = React.useCallback(async () => {
        await saveAgreement(null);
    }, [saveAgreement]);

    const blockerOnExit = React.useCallback(() => {
        setHasAgreementChanged(false);
        if (isEditMode && setIsEditMode) setIsEditMode(false);
    }, [setHasAgreementChanged, isEditMode, setIsEditMode]);

    const { showBlockerModal, setShowBlockerModal, blockerModalProps, setIsCancelling } = useNavigationBlocker({
        hasChanged: hasAgreementChanged,
        saveChanges: blockerSaveChanges,
        onExit: blockerOnExit
    });

    const wasEditModeRef = React.useRef(isEditMode);
    React.useEffect(() => {
        if (!wasEditModeRef.current && isEditMode) {
            setIsCancelling(false);
        }
        wasEditModeRef.current = isEditMode;
    }, [isEditMode, setIsCancelling]);

    const verifyUniquenessBeforeSubmit = React.useCallback(async () => {
        checkUniqueOnBlur.cancel();
        const [nameConflict, nickNameConflict] = await Promise.all([
            runUniqueCheck("name", agreementTitle),
            runUniqueCheck("nick_name", agreementNickName)
        ]);
        if (nameConflict) return "name";
        if (nickNameConflict) return "nickname";
        return null;
    }, [checkUniqueOnBlur, runUniqueCheck, agreementTitle, agreementNickName]);

    const handleContinue = async () => {
        const conflictFieldId = await verifyUniquenessBeforeSubmit();
        if (conflictFieldId) {
            // Defer to the next frame so the inline error message renders
            // before the smooth scroll measures its target position.
            requestAnimationFrame(() => scrollToCenter(conflictFieldId));
            return;
        }

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
        const conflictFieldId = await verifyUniquenessBeforeSubmit();
        if (conflictFieldId) {
            // Defer to the next frame so the inline error message renders
            // before the smooth scroll measures its target position.
            requestAnimationFrame(() => scrollToCenter(conflictFieldId));
            return;
        }

        try {
            const result = await saveAgreement();
            if (result === false && !agreement.id) {
                const data = {
                    ...agreement,
                    team_members: (agreement.team_members ?? []).map((team_member) => {
                        return formatTeamMember(team_member);
                    }),
                    requesting_agency_id: requestingAgency ? requestingAgency.id : null,
                    servicing_agency_id: servicingAgency ? servicingAgency.id : null
                };
                const { cleanData } = cleanAgreementForApi(data);
                const response = await addAgreement(cleanData).unwrap();
                console.log(`CREATE: agreement draft saved: ${JSON.stringify(response, null, 2)}`);
                setAlert({
                    type: "success",
                    heading: "Agreement Draft Saved",
                    message: `The agreement ${agreement.name} has been successfully created.`
                });
                scrollToTop();
            }
            setHasAgreementChanged(false);
            navigate("/agreements");
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            if (!agreement.id) {
                setAlert({
                    type: "error",
                    heading: "Error",
                    message: "An error occurred while saving the agreement.",
                    redirectUrl: "/error"
                });
            }
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
        projects,
        selectedProject,
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
        changeSelectedProject,
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
        checkUniqueOnBlur,
        uniquenessErrors,
        isProcurementShopDisabled,
        disabledMessage,
        fundingMethod: FUNDING_METHOD,
        agreementFilterOptions: AGREEMENT_FILTER_OPTIONS,
        handleAgreementFilterChange,
        procurementShop,
        shouldRequestChange,
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
        showBlockerModal,
        setShowBlockerModal,
        blockerModalProps,
        saveAgreement,
        verifyUniquenessBeforeSubmit,
        isLoadingProductServiceCodes,
        isLoadingProjects
    };
};

export default useAgreementEditForm;
